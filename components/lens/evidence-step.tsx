'use client'

import { Check, ExternalLink } from 'lucide-react'
import type { Assessment, Criterion, Level, Source } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { BasisTag, LevelTag, Panel, StepHeader, TeamTag } from './primitives'

type Props = {
  criteria: Criterion[]
  assessment: Assessment | null
  sources: Source[]
  resolvedGaps: number[]
  onToggleGap: (index: number) => void
}

const order: Record<Level, number> = { high: 0, medium: 1, low: 2 }

export function EvidenceStep({ criteria, assessment, sources, resolvedGaps, onToggleGap }: Props) {
  if (!assessment) {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={4} title="Review evidence and gaps" description="What do we know? What is missing? What still needs validation?" />
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Run the assessment in step 1 to build the evidence ledger.</div>
      </div>
    )
  }

  const nameFor = (id: string) => criteria.find((c) => c.id === id)?.name ?? id
  const ledger = assessment.criteria.flatMap((r) => r.evidence.map((e) => ({ ...e, criterion: nameFor(r.criterionId) })))
  const sourceFor = (id?: string | null) => (id ? sources.find((s) => s.id === id) : undefined)
  const counts = {
    verified: ledger.filter((e) => e.basis === 'verified').length,
    provided: ledger.filter((e) => e.basis === 'provided').length,
    claimed: ledger.filter((e) => e.basis === 'claimed').length,
    inferred: ledger.filter((e) => e.basis === 'inferred').length,
  }
  const gaps = assessment.gaps.map((g, i) => ({ ...g, index: i })).sort((a, b) => order[a.priority] - order[b.priority])
  const risks = [...assessment.risks].sort((a, b) => order[a.severity] - order[b.severity])

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={4}
        title="Review evidence and gaps"
        description="What do we know, what is self-reported, and what still needs validation? Each gap is routed to the team best placed to close it. Tick gaps off as they are resolved."
      />

      <Panel
        title="Evidence ledger"
        aside={
          <p className="font-mono text-xs text-muted-foreground">
            {counts.verified} verified · {counts.provided} provided · {counts.claimed} claimed · {counts.inferred} inferred
          </p>
        }
      >
        <div className="mb-4 flex h-2 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="bg-foreground" style={{ flexGrow: counts.verified }} />
          <div className="bg-primary" style={{ flexGrow: counts.provided }} />
          <div className="bg-accent" style={{ flexGrow: counts.claimed }} />
          <div className="bg-border" style={{ flexGrow: counts.inferred }} />
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {ledger.map((e, i) => {
            const source = sourceFor(e.sourceId)
            return (
              <li key={i} className="grid gap-1 py-2.5 md:grid-cols-[10rem_1fr_auto] md:items-baseline md:gap-4">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{e.criterion}</span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm leading-relaxed">{e.statement}</span>
                  {source ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1 font-mono text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {source.id} · {source.publisher}
                      {source.date ? ` · ${source.date}` : ''}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  ) : null}
                </span>
                <BasisTag basis={e.basis} />
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel title="Gaps to validate" aside={<p className="font-mono text-xs text-muted-foreground">{resolvedGaps.length}/{gaps.length} closed</p>}>
        <ul className="flex flex-col gap-3">
          {gaps.map((g) => {
            const done = resolvedGaps.includes(g.index)
            return (
              <li key={g.index} className={cn('flex gap-4 rounded-md border border-border p-4', done && 'bg-muted/60')}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`Mark gap "${g.description}" as validated`}
                  onClick={() => onToggleGap(g.index)}
                  className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border', done ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card')}
                >
                  {done ? <Check className="size-3.5" /> : null}
                </button>
                <div className={cn('flex min-w-0 flex-col gap-1.5', done && 'opacity-60')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{g.area}</span>
                    <LevelTag level={g.priority} label="priority" />
                    <TeamTag team={g.owner} />
                  </div>
                  <p className={cn('text-sm leading-relaxed', done && 'line-through')}>{g.description}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Validate: </span>
                    {g.validationStep}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel title="Risks">
        <ul className="flex flex-col divide-y divide-border">
          {risks.map((r, i) => (
            <li key={i} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.title}</span>
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{r.category}</span>
                <LevelTag level={r.severity} label="severity" />
                <TeamTag team={r.owner} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Mitigation: </span>
                {r.mitigation}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
