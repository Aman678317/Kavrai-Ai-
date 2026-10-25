import re

BILABIAL_CONSONANTS = {"p", "b", "m"}
LABIODENTAL_CONSONANTS = {"f", "v"}

class SyllableCounter:
    """
    Multilingual Syllable Counter & Phonetic Estimator
    Used for cinematic dialogue timing, syllable budgeting, and viseme anchor identification.
    """

    @staticmethod
    def count_word_syllables(word: str, lang: str = "en") -> int:
        clean = re.sub(r"[^a-zA-ZáéíóúüñÁÉÍÓÚÜàâçèêëîïôûùÀÂÇÈÊËÎÏÔÛÙäöüßÄÖÜ]", "", word.lower())
        if not clean:
            return 0

        lang_prefix = lang.split("-")[0].lower()

        if lang_prefix == "es":
            return SyllableCounter._count_spanish(clean)
        elif lang_prefix == "fr":
            return SyllableCounter._count_french(clean)
        elif lang_prefix == "de":
            return SyllableCounter._count_german(clean)
        else:
            return SyllableCounter._count_english(clean)

    @staticmethod
    def _count_english(word: str) -> int:
        # Basic English syllable counting with phonetic adjustments
        vowels = "aeiouy"
        count = 0
        prev_is_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel

        # Discard trailing silent 'e' if preceded by consonant
        if word.endswith("e") and not word.endswith("le") and count > 1:
            if len(word) >= 3 and word[-2] not in vowels:
                count -= 1

        # Adjust for words ending in 'ed' (e.g. 'walked' vs 'started')
        if word.endswith("ed") and count > 1:
            if len(word) >= 4 and word[-3] not in "td":
                count -= 1

        return max(1, count)

    @staticmethod
    def _count_spanish(word: str) -> int:
        # Spanish: strong vowels (a, e, o) and weak vowels (i, u)
        # Two strong vowels form a hiatus (2 syllables), weak+strong forms diphthong (1 syllable)
        strong = "aeoáéó"
        weak = "iuüíú"
        
        count = 0
        i = 0
        n = len(word)

        while i < n:
            char = word[i]
            if char in strong:
                count += 1
                # If next is strong, it's a separate syllable
                if i + 1 < n and word[i + 1] in strong:
                    pass
                elif i + 1 < n and word[i + 1] in weak:
                    # Diphthong, skip weak vowel
                    i += 1
            elif char in weak:
                count += 1
                # If next is strong or weak, diphthong
                if i + 1 < n and (word[i + 1] in strong or word[i + 1] in weak):
                    i += 1
            i += 1

        return max(1, count)

    @staticmethod
    def _count_french(word: str) -> int:
        vowels = "aeiouyàâçèêëîïôûù"
        count = 0
        prev_is_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel

        # Silent final 'e' in French prose
        if word.endswith("e") and count > 1:
            count -= 1

        return max(1, count)

    @staticmethod
    def _count_german(word: str) -> int:
        vowels = "aeiouyäöü"
        count = 0
        prev_is_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel

        return max(1, count)

    @staticmethod
    def count_syllables(text: str, lang: str = "en") -> int:
        """Count total syllables in a sentence or dialogue phrase"""
        words = text.split()
        return sum(SyllableCounter.count_word_syllables(w, lang) for w in words)

    @staticmethod
    def find_bilabial_anchors(text: str, start_frame: int = 0, fps: float = 24.0) -> list[tuple[str, int]]:
        """
        Identify bilabial closures (p, b, m) and estimate their relative frame position.
        Used to guide and verify lip-sync mouth closure synchronization.
        """
        words = text.split()
        if not words:
            return []

        anchors: list[tuple[str, int]] = []
        total_chars = max(1, len(text))
        
        # Approximate frame duration based on 0.4s per word
        total_frames = int(round(len(words) * 0.4 * fps))

        for idx, char in enumerate(text.lower()):
            if char in BILABIAL_CONSONANTS:
                # Frame fraction estimate
                char_frame = start_frame + int(round((idx / total_chars) * total_frames))
                anchors.append((char, char_frame))

        return anchors
