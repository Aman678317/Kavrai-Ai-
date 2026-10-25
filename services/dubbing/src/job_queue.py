"""In-memory asynchronous background worker queue for dubbing and voice synthesis jobs."""

import asyncio
import uuid
from typing import Dict, Optional

from .models import (
    DubbingJobRequest,
    DubbingJobResponse,
    DubbingStatus,
    DubbingStage,
    HumanTakeRequest,
    DubbedAudioLine,
)
from .synthesizer import dubbing_synthesizer
from .voice_registry import voice_registry, VoiceAuthorizationError


class AsyncDubbingJobQueue:
    """Manages asynchronous dubbing generation jobs and stage progression."""

    def __init__(self):
        self._jobs: Dict[str, DubbingJobResponse] = {}
        self._requests: Dict[str, DubbingJobRequest] = {}

    def enqueue_job(self, request: DubbingJobRequest) -> DubbingJobResponse:
        job_id = f"job-dub-{uuid.uuid4().hex[:8]}"
        initial_job = DubbingJobResponse(
            job_id=job_id,
            project_id=request.project_id,
            reel_id=request.reel_id,
            status=DubbingStatus.QUEUED,
            stage=DubbingStage.QUEUED,
            progress_percent=0,
            target_language=request.target_language,
        )
        self._jobs[job_id] = initial_job
        self._requests[job_id] = request
        return initial_job

    def get_job(self, job_id: str) -> Optional[DubbingJobResponse]:
        return self._jobs.get(job_id)

    def get_job_by_reel(self, reel_id: str) -> Optional[DubbingJobResponse]:
        for job in reversed(list(self._jobs.values())):
            if job.reel_id == reel_id:
                return job
        return None

    async def process_job(self, job_id: str) -> DubbingJobResponse:
        """Executes the dubbing synthesis pipeline across lifecycle stages."""
        job = self._jobs.get(job_id)
        request = self._requests.get(job_id)
        if not job or not request:
            raise ValueError(f"Job {job_id} not found")

        job.status = DubbingStatus.PROCESSING

        # Stage 1: Consent Verification
        job.stage = DubbingStage.CONSENT_VERIFICATION
        job.progress_percent = 20
        await asyncio.sleep(0.05)

        # Check all unique characters in script lines
        try:
            for line in request.script_lines:
                voice_registry.verify_voice_authorization(line.character_id)
        except VoiceAuthorizationError as err:
            job.status = DubbingStatus.FAILED
            job.stage = DubbingStage.FAILED
            job.error = str(err)
            return job

        # Stage 2: Prosody & Emotion Synthesis
        job.stage = DubbingStage.PROSODY_EMOTION_SYNTHESIS
        job.progress_percent = 50
        await asyncio.sleep(0.05)

        audio_lines = []
        for line in request.script_lines:
            dubbed_line = dubbing_synthesizer.synthesize_line(
                line=line,
                target_language=request.target_language,
                speaking_rate=request.speaking_rate,
                default_emotion=request.default_emotion,
            )
            audio_lines.append(dubbed_line)

        # Stage 3: Duration & Quality Conformance
        job.stage = DubbingStage.DURATION_QUALITY_CONFORMANCE
        job.progress_percent = 75
        await asyncio.sleep(0.05)

        # Stage 4: Stem Conformance
        job.stage = DubbingStage.STEM_CONFORMANCE
        job.progress_percent = 90
        await asyncio.sleep(0.05)

        # Finalize
        job.audio_lines = audio_lines
        job.total_duration_seconds = round(
            sum(line.conformed_duration_seconds for line in audio_lines), 2
        )
        if audio_lines:
            job.average_loudness_lkfs = round(
                sum(line.loudness_lkfs for line in audio_lines) / len(audio_lines), 1
            )
            job.average_snr_db = round(
                sum(line.snr_db for line in audio_lines) / len(audio_lines), 1
            )

        job.stage = DubbingStage.COMPLETED
        job.status = DubbingStatus.COMPLETED
        job.progress_percent = 100
        return job

    def replace_with_human_take(self, take: HumanTakeRequest) -> DubbedAudioLine:
        """Processes and attaches a human ADR take to the target job and reel."""
        human_line = dubbing_synthesizer.process_human_take(take)

        # Update matching line in any active reel job
        for job in self._jobs.values():
            if job.reel_id == take.reel_id:
                for idx, existing in enumerate(job.audio_lines):
                    if take.line_id in existing.id:
                        job.audio_lines[idx] = human_line
                        job.human_takes_count += 1
                        break

        return human_line


# Global queue instance
dubbing_job_queue = AsyncDubbingJobQueue()
