import time
import uuid
import asyncio
from typing import Optional
from .models import (
    SpeechJobRequest,
    SpeechJobResponse,
    SpeechJobStatus,
    SpeechStage,
    DialogueSegment,
)
from .audio_extractor import DemucsVocalExtractor, AudioDecodeError
from .transcriber import WhisperXTranscriber
from .diarizer import PyAnnoteSpeakerDiarizer

class AsyncSpeechJobQueue:
    """
    Asynchronous Background Job Queue for Multilingual Speech Processing
    Orchestrates Demucs vocal extraction, WhisperX ASR, and PyAnnote diarization.
    """
    def __init__(self):
        self._jobs: dict[str, SpeechJobResponse] = {}
        self._reel_to_job: dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, req: SpeechJobRequest) -> SpeechJobResponse:
        job_id = f"job_spch_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        now = time.time()
        
        duration = req.duration_seconds if req.duration_seconds and req.duration_seconds > 0 else 60.0

        job = SpeechJobResponse(
            job_id=job_id,
            project_id=req.project_id,
            reel_id=req.reel_id,
            audio_s3_uri=req.audio_s3_uri,
            status=SpeechJobStatus.QUEUED,
            stage=SpeechStage.QUEUED,
            progress_percent=0,
            detected_language="en-US",
            language_confidence=0.99,
            duration_seconds=duration,
            speaker_count=0,
            segments=[],
            created_at=now,
        )

        async with self._lock:
            self._jobs[job_id] = job
            self._reel_to_job[req.reel_id] = job_id

        # Schedule background worker
        asyncio.create_task(self._process_job(job_id, req))
        return job

    async def get_job(self, job_id: str) -> Optional[SpeechJobResponse]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def get_job_by_reel(self, reel_id: str) -> Optional[SpeechJobResponse]:
        async with self._lock:
            job_id = self._reel_to_job.get(reel_id)
            if job_id:
                return self._jobs.get(job_id)
            return None

    async def _process_job(self, job_id: str, req: SpeechJobRequest):
        job = self._jobs.get(job_id)
        if not job:
            return

        try:
            # Stage 1: Meta Demucs v4 Vocal Isolation & Noise Analysis
            job.status = SpeechJobStatus.PROCESSING
            job.stage = SpeechStage.VOCAL_EXTRACTION
            job.progress_percent = 20
            await asyncio.sleep(0.04)

            extractor = DemucsVocalExtractor()
            vocal_stem_uri, snr_db, audio_quality, needs_review = extractor.isolate_vocals(
                audio_s3_uri=req.audio_s3_uri,
                project_id=req.project_id,
                reel_id=req.reel_id,
                denoise_prefilter=req.denoise_prefilter
            )
            job.vocal_stem_s3_uri = vocal_stem_uri

            # Stage 2: Voice Activity Detection (VAD) Segmentation
            job.stage = SpeechStage.VAD_SEGMENTATION
            job.progress_percent = 45
            await asyncio.sleep(0.04)

            # Stage 3: WhisperX Multilingual ASR & Word-Level Alignment
            job.stage = SpeechStage.SPEECH_RECOGNITION
            job.progress_percent = 75
            await asyncio.sleep(0.04)

            transcriber = WhisperXTranscriber()
            raw_segments = transcriber.transcribe(
                audio_uri=req.audio_s3_uri,
                duration_seconds=job.duration_seconds,
                frame_rate=req.frame_rate,
                source_language_hint=req.source_language_hint,
                snr_db=snr_db,
                audio_quality=audio_quality,
                needs_review=needs_review
            )

            if raw_segments:
                job.detected_language = raw_segments[0].detected_language
                job.language_confidence = raw_segments[0].language_confidence

            # Stage 4: PyAnnote 3.1 Speaker Diarization & Character Attribution
            job.stage = SpeechStage.SPEAKER_DIARIZATION
            job.progress_percent = 90
            await asyncio.sleep(0.03)

            diarizer = PyAnnoteSpeakerDiarizer()
            attributed_segments, speaker_count = diarizer.diarize_and_attribute(
                segments=raw_segments,
                character_roster=req.character_roster
            )

            # Stage 5: Finalize Job
            job.segments = attributed_segments
            job.speaker_count = speaker_count
            job.stage = SpeechStage.COMPLETED
            job.status = SpeechJobStatus.COMPLETED
            job.progress_percent = 100
            job.completed_at = time.time()

        except AudioDecodeError as ade:
            job.status = SpeechJobStatus.FAILED
            job.stage = SpeechStage.FAILED
            job.error = str(ade)
        except Exception as e:
            job.status = SpeechJobStatus.FAILED
            job.stage = SpeechStage.FAILED
            job.error = f"Speech processing worker failure: {str(e)}"

# Singleton queue instance
speech_job_queue = AsyncSpeechJobQueue()
