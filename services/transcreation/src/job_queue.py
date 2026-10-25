import time
import uuid
import asyncio
from typing import Optional

from .models import (
    TranscreationJobRequest,
    TranscreationJobResponse,
    JobStatus,
    TranscreationStage,
    DubbingScriptLine,
    ToneProfile,
    ValidationStatus,
)
from .transcreator import TheatricalTranscreator

# Default theatrical dialogue lines if caller provides none
DEFAULT_DIALOGUE_SCENE = [
    {
        "line_id": "line_001",
        "source_text": "Orbital trajectory confirmed. Atmospheric entry vector initialized.",
        "character_id": "char_elena",
        "character_name": "Commander Elena Vance",
        "character_relationship": "Commanding lead pilot directing operations",
        "scene_context": "Deep space command bridge during planetary orbital descent",
        "tone": ToneProfile.URGENT_COMMAND,
        "timecode_in": "01:00:01:06",
        "timecode_out": "01:00:04:18",
        "start_seconds": 1.25,
        "end_seconds": 4.75,
    },
    {
        "line_id": "line_002",
        "source_text": "Shield frequency holding at ninety-two percent. Keep the main thrusters synchronized.",
        "character_id": "char_kaelen",
        "character_name": "Chief Engineer Kaelen",
        "character_relationship": "Senior propulsion engineer reporting to Commander Vance",
        "scene_context": "Engineering deck adjusting ion engine coils under heat load",
        "tone": ToneProfile.URGENT_COMMAND,
        "timecode_in": "01:00:06:00",
        "timecode_out": "01:00:10:12",
        "start_seconds": 6.0,
        "end_seconds": 10.5,
    },
    {
        "line_id": "line_003",
        "source_text": "We have an anomalous radiation signature breaching the forward bulkhead.",
        "character_id": "char_elena",
        "character_name": "Commander Elena Vance",
        "character_relationship": "Reporting immediate emergency status to cockpit crew",
        "scene_context": "Hull warning sensor panel flashing red during plasma sheath",
        "tone": ToneProfile.URGENT_COMMAND,
        "timecode_in": "01:00:12:08",
        "timecode_out": "01:00:16:04",
        "start_seconds": 12.33,
        "end_seconds": 16.16,
    },
]

