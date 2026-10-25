import time
import uuid
import asyncio
from typing import Optional
from .models import (
    AnalysisJobRequest,
    AnalysisJobResponse,
    JobStatus,
    AnalysisStage,
    ShotMetadata,
    SceneMetadata,
)
from .scene_detector import CinemaSceneDetector
from .character_identifier import CharacterIdentifier

class AsyncJobQueue:
    """
    Asynchronous Background Job Queue for Video Analysis
    Manages job states, stage transitions, and execution workers.
    """
    def __init__(self):
        self._jobs: dict[str, AnalysisJobResponse] = {}
        self._reel_to_job: dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, req: AnalysisJobRequest) -> AnalysisJobResponse:
        job_id = f"job_anlz_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        now = time.time()
        
        duration = req.duration_seconds if req.duration_seconds and req.duration_seconds > 0 else 60.0
        total_frames = int(round(duration * req.frame_rate))

        job = AnalysisJobResponse(
            job_id=job_id,
            project_id=req.project_id,
            reel_id=req.reel_id,
            video_s3_uri=req.video_s3_uri,
            status=JobStatus.QUEUED,
            stage=AnalysisStage.QUEUED,
            progress_percent=0,
            frame_rate=req.frame_rate,
            total_frames=total_frames,
            duration_seconds=duration,
            shots=[],
            scenes=[],
            created_at=now,
        )

        async with self._lock:
            self._jobs[job_id] = job
            self._reel_to_job[req.reel_id] = job_id

        # Schedule background worker
        asyncio.create_task(self._process_job(job_id, req.character_hints))
        return job

    async def get_job(self, job_id: str) -> Optional[AnalysisJobResponse]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def get_job_by_reel(self, reel_id: str) -> Optional[AnalysisJobResponse]:
        async with self._lock:
            job_id = self._reel_to_job.get(reel_id)
            if job_id:
                return self._jobs.get(job_id)
            return None

    async def _process_job(self, job_id: str, character_hints: Optional[list[str]] = None):
        job = self._jobs.get(job_id)
        if not job:
            return

        try:
            # Check for simulated failure trigger
            if "corrupt" in job.video_s3_uri.lower() or "error" in job.video_s3_uri.lower():
                await asyncio.sleep(0.05)
                job.status = JobStatus.FAILED
                job.stage = AnalysisStage.FAILED
                job.error = "Demuxer Error: Stream header missing or corrupt codec bitstream."
                return

            # Stage 1: Scene & Shot Boundary Detection
            job.status = JobStatus.PROCESSING
            job.stage = AnalysisStage.SCENE_DETECTION
            job.progress_percent = 25
            await asyncio.sleep(0.04)

            detector = CinemaSceneDetector(fps=job.frame_rate)
            shot_boundaries = detector.detect_shots(job.duration_seconds, job.video_s3_uri)

            # Stage 2: Character Facial Recognition & SyncNet Scoring
            job.stage = AnalysisStage.CHARACTER_RECOGNITION
            job.progress_percent = 60
            await asyncio.sleep(0.04)

            identifier = CharacterIdentifier(character_hints)
            shots_result: list[ShotMetadata] = []

            for shot in shot_boundaries:
                char_name, char_conf, bbox, syncnet, ssim = identifier.identify_shot_character(
                    shot.shot_index, job.video_s3_uri
                )
                shots_result.append(ShotMetadata(
                    shot_index=shot.shot_index,
                    start_frame=shot.start_frame,
                    end_frame=shot.end_frame,
                    start_smpte=shot.start_smpte,
                    end_smpte=shot.end_smpte,
                    duration_seconds=shot.duration_seconds,
                    active_character=char_name,
                    character_confidence=char_conf,
                    face_bounding_box=bbox,
                    syncnet_confidence=syncnet,
                    ssim_identity=ssim,
                ))

            # Stage 3: Theatrical SMPTE Timecode & Scene Aggregation
            job.stage = AnalysisStage.TIMECODE_INDEXING
            job.progress_percent = 85
            await asyncio.sleep(0.03)

            # Group shots into dramatic scenes (approx 3-5 shots per scene)
            scenes_result: list[SceneMetadata] = []
            scene_chunk_size = 4
            for s_idx in range(0, len(shots_result), scene_chunk_size):
                chunk = shots_result[s_idx:s_idx + scene_chunk_size]
                scene_num = (s_idx // scene_chunk_size) + 1
                scenes_result.append(SceneMetadata(
                    scene_index=scene_num,
                    start_smpte=chunk[0].start_smpte,
                    end_smpte=chunk[-1].end_smpte,
                    shot_count=len(chunk),
                    dominant_character=chunk[0].active_character,
                ))

            # Stage 4: Finalize Job
            job.shots = shots_result
            job.scenes = scenes_result
            job.stage = AnalysisStage.COMPLETED
            job.status = JobStatus.COMPLETED
            job.progress_percent = 100
            job.completed_at = time.time()

        except Exception as e:
            job.status = JobStatus.FAILED
            job.stage = AnalysisStage.FAILED
            job.error = f"Analysis worker failure: {str(e)}"

# Singleton queue instance
job_queue = AsyncJobQueue()
