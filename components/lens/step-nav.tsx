'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { title: 'Startup intake', hint: 'Profile and evidence' },
  { title: 'Use-case fit', hint: 'Where could they fit?' },
  { title: 'Viability', hint: 'Weighted bank criteria' },
  { title: 'Evidence & gaps', hint: 'Routed to owner teams' },
  { title: 'Decision & handoff', hint: 'Gate to PoC review' },
]

export function StepNav({ current, completion, onSelect }: { current: number; completion: boolean[]; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Diligence steps">
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {steps.map((s, i) => {
          const n = i + 1
          const active = n === current
          const done = completion[i]
          return (
            <li key={s.title} className="shrink-0 lg:relative">
              {i < steps.length - 1 ? <span aria-hidden="true" className="absolute left-[15px] top-9 hidden h-[calc(100%-1.5rem)] w-px bg-border lg:block" /> : null}
              <button
                type="button"
                onClick={() => onSelect(n)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors lg:items-start lg:py-2.5',
                  active ? 'bg-card shadow-sm ring-1 ring-border' : 'hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs',
                    active && 'border-primary bg-primary text-primary-foreground',
                    !active && done && 'border-primary bg-card text-primary',
                    !active && !done && 'border-input bg-background text-muted-foreground',
                  )}
                >
                  {done && !active ? <Check className="size-3.5" /> : n}
                </span>
                <span className="flex flex-col">
                  <span className={cn('whitespace-nowrap text-sm', active ? 'font-semibold' : 'font-medium')}>{s.title}</span>
                  <span className="hidden text-xs text-muted-foreground lg:block">{s.hint}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
