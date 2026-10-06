'use client'

import { Plus, X } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Level, ReviewTeam } from '@/lib/schemas'

export const teamLabels: Record<ReviewTeam, string> = {
  procurement: 'Procurement',
  risk: 'Risk',
  legal: 'Legal',
  partnerships: 'Partnerships',
}

export function TeamTag({ team }: { team: ReviewTeam }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-sm border border-border bg-card px-1.5 font-mono text-[11px] uppercase tracking-wide text-foreground">
      <span aria-hidden="true" className="text-muted-foreground">
        {'→'}
      </span>
      {teamLabels[team]}
    </span>
  )
}

export function StepHeader({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <header className="flex flex-col gap-2 border-b border-border pb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Step {step} of 5</p>
      <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>
    </header>
  )
}

export function Panel({ title, aside, children, className }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-border bg-card', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  )
}

const levelStyles: Record<Level, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-accent/25 text-accent-foreground border-accent/40',
  low: 'bg-muted text-muted-foreground border-border',
}

export function LevelTag({ level, label }: { level: Level; label?: string }) {
  return (
    <span className={cn('inline-flex h-5 items-center rounded-sm border px-1.5 font-mono text-[11px] uppercase tracking-wide', levelStyles[level])}>
      {label ? `${label} ` : ''}
      {level}
    </span>
  )
}

const basisStyles = {
  verified: 'border-primary bg-primary text-primary-foreground',
  provided: 'border-primary/30 bg-primary/10 text-primary',
  claimed: 'border-accent/50 bg-accent/20 text-accent-foreground',
  inferred: 'border-border bg-muted text-muted-foreground',
} as const

export function BasisTag({ basis }: { basis: keyof typeof basisStyles }) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 font-mono text-[11px] uppercase tracking-wide', basisStyles[basis])}>
      {basis}
    </span>
  )
}

const STRIPES = 'repeating-linear-gradient(135deg, var(--primary) 0 2px, transparent 2px 5px)'

/** Five segments: filled count shows the score, fill texture shows evidence confidence. */
export function ScoreMeter({ score, confidence, size = 'md' }: { score: number | null; confidence?: Level; size?: 'sm' | 'md' }) {
  const label = score === null ? 'Not assessed' : `Score ${score} of 5, ${confidence} confidence`
  return (
    <div role="img" aria-label={label} className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = score !== null && i < score
        return (
          <span
            key={i}
            className={cn(
              'rounded-[2px] border',
              size === 'sm' ? 'h-2.5 w-4' : 'h-3.5 w-7',
              filled ? 'border-primary' : 'border-border bg-muted',
              filled && confidence === 'high' && 'bg-primary',
              filled && confidence === 'medium' && 'bg-primary/55',
            )}
            style={filled && confidence === 'low' ? { backgroundImage: STRIPES } : undefined}
          />
        )
      })}
    </div>
  )
}

export function ConfidenceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-[2px] border border-primary bg-primary" /> High confidence
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-[2px] border border-primary bg-primary/55" /> Medium
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-[2px] border border-primary" style={{ backgroundImage: STRIPES }} /> Low
      </span>
    </div>
  )
}

export function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  const id = useId()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      {items.map((item, i) => (
        <div key={`${id}-${i}`} className="flex items-center gap-2">
          <Input
            aria-label={`${label} ${i + 1}`}
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...items, ''])}>
        <Plus className="size-4" /> Add
      </Button>
    </fieldset>
  )
}
