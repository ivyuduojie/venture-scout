'use client'

import { BANK_NAME } from '@/lib/sample'
import type { Assessment } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { Panel, StepHeader } from './primitives'

type Props = {
  assessment: Assessment | null
  selected: number | null
  onSelect: (index: number) => void
}

export const verdictCopy = {
  strong: { label: 'Strong fit', className: 'bg-primary text-primary-foreground' },
  partial: { label: 'Partial fit', className: 'bg-accent text-accent-foreground' },
  weak: { label: 'Weak fit', className: 'bg-destructive text-primary-foreground' },
  unclear: { label: 'Fit unclear', className: 'bg-muted text-foreground' },
} as const

const useCaseFit = {
  strong: { label: 'Strong', bars: 3 },
  moderate: { label: 'Moderate', bars: 2 },
  weak: { label: 'Weak', bars: 1 },
} as const

export function UseCaseStep({ assessment, selected, onSelect }: Props) {
  if (!assessment) {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={2} title="Use-case fit" description={`Where could this startup realistically add value inside ${BANK_NAME}?`} />
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Run the assessment in step 1 to map candidate use cases.</div>
      </div>
    )
  }

  const verdict = verdictCopy[assessment.fit.verdict]

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={2}
        title="Use-case fit"
        description={`Where could this startup add value inside ${BANK_NAME}? Select the use case you would take forward to a Proof of Concept.`}
      />

      <Panel
        title="Partner suitability"
        aside={<span className={cn('rounded-sm px-2 py-0.5 font-mono text-xs uppercase tracking-wide', verdict.className)}>{verdict.label}</span>}
      >
        <p className="max-w-3xl text-pretty leading-relaxed">{assessment.fit.summary}</p>
      </Panel>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">Candidate use cases</legend>
        {assessment.useCases.map((u, i) => {
          const isSelected = selected === i
          const f = useCaseFit[u.fit]
          return (
            <label
              key={i}
              className={cn(
                'flex cursor-pointer gap-4 rounded-lg border bg-card p-5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input',
              )}
            >
              <input type="radio" name="use-case" checked={isSelected} onChange={() => onSelect(i)} className="sr-only" />
              <span
                aria-hidden="true"
                className={cn('mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border', isSelected ? 'border-primary' : 'border-input')}
              >
                {isSelected ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-6">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{u.businessUnit}</span>
                    <span className="text-pretty font-semibold">{u.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2" aria-label={`${f.label} fit`}>
                    <span className="flex items-end gap-0.5" aria-hidden="true">
                      {[1, 2, 3].map((b) => (
                        <span key={b} className={cn('w-1.5 rounded-[1px]', b <= f.bars ? 'bg-primary' : 'bg-border')} style={{ height: `${b * 4 + 4}px` }} />
                      ))}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wide">{f.label}</span>
                  </span>
                </span>
                <span className="text-sm leading-relaxed">
                  <span className="font-medium">Value: </span>
                  {u.valueHypothesis}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{u.rationale}</span>
              </span>
            </label>
          )
        })}
      </fieldset>
    </div>
  )
}
