export function charNgrams(str: string, n: number): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i <= str.length - n; i++) {
    grams.add(str.slice(i, i + n));
  }
  return grams;
}

export function calculateNameSimilarityScore(str1: string, str2: string, n: number = 2): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const n1 = charNgrams(s1, n);
  const n2 = charNgrams(s2, n);
  const intersection = new Set([...n1].filter(x => n2.has(x)));
  const union = new Set([...n1, ...n2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}
