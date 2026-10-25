import asyncio
import pytest
import httpx
from httpx import ASGITransport

from services.speech_engine.src.models import (
    SpeechJobRequest,
    SpeechJobStatus,
    SpeechStage,
)
from services.speech_engine.src.audio_extractor import (
    DemucsVocalExtractor,
    AudioDecodeError,
)
from services.speech_engine.src.transcriber import (
    WhisperXTranscriber,
    seconds_to_smpte,
)
from services.speech_engine.src.diarizer import (
    PyAnnoteSpeakerDiarizer,
    DEFAULT_CHARACTER_ROSTER,
)
from services.speech_engine.src.job_queue import AsyncSpeechJobQueue
from services.speech_engine.src.service import app

class TestSMPTETimecodes:
    def test_seconds_to_smpte_conversions(self):
        assert seconds_to_smpte(0.0, 24.0) == "00:00:00:00"
        assert seconds_to_smpte(1.0, 24.0) == "00:00:01:00"
        assert seconds_to_smpte(60.0, 24.0) == "00:01:00:00"
        assert seconds_to_smpte(3600.0, 24.0) == "01:00:00:00"
        assert seconds_to_smpte(7200.0, 24.0) == "02:00:00:00"

class TestDemucsVocalExtractor:
    def test_demucs_clean_vocal_extraction(self):
        extractor = DemucsVocalExtractor()
        uri, snr, quality, needs_review = extractor.isolate_vocals(
            audio_s3_uri="s3://cinema-vault-raw/master_audio.wav",
            project_id="proj_101",
            reel_id="reel_101",
            denoise_prefilter=True
        )
        assert uri.startswith("s3://cinema-vault-stems/proj_101/reels/reel_101/vocals_48khz.wav")
        assert snr >= 10.0
        assert "CLEAN" in quality
        assert needs_review is False

    def test_demucs_noisy_vocal_extraction_flags_review(self):
        extractor = DemucsVocalExtractor()
        uri, snr, quality, needs_review = extractor.isolate_vocals(
            audio_s3_uri="s3://cinema-vault-raw/noisy_field_recording.wav",
            project_id="proj_102",
            reel_id="reel_102",
            denoise_prefilter=True
        )
        assert snr < 3.0  # Fails SNR noise floor threshold (< 3.0 dB)
        assert "LOW_SNR" in quality
        assert needs_review is True

    def test_demucs_corrupt_audio_raises_error(self):
        extractor = DemucsVocalExtractor()
        with pytest.raises(AudioDecodeError) as exc_info:
            extractor.isolate_vocals(
                audio_s3_uri="s3://cinema-vault-raw/corrupt_header_audio.wav",
                project_id="proj_err",
                reel_id="reel_err"
            )
        assert "Corrupted audio bitstream" in str(exc_info.value)

class TestWhisperXTranscriber:
    def test_whisperx_multilingual_support(self):
        transcriber = WhisperXTranscriber()
        languages = ["en", "es", "fr", "de", "ja"]
        for lang in languages:
            segments = transcriber.transcribe(
                audio_uri=f"s3://vault/{lang}_scene.wav",
                duration_seconds=30.0,
                source_language_hint=lang
            )
            assert len(segments) > 0
            assert segments[0].detected_language.startswith(lang)
            assert segments[0].language_confidence >= 0.95
            assert len(segments[0].text) > 0

    def test_whisperx_word_level_timestamps(self):
        transcriber = WhisperXTranscriber()
        segments = transcriber.transcribe(
            audio_uri="s3://vault/scene_dialogue.wav",
            duration_seconds=25.0
        )
        assert len(segments) > 0
        seg = segments[0]
        assert len(seg.words) > 0

        # Verify word monotonic time bounds within dialogue segment
        for i, word in enumerate(seg.words):
            assert word.start_time >= seg.start_seconds
            assert word.end_time <= seg.end_seconds + 0.05
            assert word.start_time <= word.end_time
            assert word.confidence > 0.0
            if i > 0:
                assert word.start_time >= seg.words[i - 1].start_time

    def test_whisperx_long_recording_vad_chunking(self):
        """
        Verify 120-minute (7200s) feature film VAD chunking and continuous timecodes
        """
        transcriber = WhisperXTranscriber()
        long_duration = 7200.0 # 2-hour movie
        segments = transcriber.transcribe(
            audio_uri="s3://vault/feature_film_120m.wav",
            duration_seconds=long_duration,
            frame_rate=24.0
        )
        assert len(segments) >= 100 # Should generate realistic theatrical dialogue density
        assert segments[0].start_seconds >= 0.0
        assert segments[-1].end_seconds <= long_duration
        # Check monotonic timestamps and timecodes
        for i in range(len(segments) - 1):
            assert segments[i].start_seconds < segments[i + 1].start_seconds
            assert segments[i].end_seconds <= segments[i + 1].start_seconds

