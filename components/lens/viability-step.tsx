'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Assessment, Criterion } from '@/lib/schemas'
import { clampScore, resultFor } from '@/lib/scoring'
import { BasisTag, ConfidenceLegend, Panel, ScoreMeter, StepHeader } from './primitives'

type Props = {
  criteria: Criterion[]
  assessment: Assessment | null
  onCriteriaChange: (criteria: Criterion[]) => void
}

export function ViabilityStep({ criteria, assessment, onCriteriaChange }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function addCriterion(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'criterion'
    let id = base
    let n = 2
    while (criteria.some((c) => c.id === id)) id = `${base}-${n++}`
    onCriteriaChange([...criteria, { id, name: trimmed, description: description.trim(), weight: 3 }])
    setName('')
    setDescription('')
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={3}
        title="Evaluate viability"
        description="Is this startup viable as a bank supplier? Scores come from the lens; weights are yours and update the overall readout instantly. New criteria are scored on the next run."
      />

      <ConfidenceLegend />

      <ul className="flex flex-col gap-3">
        {criteria.map((c) => {
          const r = resultFor(assessment, c.id)
          return (
            <li key={c.id} className="rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.description || 'No description.'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex flex-col items-end gap-1.5">
                    <ScoreMeter score={r ? clampScore(r.score) : null} confidence={r?.confidence} />
                    <span className="font-mono text-xs text-muted-foreground">{r ? `${clampScore(r.score)}/5 · ${r.confidence} conf.` : 'not assessed'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor={`weight-${c.id}`} className="sr-only">
                      Weight for {c.name}
                    </Label>
                    <select
                      id={`weight-${c.id}`}
                      value={c.weight}
                      onChange={(e) => onCriteriaChange(criteria.map((x) => (x.id === c.id ? { ...x, weight: Number(e.target.value) } : x)))}
                      className="h-8 rounded-md border border-input bg-card px-2 font-mono text-sm"
                    >
                      {[0, 1, 2, 3, 4, 5].map((w) => (
                        <option key={w} value={w}>
                          {w === 0 ? 'w0 off' : `w${w}`}
                        </option>
                      ))}
                    </select>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${c.name}`} onClick={() => onCriteriaChange(criteria.filter((x) => x.id !== c.id))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {r ? (
                <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-5 py-4">
                  <p className="text-sm leading-relaxed">{r.rationale}</p>
                  {r.evidence.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {r.evidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <BasisTag basis={ev.basis} />
                          <span className="leading-relaxed text-muted-foreground">{ev.statement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Panel title="Add a criterion">
        <form onSubmit={addCriterion} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="new-criterion-name">Name</Label>
            <Input id="new-criterion-name" value={name} placeholder="e.g. ESG alignment, Cloud concentration" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-[2] flex-col gap-2">
            <Label htmlFor="new-criterion-description">What good looks like</Label>
            <Input id="new-criterion-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={!name.trim()}>
            <Plus className="size-4" /> Add criterion
          </Button>
        </form>
      </Panel>
    </div>
  )
}
