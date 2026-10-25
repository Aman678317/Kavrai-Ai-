"""FastAPI REST Service for the Modular Dubbing and Voice Synthesis Engine."""

from typing import List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    DubbingJobRequest,
    DubbingJobResponse,
    CharacterVoiceProfile,
    HumanTakeRequest,
    DubbedAudioLine,
)
from .voice_registry import voice_registry, VoiceAuthorizationError
from .job_queue import dubbing_job_queue

app = FastAPI(
    title="Kavrai AI Dubbing & Voice Synthesis Service",
    description="Licensed TTS (CosyVoice 2 / StyleTTS 2), SAG-AFTRA Voice Authorization Ledger, WSOLA Conformance & Human ADR Ingest",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health probe endpoint."""
    return {
        "status": "healthy",
        "service": "kavrai-dubbing-service",
        "version": "1.0.0",
        "registered_voices": len(voice_registry.list_voice_profiles()),
        "licensed_models": ["CosyVoice 2 (Apache 2.0)", "StyleTTS 2 (MIT)"],
        "compliance": "SAG-AFTRA Consent Gate Active",
    }


@app.get("/api/v1/dubbing/voices", response_model=List[CharacterVoiceProfile])
async def list_character_voices():
    """Returns all registered character voice profiles and authorization status."""
    return voice_registry.list_voice_profiles()


@app.post("/api/v1/dubbing/jobs", response_model=DubbingJobResponse)
async def create_dubbing_job(
    request: DubbingJobRequest, background_tasks: BackgroundTasks
):
    """Enqueues an asynchronous dubbing and voice synthesis job."""
    initial_job = dubbing_job_queue.enqueue_job(request)
    background_tasks.add_task(dubbing_job_queue.process_job, initial_job.job_id)
    return initial_job


@app.get("/api/v1/dubbing/jobs/{job_id}", response_model=DubbingJobResponse)
async def get_dubbing_job(job_id: str):
    """Retrieves current job status, stage, progress, and conformed audio lines."""
    job = dubbing_job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


@app.get("/api/v1/dubbing/jobs/reel/{reel_id}", response_model=DubbingJobResponse)
async def get_dubbing_job_by_reel(reel_id: str):
    """Retrieves the latest dubbing job for a given reel."""
    job = dubbing_job_queue.get_job_by_reel(reel_id)
    if not job:
        raise HTTPException(
            status_code=404, detail=f"No dubbing job found for reel {reel_id}"
        )
    return job


@app.post("/api/v1/dubbing/human-take", response_model=DubbedAudioLine)
async def submit_human_audio_take(request: HumanTakeRequest):
    """Ingests and validates a human ADR audio take for a dialogue line."""
    try:
        return dubbing_job_queue.replace_with_human_take(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