class AsyncTranscreationJobQueue:
    """
    Asynchronous Background Queue for Multilingual Cinema Transcreation
    Manages job states, stage transitions, syllable verification, and retries.
    """
    def __init__(self):
        self._jobs: dict[str, TranscreationJobResponse] = {}
        self._reel_to_job: dict[str, str] = {}
        self._lines_index: dict[str, DubbingScriptLine] = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, req: TranscreationJobRequest) -> TranscreationJobResponse:
        job_id = f"job_trans_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        now = time.time()

        job = TranscreationJobResponse(
            job_id=job_id,
            project_id=req.project_id,
            reel_id=req.reel_id,
            status=JobStatus.QUEUED,
            stage=TranscreationStage.QUEUED,
            progress_percent=0,
            target_language=req.target_language,
            script_lines=[],
            created_at=now,
        )

        async with self._lock:
            self._jobs[job_id] = job
            self._reel_to_job[req.reel_id] = job_id

        # Schedule worker in background
        asyncio.create_task(self._process_job(job_id, req))
        return job

    async def get_job(self, job_id: str) -> Optional[TranscreationJobResponse]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def get_job_by_reel(self, reel_id: str) -> Optional[TranscreationJobResponse]:
        async with self._lock:
            job_id = self._reel_to_job.get(reel_id)
            if job_id:
                return self._jobs.get(job_id)
            return None

    async def update_line(self, line_id: str, updates: dict) -> Optional[DubbingScriptLine]:
        async with self._lock:
            line = self._lines_index.get(line_id)
            if not line:
                return None

            if "translated_text" in updates:
                line.translated_text = updates["translated_text"]
                line.validation_status = ValidationStatus.MANUALLY_EDITED
            if "is_approved" in updates:
                line.is_approved = bool(updates["is_approved"])
                if line.is_approved:
                    line.validation_status = ValidationStatus.VALIDATED
            if "tone" in updates:
                line.tone = ToneProfile(updates["tone"])

            return line

    async def _process_job(self, job_id: str, req: TranscreationJobRequest):
        job = self._jobs.get(job_id)
        if not job:
            return

        try:
            # Stage 1: Scene Context & Dramatic Tone Analysis
            job.status = JobStatus.PROCESSING
            job.stage = TranscreationStage.SCENE_CONTEXT_ANALYSIS
            job.progress_percent = 15
            await asyncio.sleep(0.04)

            # Stage 2: LLM Transcreation with Syllable & Viseme Constraints
            job.stage = TranscreationStage.LLM_TRANSCREATION
            job.progress_percent = 50
            await asyncio.sleep(0.04)

            transcreator = TheatricalTranscreator()
            dialogue_items = req.dialogue_inputs if req.dialogue_inputs else DEFAULT_DIALOGUE_SCENE
            generated_lines: list[DubbingScriptLine] = []
            total_retries = 0

            for item in dialogue_items:
                tone = item.get("tone")
                if isinstance(tone, str):
                    tone_enum = ToneProfile(tone)
                elif isinstance(tone, ToneProfile):
                    tone_enum = tone
                else:
                    tone_enum = ToneProfile.URGENT_COMMAND

                line, retries = await transcreator.transcreate_line(
                    line_id=item.get("line_id", f"line_{uuid.uuid4().hex[:6]}"),
                    source_text=item["source_text"],
                    source_lang=req.source_language,
                    target_lang=req.target_language,
                    character_id=item.get("character_id", "char_01"),
                    character_name=item.get("character_name", "Lead Character"),
                    character_relationship=item.get("character_relationship", "Dialogue speaker"),
                    scene_context=item.get("scene_context", "Theatrical scene"),
                    tone=tone_enum,
                    timecode_in=item.get("timecode_in", "01:00:00:00"),
                    timecode_out=item.get("timecode_out", "01:00:04:00"),
                    start_seconds=item.get("start_seconds", 0.0),
                    end_seconds=item.get("end_seconds", 4.0),
                    syllable_budget_tolerance=req.syllable_budget_tolerance,
                    simulate_failure=req.simulate_provider_failure,
                    simulate_rate_limit=req.simulate_rate_limit,
                )
                total_retries += retries
                generated_lines.append(line)
                self._lines_index[line.line_id] = line

            # Stage 3: Syllable Budget Verification & Drift Analysis
            job.stage = TranscreationStage.SYLLABLE_BUDGET_VERIFICATION
            job.progress_percent = 75
            await asyncio.sleep(0.04)

            total_src_syllables = sum(l.source_syllables for l in generated_lines)
            total_tgt_syllables = sum(l.target_syllables for l in generated_lines)
            avg_delta = round(
                sum(l.syllable_delta for l in generated_lines) / max(1, len(generated_lines)), 2
            )

            # Stage 4: Viseme Bilabial Closure Alignment Indexing
            job.stage = TranscreationStage.VISEME_ALIGNMENT_INDEXING
            job.progress_percent = 90
            await asyncio.sleep(0.03)

            # Finalize Job
            job.script_lines = generated_lines
            job.total_syllables_source = total_src_syllables
            job.total_syllables_target = total_tgt_syllables
            job.average_syllable_delta = avg_delta
            job.retry_count = total_retries
            job.stage = TranscreationStage.COMPLETED
            job.status = JobStatus.COMPLETED
            job.progress_percent = 100
            job.completed_at = time.time()

        except Exception as e:
            job.status = JobStatus.FAILED
            job.stage = TranscreationStage.FAILED
            job.error = f"Transcreation worker failure: {str(e)}"

# Singleton queue instance
transcreation_job_queue = AsyncTranscreationJobQueue()
