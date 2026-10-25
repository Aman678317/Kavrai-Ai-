"""Automated tests for the Modular Dubbing & Voice Synthesis microservice."""

import pytest
from httpx import AsyncClient, ASGITransport

from src.models import (
    EmotionProfile,
    VoiceLicenseType,
    ConformanceStatus,
    ScriptLineInput,
    DubbingJobRequest,
    HumanTakeRequest,
)
from src.voice_registry import voice_registry, VoiceAuthorizationError
from src.conformance import AudioConformanceEngine
from src.synthesizer import dubbing_synthesizer
from src.job_queue import dubbing_job_queue
from src.service import app


class TestVoiceRegistry:
    def test_voice_registry_authorization_success(self):
        profile = voice_registry.verify_voice_authorization("char_elena")
        assert profile.character_name == "Commander Elena Vance"
        assert profile.is_authorized is True
        assert "SAG-AFTRA" in profile.authorization_consent_id
        assert profile.license_type == VoiceLicenseType.APACHE_2_0

    def test_voice_registry_unauthorized_rejection(self):
        with pytest.raises(VoiceAuthorizationError) as exc_info:
            voice_registry.verify_voice_authorization("char_unauthorized")
        assert "Voice authorization failed" in str(exc_info.value)
        assert "EXPIRED-CONSENT" in str(exc_info.value)

    def test_voice_registry_unknown_character(self):
        with pytest.raises(VoiceAuthorizationError) as exc_info:
            voice_registry.verify_voice_authorization("char_nonexistent_999")
        assert "No registered voice profile found" in str(exc_info.value)


class TestAudioConformanceEngine:
    def test_wsola_duration_exact_match(self):
        # Target: 3.5s, Actual: 3.55s (1.4% drift, <= 5%)
        conformed, wsola_applied, ratio, status, warning = (
            AudioConformanceEngine.evaluate_duration(target_sec=3.5, actual_sec=3.55)
        )
        assert wsola_applied is False
        assert ratio == 1.0
        assert status == ConformanceStatus.CONFORMED
        assert conformed == 3.55
        assert warning is None

    def test_wsola_time_stretch_moderate_drift(self):
        # Target: 3.5s, Actual: 3.85s (10.0% drift, <= 15%)
        conformed, wsola_applied, ratio, status, warning = (
            AudioConformanceEngine.evaluate_duration(target_sec=3.5, actual_sec=3.85)
        )
        assert wsola_applied is True
        assert ratio == round(3.5 / 3.85, 3)
        assert status == ConformanceStatus.CONFORMED
        assert conformed == 3.5  # Conformed to target
        assert warning is None

    def test_wsola_excessive_drift_flags_pacing(self):
        # Target: 2.0s, Actual: 2.60s (30.0% drift, > 15%)
        conformed, wsola_applied, ratio, status, warning = (
            AudioConformanceEngine.evaluate_duration(target_sec=2.0, actual_sec=2.6)
        )
        assert wsola_applied is False
        assert status == ConformanceStatus.NEEDS_PACING_ADJUSTMENT
        assert warning is not None
        assert "Exceeds max WSOLA time-stretch limit" in warning

    def test_itur_bs1770_loudness_conformance(self):
        raw_lkfs = -21.4
        conformed_lkfs, true_peak = AudioConformanceEngine.conform_loudness(raw_lkfs)
        assert conformed_lkfs == -24.0
        assert true_peak <= -1.0

    def test_snr_quality_gate(self):
        passes, msg = AudioConformanceEngine.validate_snr(28.4)
        assert passes is True
        assert "Clean dialogue vocal" in msg

        fails, msg_fail = AudioConformanceEngine.validate_snr(18.2)
        assert fails is False
        assert "falls below theatrical broadcast requirement" in msg_fail


