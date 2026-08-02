export interface TextAnchor {
  exact: string
  prefix: string
  suffix: string
}

const CONTEXT_LENGTH = 40

function anchorAt(text: string, exact: string, index: number): TextAnchor {
  return {
    exact,
    prefix: text.slice(Math.max(0, index - CONTEXT_LENGTH), index),
    suffix: text.slice(index + exact.length, index + exact.length + CONTEXT_LENGTH),
  }
}

function contextScore(text: string, index: number, anchor: TextAnchor): number {
  let score = 0
  const before = text.slice(0, index)
  const after = text.slice(index + anchor.exact.length)
  for (let size = Math.min(anchor.prefix.length, CONTEXT_LENGTH); size > 0; size -= 1) {
    if (before.endsWith(anchor.prefix.slice(-size))) { score += size; break }
  }
  for (let size = Math.min(anchor.suffix.length, CONTEXT_LENGTH); size > 0; size -= 1) {
    if (after.startsWith(anchor.suffix.slice(0, size))) { score += size; break }
  }
  return score
}

export function reanchorText(text: string, anchor: TextAnchor): TextAnchor | null {
  if (anchor.exact.length < 2) return null
  const candidates: number[] = []
  let index = text.indexOf(anchor.exact)
  while (index >= 0) {
    candidates.push(index)
    index = text.indexOf(anchor.exact, index + anchor.exact.length)
  }
  if (candidates.length) {
    const best = candidates.sort((a, b) => contextScore(text, b, anchor) - contextScore(text, a, anchor))[0]!
    return anchorAt(text, anchor.exact, best)
  }

  // If the quoted words changed, use both surrounding contexts to recover the
  // bounded phrase. Short context fragments tolerate small nearby revisions.
  const prefixNeedle = anchor.prefix.slice(-Math.min(20, anchor.prefix.length))
  const suffixNeedle = anchor.suffix.slice(0, Math.min(20, anchor.suffix.length))
  if (!prefixNeedle || !suffixNeedle) return null
  const prefixAt = text.indexOf(prefixNeedle)
  if (prefixAt < 0 || text.indexOf(prefixNeedle, prefixAt + 1) >= 0) return null
  const start = prefixAt + prefixNeedle.length
  const suffixAt = text.indexOf(suffixNeedle, start)
  if (suffixAt < start || suffixAt - start > 500) return null
  const recovered = text.slice(start, suffixAt).trim()
  if (recovered.length < 2) return null
  const recoveredAt = text.indexOf(recovered, start)
  return anchorAt(text, recovered, recoveredAt)
}
