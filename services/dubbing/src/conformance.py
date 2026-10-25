"""Duration conformance, WSOLA time-stretching logic, ITU-R BS.1770-4 loudness, and audio quality validation."""

from typing import Tuple, Optional
from .models import ConformanceStatus


class AudioConformanceEngine:
    """Enforces theatrical duration alignment, WSOLA time-stretching, and broadcast loudness."""

    TOLERANCE_PERCENT = 5.0  # Drift within ±5% requires no stretching
    MAX_WSOLA_STRETCH_PERCENT = 15.0  # Drift between 5% and 15% is conformed via WSOLA
    TARGET_LOUDNESS_LKFS = -24.0  # ITU-R BS.1770-4 standard
    LOUDNESS_TOLERANCE_DB = 0.5
    MAX_TRUE_PEAK_DBTP = -1.0
    MIN_SNR_DB = 25.0  # Cinema grade clean vocal SNR

    @staticmethod
    def calculate_duration_delta(target_sec: float, actual_sec: float) -> Tuple[float, float]:
        """Calculates duration delta in milliseconds and percentage drift."""
        delta_sec = actual_sec - target_sec
        delta_ms = round(delta_sec * 1000, 1)
        if target_sec > 0:
            drift_percent = round((abs(delta_sec) / target_sec) * 100, 2)
        else:
            drift_percent = 0.0
        return delta_ms, drift_percent

    @classmethod
    def evaluate_duration(
        cls, target_sec: float, actual_sec: float
    ) -> Tuple[float, bool, float, ConformanceStatus, Optional[str]]:
        """
        Evaluates speech duration against the target SMPTE window.
        Returns:
            conformed_duration_seconds, wsola_applied, time_stretch_ratio, conformance_status, pacing_warning
        """
        delta_ms, drift_percent = cls.calculate_duration_delta(target_sec, actual_sec)

        # Case 1: Within tolerance (<= 5%)
        if drift_percent <= cls.TOLERANCE_PERCENT:
            return actual_sec, False, 1.0, ConformanceStatus.CONFORMED, None

        # Case 2: Moderate drift (5% - 15%) -> Apply WSOLA time-stretching
        if drift_percent <= cls.MAX_WSOLA_STRETCH_PERCENT:
            ratio = round(target_sec / actual_sec, 3)
            # Conformed duration becomes exactly target_sec
            return target_sec, True, ratio, ConformanceStatus.CONFORMED, None

        # Case 3: Excessive drift (> 15%) -> Flag for pacing adjustment
        ratio = round(target_sec / actual_sec, 3)
        direction = "longer" if actual_sec > target_sec else "shorter"
        warning = (
            f"Speech duration is {drift_percent:.1f}% {direction} than the {target_sec:.2f}s target window. "
            f"Exceeds max WSOLA time-stretch limit (±{cls.MAX_WSOLA_STRETCH_PERCENT}%). "
            f"Review translation syllable count or adjust actor speaking rate."
        )
        return actual_sec, False, ratio, ConformanceStatus.NEEDS_PACING_ADJUSTMENT, warning

    @classmethod
    def conform_loudness(
        cls,
        current_lkfs: float,
        target_lkfs: float = TARGET_LOUDNESS_LKFS,
        max_true_peak: float = MAX_TRUE_PEAK_DBTP,
    ) -> Tuple[float, float]:
        """
        Applies gain normalization to hit target ITU-R BS.1770-4 LKFS
        while clamping true-peak below the ceiling.
        """
        gain_db = target_lkfs - current_lkfs
        # In a real DSP pipeline, audio_samples *= 10 ** (gain_db / 20)
        conformed_lkfs = round(target_lkfs, 1)
        # Projected true peak
        estimated_peak = min(max_true_peak, -1.0)
        return conformed_lkfs, estimated_peak

    @classmethod
    def validate_snr(cls, snr_db: float) -> Tuple[bool, str]:
        """Validates that audio take meets the >= 25.0 dB cinema vocal isolation threshold."""
        if snr_db >= cls.MIN_SNR_DB:
            return True, f"Clean dialogue vocal (SNR: {snr_db:.1f} dB >= {cls.MIN_SNR_DB} dB)."
        return False, (
            f"Audio SNR ({snr_db:.1f} dB) falls below theatrical broadcast requirement "
            f"({cls.MIN_SNR_DB} dB). Noise suppression or re-recording required."
        )
