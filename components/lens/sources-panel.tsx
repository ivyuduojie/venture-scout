'use client'

import { ExternalLink, Globe, Landmark, Loader2, Lock, Newspaper, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConnectorReport } from '@/app/api/sources/route'
import type { Source, SourceKind } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { Panel } from './primitives'

type Props = {
  sources: Source[]
  report: ConnectorReport | null
  pending: boolean
  error: string | null
  canGather: boolean
  onGather: () => void
  onRemove: (id: string) => void
}

const kindMeta: Record<SourceKind, { label: string; icon: typeof Globe; verifies: boolean }> = {
  sec_filing: { label: 'SEC filing', icon: Landmark, verifies: true },
  news: { label: 'News', icon: Newspaper, verifies: true },
  website: { label: 'Company site', icon: Globe, verifies: false },
}

const live = [
  { id: 'website', name: 'Company website', detail: 'Home, about, security and customer pages' },
  { id: 'sec', name: 'SEC EDGAR', detail: 'Form D private-offering filings' },
  { id: 'news', name: 'Reputable news', detail: 'TechCrunch, Reuters, American Banker, Axios and more' },
] as const

const recommended = [
  { name: 'PitchBook', detail: 'Funding history, valuations, investors' },
  { name: 'Crunchbase', detail: 'Funding rounds, headcount trends' },
  { name: 'CB Insights', detail: 'Market maps, Mosaic health score' },
  { name: 'Dun & Bradstreet', detail: 'Business credit, financial stability' },
  { name: 'OFAC / Consolidated Screening List', detail: 'Sanctions screening, free public API' },
  { name: 'CFPB & state regulators', detail: 'Complaints, enforcement, licensing (NMLS)' },
]

const statusStyles = {
  ok: 'bg-primary',
  empty: 'bg-accent',
  error: 'bg-destructive',
}

export function SourcesPanel({ sources, report, pending, error, canGather, onGather, onRemove }: Props) {
  return (
    <Panel
      title="Public sources"
      aside={<span className="font-mono text-xs text-muted-foreground">{sources.length} linked</span>}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pull verifiable public records before running the lens. Evidence backed by an SEC filing or independent news is marked{' '}
            <span className="font-medium text-foreground">verified</span> and linked; the startup&apos;s own website counts as a claim.
          </p>
          <Button variant="outline" onClick={onGather} disabled={pending || !canGather} className="shrink-0">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {pending ? 'Searching…' : sources.length ? 'Refresh sources' : 'Gather public sources'}
          </Button>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3" aria-label="Connected sources">
          {live.map((c) => {
            const r = report?.[c.id]
            return (
              <li key={c.id} className="flex flex-col gap-1 rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn('size-2 rounded-full', r ? statusStyles[r.status] : 'bg-border')} />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{r ? r.message : c.detail}</p>
              </li>
            )
          })}
        </ul>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {sources.length ? (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {sources.map((s) => {
              const meta = kindMeta[s.kind]
              const Icon = meta.icon
              return (
                <li key={s.id} className="flex gap-3 p-3">
                  <span className="mt-0.5 font-mono text-xs text-muted-foreground">{s.id}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm font-medium leading-snug underline-offset-4 hover:underline"
                    >
                      <span className="line-clamp-2">{s.title}</span>
                      <ExternalLink aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    </a>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Icon aria-hidden="true" className="size-3.5" />
                        {meta.label}
                      </span>
                      <span>{s.publisher}</span>
                      {s.date ? <span>{s.date}</span> : null}
                      <span className={meta.verifies ? 'text-primary' : ''}>{meta.verifies ? 'Independent' : 'Self-reported'}</span>
                    </p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.snippet}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onRemove(s.id)} aria-label={`Remove source ${s.id}`}>
                    <X className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Lock aria-hidden="true" className="size-3.5 text-muted-foreground" />
            <h3 className="text-sm font-medium">Recommended licensed connections</h3>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Need an enterprise subscription or API key. Once your team has access, these can feed the same verified-evidence pipeline.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((r) => (
              <li key={r.name} className="rounded-md border border-dashed border-border px-3 py-2">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  )
}
