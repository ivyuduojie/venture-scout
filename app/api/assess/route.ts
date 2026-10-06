import { generateText, Output } from 'ai'
import { z } from 'zod'
import { BANK_NAME } from '@/lib/sample'
import { assessmentSchema, criterionSchema, sourceSchema, startupSchema } from '@/lib/schemas'

export const maxDuration = 120

const bodySchema = z.object({
  startup: startupSchema,
  criteria: z.array(criterionSchema).min(1).max(15),
  focus: z.string().max(2000).optional(),
  sources: z.array(sourceSchema).max(30).default([]),
})

const SYSTEM = `You are a rigorous startup diligence analyst on the partnerships and innovation team at ${BANK_NAME}, a regulated US bank.
The team scouts early and growth stage startups, primarily based in North America (US and Canada), without a fixed use case. Your job is to:
1. Identify where in the bank the startup could realistically add value (candidate use cases by business unit).
2. Evaluate the startup's viability as a bank supplier against the supplied criteria.
3. Surface gaps and risks, routing each to the team that should close it before a Proof of Concept: procurement, risk, legal, or partnerships.

Rules:
- Base judgements only on the supplied startup description and evidence. Never invent facts, customers, certifications or numbers.
- Apply a US bank's lens: Interagency Guidance on Third-Party Relationships (OCC, Fed, FDIC), FFIEC expectations, SR 11-7 model risk, BSA/AML and OFAC, GLBA privacy, NYDFS Part 500, state privacy and licensing rules, operational resilience and vendor concentration.
- Use US terminology, payment rails (ACH, RTP, FedNow, Zelle, card networks), core providers and USD.
- If the startup is headquartered outside the US, flag cross-border considerations (data residency, foreign ownership, OFAC screening, local entity) as gaps or risks. For Canadian startups, also note any Canadian regulatory context briefly.
- Label every evidence statement:
  - "verified" only when an independent PUBLIC SOURCE (SEC filing or third-party news outlet) explicitly supports it. Set sourceId to that source's id.
  - "provided" if it is in documents the startup supplied (deck, SOC 2 report, references).
  - "claimed" if self-reported, including statements from the startup's own website. Set sourceId when it comes from a listed website page.
  - "inferred" if it is your inference.
- Never attach a sourceId the source does not support. Note any conflict between public sources and the startup's claims as a gap.
- Public sources may be about a different company with a similar name. Ignore a source unless it clearly refers to this startup.
- Score each criterion 0-5 as an integer. Missing or self-reported evidence lowers confidence; never assume it is positive.
- Score every criterion supplied, using its exact id as criterionId.
- Gaps must be concrete with an actionable validation step. Risks must include a practical mitigation.
- Do not recommend a final decision. A human on the partnerships team makes the decision.`

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'The assessment request is incomplete. Add a startup name and at least one criterion.' }, { status: 400 })
  }
  const { startup, criteria, focus, sources } = parsed.data
  const sourceBlock = sources.length
    ? sources
        .map((s) => `[${s.id}] ${s.kind.toUpperCase()} · ${s.publisher}${s.date ? ` · ${s.date}` : ''}\n${s.title}\n${s.url}\n${s.snippet}`)
        .join('\n\n')
    : 'None gathered. No evidence can be marked verified.'
  const activeCriteria = criteria.filter((c) => c.weight > 0)

  const prompt = `STARTUP
Name: ${startup.name}
Website: ${startup.website || 'not provided'}
Stage: ${startup.stage || 'not provided'}
Headquarters: ${startup.headquarters || 'not provided'}
Category: ${startup.category || 'not provided'}
Description: ${startup.description || 'not provided'}

EVIDENCE SUPPLIED
${startup.evidence || 'No evidence supplied.'}

PUBLIC SOURCES
${sourceBlock}

SCOUTING FOCUS FROM THE TEAM
${focus?.trim() || 'None given. Explore use cases across the bank.'}

CRITERIA TO SCORE
${activeCriteria.map((c) => `- id: ${c.id} | ${c.name} (weight ${c.weight}/5): ${c.description}`).join('\n')}`

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({ schema: assessmentSchema }),
      system: SYSTEM,
      prompt,
    })
    return Response.json({ assessment: output })
  } catch (error) {
    console.error('[assess] generation failed', error)
    const raw = error instanceof Error ? error.message : ''
  const message = /credit card/i.test(raw)
    ? 'AI Gateway billing is not enabled on this Vercel team. Add a payment method in your Vercel AI settings, then run the assessment again.'
    : 'The assessment could not be generated. Please try again.'
  return Response.json({ error: message }, { status: 500 })
  }
}