class TestPyAnnoteSpeakerDiarizer:
    def test_diarization_and_character_roster_attribution(self):
        diarizer = PyAnnoteSpeakerDiarizer()
        transcriber = WhisperXTranscriber()
        raw_segments = transcriber.transcribe(
            audio_uri="s3://vault/cockpit_dialogue.wav",
            duration_seconds=40.0
        )
        roster = ["Commander Elena Vance", "Chief Engineer Kaelen"]
        attributed, count = diarizer.diarize_and_attribute(raw_segments, character_roster=roster)

        assert count > 0
        assigned_names = {s.speaker_name for s in attributed}
        assert assigned_names.issubset(set(roster))
        assert "Commander Elena Vance" in assigned_names

    def test_diarization_fallback_roster(self):
        diarizer = PyAnnoteSpeakerDiarizer()
        transcriber = WhisperXTranscriber()
        raw_segments = transcriber.transcribe(
            audio_uri="s3://vault/bridge_scene.wav",
            duration_seconds=20.0
        )
        attributed, count = diarizer.diarize_and_attribute(raw_segments, character_roster=[])
        assert count > 0
        assigned_names = {s.speaker_name for s in attributed}
        assert assigned_names.issubset(set(DEFAULT_CHARACTER_ROSTER))

class TestAsyncSpeechJobQueue:
    @pytest.mark.asyncio
    async def test_job_lifecycle_completion(self):
        queue = AsyncSpeechJobQueue()
        req = SpeechJobRequest(
            project_id="proj_lifecycle",
            reel_id="reel_lifecycle",
            audio_s3_uri="s3://cinema-vault-raw/reel_audio.wav",
            duration_seconds=30.0,
            character_roster=["Commander Elena Vance", "Chief Engineer Kaelen"]
        )

        job = await queue.enqueue(req)
        assert job.status in [SpeechJobStatus.QUEUED, SpeechJobStatus.PROCESSING]
        assert job.job_id.startswith("job_spch_")

        # Poll until completion
        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == SpeechJobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == SpeechJobStatus.COMPLETED
        assert final_job.stage == SpeechStage.COMPLETED
        assert final_job.progress_percent == 100
        assert len(final_job.segments) > 0
        assert final_job.speaker_count >= 1
        assert final_job.vocal_stem_s3_uri is not None
        assert final_job.completed_at is not None

    @pytest.mark.asyncio
    async def test_noisy_audio_job_retains_review_flags(self):
        queue = AsyncSpeechJobQueue()
        req = SpeechJobRequest(
            project_id="proj_noisy",
            reel_id="reel_noisy",
            audio_s3_uri="s3://cinema-vault-raw/noisy_dialogue_take.wav",
            duration_seconds=20.0
        )
        job = await queue.enqueue(req)

        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == SpeechJobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == SpeechJobStatus.COMPLETED
        # Segments must be flagged for manual audio engineer review due to low SNR
        assert all(s.needs_review for s in final_job.segments)
        assert all(s.snr_db < 3.0 for s in final_job.segments)

    @pytest.mark.asyncio
    async def test_corrupt_audio_job_fails_gracefully(self):
        queue = AsyncSpeechJobQueue()
        req = SpeechJobRequest(
            project_id="proj_corrupt",
            reel_id="reel_corrupt",
            audio_s3_uri="s3://cinema-vault-raw/corrupt_bitstream.wav",
            duration_seconds=15.0
        )
        job = await queue.enqueue(req)

        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == SpeechJobStatus.FAILED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == SpeechJobStatus.FAILED
        assert final_job.stage == SpeechStage.FAILED
        assert "Corrupted audio bitstream" in (final_job.error or "")

class TestFastAPISpeechService:
    @pytest.mark.asyncio
    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "HEALTHY"
            assert data["service"] == "kavrai-speech-engine"
            assert data["models"]["vocal_isolation"] == "meta-demucs-v4"
            assert data["models"]["speech_recognition"] == "whisperx-large-v3"
            assert data["models"]["speaker_diarization"] == "pyannote-audio-3.1"

    @pytest.mark.asyncio
    async def test_create_and_poll_speech_job(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            post_resp = await client.post(
                "/api/v1/speech/jobs",
                json={
                    "project_id": "proj_speech_test",
                    "reel_id": "reel_speech_test",
                    "audio_s3_uri": "s3://cinema-vault-raw/scene01_dialogue.wav",
                    "duration_seconds": 25.0,
                    "frame_rate": 24.0,
                    "source_language_hint": "en",
                    "character_roster": ["Commander Elena Vance", "Chief Engineer Kaelen"],
                },
            )
            assert post_resp.status_code == 202
            job_data = post_resp.json()
            job_id = job_data["job_id"]

            # Poll for completion
            for _ in range(50):
                await asyncio.sleep(0.02)
                get_resp = await client.get(f"/api/v1/speech/jobs/{job_id}")
                assert get_resp.status_code == 200
                poll_data = get_resp.json()
                if poll_data["status"] == "COMPLETED":
                    break

            final_resp = await client.get(f"/api/v1/speech/jobs/{job_id}")
            assert final_resp.status_code == 200
            final_data = final_resp.json()
            assert final_data["status"] == "COMPLETED"
            assert len(final_data["segments"]) > 0
            assert final_data["vocal_stem_s3_uri"] is not None

    @pytest.mark.asyncio
    async def test_get_job_by_reel(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            reel_id = "reel_by_id_test"
            await client.post(
                "/api/v1/speech/jobs",
                json={
                    "project_id": "proj_by_reel",
                    "reel_id": reel_id,
                    "audio_s3_uri": "s3://cinema-vault-raw/master.wav",
                    "duration_seconds": 10.0,
                },
            )
            get_resp = await client.get(f"/api/v1/speech/jobs/reel/{reel_id}")
            assert get_resp.status_code == 200
            assert get_resp.json()["reel_id"] == reel_id

    @pytest.mark.asyncio
    async def test_job_not_found_returns_404(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/speech/jobs/nonexistent_job_12345")
            assert resp.status_code == 404
            assert "was not found" in resp.json()["detail"]
