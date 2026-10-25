"""SAG-AFTRA Voice Authorization Ledger and Character Voice Registry."""

from typing import Dict, List, Optional
from .models import CharacterVoiceProfile, VoiceLicenseType


class VoiceAuthorizationError(Exception):
    """Raised when voice synthesis is attempted without SAG-AFTRA consent clearance."""
    pass


class VoiceRegistry:
    """Manages character voice profiles and enforces SAG-AFTRA consent verification."""

    def __init__(self):
        self._profiles: Dict[str, CharacterVoiceProfile] = {}
        self._seed_default_cinema_roster()

    def _seed_default_cinema_roster(self):
        """Seed certified character profiles for the studio cinematic cast."""
        profiles = [
            CharacterVoiceProfile(
                character_id="char_elena",
                character_name="Commander Elena Vance",
                performer_name="Elena Vance (Voice Talent)",
                authorization_consent_id="SAG-AFTRA-EV-2026-9941",
                is_authorized=True,
                primary_model="CosyVoice 2 (Apache 2.0)",
                license_type=VoiceLicenseType.APACHE_2_0,
                pitch_scale=1.05,
                energy_scale=1.10,
                reference_audio_url="s3://cinema-vault-voices/elena_vance_clean_master.wav",
                language_timbre="es-ES",
            ),
            CharacterVoiceProfile(
                character_id="char_kaelen",
                character_name="Chief Engineer Kaelen",
                performer_name="Kaelen Scott (Voice Talent)",
                authorization_consent_id="SAG-AFTRA-KS-2026-4412",
                is_authorized=True,
                primary_model="StyleTTS 2 (MIT)",
                license_type=VoiceLicenseType.MIT_WITH_CONSENT,
                pitch_scale=0.95,
                energy_scale=1.15,
                reference_audio_url="s3://cinema-vault-voices/kaelen_scott_clean_master.wav",
                language_timbre="es-ES",
            ),
            CharacterVoiceProfile(
                character_id="char_aura",
                character_name="AI Interface Aura",
                performer_name="Aura Synthetic Vocal Architecture",
                authorization_consent_id="SYNTH-AI-AU-2026-0001",
                is_authorized=True,
                primary_model="CosyVoice 2 (Apache 2.0)",
                license_type=VoiceLicenseType.APACHE_2_0,
                pitch_scale=1.00,
                energy_scale=0.98,
                reference_audio_url="s3://cinema-vault-voices/aura_interface_master.wav",
                language_timbre="es-ES",
            ),
            CharacterVoiceProfile(
                character_id="char_unauthorized",
                character_name="Uncertified Cast Member",
                performer_name="Pending Legal Sign-off",
                authorization_consent_id="EXPIRED-CONSENT-2025-0000",
                is_authorized=False,
                primary_model="Restricted Model",
                license_type=VoiceLicenseType.APACHE_2_0,
                pitch_scale=1.0,
                energy_scale=1.0,
                reference_audio_url="s3://cinema-vault-voices/pending.wav",
                language_timbre="es-ES",
            ),
        ]
        for p in profiles:
            self._profiles[p.character_id] = p

    def get_voice_profile(self, character_id: str) -> Optional[CharacterVoiceProfile]:
        return self._profiles.get(character_id)

    def list_voice_profiles(self) -> List[CharacterVoiceProfile]:
        return list(self._profiles.values())

    def verify_voice_authorization(self, character_id: str) -> CharacterVoiceProfile:
        """Verifies that the requested character has valid SAG-AFTRA consent."""
        profile = self.get_voice_profile(character_id)
        if not profile:
            raise VoiceAuthorizationError(
                f"No registered voice profile found for character '{character_id}'."
            )
        if not profile.is_authorized:
            raise VoiceAuthorizationError(
                f"Voice authorization failed for character '{character_id}' ({profile.character_name}). "
                f"SAG-AFTRA consent token '{profile.authorization_consent_id}' is invalid or expired."
            )
        return profile

    def register_or_update(self, profile: CharacterVoiceProfile) -> CharacterVoiceProfile:
        self._profiles[profile.character_id] = profile
        return profile


# Global voice registry instance
voice_registry = VoiceRegistry()
