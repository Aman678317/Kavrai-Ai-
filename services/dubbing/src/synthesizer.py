"""Modular Voice Synthesizer with licensed model adapters (CosyVoice 2, StyleTTS 2) and Human ADR Take processing."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import math

from .models import (
    DubbedAudioLine,
    ScriptLineInput,
    EmotionProfile,
    VoiceLicenseType,
    ConformanceStatus,
    HumanTakeRequest,
)
from .voice_registry import voice_registry, VoiceAuthorizationError
from .conformance import AudioConformanceEngine


class BaseTTSProvider(ABC):
    """Abstract interface for neural text-to-speech providers."""

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice_profile: Any,
        target_duration: float,
        speaking_rate: float,
        emotion: EmotionProfile,
        target_language: str,
    ) -> Dict[str, Any]:
        """Synthesizes speech and returns acoustic metadata and projected duration."""
        pass


class CosyVoice2Provider(BaseTTSProvider):
    """
    CosyVoice 2 (Apache 2.0 / FunAudioLLM) provider.
    Zero-shot cross-lingual voice cloning using reference audio embeddings.
    """

    def synthesize(
        self,
        text: str,
        voice_profile: Any,
        target_duration: float,
        speaking_rate: float,
        emotion: EmotionProfile,
        target_language: str,
    ) -> Dict[str, Any]:
        # Phonetic duration calculation based on character count and cadence
        char_count = len(text.strip())
        base_seconds = max(0.8, (char_count / 14.5) / speaking_rate)
        
        # Micro-variation depending on emotion
        if emotion == EmotionProfile.URGENT_COMMAND:
            base_seconds *= 0.94
        elif emotion == EmotionProfile.INTIMATE_WHISPER:
            base_seconds *= 1.08

        # S3 storage URL simulation
        clean_text_slug = text[:15].lower().replace(" ", "_").replace(".", "")
        s3_url = f"s3://cinema-vault-dubbing/cosyvoice2/{voice_profile.character_id}_{clean_text_slug}.wav"

        return {
            "model_name": "CosyVoice 2 (Apache 2.0)",
            "license_type": VoiceLicenseType.APACHE_2_0,
            "raw_duration_seconds": round(base_seconds, 2),
            "raw_loudness_lkfs": -22.8,
            "true_peak_dbtp": -0.8,
            "snr_db": 29.4,
            "audio_url": s3_url,
        }


class StyleTTS2Provider(BaseTTSProvider):
    """
    StyleTTS 2 (MIT + Consent) provider.
    Diffusion head with expressive F0 pitch and energy conditioning.
    """

    def synthesize(
        self,
        text: str,
        voice_profile: Any,
        target_duration: float,
        speaking_rate: float,
        emotion: EmotionProfile,
        target_language: str,
    ) -> Dict[str, Any]:
        char_count = len(text.strip())
        base_seconds = max(0.8, (char_count / 15.0) / speaking_rate)

        if emotion == EmotionProfile.URGENT_COMMAND:
            base_seconds *= 0.92
        elif emotion == EmotionProfile.INTIMATE_WHISPER:
            base_seconds *= 1.10

        clean_text_slug = text[:15].lower().replace(" ", "_").replace(".", "")
        s3_url = f"s3://cinema-vault-dubbing/styletts2/{voice_profile.character_id}_{clean_text_slug}.wav"

        return {
            "model_name": "StyleTTS 2 (MIT)",
            "license_type": VoiceLicenseType.MIT_WITH_CONSENT,
            "raw_duration_seconds": round(base_seconds, 2),
            "raw_loudness_lkfs": -23.1,
            "true_peak_dbtp": -0.9,
            "snr_db": 28.8,
            "audio_url": s3_url,
        }


class ModularDubbingSynthesizer:
    """
    High-level orchestrator for voice synthesis, SAG-AFTRA verification,
    duration conformance, and human take ingestion.
    """

    def __init__(self):
        self._cosyvoice = CosyVoice2Provider()
        self._styletts2 = StyleTTS2Provider()

    def _get_provider(self, primary_model: str) -> BaseTTSProvider:
        if "StyleTTS" in primary_model:
            return self._styletts2
        return self._cosyvoice

    def synthesize_line(
        self,
        line: ScriptLineInput,
        target_language: str = "es-ES",
        speaking_rate: float = 1.0,
        default_emotion: EmotionProfile = EmotionProfile.NEUTRAL,
    ) -> DubbedAudioLine:
        """
        Synthesizes a single dialogue line, verifies actor consent,
        and conforms duration and broadcast loudness.
        """
        # 1. Gate: Verify SAG-AFTRA voice authorization
        profile = voice_registry.verify_voice_authorization(line.character_id)

        # 2. Determine target duration from SMPTE or timestamps
        target_duration = max(0.5, line.end_seconds - line.start_seconds)

        # 3. Resolve emotion profile
        emotion = default_emotion
        if line.tone and line.tone in EmotionProfile.__members__:
            emotion = EmotionProfile[line.tone]

        # 4. Synthesize speech via approved provider
        provider = self._get_provider(profile.primary_model)
        synth_result = provider.synthesize(
            text=line.translated_text,
            voice_profile=profile,
            target_duration=target_duration,
            speaking_rate=speaking_rate,
            emotion=emotion,
            target_language=target_language,
        )

        actual_duration = synth_result["raw_duration_seconds"]
        delta_ms, _ = AudioConformanceEngine.calculate_duration_delta(target_duration, actual_duration)

        # 5. Evaluate duration conformance & WSOLA
        conformed_duration, wsola_applied, stretch_ratio, conf_status, pacing_warning = (
            AudioConformanceEngine.evaluate_duration(target_duration, actual_duration)
        )

        # 6. Apply broadcast loudness conformance (-24.0 LKFS)
        conformed_lkfs, true_peak = AudioConformanceEngine.conform_loudness(
            synth_result["raw_loudness_lkfs"]
        )

        return DubbedAudioLine(
            id=f"dub-audio-{line.id}",
            shot_id=line.shot_id,
            character_id=line.character_id,
            character_name=line.character_name,
            timecode_in=line.timecode_in,
            timecode_out=line.timecode_out,
            target_duration_seconds=round(target_duration, 2),
            actual_duration_seconds=round(actual_duration, 2),
            conformed_duration_seconds=round(conformed_duration, 2),
            duration_delta_ms=delta_ms,
            wsola_applied=wsola_applied,
            time_stretch_ratio=stretch_ratio,
            loudness_lkfs=conformed_lkfs,
            true_peak_dbtp=true_peak,
            snr_db=synth_result["snr_db"],
            is_human_audio=False,
            audio_url=synth_result["audio_url"],
            conformance_status=conf_status,
            license_type=synth_result["license_type"],
            emotion=emotion,
            translated_text=line.translated_text,
            pacing_warning=pacing_warning,
        )

    def process_human_take(self, take: HumanTakeRequest) -> DubbedAudioLine:
        """
        Processes human-recorded studio audio (ADR), verifies character assignment,
        and conforms duration/loudness against the target window.
        """
        # Verify voice profile exists
        profile = voice_registry.get_voice_profile(take.character_id)
        character_name = profile.character_name if profile else take.character_id

        target_duration = max(0.5, take.target_duration_seconds)
        actual_duration = max(0.1, take.recorded_duration_seconds)

        delta_ms, _ = AudioConformanceEngine.calculate_duration_delta(target_duration, actual_duration)

        # Evaluate duration conformance
        conformed_duration, wsola_applied, stretch_ratio, conf_status, pacing_warning = (
            AudioConformanceEngine.evaluate_duration(target_duration, actual_duration)
        )

        # Broadcast loudness normalization
        conformed_lkfs, true_peak = AudioConformanceEngine.conform_loudness(-23.5)

        snr_db = take.snr_db if take.snr_db is not None else 27.5

        return DubbedAudioLine(
            id=f"dub-human-{take.line_id}",
            shot_id=None,
            character_id=take.character_id,
            character_name=character_name,
            timecode_in="01:00:00:00",
            timecode_out="01:00:05:00",
            target_duration_seconds=round(target_duration, 2),
            actual_duration_seconds=round(actual_duration, 2),
            conformed_duration_seconds=round(conformed_duration, 2),
            duration_delta_ms=delta_ms,
            wsola_applied=wsola_applied,
            time_stretch_ratio=stretch_ratio,
            loudness_lkfs=conformed_lkfs,
            true_peak_dbtp=true_peak,
            snr_db=snr_db,
            is_human_audio=True,
            audio_url=take.audio_url_or_path,
            conformance_status=conf_status,
            license_type=VoiceLicenseType.HUMAN_PERFORMER,
            emotion=EmotionProfile.NEUTRAL,
            translated_text="[Human Performer ADR Studio Recording]",
            pacing_warning=pacing_warning,
        )


# Global synthesizer instance
dubbing_synthesizer = ModularDubbingSynthesizer()
