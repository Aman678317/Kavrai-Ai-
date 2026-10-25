from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .models import SpeechJobRequest, SpeechJobResponse
from .job_queue import speech_job_queue

app = FastAPI(
    title="Kavrai AI Speech Processing Engine",
    description="Asynchronous Multilingual Speech-to-Text, Demucs Stem Isolation, and PyAnnote Diarization Microservice",
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

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "kavrai-speech-engine",
        "version": "1.0.0",
        "models": {
            "vocal_isolation": "meta-demucs-v4",
            "speech_recognition": "whisperx-large-v3",
            "speaker_diarization": "pyannote-audio-3.1"
        },
        "multilingual_enabled": True
    }

@app.post(
    "/api/v1/speech/jobs",
    response_model=SpeechJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Speech Processing"],
)
async def create_speech_job(request: SpeechJobRequest):
    """
    Submit audio/video master reel for asynchronous vocal extraction, multilingual transcription, and speaker turn attribution.
    """
    job = await speech_job_queue.enqueue(request)
    return job

@app.get(
    "/api/v1/speech/jobs/{job_id}",
    response_model=SpeechJobResponse,
    tags=["Speech Processing"],
)
async def get_speech_job_status(job_id: str):
    """
    Poll speech job status, stage progression, word timestamps, and speaker turns.
    """
    job = await speech_job_queue.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Speech processing job '{job_id}' was not found.",
        )
    return job

@app.get(
    "/api/v1/speech/jobs/reel/{reel_id}",
    response_model=SpeechJobResponse,
    tags=["Speech Processing"],
)
async def get_reel_speech_job(reel_id: str):
    """
    Retrieve latest speech processing results for a specific master reel.
    """
    job = await speech_job_queue.get_job_by_reel(reel_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No speech processing job found for reel '{reel_id}'.",
        )
    return job
