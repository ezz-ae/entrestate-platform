import "server-only"

type ReportRecord = {
  id: string
  createdAt: string
  title: string
  payload: unknown
}

type WatchlistRecord = {
  id: string
  name: string
  createdAt: string
  items: Array<{ name: string; slug?: string; createdAt: string }>
}

declare global {
  // eslint-disable-next-line no-var
  var entrestateReports: Map<string, ReportRecord> | undefined
  // eslint-disable-next-line no-var
  var entrestateWatchlists: Map<string, WatchlistRecord> | undefined
}

const reports = globalThis.entrestateReports ?? new Map<string, ReportRecord>()
const watchlists = globalThis.entrestateWatchlists ?? new Map<string, WatchlistRecord>()

if (!globalThis.entrestateReports) globalThis.entrestateReports = reports
if (!globalThis.entrestateWatchlists) globalThis.entrestateWatchlists = watchlists

export function saveReport(report: Omit<ReportRecord, "id" | "createdAt">) {
  const id = crypto.randomUUID()
  const record: ReportRecord = {
    id,
    createdAt: new Date().toISOString(),
    ...report,
  }
  reports.set(id, record)
  return record
}

export function getReport(id: string) {
  return reports.get(id) ?? null
}

export function createWatchlist(name: string) {
  const id = crypto.randomUUID()
  const record: WatchlistRecord = {
    id,
    name,
    createdAt: new Date().toISOString(),
    items: [],
  }
  watchlists.set(id, record)
  return record
}

export function addWatchlistItem(watchlistId: string, item: { name: string; slug?: string }) {
  const watchlist = watchlists.get(watchlistId)
  if (!watchlist) return null
  watchlist.items.push({ ...item, createdAt: new Date().toISOString() })
  return watchlist
}
