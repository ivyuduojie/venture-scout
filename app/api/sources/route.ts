import { z } from 'zod'
import { startupSchema, type Source } from '@/lib/schemas'
import { collectNews, collectSecFilings, collectWebsite, type CollectorResult } from '@/lib/sources'

export const maxDuration = 60

const bodySchema = z.object({ startup: startupSchema })

export type ConnectorId = 'website' | 'sec' | 'news'
export type ConnectorReport = Record<ConnectorId, Omit<CollectorResult, 'sources'>>

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Add a startup name before gathering sources.' }, { status: 400 })
  }
  const { startup } = parsed.data

  const [website, sec, news] = await Promise.all([collectWebsite(startup), collectSecFilings(startup), collectNews(startup)])

  const seen = new Set<string>()
  const sources: Source[] = []
  for (const draft of [...sec.sources, ...news.sources, ...website.sources]) {
    if (seen.has(draft.url)) continue
    seen.add(draft.url)
    sources.push({ id: `S${sources.length + 1}`, ...draft })
  }

  const report: ConnectorReport = {
    website: { status: website.status, message: website.message },
    sec: { status: sec.status, message: sec.message },
    news: { status: news.status, message: news.message },
  }
  return Response.json({ sources, report })
}
