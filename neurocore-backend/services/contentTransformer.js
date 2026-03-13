const sentenceSplit = (text) => {
  const protected_ = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|St|Ave|Blvd|Dept|Approx|est)\./gi, (m) => m.replace(".", "##DOT##"))
    .replace(/(\d+)\.(\d+)/g, "$1##DOT##$2")
    .replace(/\.{2,}/g, "##ELLIPSIS##")
    .replace(/(https?:\/\/[^\s]+)/g, (m) => m.replace(/\./g, "##DOT##"));

  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'])/);

  return raw
    .map((s) =>
      s
        .replace(/##DOT##/g, ".")
        .replace(/##ELLIPSIS##/g, "...")
        .trim()
    )
    .filter((s) => s.length > 0);
};

export const transformContent = (text) => {
  const sentences = sentenceSplit(text);

  const simplified = sentences.join(" ");
  const bulletMode = sentences.map((s) => `• ${s}`);

  const chunkMode = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunkMode.push(sentences.slice(i, i + 2).join(" "));
  }

  return { simplified, bulletMode, chunkMode, sentences };
};