from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ToneProfile(str, Enum):
    URGENT_COMMAND = "URGENT_COMMAND"
    WHISPER_CONSPIRATORIAL = "WHISPER_CONSPIRATORIAL"
    CALM_TECHNICAL = "CALM_TECHNICAL"
    INTIMATE_EMOTIONAL = "INTIMATE_EMOTIONAL"
    SARCASTIC_WIT = "SARCASTIC_WIT"

class ValidationStatus(str, Enum):
    VALIDATED = "VALIDATED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    SYLLABLE_MISMATCH = "SYLLABLE_MISMATCH"
    MANUALLY_EDITED = "MANUALLY_EDITED"

class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class TranscreationStage(str, Enum):
    QUEUED = "QUEUED"
    SCENE_CONTEXT_ANALYSIS = "SCENE_CONTEXT_ANALYSIS"
    LLM_TRANSCREATION = "LLM_TRANSCREATION"
    SYLLABLE_BUDGET_VERIFICATION = "SYLLABLE_BUDGET_VERIFICATION"
    VISEME_ALIGNMENT_INDEXING = "VISEME_ALIGNMENT_INDEXING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class VisemeAnchor(BaseModel):
    viseme: str = "bilabial"
    target_frame: int
    phoneme: str
    is_closure: bool = True

class PronunciationNote(BaseModel):
    word: str
    ipa: str
    phonetic_spelling: str
    stress_syllable: str
    audio_cue: Optional[str] = None

class DubbingScriptLine(BaseModel):
    line_id: str
    shot_id: Optional[str] = None
    timecode_in: str
    timecode_out: str
    start_seconds: float
    end_seconds: float
    character_id: str
    character_name: str
    character_relationship: str
    scene_context: str
    tone: ToneProfile
    source_language: str
    target_language: str
    source_text: str
    translated_text: str
    source_syllables: int
    target_syllables: int
    syllable_delta: int
    duration_delta_percent: float
    viseme_anchors: list[VisemeAnchor] = Field(default_factory=list)
    pronunciation_notes: list[PronunciationNote] = Field(default_factory=list)
    cultural_notes: Optional[str] = None
    validation_status: ValidationStatus = ValidationStatus.VALIDATED
    is_approved: bool = False

class TranscreationJobRequest(BaseModel):
    project_id: str
    reel_id: str
    source_language: str = "en-US"
    target_language: str = "es-ES"
    syllable_budget_tolerance: int = Field(default=1, ge=0, le=3)
    match_viseme_closures: bool = True
    dialogue_inputs: Optional[list[dict]] = None
    simulate_provider_failure: bool = False
    simulate_rate_limit: bool = False

class TranscreationJobResponse(BaseModel):
    job_id: str
    project_id: str
    reel_id: str
    status: JobStatus
    stage: TranscreationStage
    progress_percent: int = Field(default=0, ge=0, le=100)
    target_language: str
    script_lines: list[DubbingScriptLine] = Field(default_factory=list)
    total_syllables_source: int = 0
    total_syllables_target: int = 0
    average_syllable_delta: float = 0.0
    retry_count: int = 0
    provider_used: str = "Claude 3.5 Sonnet / Qwen-2.5-72B Fallback"
    error: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None