class TestModularDubbingSynthesizer:
    def test_synthesize_line_cosyvoice(self):
        line = ScriptLineInput(
            id="line-001",
            shot_id="shot-101",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            timecode_in="01:00:01:00",
            timecode_out="01:00:04:12",
            start_seconds=1.0,
            end_seconds=4.5,
            translated_text="Trayectoria orbital lista. Vector de reentrada iniciado.",
            tone="URGENT_COMMAND",
        )
        dubbed = dubbing_synthesizer.synthesize_line(line, target_language="es-ES")
        assert dubbed.character_id == "char_elena"
        assert dubbed.loudness_lkfs == -24.0
        assert dubbed.true_peak_dbtp <= -1.0
        assert dubbed.snr_db >= 25.0
        assert dubbed.conformance_status in [
            ConformanceStatus.CONFORMED,
            ConformanceStatus.NEEDS_PACING_ADJUSTMENT,
        ]
        assert "s3://cinema-vault-dubbing/" in dubbed.audio_url

    def test_synthesize_line_styletts2(self):
        line = ScriptLineInput(
            id="line-002",
            shot_id="shot-102",
            character_id="char_kaelen",
            character_name="Chief Engineer Kaelen",
            timecode_in="01:00:06:00",
            timecode_out="01:00:10:12",
            start_seconds=6.0,
            end_seconds=10.5,
            translated_text="Escudos al noventa y dos por ciento. Propulsores sincronizados.",
            tone="URGENT_COMMAND",
        )
        dubbed = dubbing_synthesizer.synthesize_line(line, target_language="es-ES")
        assert dubbed.license_type == VoiceLicenseType.MIT_WITH_CONSENT
        assert dubbed.loudness_lkfs == -24.0

    def test_emotion_conditioning_modulations(self):
        line_urgent = ScriptLineInput(
            id="line-urg",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            timecode_in="01:00:00:00",
            timecode_out="01:00:04:00",
            start_seconds=0.0,
            end_seconds=4.0,
            translated_text="Advertencia inmediata. Evacuen el hangar.",
            tone="URGENT_COMMAND",
        )
        dubbed_urgent = dubbing_synthesizer.synthesize_line(
            line_urgent, default_emotion=EmotionProfile.URGENT_COMMAND
        )

        line_whisper = ScriptLineInput(
            id="line-whi",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            timecode_in="01:00:00:00",
            timecode_out="01:00:04:00",
            start_seconds=0.0,
            end_seconds=4.0,
            translated_text="Advertencia inmediata. Evacuen el hangar.",
            tone="INTIMATE_WHISPER",
        )
        dubbed_whisper = dubbing_synthesizer.synthesize_line(
            line_whisper, default_emotion=EmotionProfile.INTIMATE_WHISPER
        )

        # Urgent speech has faster cadence than whisper
        assert dubbed_urgent.actual_duration_seconds < dubbed_whisper.actual_duration_seconds

    def test_speaking_rate_modulation(self):
        line = ScriptLineInput(
            id="line-rate",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            timecode_in="01:00:00:00",
            timecode_out="01:00:05:00",
            start_seconds=0.0,
            end_seconds=5.0,
            translated_text="Confirmación de coordenadas completada.",
        )
        dubbed_normal = dubbing_synthesizer.synthesize_line(line, speaking_rate=1.0)
        dubbed_fast = dubbing_synthesizer.synthesize_line(line, speaking_rate=1.25)
        assert dubbed_fast.actual_duration_seconds < dubbed_normal.actual_duration_seconds

    def test_human_audio_take_ingest(self):
        take = HumanTakeRequest(
            line_id="line-001",
            reel_id="reel-01",
            character_id="char_elena",
            performer_name="Maria Rodriguez (Spanish Voice Actor)",
            target_duration_seconds=3.5,
            audio_url_or_path="s3://cinema-vault-dubbing/human_adr/take_01.wav",
            recorded_duration_seconds=3.6,
            snr_db=29.2,
        )
        conformed_take = dubbing_synthesizer.process_human_take(take)
        assert conformed_take.is_human_audio is True
        assert conformed_take.license_type == VoiceLicenseType.HUMAN_PERFORMER
        assert conformed_take.conformance_status == ConformanceStatus.CONFORMED
        assert conformed_take.loudness_lkfs == -24.0

    def test_human_audio_take_excessive_drift(self):
        take = HumanTakeRequest(
            line_id="line-001",
            reel_id="reel-01",
            character_id="char_elena",
            performer_name="Elena Voice Actor",
            target_duration_seconds=2.0,
            audio_url_or_path="s3://cinema-vault-dubbing/human_adr/take_drift.wav",
            recorded_duration_seconds=3.2,  # 60% drift!
            snr_db=28.0,
        )
        conformed_take = dubbing_synthesizer.process_human_take(take)
        assert conformed_take.conformance_status == ConformanceStatus.NEEDS_PACING_ADJUSTMENT
        assert conformed_take.pacing_warning is not None


