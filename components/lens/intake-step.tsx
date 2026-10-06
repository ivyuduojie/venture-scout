'use client'

import { Loader2, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BANK_NAME } from '@/lib/sample'
import type { Startup } from '@/lib/schemas'
import { Panel, StepHeader } from './primitives'

type Props = {
  startup: Startup
  focus: string
  hasAssessment: boolean
  pending: boolean
  error: string | null
  criteriaCount: number
  onStartupChange: (startup: Startup) => void
  onFocusChange: (focus: string) => void
  onRun: () => void
  sourcesSlot: React.ReactNode
}

const categories = [
  'Payments',
  'Fraud & financial crime',
  'Lending & credit',
  'RegTech & compliance',
  'Wealth & investments',
  'Open banking & data',
  'Customer experience',
  'Cybersecurity',
  'Operations & automation',
  'Other',
]

export function IntakeStep({ startup, focus, hasAssessment, pending, error, criteriaCount, onStartupChange, onFocusChange, onRun, sourcesSlot }: Props) {
  const set = <K extends keyof Startup>(key: K, value: Startup[K]) => onStartupChange({ ...startup, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        step={1}
        title="Startup intake"
        description={`Capture who the startup is and everything gathered so far. No fixed use case is needed — the lens maps where they could fit across ${BANK_NAME}.`}
      />

      <Panel title="Startup profile">
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startup-name">Name</Label>
              <Input id="startup-name" value={startup.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startup-website">Website</Label>
              <Input id="startup-website" value={startup.website} onChange={(e) => set('website', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startup-stage">Stage</Label>
              <select
                id="startup-stage"
                value={startup.stage}
                onChange={(e) => set('stage', e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Select stage</option>
                {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth / pre-IPO'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startup-category">Category</Label>
              <select
                id="startup-category"
                value={startup.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="startup-hq">Headquarters</Label>
              <Input id="startup-hq" value={startup.headquarters} placeholder="City, state (e.g. Austin, TX)" onChange={(e) => set('headquarters', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="startup-description">What they do</Label>
            <Textarea id="startup-description" rows={3} value={startup.description} onChange={(e) => set('description', e.target.value)} className="leading-relaxed" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="startup-evidence">Evidence gathered</Label>
            <Textarea
              id="startup-evidence"
              rows={7}
              value={startup.evidence}
              placeholder="Paste pitch deck excerpts, intro call notes, certifications, security questionnaire answers, reference summaries…"
              onChange={(e) => set('evidence', e.target.value)}
              className="font-mono text-sm leading-relaxed"
            />
          </div>
        </div>
      </Panel>

      {sourcesSlot}

      <Panel title="Scouting focus" aside={<span className="font-mono text-xs text-muted-foreground">Optional</span>}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="scouting-focus" className="sr-only">
            Scouting focus
          </Label>
          <Textarea
            id="scouting-focus"
            rows={2}
            value={focus}
            onChange={(e) => onFocusChange(e.target.value)}
            placeholder="Any strategic themes or business units to prioritize, e.g. reducing Zelle scam losses, small business onboarding."
            className="leading-relaxed"
          />
        </div>
      </Panel>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-secondary-foreground">
          Running the lens identifies candidate use cases, scores {criteriaCount} viability criteria, and routes gaps to Procurement, Risk and Legal.
        </p>
        <Button onClick={onRun} disabled={pending || !startup.name.trim() || criteriaCount === 0} className="shrink-0">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          {pending ? 'Running lens…' : hasAssessment ? 'Re-run assessment' : 'Run assessment'}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
