/** Small text utilities: tokenizing and TF-IDF cosine similarity. No dependencies. */

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can for from has have in into is it its of on or our " +
    "that the their they this to was we were will with you your who what which while about " +
    "using use used also more than such other etc per via over under across within strong " +
    "good great excellent ability experience years year work working team role job candidate"
  ).split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/**
 * Build TF-IDF vectors for a small corpus and return a function that scores
 * cosine similarity between any two documents in it (by index).
 */
export function tfidfSimilarity(docs: string[]): (a: number, b: number) => number {
  const tokenized = docs.map(tokenize);
  const df = new Map<string, number>();
  for (const toks of tokenized) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = docs.length;
  const vectors = tokenized.map((toks) => {
    const tf = termFreq(toks);
    const vec = new Map<string, number>();
    let norm = 0;
    for (const [term, count] of tf) {
      // Smoothed IDF so terms present in every document still count a little.
      const idf = Math.log((1 + n) / (1 + (df.get(term) ?? 0))) + 1;
      const w = (1 + Math.log(count)) * idf;
      vec.set(term, w);
      norm += w * w;
    }
    return { vec, norm: Math.sqrt(norm) };
  });

  return (a, b) => {
    const va = vectors[a];
    const vb = vectors[b];
    if (!va || !vb || va.norm === 0 || vb.norm === 0) return 0;
    const [small, large] = va.vec.size <= vb.vec.size ? [va, vb] : [vb, va];
    let dot = 0;
    for (const [term, w] of small.vec) {
      const other = large.vec.get(term);
      if (other) dot += w * other;
    }
    return dot / (va.norm * vb.norm);
  };
}
