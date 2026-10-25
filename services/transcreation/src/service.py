from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from .models import (
    TranscreationJobRequest,
    TranscreationJobResponse,
    DubbingScriptLine,
    ToneProfile,
)
from .job_queue import transcreation_job_queue

app = FastAPI(
    title="Kavrai AI Dialogue Transcreation & Dubbing Script Service",
    description="Multilingual Cinematic Transcreation, Syllable Budgeting, and Dubbing Script Microservice",
    version="1.0.0",
)

# Enable CORS for studio frontend workspace
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LineUpdateRequest(BaseModel):
    translated_text: Optional[str] = None
    tone: Optional[ToneProfile] = None
    is_approved: Optional[bool] = None

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "kavrai-transcreation-service",
        "version": "1.0.0",
        "models": {
            "primary": "claude-3-5-sonnet-20241022",
            "self_hosted_fallback": "qwen-2.5-72b-instruct",
        },
        "lip_sync_timing_constraint": "syllable_budget_delta_plus_minus_1",
        "supported_languages": ["en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "hi-IN"],
    }

@app.post(
    "/api/v1/transcreation/jobs",
    response_model=TranscreationJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Transcreation"],
)
async def create_transcreation_job(request: TranscreationJobRequest):
    """
    Submit dialogue lines for multilingual transcreation, syllable timing budgeting, and dubbing script generation.
    """
    job = await transcreation_job_queue.enqueue(request)
    return job

@app.get(
    "/api/v1/transcreation/jobs/{job_id}",
    response_model=TranscreationJobResponse,
    tags=["Transcreation"],
)
async def get_job_status(job_id: str):
    """
    Poll transcreation progress, stage transitions, syllable metrics, and generated dubbing script.
    """
    job = await transcreation_job_queue.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transcreation job '{job_id}' was not found.",
        )
    return job

@app.get(
    "/api/v1/transcreation/jobs/reel/{reel_id}",
    response_model=TranscreationJobResponse,
    tags=["Transcreation"],
)
async def get_reel_transcreation(reel_id: str):
    """
    Retrieve latest transcreation dubbing script for a specific master reel.
    """
    job = await transcreation_job_queue.get_job_by_reel(reel_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No transcreation job found for reel '{reel_id}'.",
        )
    return job

@app.put(
    "/api/v1/transcreation/scripts/{line_id}",
    response_model=DubbingScriptLine,
    tags=["Transcreation"],
)
async def update_script_line(line_id: str, request: LineUpdateRequest):
    """
    Update translated dialogue, tone, or manual validation status for a dubbing script line.
    """
    line = await transcreation_job_queue.update_line(line_id, request.model_dump(exclude_unset=True))
    if not line:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dubbing script line '{line_id}' was not found.",
        )
    return line
