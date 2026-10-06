'use client'

import { CheckCircle2, Send, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Assessment, Handoff, HandoffTeam, ReviewStatus } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { LevelTag, teamLabels } from './primitives'

const teams: { id: HandoffTeam; remit: string }[] = [
  { id: 'procurement', remit: 'Vendor onboarding, commercials, financial health' },
  { id: 'risk', remit: 'Third-party, operational, information security and model risk' },
  { id: 'legal', remit: 'Contracts, IP, data protection, regulatory obligations' },
]

export const statusCopy: Record<ReviewStatus, { label: string; className: string }> = {
  'not-sent': { label: 'Not sent', className: 'border-border bg-muted text-muted-foreground' },
  'in-review': { label: 'In review', className: 'border-accent/50 bg-accent/20 text-accent-foreground' },
  cleared: { label: 'Cleared', className: 'border-primary/30 bg-primary/10 text-primary' },
  concerns: { label: 'Concerns raised', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

type Props = {
  assessment: Assessment | null
  resolvedGaps: number[]
  conditions: string[]
  handoff: Handoff
  onChange: (handoff: Handoff) => void
}

export function HandoffPanel({ assessment, resolvedGaps, conditions, handoff, onChange }: Props) {
  const openGaps = assessment?.gaps.filter((_, i) => !resolvedGaps.includes(i)) ?? []
  const statuses = Object.values(handoff.status)
  const allCleared = statuses.every((s) => s === 'cleared')
  const anyConcerns = statuses.some((s) => s === 'concerns')
  const retained = openGaps.filter((g) => g.owner === 'partnerships' && !conditions.includes(g.validationStep))

  function send() {
    onChange({ sentAt: new Date().toISOString(), status: { procurement: 'in-review', risk: 'in-review', legal: 'in-review' } })
  }

  return (
    <section aria-labelledby="handoff-title" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Proof of Concept gate</p>
          <h2 id="handoff-title" className="text-xl font-semibold">
            Review handoff
          </h2>
        </div>
        {handoff.sentAt ? (
          <p className="font-mono text-xs text-muted-foreground">Sent {new Date(handoff.sentAt).toLocaleString()}</p>
        ) : (
          <Button onClick={send} className="w-fit print:hidden">
            <Send className="size-4" /> Send to PoC review
          </Button>
        )}
      </div>

      {handoff.sentAt && (allCleared || anyConcerns) ? (
        <div
          role="status"
          className={cn(
            'flex items-center gap-2 border-b border-border px-6 py-3 text-sm font-medium',
            allCleared ? 'bg-primary text-primary-foreground' : 'bg-destructive/10 text-destructive',
          )}
        >
          {allCleared ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}
          {allCleared ? 'All reviewers cleared. Ready to start the Proof of Concept.' : 'A reviewer raised concerns. Resolve them before the PoC can start.'}
        </div>
      ) : null}

      <div className="grid gap-px bg-border md:grid-cols-3">
        {teams.map((t) => {
          const gaps = openGaps.filter((g) => g.owner === t.id)
          const risks = assessment?.risks.filter((r) => r.owner === t.id) ?? []
          const status = handoff.status[t.id]
          return (
            <div key={t.id} className="flex flex-col gap-4 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-semibold">{teamLabels[t.id]}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t.remit}</p>
                </div>
                <span className={cn('inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 font-mono text-[11px] uppercase tracking-wide', statusCopy[status].className)}>
                  {statusCopy[status].label}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Open items · {gaps.length}</p>
                {gaps.length ? (
                  <ul className="flex flex-col gap-2">
                    {gaps.map((g, i) => (
                      <li key={i} className="flex flex-col gap-1 text-sm leading-relaxed">
                        <span className="flex items-center gap-2">
                          <LevelTag level={g.priority} />
                          <span className="font-medium">{g.area}</span>
                        </span>
                        <span className="text-muted-foreground">{g.validationStep}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None outstanding.</p>
                )}
              </div>

              {risks.length ? (
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Risks to assess · {risks.length}</p>
                  <ul className="flex flex-col gap-1.5">
                    {risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                        <LevelTag level={r.severity} />
                        <span>{r.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {handoff.sentAt ? (
                <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-4 print:hidden">
                  <label htmlFor={`status-${t.id}`} className="text-xs text-muted-foreground">
                    Review outcome
                  </label>
                  <select
                    id={`status-${t.id}`}
                    value={status}
                    onChange={(e) => onChange({ ...handoff, status: { ...handoff.status, [t.id]: e.target.value as ReviewStatus } })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-sm"
                  >
                    <option value="in-review">In review</option>
                    <option value="cleared">Cleared</option>
                    <option value="concerns">Concerns raised</option>
                  </select>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {conditions.length || retained.length ? (
        <div className="flex flex-col gap-3 border-t border-border p-6">
          <h3 className="text-sm font-semibold">Retained by Partnerships</h3>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
            {conditions.map((c, i) => (
              <li key={`c-${i}`} className="flex gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Condition</span>
                <span>{c}</span>
              </li>
            ))}
            {retained.map((g, i) => (
              <li key={`g-${i}`} className="flex gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{g.area}</span>
                <span>{g.validationStep}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
