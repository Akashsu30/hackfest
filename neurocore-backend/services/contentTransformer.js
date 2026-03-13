/**
 * Step 1 — Clean raw pasted text.
 * Removes formatting artifacts common in text copied from PDFs, web pages,
 * Google Docs, Word, etc: bullets, list markers, page numbers, smart quotes,
 * invisible Unicode characters, and excess whitespace.
 */
export const cleanText = (raw) => {
  return raw
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // Remove ALL square-bracket references before any other processing:
    // [1]  [20]  [j]  [k]  [l]  [citation needed]  [note]  [a]  [b]  etc.
    .replace(/\[[^\]]{0,40}\]/g, '')

    // Remove bullet / list symbols at the start of lines  (•  ◦  ▪  ●  ■  ➢  →  *  +  -)
    .replace(/^[ \t]*[•◦▪●■➢➤→*+\-]\s*/gm, '')

    // Remove numbered / lettered list markers: "1. "  "a) "  "(2) "  "i. "
    .replace(/^[ \t]*\(?(?:\d+|[a-zA-Z]+)[.)]\s+/gm, '')

    // Remove lines that are only a bare number (page numbers)
    .replace(/^[ \t]*\d+[ \t]*$/gm, '')
    // Remove "Page N" / "Page N of N" lines (PDF headers/footers)
    .replace(/^[ \t]*page\s+\d+(\s+of\s+\d+)?[ \t]*$/gim, '')

    // Paragraph break after non-punctuation → treat as sentence end
    .replace(/([^.!?…])\n{2,}/g, '$1. ')
    // Paragraph break after punctuation → just a space
    .replace(/([.!?…])\n{2,}/g, '$1 ')
    // Single newline → space
    .replace(/\n/g, ' ')

    // Normalize smart / curly quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize en-dash, em-dash, horizontal bar to hyphen
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Remove invisible / zero-width characters
    .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g, '')

    // Collapse multiple spaces into one
    .replace(/  +/g, ' ')
    // Remove space before punctuation
    .replace(/\s([.!?,;:])/g, '$1')
    .trim();
};

/**
 * Step 2 — Split cleaned text into individual sentences.
 * Protects known abbreviations so their dots don't trigger false splits.
 */
const sentenceSplit = (text) => {
  const protected_ = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|St|Ave|Blvd|Dept|Approx|est)\./gi, (m) => m.replace('.', '##DOT##'))
    .replace(/(\d+)\.(\d+)/g, '$1##DOT##$2')
    .replace(/\.{2,}/g, '##ELLIPSIS##')
    .replace(/(https?:\/\/[^\s]+)/g, (m) => m.replace(/\./g, '##DOT##'));

  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'])/);

  return raw
    .map((s) =>
      s
        .replace(/##DOT##/g, '.')
        .replace(/##ELLIPSIS##/g, '...')
        .trim()
    )
    .filter((s) => s.length > 3);
};

export const transformContent = (text) => {
  const cleaned = cleanText(text);
  const sentences = sentenceSplit(cleaned);

  const simplified = sentences.join(' ');
  const bulletMode = sentences.map((s) => `• ${s}`);

  const chunkMode = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunkMode.push(sentences.slice(i, i + 2).join(' '));
  }

  return { simplified, bulletMode, chunkMode, sentences };
};
