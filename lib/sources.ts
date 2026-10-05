import { gateway, generateText } from 'ai'
import type { Source, Startup } from './schemas'

type Draft = Omit<Source, 'id'>

export type CollectorResult = { status: 'ok' | 'empty' | 'error'; message: string; sources: Draft[] }

const SEC_USER_AGENT = 'XBank Startup Partner Lens partnerships-research@xbank.example'

const REPUTABLE_NEWS_DOMAINS = [
  'techcrunch.com',
  'reuters.com',
  'bloomberg.com',
  'wsj.com',
  'ft.com',
  'axios.com',
  'forbes.com',
  'americanbanker.com',
  'fintechfutures.com',
  'finextra.com',
  'paymentsdive.com',
  'bankingdive.com',
  'pymnts.com',
  'businesswire.com',
  'prnewswire.com',
  'globenewswire.com',
  'fortune.com',
  'cnbc.com',
  'businessinsider.com',
  'thefinancialbrand.com',
]

function normalizeUrl(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    if (!url.hostname.includes('.')) return null
    return url
  } catch {
    return null
  }
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractPage(html: string) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '')
  const description = decodeEntities(
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      '',
  )
  const text = decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
  return { title, description, text }
}

async function fetchPage(url: URL) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StartupPartnerLens/1.0)', Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return null
  return { url: res.url, ...extractPage((await res.text()).slice(0, 400_000)) }
}

export async function collectWebsite(startup: Startup): Promise<CollectorResult> {
  const base = normalizeUrl(startup.website)
  if (!base) return { status: 'empty', message: 'No website provided', sources: [] }

  const paths = ['/', '/about', '/security', '/customers']
  const pages = await Promise.allSettled(paths.map((p) => fetchPage(new URL(p, base.origin))))
  const seen = new Set<string>()
  const sources: Draft[] = []
  for (const page of pages) {
    if (page.status !== 'fulfilled' || !page.value || seen.has(page.value.url)) continue
    seen.add(page.value.url)
    const { url, title, description, text } = page.value
    sources.push({
      kind: 'website',
      title: title || url,
      url,
      publisher: base.hostname.replace(/^www\./, ''),
      date: null,
      snippet: [description, text].filter(Boolean).join(' — ').slice(0, 1500),
    })
  }
  if (!sources.length) return { status: 'error', message: `Could not reach ${base.hostname}`, sources }
  return { status: 'ok', message: `${sources.length} page${sources.length === 1 ? '' : 's'} read`, sources }
}

type EdgarHit = {
  _id: string
  _source: { ciks: string[]; display_names: string[]; file_date: string; form: string; adsh: string; biz_locations?: string[]; xsl?: string }
}

export async function collectSecFilings(startup: Startup): Promise<CollectorResult> {
  const name = startup.name.trim()
  const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${name}"`)}&forms=D,D/A`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': SEC_USER_AGENT }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return { status: 'error', message: `SEC EDGAR returned ${res.status}`, sources: [] }
    const data = (await res.json()) as { hits?: { hits?: EdgarHit[] } }
    const needle = name.toLowerCase()
    const sources = (data.hits?.hits ?? [])
      .filter((h) => h._source.display_names.some((d) => d.toLowerCase().startsWith(needle)))
      .slice(0, 6)
      .map((h): Draft => {
        const { ciks, display_names, file_date, form, adsh, biz_locations, xsl } = h._source
        const cik = String(Number(ciks[0]))
        const file = h._id.split(':')[1] ?? 'primary_doc.xml'
        const folder = adsh.replace(/-/g, '')
        const entity = display_names[0].replace(/\s*\(CIK.*\)$/, '').trim()
        return {
          kind: 'sec_filing',
          title: `Form ${form} — ${entity}`,
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${folder}/${xsl ? `${xsl}/` : ''}${file}`,
          publisher: 'SEC EDGAR',
          date: file_date,
          snippet: `Form ${form} notice of exempt securities offering filed by ${entity}${biz_locations?.length ? ` (${biz_locations.join(', ')})` : ''} on ${file_date}. Confirms a private fundraise was reported to the SEC; amounts are in the filing.`,
        }
      })
    if (!sources.length) return { status: 'empty', message: 'No Form D filings matched this name', sources }
    return { status: 'ok', message: `${sources.length} Form D filing${sources.length === 1 ? '' : 's'} found`, sources }
  } catch {
    return { status: 'error', message: 'SEC EDGAR did not respond', sources: [] }
  }
}

type SearchResult = { title: string; url: string; snippet: string; date?: string; lastUpdated?: string }

export async function collectNews(startup: Startup): Promise<CollectorResult> {
  const name = startup.name.trim()
  const host = normalizeUrl(startup.website)?.hostname.replace(/^www\./, '')
  const subject = [name, host ? `(${host})` : '', startup.category].filter(Boolean).join(' ')
  try {
    const result = await generateText({
      model: 'openai/gpt-5-mini',
      prompt: `Search reputable business and fintech news for the startup ${subject}: funding rounds, bank or credit union customers and partnerships, product launches, regulatory actions, lawsuits, layoffs or security incidents. Use the search tool once, then reply "done".`,
      tools: {
        search: gateway.tools.perplexitySearch({
          maxResults: 10,
          country: 'US',
          searchDomainFilter: REPUTABLE_NEWS_DOMAINS,
        }),
      },
      toolChoice: { type: 'tool', toolName: 'search' },
    })
    const results: SearchResult[] = []
    for (const step of result.steps) {
      for (const part of step.content) {
        if (part.type !== 'tool-result') continue
        const output = part.output as { results?: SearchResult[] }
        if (output?.results) results.push(...output.results)
      }
    }
    const needle = name.toLowerCase()
    const sources = results
      .filter((r) => `${r.title} ${r.snippet}`.toLowerCase().includes(needle))
      .slice(0, 8)
      .map(
        (r): Draft => ({
          kind: 'news',
          title: r.title,
          url: r.url,
          publisher: new URL(r.url).hostname.replace(/^www\./, ''),
          date: r.date ?? r.lastUpdated ?? null,
          snippet: r.snippet.replace(/\s+/g, ' ').slice(0, 1200),
        }),
      )
    if (!sources.length) return { status: 'empty', message: 'No coverage in reputable outlets', sources }
    return { status: 'ok', message: `${sources.length} article${sources.length === 1 ? '' : 's'} found`, sources }
  } catch (error) {
    console.error('[sources] news search failed', error)
    const raw = error instanceof Error ? error.message : ''
  const message = /credit card/i.test(raw)
    ? 'News search needs AI Gateway billing enabled on your Vercel team'
    : 'News search is unavailable right now'
  return { status: 'error', message, sources: [] }
  }
}
