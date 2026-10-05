import { z } from 'zod'

export const level = z.enum(['high', 'medium', 'low'])

export const reviewTeam = z.enum(['procurement', 'risk', 'legal', 'partnerships'])

export const criterionSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(80),
  description: z.string().max(400),
  weight: z.number().int().min(0).max(5),
})

export const startupSchema = z.object({
  name: z.string().min(1).max(120),
  website: z.string().max(200),
  stage: z.string().max(60),
  headquarters: z.string().max(120),
  category: z.string().max(80),
  description: z.string().max(4000),
  evidence: z.string().max(20000),
})

export const sourceKind = z.enum(['website', 'sec_filing', 'news'])

export const sourceSchema = z.object({
  id: z.string().max(10),
  kind: sourceKind,
  title: z.string().max(300),
  url: z.string().url().max(1000),
  publisher: z.string().max(120),
  date: z.string().max(40).nullable(),
  snippet: z.string().max(2000),
})

export const assessmentSchema = z.object({
  fit: z.object({
    verdict: z.enum(['strong', 'partial', 'weak', 'unclear']).describe('Overall suitability as a partner for the bank'),
    summary: z.string().describe('2-3 sentences on where this startup could add value to the bank and the main reservations'),
  }),
  useCases: z
    .array(
      z.object({
        businessUnit: z.string().describe('Bank business unit, e.g. Retail Payments, Financial Crime, SME Lending, Wealth, Operations, Technology'),
        title: z.string().describe('Short name for the use case'),
        valueHypothesis: z.string().describe('The business value the bank could expect, phrased as an outcome'),
        fit: z.enum(['strong', 'moderate', 'weak']),
        rationale: z.string().describe('Why the startup does or does not fit this use case, grounded in the evidence'),
      }),
    )
    .describe('2-5 candidate use cases inside the bank, strongest first'),
  criteria: z.array(
    z.object({
      criterionId: z.string().describe('Exactly the id of the criterion being scored'),
      score: z.number().describe('Integer from 0 (no basis) to 5 (excellent)'),
      confidence: level.describe('How well the score is supported by provided evidence'),
      rationale: z.string(),
      evidence: z.array(
        z.object({
          statement: z.string(),
          basis: z
            .enum(['verified', 'provided', 'claimed', 'inferred'])
            .describe(
              'verified = confirmed by an independent public source listed under PUBLIC SOURCES (SEC filing, reputable news); provided = in documents the startup supplied; claimed = startup self-reported, incl. its own website; inferred = analyst inference',
            ),
          sourceId: z
            .string()
            .nullable()
            .describe('Id of the PUBLIC SOURCE (e.g. "S2") that supports the statement. Required when basis is verified; null when no listed source supports it.'),
        }),
      ),
    }),
  ),
  gaps: z.array(
    z.object({
      area: z.string(),
      description: z.string().describe('What is unknown or unverified'),
      validationStep: z.string().describe('A concrete action to close the gap'),
      priority: level,
      owner: reviewTeam.describe('Team best placed to close it: procurement (commercials, vendor onboarding, financial health), risk (third-party, operational, information security, model risk), legal (contracts, IP, data protection, regulatory obligations), partnerships (business fit, references, sponsor)'),
    }),
  ),
  risks: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      severity: level,
      mitigation: z.string(),
      owner: reviewTeam,
    }),
  ),
})

export type Criterion = z.infer<typeof criterionSchema>
export type Startup = z.infer<typeof startupSchema>
export type Assessment = z.infer<typeof assessmentSchema>
export type CriterionResult = Assessment['criteria'][number]
export type UseCase = Assessment['useCases'][number]
export type Level = z.infer<typeof level>
export type Source = z.infer<typeof sourceSchema>
export type SourceKind = z.infer<typeof sourceKind>
export type EvidenceBasis = CriterionResult['evidence'][number]['basis']
export type ReviewTeam = z.infer<typeof reviewTeam>

export type DecisionOutcome = 'proceed' | 'conditions' | 'diligence' | 'decline'

export type Decision = {
  outcome: DecisionOutcome
  useCase: string
  conditions: string[]
  rationale: string
  decidedBy: string
  decidedAt: string
}

export type ReviewStatus = 'not-sent' | 'in-review' | 'cleared' | 'concerns'

export type HandoffTeam = Exclude<ReviewTeam, 'partnerships'>

export type Handoff = {
  sentAt: string | null
  status: Record<HandoffTeam, ReviewStatus>
}