class TestDubbingJobQueue:
    @pytest.mark.asyncio
    async def test_job_lifecycle_completion(self):
        request = DubbingJobRequest(
            project_id="proj-001",
            reel_id="reel-01",
            target_language="es-ES",
            script_lines=[
                ScriptLineInput(
                    id="dub-001",
                    character_id="char_elena",
                    character_name="Commander Elena Vance",
                    timecode_in="01:00:01:00",
                    timecode_out="01:00:04:00",
                    start_seconds=1.0,
                    end_seconds=4.0,
                    translated_text="Trayectoria orbital lista.",
                ),
                ScriptLineInput(
                    id="dub-002",
                    character_id="char_kaelen",
                    character_name="Chief Engineer Kaelen",
                    timecode_in="01:00:05:00",
                    timecode_out="01:00:09:00",
                    start_seconds=5.0,
                    end_seconds=9.0,
                    translated_text="Propulsores sincronizados.",
                ),
            ],
        )
        job = dubbing_job_queue.enqueue_job(request)
        completed_job = await dubbing_job_queue.process_job(job.job_id)
        assert completed_job.status == "COMPLETED"
        assert completed_job.progress_percent == 100
        assert len(completed_job.audio_lines) == 2
        assert completed_job.average_loudness_lkfs == -24.0

    @pytest.mark.asyncio
    async def test_unauthorized_voice_fails_job(self):
        request = DubbingJobRequest(
            project_id="proj-001",
            reel_id="reel-01",
            target_language="es-ES",
            script_lines=[
                ScriptLineInput(
                    id="dub-unauth",
                    character_id="char_unauthorized",
                    character_name="Uncertified Cast Member",
                    timecode_in="01:00:01:00",
                    timecode_out="01:00:04:00",
                    start_seconds=1.0,
                    end_seconds=4.0,
                    translated_text="Texto no autorizado.",
                )
            ],
        )
        job = dubbing_job_queue.enqueue_job(request)
        failed_job = await dubbing_job_queue.process_job(job.job_id)
        assert failed_job.status == "FAILED"
        assert "Voice authorization failed" in failed_job.error


class TestFastAPIDubbingService:
    @pytest.mark.asyncio
    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["service"] == "kavrai-dubbing-service"
        assert "SAG-AFTRA" in data["compliance"]

    @pytest.mark.asyncio
    async def test_list_voices(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/v1/dubbing/voices")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 3
        ids = [v["character_id"] for v in data]
        assert "char_elena" in ids
        assert "char_kaelen" in ids

    @pytest.mark.asyncio
    async def test_create_and_poll_dubbing_job(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            post_res = await ac.post(
                "/api/v1/dubbing/jobs",
                json={
                    "project_id": "proj-fastapi-test",
                    "reel_id": "reel-fastapi-01",
                    "target_language": "es-ES",
                    "speaking_rate": 1.0,
                    "default_emotion": "URGENT_COMMAND",
                    "script_lines": [
                        {
                            "id": "dub-fast-01",
                            "character_id": "char_elena",
                            "character_name": "Commander Elena Vance",
                            "timecode_in": "01:00:01:00",
                            "timecode_out": "01:00:04:00",
                            "start_seconds": 1.0,
                            "end_seconds": 4.0,
                            "translated_text": "Trayectoria confirmada.",
                            "tone": "URGENT_COMMAND",
                        }
                    ],
                },
            )
            assert post_res.status_code == 200
            job_id = post_res.json()["job_id"]

            # Poll
            get_res = await ac.get(f"/api/v1/dubbing/jobs/{job_id}")
            assert get_res.status_code == 200

    @pytest.mark.asyncio
    async def test_human_take_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post(
                "/api/v1/dubbing/human-take",
                json={
                    "line_id": "line-human-test",
                    "reel_id": "reel-human-01",
                    "character_id": "char_elena",
                    "performer_name": "Elena Human Voice Talent",
                    "target_duration_seconds": 3.0,
                    "audio_url_or_path": "s3://cinema-vault-dubbing/human/test_take.wav",
                    "recorded_duration_seconds": 3.05,
                    "snr_db": 30.1,
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert data["is_human_audio"] is True
            assert data["loudness_lkfs"] == -24.0

    @pytest.mark.asyncio
    async def test_not_found_returns_404(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/v1/dubbing/jobs/job-unknown-999")
            assert res.status_code == 404
