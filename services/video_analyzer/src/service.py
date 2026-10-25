from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .models import AnalysisJobRequest, AnalysisJobResponse
from .job_queue import job_queue

app = FastAPI(
    title="Kavrai AI Video Analyzer Service",
    description="Asynchronous Scene & Shot Detection, Character Recognition, and SMPTE Indexing Microservice",
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
        "service": "kavrai-video-analyzer",
        "version": "1.0.0",
        "gpu_accelerated": True,
    }

@app.post(
    "/api/v1/analysis/jobs",
    response_model=AnalysisJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Analysis"],
)
async def create_analysis_job(request: AnalysisJobRequest):
    """
    Submit an uploaded cinema master or reel for asynchronous scene, shot, and character analysis.
    """
    job = await job_queue.enqueue(request)
    return job

@app.get(
    "/api/v1/analysis/jobs/{job_id}",
    response_model=AnalysisJobResponse,
    tags=["Analysis"],
)
async def get_job_status(job_id: str):
    """
    Poll job progress, stage transitions, and retrieved shot/character metadata.
    """
    job = await job_queue.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job '{job_id}' was not found.",
        )
    return job

@app.get(
    "/api/v1/analysis/jobs/reel/{reel_id}",
    response_model=AnalysisJobResponse,
    tags=["Analysis"],
)
async def get_reel_analysis(reel_id: str):
    """
    Retrieve latest analysis results for a specific master reel.
    """
    job = await job_queue.get_job_by_reel(reel_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis job found for reel '{reel_id}'.",
        )
    return job
