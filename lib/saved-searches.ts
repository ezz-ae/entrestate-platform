export type SavedSearch = {
  id: string
  label: string
  detail: string
  category?: string
  scriptLabel?: string
  query?: string
  inputs?: Record<string, string>
  createdAt: string
}

const STORAGE_KEY = "entrestate.saved-searches.v1"

function readStorage(): SavedSearch[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedSearch[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function writeStorage(next: SavedSearch[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function getSavedSearches() {
  return readStorage().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getSavedSearchById(id: string) {
  const list = readStorage()
  return list.find((item) => item.id === id) ?? null
}

export function saveSearch(entry: SavedSearch) {
  const list = readStorage()
  const next = [entry, ...list.filter((item) => item.id !== entry.id)].slice(0, 50)
  writeStorage(next)
  return next
}

export function removeSavedSearch(id: string) {
  const list = readStorage()
  const next = list.filter((item) => item.id !== id)
  writeStorage(next)
  return next
}
