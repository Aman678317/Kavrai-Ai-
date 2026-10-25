import asyncio
import pytest
import httpx
from httpx import ASGITransport

from services.video_analyzer.src.models import (
    AnalysisJobRequest,
    JobStatus,
    AnalysisStage,
)
from services.video_analyzer.src.scene_detector import (
    frames_to_smpte,
    smpte_to_frames,
    CinemaSceneDetector,
)
from services.video_analyzer.src.character_identifier import CharacterIdentifier
from services.video_analyzer.src.job_queue import AsyncJobQueue
from services.video_analyzer.src.service import app

class TestSMPTEConversions:
    def test_frames_to_smpte(self):
        assert frames_to_smpte(0, 24.0) == "00:00:00:00"
        assert frames_to_smpte(24, 24.0) == "00:00:01:00"
        assert frames_to_smpte(36, 24.0) == "00:00:01:12"
        assert frames_to_smpte(1440, 24.0) == "00:01:00:00"
        assert frames_to_smpte(86400, 24.0) == "01:00:00:00"

    def test_smpte_to_frames(self):
        assert smpte_to_frames("00:00:00:00", 24.0) == 0
        assert smpte_to_frames("00:00:01:00", 24.0) == 24
        assert smpte_to_frames("00:01:00:00", 24.0) == 1440
        assert smpte_to_frames("01:00:00:00", 24.0) == 86400
        assert smpte_to_frames("invalid", 24.0) == 0

    def test_round_trip_timecode(self):
        original = "01:24:36:18"
        frames = smpte_to_frames(original, 24.0)
        reconstructed = frames_to_smpte(frames, 24.0)
        assert reconstructed == original

class TestSceneAndShotDetection:
    def test_contiguous_shot_boundaries(self):
        detector = CinemaSceneDetector(fps=24.0)
        cuts = detector.detect_shots(duration_seconds=45.0)

        assert len(cuts) > 0
        assert cuts[0].start_frame == 0

        # Verify contiguous boundaries with zero frame gaps or overlaps
        for i in range(len(cuts) - 1):
            assert cuts[i].end_frame == cuts[i + 1].start_frame
            assert cuts[i].end_smpte == cuts[i + 1].start_smpte

        total_frames = int(round(45.0 * 24.0))
        assert cuts[-1].end_frame == total_frames
        assert cuts[-1].end_smpte == frames_to_smpte(total_frames, 24.0)

    def test_long_film_zero_drift(self):
        """
        Verify long-film (120-minute) full movie shot boundary calculation
        120 min = 7,200 seconds = 172,800 frames at 24 fps
        """
        detector = CinemaSceneDetector(fps=24.0)
        long_film_duration = 120.0 * 60.0
        cuts = detector.detect_shots(duration_seconds=long_film_duration)

        expected_total_frames = int(round(long_film_duration * 24.0))
        assert expected_total_frames == 172800

        # Frame continuity and exact end boundary
        assert cuts[0].start_frame == 0
        assert cuts[-1].end_frame == expected_total_frames
        assert cuts[-1].end_smpte == "02:00:00:00"

        # Verify shot count reasonable for a 2-hour feature film (~1,200 to ~1,800 shots)
        assert 1200 <= len(cuts) <= 1800

class TestCharacterIdentification:
    def test_character_attribution_and_qc_bounds(self):
        identifier = CharacterIdentifier()
        name, conf, bbox, syncnet, ssim = identifier.identify_shot_character(1, "s3://vault/test.mov")

        assert isinstance(name, str)
        assert len(name) > 0
        assert 0.85 <= conf <= 1.0
        assert syncnet >= 8.2  # Meets Netflix Studio benchmark
        assert ssim >= 0.992   # Meets facial identity preservation benchmark

        # Bounding box is normalized within [0.0, 1.0]
        assert 0.0 <= bbox.x <= 1.0
        assert 0.0 <= bbox.y <= 1.0
        assert 0.0 < bbox.width <= 1.0
        assert 0.0 < bbox.height <= 1.0

class TestAsyncJobQueue:
    @pytest.mark.asyncio
    async def test_job_lifecycle_completion(self):
        queue = AsyncJobQueue()
        req = AnalysisJobRequest(
            project_id="proj_001",
            reel_id="reel_001",
            video_s3_uri="s3://cinema-vault-raw/master.mov",
            frame_rate=24.0,
            duration_seconds=20.0,
        )

        job = await queue.enqueue(req)
        assert job.status in [JobStatus.QUEUED, JobStatus.PROCESSING]
        assert job.job_id.startswith("job_anlz_")

        # Wait for background task to complete
        for _ in range(50):
            await asyncio.sleep(0.02)
            updated = await queue.get_job(job.job_id)
            if updated and updated.status == JobStatus.COMPLETED:
                break

        final_job = await queue.get_job(job.job_id)
        assert final_job is not None
        assert final_job.status == JobStatus.COMPLETED
        assert final_job.stage == AnalysisStage.COMPLETED
        assert final_job.progress_percent == 100
        assert len(final_job.shots) > 0
        assert len(final_job.scenes) > 0
        assert final_job.completed_at is not None

    @pytest.mark.asyncio
    async def test_job_failure_handling(self):
        queue = AsyncJobQueue()
        req = AnalysisJobRequest(
            project_id="proj_err",
            reel_id="reel_err",
            video_s3_uri="s3://cinema-vault-raw/corrupt_header.mov",
            duration_seconds=10.0,
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
        assert final_job.stage == AnalysisStage.FAILED
        assert "Demuxer Error" in (final_job.error or "")

class TestFastAPIService:
    @pytest.mark.asyncio
    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "HEALTHY"
            assert data["service"] == "kavrai-video-analyzer"

    @pytest.mark.asyncio
    async def test_create_and_poll_job(self):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            post_resp = await client.post(
                "/api/v1/analysis/jobs",
                json={
                    "project_id": "proj_api_test",
                    "reel_id": "reel_api_test",
                    "video_s3_uri": "s3://cinema-vault-raw/reel_01.mov",
                    "frame_rate": 24.0,
                    "duration_seconds": 15.0,
                },
            )
            assert post_resp.status_code == 202
            job_data = post_resp.json()
            job_id = job_data["job_id"]

            # Poll for completion
            for _ in range(50):
                await asyncio.sleep(0.02)
                get_resp = await client.get(f"/api/v1/analysis/jobs/{job_id}")
                assert get_resp.status_code == 200
                poll_data = get_resp.json()
                if poll_data["status"] == "COMPLETED":
                    break

            final_resp = await client.get(f"/api/v1/analysis/jobs/{job_id}")
            assert final_resp.status_code == 200
            final_data = final_resp.json()
            assert final_data["status"] == "COMPLETED"
            assert len(final_data["shots"]) > 0
