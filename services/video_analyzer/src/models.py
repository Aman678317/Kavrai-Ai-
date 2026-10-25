from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AnalysisStage(str, Enum):
    QUEUED = "QUEUED"
    SCENE_DETECTION = "SCENE_DETECTION"
    CHARACTER_RECOGNITION = "CHARACTER_RECOGNITION"
    TIMECODE_INDEXING = "TIMECODE_INDEXING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class FaceBoundingBox(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    width: float = Field(..., ge=0.0, le=1.0)
    height: float = Field(..., ge=0.0, le=1.0)

class ShotMetadata(BaseModel):
    shot_index: int
    start_frame: int
    end_frame: int
    start_smpte: str
    end_smpte: str
    duration_seconds: float
    active_character: str
    character_confidence: float = Field(..., ge=0.0, le=1.0)
    face_bounding_box: Optional[FaceBoundingBox] = None
    syncnet_confidence: float = Field(..., ge=0.0, le=10.0)
    ssim_identity: float = Field(..., ge=0.0, le=1.0)

class SceneMetadata(BaseModel):
    scene_index: int
    start_smpte: str
    end_smpte: str
    shot_count: int
    dominant_character: str

class AnalysisJobRequest(BaseModel):
    project_id: str
    reel_id: str
    video_s3_uri: str
    frame_rate: float = 24.0
    duration_seconds: Optional[float] = None
    character_hints: Optional[list[str]] = None

class AnalysisJobResponse(BaseModel):
    job_id: str
    project_id: str
    reel_id: str
    video_s3_uri: str
    status: JobStatus
    stage: AnalysisStage
    progress_percent: int = Field(default=0, ge=0, le=100)
    frame_rate: float
    total_frames: int
    duration_seconds: float
    shots: list[ShotMetadata] = Field(default_factory=list)
    scenes: list[SceneMetadata] = Field(default_factory=list)
    error: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None
