import type { VisSpec } from "./types"

export type NotebookEntry = {
  id: string
  datasetId?: string
  title: string
  summary: string
  highlights: string[]
  chart?: VisSpec
  createdAt: string
}

const STORAGE_KEY = "entrestate-data-notebook"

export function getNotebookEntries(): NotebookEntry[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as NotebookEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn("Failed to load notebook entries:", error)
    return []
  }
}

export function saveNotebookEntry(entry: NotebookEntry): NotebookEntry[] {
  if (typeof window === "undefined") return []
  const entries = getNotebookEntries()
  const next = [entry, ...entries].slice(0, 200)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function removeNotebookEntry(entryId: string): NotebookEntry[] {
  if (typeof window === "undefined") return []
  const entries = getNotebookEntries().filter((entry) => entry.id !== entryId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function clearNotebookEntries(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function createNotebookEntry(options: {
  datasetId?: string
  title: string
  summary: string
  highlights?: string[]
  chart?: VisSpec
}): NotebookEntry {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    datasetId: options.datasetId,
    title: options.title,
    summary: options.summary,
    highlights: options.highlights ?? [],
    chart: options.chart,
    createdAt: new Date().toISOString(),
  }
}
