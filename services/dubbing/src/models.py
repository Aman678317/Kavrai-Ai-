"""Pydantic data models for the Dubbing & Voice Synthesis microservice."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class EmotionProfile(str, Enum):
    NEUTRAL = "NEUTRAL"
    URGENT_COMMAND = "URGENT_COMMAND"
    INTIMATE_WHISPER = "INTIMATE_WHISPER"
    SARCASTIC_WIT = "SARCASTIC_WIT"
    TERRIFIED = "TERRIFIED"
    HEROIC = "HEROIC"
    SOMBER = "SOMBER"


class VoiceLicenseType(str, Enum):
    APACHE_2_0 = "APACHE_2_0"
    MIT_WITH_CONSENT = "MIT_WITH_CONSENT"
    COMMERCIAL_ENTERPRISE = "COMMERCIAL_ENTERPRISE"
    HUMAN_PERFORMER = "HUMAN_PERFORMER"


class ConformanceStatus(str, Enum):
    CONFORMED = "CONFORMED"
    NEEDS_PACING_ADJUSTMENT = "NEEDS_PACING_ADJUSTMENT"
    FAILED = "FAILED"


class CharacterVoiceProfile(BaseModel):
    character_id: str
    character_name: str
    performer_name: str
    authorization_consent_id: str
    is_authorized: bool = True
    primary_model: str = "CosyVoice 2 (Apache 2.0)"
    license_type: VoiceLicenseType = VoiceLicenseType.APACHE_2_0
    pitch_scale: float = 1.0
    energy_scale: float = 1.0
    reference_audio_url: str
    language_timbre: str = "es-ES"


class DubbedAudioLine(BaseModel):
    id: str
    shot_id: Optional[str] = None
    character_id: str
    character_name: str
    timecode_in: str
    timecode_out: str
    target_duration_seconds: float
    actual_duration_seconds: float
    conformed_duration_seconds: float
    duration_delta_ms: float
    wsola_applied: bool = False
    time_stretch_ratio: float = 1.0
    loudness_lkfs: float = -24.0
    true_peak_dbtp: float = -1.0
    snr_db: float = 28.5
    is_human_audio: bool = False
    audio_url: str
    conformance_status: ConformanceStatus = ConformanceStatus.CONFORMED
    license_type: VoiceLicenseType = VoiceLicenseType.APACHE_2_0
    emotion: EmotionProfile = EmotionProfile.NEUTRAL
    translated_text: str
    pacing_warning: Optional[str] = None


class DubbingStage(str, Enum):
    QUEUED = "QUEUED"
    CONSENT_VERIFICATION = "CONSENT_VERIFICATION"
    PROSODY_EMOTION_SYNTHESIS = "PROSODY_EMOTION_SYNTHESIS"
    DURATION_QUALITY_CONFORMANCE = "DURATION_QUALITY_CONFORMANCE"
    STEM_CONFORMANCE = "STEM_CONFORMANCE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DubbingStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ScriptLineInput(BaseModel):
    id: str
    shot_id: Optional[str] = None
    character_id: str
    character_name: str
    timecode_in: str
    timecode_out: str
    start_seconds: float
    end_seconds: float
    translated_text: str
    tone: Optional[str] = "URGENT_COMMAND"
    pronunciation_notes: Optional[List[dict]] = None


class DubbingJobRequest(BaseModel):
    project_id: str
    reel_id: str
    target_language: str = "es-ES"
    speaking_rate: float = 1.0
    default_emotion: EmotionProfile = EmotionProfile.NEUTRAL
    script_lines: List[ScriptLineInput] = Field(default_factory=list)


class DubbingJobResponse(BaseModel):
    job_id: str
    project_id: str
    reel_id: str
    status: DubbingStatus = DubbingStatus.QUEUED
    stage: DubbingStage = DubbingStage.QUEUED
    progress_percent: int = 0
    target_language: str = "es-ES"
    audio_lines: List[DubbedAudioLine] = Field(default_factory=list)
    total_duration_seconds: float = 0.0
    average_loudness_lkfs: float = -24.0
    average_snr_db: float = 28.0
    human_takes_count: int = 0
    error: Optional[str] = None


class HumanTakeRequest(BaseModel):
    line_id: str
    reel_id: str
    character_id: str
    performer_name: str
    target_duration_seconds: float
    audio_url_or_path: str
    recorded_duration_seconds: float
    snr_db: Optional[float] = 27.5
