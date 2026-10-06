import type { Decision, Handoff } from '@/lib/schemas'
import { outcomes } from './decision-step'

type Props = {
  score: number | null
  coverage: number | null
  openGaps: number
  risks: number | null
  decision: Decision | null
  handoff: Handoff
}

function pocStatus(decision: Decision | null, handoff: Handoff) {
  if (!decision) return 'Awaiting decision'
  if (decision.outcome === 'decline') return 'Closed'
  if (decision.outcome === 'diligence') return 'With Partnerships'
  if (!handoff.sentAt) return 'Ready to send'
  const s = Object.values(handoff.status)
  if (s.every((v) => v === 'cleared')) return 'Cleared for PoC'
  if (s.some((v) => v === 'concerns')) return 'Concerns raised'
  return `In review · ${s.filter((v) => v === 'cleared').length}/3 cleared`
}

export function Readout({ score, coverage, openGaps, risks, decision, handoff }: Props) {
  const decisionLabel = decision ? outcomes.find((o) => o.value === decision.outcome)?.label : 'Pending'
  return (
    <section aria-label="Lens readout" className="hidden rounded-lg border border-border bg-card lg:block">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lens readout</h2>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <Gauge label="Weighted score" value={score} suffix="/100" />
        <Gauge label="Evidence coverage" value={coverage} suffix="%" tone="accent" />
        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <dt className="text-xs text-muted-foreground">Open gaps</dt>
            <dd className="font-mono text-lg">{risks === null ? '—' : openGaps}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">High risks</dt>
            <dd className="font-mono text-lg">{risks ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Decision</dt>
            <dd className="text-sm font-semibold">{decisionLabel}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">PoC review</dt>
            <dd className="text-sm font-semibold">{pocStatus(decision, handoff)}</dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-muted-foreground">Coverage is the share of criterion weight backed by medium- or high-confidence evidence.</p>
      </div>
    </section>
  )
}

function Gauge({ label, value, suffix, tone = 'primary' }: { label: string; value: number | null; suffix: string; tone?: 'primary' | 'accent' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-medium tabular-nums">
          {value ?? '—'}
          {value !== null ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={tone === 'primary' ? 'h-full bg-primary' : 'h-full bg-accent'} style={{ width: `${value ?? 0}%` }} />
        {[20, 40, 60, 80].map((t) => (
          <span key={t} className="absolute top-0 h-full w-px bg-card" style={{ left: `${t}%` }} />
        ))}
      </div>
    </div>
  )
}
