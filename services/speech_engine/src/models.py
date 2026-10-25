from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class SpeechJobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class SpeechStage(str, Enum):
    QUEUED = "QUEUED"
    VOCAL_EXTRACTION = "VOCAL_EXTRACTION"
    VAD_SEGMENTATION = "VAD_SEGMENTATION"
    SPEECH_RECOGNITION = "SPEECH_RECOGNITION"
    SPEAKER_DIARIZATION = "SPEAKER_DIARIZATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class WordTiming(BaseModel):
    word: str
    start_time: float
    end_time: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    phonemes: Optional[list[str]] = None

class DialogueSegment(BaseModel):
    segment_id: str
    speaker_id: str
    speaker_name: str
    start_smpte: str
    end_smpte: str
    start_seconds: float
    end_seconds: float
    detected_language: str
    language_confidence: float = Field(..., ge=0.0, le=1.0)
    text: str
    words: list[WordTiming] = Field(default_factory=list)
    audio_quality: str
    snr_db: float
    needs_review: bool = False

class SpeechJobRequest(BaseModel):
    project_id: str
    reel_id: str
    audio_s3_uri: str
    duration_seconds: Optional[float] = None
    frame_rate: float = 24.0
    source_language_hint: Optional[str] = "en"
    character_roster: Optional[list[str]] = None
    denoise_prefilter: bool = True

class SpeechJobResponse(BaseModel):
    job_id: str
    project_id: str
    reel_id: str
    audio_s3_uri: str
    status: SpeechJobStatus
    stage: SpeechStage
    progress_percent: int = Field(default=0, ge=0, le=100)
    detected_language: str = "en-US"
    language_confidence: float = 0.99
    duration_seconds: float
    speaker_count: int = 0
    segments: list[DialogueSegment] = Field(default_factory=list)
    vocal_stem_s3_uri: Optional[str] = None
    error: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None
