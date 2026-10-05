import type { Assessment, Criterion, CriterionResult } from './schemas'

export function resultFor(assessment: Assessment | null, id: string): CriterionResult | undefined {
  return assessment?.criteria.find((c) => c.criterionId === id)
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(5, Math.round(score)))
}

export function weightedScore(criteria: Criterion[], assessment: Assessment | null) {
  if (!assessment) return null
  let earned = 0
  let possible = 0
  for (const c of criteria) {
    if (c.weight === 0) continue
    const r = resultFor(assessment, c.id)
    if (!r) continue
    earned += clampScore(r.score) * c.weight
    possible += 5 * c.weight
  }
  return possible === 0 ? null : Math.round((earned / possible) * 100)
}

/** Share of total criterion weight backed by medium- or high-confidence evidence. */
export function evidenceCoverage(criteria: Criterion[], assessment: Assessment | null) {
  if (!assessment) return null
  let covered = 0
  let total = 0
  for (const c of criteria) {
    if (c.weight === 0) continue
    total += c.weight
    const r = resultFor(assessment, c.id)
    if (r && r.confidence !== 'low') covered += c.weight
  }
  return total === 0 ? null : Math.round((covered / total) * 100)
}
