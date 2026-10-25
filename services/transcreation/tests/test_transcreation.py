import asyncio
import pytest
import httpx
from httpx import ASGITransport

from services.transcreation.src.models import (
    TranscreationJobRequest,
    JobStatus,
    TranscreationStage,
    ToneProfile,
    ValidationStatus,
)
from services.transcreation.src.syllable_counter import SyllableCounter
from services.transcreation.src.transcreator import (
    TheatricalTranscreator,
    ProviderServerError,
    ProviderRateLimitError,
)
from services.transcreation.src.job_queue import AsyncTranscreationJobQueue
from services.transcreation.src.service import app

class TestSyllableCounter:
    def test_english_syllable_count(self):
        assert SyllableCounter.count_word_syllables("orbital", "en") == 3
        assert SyllableCounter.count_word_syllables("trajectory", "en") == 4
        assert SyllableCounter.count_word_syllables("confirmed", "en") == 2
        assert SyllableCounter.count_syllables("Orbital trajectory confirmed.", "en") == 9

    def test_spanish_syllable_count(self):
        assert SyllableCounter.count_word_syllables("orbital", "es") == 3
        assert SyllableCounter.count_word_syllables("reentrada", "es") == 4
        assert SyllableCounter.count_word_syllables("iniciado", "es") == 4
        assert SyllableCounter.count_syllables("Trayectoria orbital lista.", "es") >= 7

    def test_french_and_german_syllable_count(self):
        assert SyllableCounter.count_word_syllables("trajectoire", "fr") == 3
        assert SyllableCounter.count_word_syllables("eintrittsvektor", "de") >= 4

    def test_find_bilabial_anchors(self):
        text = "Trayectoria orbital lista. Vector de reentrada iniciado."
        anchors = SyllableCounter.find_bilabial_anchors(text, start_frame=100, fps=24.0)
        assert len(anchors) > 0
        # Check anchors are valid bilabial phonemes (p, b, m)
        for phoneme, frame in anchors:
            assert phoneme in {"p", "b", "m"}
            assert frame >= 100

class TestTheatricalTranscreator:
    @pytest.mark.asyncio
    async def test_transcreation_syllable_budget_enforcement(self):
        transcreator = TheatricalTranscreator()
        source_text = "Orbital trajectory confirmed. Atmospheric entry vector initialized."
        line, retries = await transcreator.transcreate_line(
            line_id="line_test_01",
            source_text=source_text,
            source_lang="en-US",
            target_lang="es-ES",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            character_relationship="Commanding lead pilot",
            scene_context="Orbital atmospheric re-entry",
            tone=ToneProfile.URGENT_COMMAND,
            timecode_in="01:00:01:06",
            timecode_out="01:00:04:18",
            start_seconds=1.25,
            end_seconds=4.75,
            syllable_budget_tolerance=1,
        )

        assert line.line_id == "line_test_01"
        assert line.source_syllables > 0
        assert line.target_syllables > 0
        # Lip-sync constraint: Delta <= 1 syllable
        assert line.syllable_delta <= 1
        assert line.validation_status == ValidationStatus.VALIDATED
        assert line.is_approved is True
        assert len(line.viseme_anchors) > 0

    @pytest.mark.asyncio
    async def test_pronunciation_notes_for_voice_actors(self):
        transcreator = TheatricalTranscreator()
        line, _ = await transcreator.transcreate_line(
            line_id="line_test_02",
            source_text="Orbital trajectory confirmed. Atmospheric entry vector initialized.",
            source_lang="en-US",
            target_lang="es-ES",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            character_relationship="Lead pilot",
            scene_context="Cockpit descent",
            tone=ToneProfile.URGENT_COMMAND,
            timecode_in="01:00:01:06",
            timecode_out="01:00:04:18",
            start_seconds=1.25,
            end_seconds=4.75,
        )

        assert len(line.pronunciation_notes) > 0
        note = line.pronunciation_notes[0]
        assert len(note.word) > 0
        assert len(note.ipa) > 0
        assert len(note.phonetic_spelling) > 0
        assert len(note.stress_syllable) > 0

    @pytest.mark.asyncio
    async def test_provider_retry_on_rate_limit(self):
        # Test retry recovery when encountering HTTP 429 rate limit
        transcreator = TheatricalTranscreator(max_retries=3, initial_backoff_sec=0.01)
        line, retries = await transcreator.transcreate_line(
            line_id="line_retry_test",
            source_text="Orbital trajectory confirmed. Atmospheric entry vector initialized.",
            source_lang="en-US",
            target_lang="es-ES",
            character_id="char_elena",
            character_name="Commander Elena Vance",
            character_relationship="Lead pilot",
            scene_context="Descent",
            tone=ToneProfile.URGENT_COMMAND,
            timecode_in="01:00:00:00",
            timecode_out="01:00:04:00",
            start_seconds=0.0,
            end_seconds=4.0,
            simulate_rate_limit=True,
        )

        assert line is not None
        assert retries >= 1 # Succeeded on retry backoff

    @pytest.mark.asyncio
    async def test_provider_terminal_failure_handling(self):
        transcreator = TheatricalTranscreator(max_retries=2, initial_backoff_sec=0.01)
        with pytest.raises(ProviderServerError) as exc_info:
            await transcreator.transcreate_line(
                line_id="line_fail_test",
                source_text="Orbital trajectory confirmed. Atmospheric entry vector initialized.",
                source_lang="en-US",
                target_lang="es-ES",
                character_id="char_elena",
                character_name="Commander Elena Vance",
                character_relationship="Lead pilot",
                scene_context="Descent",
                tone=ToneProfile.URGENT_COMMAND,
                timecode_in="01:00:00:00",
                timecode_out="01:00:04:00",
                start_seconds=0.0,
                end_seconds=4.0,
                simulate_failure=True,
            )
        assert "Persistent backend gateway timeout" in str(exc_info.value)

