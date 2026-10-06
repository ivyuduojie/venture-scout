'use client'

import { ArrowLeft, ArrowRight, FilePlus2, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ConnectorReport } from '@/app/api/sources/route'
import type { Assessment, Criterion, Decision, Handoff, Source, Startup } from '@/lib/schemas'
import { SourcesPanel } from './sources-panel'
import { BANK_NAME, defaultCriteria, sampleAssessment, sampleStartup } from '@/lib/sample'
import { evidenceCoverage, weightedScore } from '@/lib/scoring'
import { DecisionStep } from './decision-step'
import { EvidenceStep } from './evidence-step'
import { IntakeStep } from './intake-step'
import { Readout } from './readout'
import { StepNav } from './step-nav'
import { UseCaseStep } from './use-case-step'
import { ViabilityStep } from './viability-step'

const emptyStartup: Startup = { name: '', website: '', stage: '', headquarters: '', category: '', description: '', evidence: '' }
const emptyHandoff: Handoff = { sentAt: null, status: { procurement: 'not-sent', risk: 'not-sent', legal: 'not-sent' } }

export function Workspace() {
  const [step, setStep] = useState(1)
  const [startup, setStartup] = useState<Startup>(sampleStartup)
  const [focus, setFocus] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria)
  const [assessment, setAssessment] = useState<Assessment | null>(sampleAssessment)
  const [useCaseIndex, setUseCaseIndex] = useState<number | null>(0)
  const [resolvedGaps, setResolvedGaps] = useState<number[]>([])
  const [decision, setDecision] = useState<Decision | null>(null)
  const [handoff, setHandoff] = useState<Handoff>(emptyHandoff)
  const [caseKey, setCaseKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [sourceReport, setSourceReport] = useState<ConnectorReport | null>(null)
  const [sourcesPending, setSourcesPending] = useState(false)
  const [sourcesError, setSourcesError] = useState<string | null>(null)

  async function gatherSources() {
    setSourcesPending(true)
    setSourcesError(null)
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setSources(data.sources)
      setSourceReport(data.report)
    } catch (e) {
      setSourcesError(e instanceof Error ? e.message : 'Could not gather sources')
    } finally {
      setSourcesPending(false)
    }
  }

  const score = weightedScore(criteria, assessment)
  const coverage = evidenceCoverage(criteria, assessment)
  const openGaps = assessment?.gaps.filter((_, i) => !resolvedGaps.includes(i)).map((g) => g.validationStep) ?? []
  const useCase = useCaseIndex !== null ? (assessment?.useCases[useCaseIndex] ?? null) : null

  function resetDownstream() {
    setResolvedGaps([])
    setDecision(null)
    setHandoff(emptyHandoff)
  }

  function loadCase(sample: boolean) {
    setStartup(sample ? sampleStartup : emptyStartup)
    setFocus('')
    setCriteria(defaultCriteria)
    setAssessment(sample ? sampleAssessment : null)
    setUseCaseIndex(sample ? 0 : null)
    resetDownstream()
    setError(null)
    setSources([])
    setSourceReport(null)
    setSourcesError(null)
    setStep(1)
    setCaseKey((k) => k + 1)
  }

  async function runAssessment() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup, criteria, focus, sources }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setAssessment(data.assessment)
      setUseCaseIndex(data.assessment.useCases.length ? 0 : null)
      resetDownstream()
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  function decide(next: Decision | null) {
    setDecision(next)
    if (!next) setHandoff(emptyHandoff)
  }

  const completion = [
    Boolean(startup.name && startup.description),
    Boolean(assessment) && useCase !== null,
    Boolean(assessment),
    Boolean(assessment) && openGaps.length === 0,
    Boolean(decision),
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <LensMark />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Startup Partner Lens <span className="font-normal text-muted-foreground">· {BANK_NAME} Partnerships & Innovation</span>
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {startup.name || 'New startup'}
                {useCase ? ` · ${useCase.businessUnit}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadCase(true)}>
              <FlaskConical className="size-4" />
              <span className="hidden sm:inline">Sample case</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadCase(false)}>
              <FilePlus2 className="size-4" />
              <span className="hidden sm:inline">New startup</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-6 md:px-6 lg:grid-cols-[16rem_1fr] lg:py-10">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start print:hidden">
          <StepNav current={step} completion={completion} onSelect={setStep} />
          <Readout
            score={score}
            coverage={coverage}
            openGaps={openGaps.length}
            risks={assessment?.risks.filter((r) => r.severity === 'high').length ?? null}
            decision={decision}
            handoff={handoff}
          />
        </aside>

        <main key={caseKey} className="flex min-w-0 flex-col gap-8">
          {step === 1 && (
            <IntakeStep
              startup={startup}
              focus={focus}
              hasAssessment={Boolean(assessment)}
              pending={pending}
              error={error}
              criteriaCount={criteria.filter((c) => c.weight > 0).length}
              onStartupChange={setStartup}
              onFocusChange={setFocus}
              onRun={runAssessment}
              sourcesSlot={
                <SourcesPanel
                  sources={sources}
                  report={sourceReport}
                  pending={sourcesPending}
                  error={sourcesError}
                  canGather={Boolean(startup.name.trim())}
                  onGather={gatherSources}
                  onRemove={(id) => setSources((s) => s.filter((x) => x.id !== id))}
                />
              }
            />
          )}
          {step === 2 && <UseCaseStep assessment={assessment} selected={useCaseIndex} onSelect={setUseCaseIndex} />}
          {step === 3 && <ViabilityStep criteria={criteria} assessment={assessment} onCriteriaChange={setCriteria} />}
          {step === 4 && (
            <EvidenceStep
              criteria={criteria}
              assessment={assessment}
              sources={sources}
              resolvedGaps={resolvedGaps}
              onToggleGap={(i) => setResolvedGaps((g) => (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]))}
            />
          )}
          {step === 5 && (
            <DecisionStep
              startup={startup}
              assessment={assessment}
              useCase={useCase}
              score={score}
              coverage={coverage}
              openGaps={openGaps}
              partnershipGaps={
                assessment?.gaps.filter((g, i) => g.owner === 'partnerships' && !resolvedGaps.includes(i)).map((g) => g.validationStep) ?? []
              }
              resolvedGaps={resolvedGaps}
              decision={decision}
              handoff={handoff}
              onDecide={decide}
              onHandoffChange={setHandoff}
            />
          )}

          <nav aria-label="Step navigation" className="flex items-center justify-between border-t border-border pt-6 print:hidden">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
              <ArrowLeft className="size-4" /> Previous
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : null}
          </nav>
        </main>
      </div>
    </div>
  )
}

function LensMark() {
  return (
    <span aria-hidden="true" className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-primary">
      <span className="size-4 rounded-full border-2 border-primary-foreground" />
      <span className="absolute size-1.5 rounded-full bg-accent" />
    </span>
  )
}
