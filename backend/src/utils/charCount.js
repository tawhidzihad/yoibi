/**
 * Counts characters consistently across the application.
 * Uses grapheme clusters via Intl.Segmenter when available so that
 * multi-byte characters and compound emojis (e.g. skin tones, ZWJ sequences)
 * are counted identically as 1 character by both server and client.
 * Falls back to Unicode code points [...normalized].length.
 */
function countCharacters(text) {
    if (!text) return 0;
    const normalized = typeof text === "string" ? text.normalize("NFC") : String(text);
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
        const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        return [...segmenter.segment(normalized)].length;
    }
    return [...normalized].length;
}

module.exports = { countCharacters };
