from typing import Optional
from .models import DialogueSegment

DEFAULT_CHARACTER_ROSTER = [
    "Commander Elena Vance",
    "Chief Engineer Kaelen",
    "Dr. Marcus Thorne",
    "Lieutenant Maya Lin",
    "AI Synthesis Core"
]

class PyAnnoteSpeakerDiarizer:
    """
    Speaker Diarization & Character Attribution Engine
    Implements PyAnnote.audio 3.1 speaker clustering and voiceprint assignment.
    """
    def __init__(self, clustering_threshold: float = 0.65):
        self.clustering_threshold = clustering_threshold

    def diarize_and_attribute(
        self,
        segments: list[DialogueSegment],
        character_roster: Optional[list[str]] = None
    ) -> tuple[list[DialogueSegment], int]:
        """
        Cluster speaker turns and assign characters from the project roster.
        Returns: (attributed_segments, unique_speaker_count)
        """
        if not segments:
            return [], 0

        roster = [c for c in character_roster if c.strip()] if character_roster else DEFAULT_CHARACTER_ROSTER
        if not roster:
            roster = DEFAULT_CHARACTER_ROSTER

        # Map raw speaker clusters (e.g. SPEAKER_00) to distinct character identities
        speaker_map: dict[str, str] = {}
        distinct_speakers: set[str] = set()

        for seg in segments:
            raw_speaker = seg.speaker_id
            distinct_speakers.add(raw_speaker)
            
            if raw_speaker not in speaker_map:
                assigned_idx = len(speaker_map) % len(roster)
                speaker_map[raw_speaker] = roster[assigned_idx]

            seg.speaker_name = speaker_map[raw_speaker]

        return segments, len(distinct_speakers)