class TestAsyncTranscreationJobQueue:
    @pytest.mark.asyncio
    async def test_job_lifecycle_completion(self):
        queue = AsyncTranscreationJobQueue()
        req = TranscreationJobRequest(
            project_id="proj_lifecycle",
            reel_id="reel_lifecycle",
            target_language="es-ES",
            syllable_budget_tolerance=1,
        )

        job = await queue.enqueue(req)
        assert job.status in [JobStatus.QUEUED, JobStatus.PROCESSING]
        assert job.job_id.startswith("job_trans_")

        # Poll until completion
        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == JobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == JobStatus.COMPLETED
        assert final_job.stage == TranscreationStage.COMPLETED
        assert final_job.progress_percent == 100
        assert len(final_job.script_lines) >= 3
        assert final_job.total_syllables_source > 0
        assert final_job.total_syllables_target > 0
        assert final_job.completed_at is not None

    @pytest.mark.asyncio
    async def test_rate_limit_retry_recorded_in_job(self):
        queue = AsyncTranscreationJobQueue()
        req = TranscreationJobRequest(
            project_id="proj_retry",
            reel_id="reel_retry",
            target_language="es-ES",
            simulate_rate_limit=True,
        )
        job = await queue.enqueue(req)

        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == JobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == JobStatus.COMPLETED
        assert final_job.retry_count > 0

    @pytest.mark.asyncio
    async def test_failure_recorded_in_job(self):
        queue = AsyncTranscreationJobQueue()
        req = TranscreationJobRequest(
            project_id="proj_fail",
            reel_id="reel_fail",
            target_language="es-ES",
            simulate_provider_failure=True,
        )
        job = await queue.enqueue(req)

        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == JobStatus.FAILED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == JobStatus.FAILED
        assert final_job.stage == TranscreationStage.FAILED
        assert "Persistent backend gateway timeout" in (final_job.error or "")

    @pytest.mark.asyncio
    async def test_update_script_line(self):
        queue = AsyncTranscreationJobQueue()
        req = TranscreationJobRequest(
            project_id="proj_edit",
            reel_id="reel_edit",
            target_language="es-ES",
        )
        job = await queue.enqueue(req)

        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == JobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        target_line = final_job.script_lines[0]

        updated_line = await queue.update_line(
            target_line.line_id,
            {"translated_text": "Texto traducido corregido manualmente.", "is_approved": True}
        )
        assert updated_line is not None
        assert updated_line.translated_text == "Texto traducido corregido manualmente."
        assert updated_line.is_approved is True

class TestFastAPIService:
    @pytest.mark.asyncio
    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "HEALTHY"
            assert data["service"] == "kavrai-transcreation-service"
            assert "claude-3-5-sonnet" in data["models"]["primary"]

    @pytest.mark.asyncio
    async def test_create_and_poll_transcreation_job(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            post_resp = await client.post(
                "/api/v1/transcreation/jobs",
                json={
                    "project_id": "proj_api_test",
                    "reel_id": "reel_api_test",
                    "target_language": "es-ES",
                    "syllable_budget_tolerance": 1,
                },
            )
            assert post_resp.status_code == 202
            job_data = post_resp.json()
            job_id = job_data["job_id"]

            for _ in range(50):
                await asyncio.sleep(0.02)
                get_resp = await client.get(f"/api/v1/transcreation/jobs/{job_id}")
                assert get_resp.status_code == 200
                poll_data = get_resp.json()
                if poll_data["status"] == "COMPLETED":
                    break

            final_resp = await client.get(f"/api/v1/transcreation/jobs/{job_id}")
            assert final_resp.status_code == 200
            final_data = final_resp.json()
            assert final_data["status"] == "COMPLETED"
            assert len(final_data["script_lines"]) >= 3
            assert final_data["average_syllable_delta"] <= 1.0

    @pytest.mark.asyncio
    async def test_put_update_script_line(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # Create job first
            post_resp = await client.post(
                "/api/v1/transcreation/jobs",
                json={"project_id": "proj_put", "reel_id": "reel_put", "target_language": "es-ES"},
            )
            job_id = post_resp.json()["job_id"]

            for _ in range(50):
                await asyncio.sleep(0.02)
                get_resp = await client.get(f"/api/v1/transcreation/jobs/{job_id}")
                if get_resp.json()["status"] == "COMPLETED":
                    break

            job_data = (await client.get(f"/api/v1/transcreation/jobs/{job_id}")).json()
            line_id = job_data["script_lines"][0]["line_id"]

            put_resp = await client.put(
                f"/api/v1/transcreation/scripts/{line_id}",
                json={"translated_text": "Ajuste editorial con rima perfecta.", "is_approved": True},
            )
            assert put_resp.status_code == 200
            assert put_resp.json()["translated_text"] == "Ajuste editorial con rima perfecta."
            assert put_resp.json()["is_approved"] is True

    @pytest.mark.asyncio
    async def test_not_found_returns_404(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/transcreation/jobs/nonexistent_job_123")
            assert resp.status_code == 404
            assert "was not found" in resp.json()["detail"]
