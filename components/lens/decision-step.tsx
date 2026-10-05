'use client'

import { Printer, Stamp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Assessment, Decision, DecisionOutcome, Handoff, Startup, UseCase } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { HandoffPanel } from './handoff-panel'
import { ListEditor, Panel, StepHeader } from './primitives'
import { verdictCopy } from './use-case-step'

export const outcomes: { value: DecisionOutcome; label: string; hint: string; tone: string }[] = [
  { value: 'proceed', label: 'Proceed', hint: 'Send to Procurement, Risk and Legal for PoC review.', tone: 'bg-primary text-primary-foreground' },
  { value: 'conditions', label: 'Proceed with conditions', hint: 'Send to PoC review with conditions the team will track.', tone: 'bg-accent text-accent-foreground' },
  { value: 'diligence', label: 'More diligence required', hint: 'Too many material unknowns. Keep with Partnerships.', tone: 'bg-secondary text-secondary-foreground' },
  { value: 'decline', label: 'Do not proceed', hint: 'Not a viable partner for the bank at this time.', tone: 'bg-destructive text-primary-foreground' },
]

type Props = {
  startup: Startup
  assessment: Assessment | null
  useCase: UseCase | null
  score: number | null
  coverage: number | null
  openGaps: string[]
  partnershipGaps: string[]
  resolvedGaps: number[]
  decision: Decision | null
  handoff: Handoff
  onDecide: (decision: Decision | null) => void
  onHandoffChange: (handoff: Handoff) => void
}

export function DecisionStep({ startup, assessment, useCase, score, coverage, openGaps, partnershipGaps, resolvedGaps, decision, handoff, onDecide, onHandoffChange }: Props) {
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(decision?.outcome ?? null)
  const [useCaseTitle, setUseCaseTitle] = useState(decision?.useCase ?? (useCase ? `${useCase.businessUnit}: ${useCase.title}` : ''))
  const [conditions, setConditions] = useState<string[]>(decision?.conditions ?? [])
  const [rationale, setRationale] = useState(decision?.rationale ?? '')
  const [decidedBy, setDecidedBy] = useState(decision?.decidedBy ?? '')

  const needsConditions = outcome === 'conditions' || outcome === 'diligence'
  const needsUseCase = outcome === 'proceed' || outcome === 'conditions'
  const canRecord = outcome && rationale.trim() && decidedBy.trim() && (!needsUseCase || useCaseTitle.trim())

  function record(e: React.FormEvent) {
    e.preventDefault()
    if (!outcome) return
    onDecide({
      outcome,
      useCase: useCaseTitle.trim(),
      conditions: needsConditions ? conditions.map((c) => c.trim()).filter(Boolean) : [],
      rationale: rationale.trim(),
      decidedBy: decidedBy.trim(),
      decidedAt: new Date().toISOString(),
    })
  }

  if (decision) {
    const meta = outcomes.find((o) => o.value === decision.outcome)!
    const handsOff = decision.outcome === 'proceed' || decision.outcome === 'conditions'
    return (
      <div className="flex flex-col gap-6">
        <StepHeader
          step={5}
          title="Decision recorded"
          description={handsOff ? 'Send the case to Procurement, Risk and Legal, then track each review until the PoC is cleared.' : 'This record captures the decision and the evidence it was based on.'}
        />
        <article className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Partnership decision</p>
              <h2 className="text-balance text-xl font-semibold">{startup.name}</h2>
              {decision.useCase ? <p className="text-sm text-muted-foreground">{decision.useCase}</p> : null}
            </div>
            <span className={cn('w-fit rounded-sm px-3 py-1.5 font-mono text-sm uppercase tracking-wide', meta.tone)}>{meta.label}</span>
          </div>
          <dl className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
            {[
              ['Weighted score', score === null ? '—' : `${score}/100`],
              ['Evidence coverage', coverage === null ? '—' : `${coverage}%`],
              ['Partner suitability', assessment ? verdictCopy[assessment.fit.verdict].label : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 bg-card px-6 py-4">
                <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="font-mono text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">Rationale</h3>
              <p className="whitespace-pre-line leading-relaxed">{decision.rationale}</p>
            </div>
            {decision.outcome === 'diligence' && decision.conditions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold">Diligence still required</h3>
                <ol className="list-decimal pl-5 leading-relaxed">
                  {decision.conditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            <p className="font-mono text-xs text-muted-foreground">
              Decided by {decision.decidedBy} · {new Date(decision.decidedAt).toLocaleString()}
            </p>
          </div>
        </article>

        {handsOff ? (
          <HandoffPanel assessment={assessment} resolvedGaps={resolvedGaps} conditions={decision.conditions} handoff={handoff} onChange={onHandoffChange} />
        ) : null}

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print record
          </Button>
          <Button variant="ghost" onClick={() => onDecide(null)}>
            Revise decision
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={record} className="flex flex-col gap-6">
      <StepHeader
        step={5}
        title="Decision and handoff"
        description="The lens informs; the partnerships team decides. A pass sends the startup to Procurement, Risk and Legal for Proof of Concept review."
      />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Decision outcome</legend>
        {outcomes.map((o) => {
          const selected = outcome === o.value
          return (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-lg border bg-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input',
              )}
            >
              <input
                type="radio"
                name="outcome"
                value={o.value}
                checked={selected}
                onChange={() => {
                  setOutcome(o.value)
                  if (o.value === 'conditions') setConditions(partnershipGaps)
                  if (o.value === 'diligence') setConditions(openGaps)
                }}
                className="sr-only"
              />
              <span className="flex items-center gap-2 font-semibold">
                <span className={cn('size-2.5 rounded-full', o.tone.split(' ')[0])} aria-hidden="true" />
                {o.label}
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">{o.hint}</span>
            </label>
          )
        })}
      </fieldset>

      <Panel>
        <div className="flex flex-col gap-5">
          {needsUseCase ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="poc-use-case">Proof of Concept use case</Label>
              <Input id="poc-use-case" value={useCaseTitle} onChange={(e) => setUseCaseTitle(e.target.value)} placeholder="Select one in step 2 or describe it here" />
            </div>
          ) : null}
          {needsConditions ? (
            <ListEditor label={outcome === 'diligence' ? 'Diligence still required' : 'Conditions to proceed'} items={conditions} onChange={setConditions} />
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea id="rationale" rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} className="leading-relaxed" placeholder="Why this outcome, given the evidence and gaps?" />
          </div>
          <div className="flex flex-col gap-2 md:max-w-sm">
            <Label htmlFor="decided-by">Decision owner</Label>
            <Input id="decided-by" value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} placeholder="Name, role" />
          </div>
          <Button type="submit" disabled={!canRecord} className="w-fit">
            <Stamp className="size-4" /> Record decision
          </Button>
        </div>
      </Panel>
    </form>
  )
}
