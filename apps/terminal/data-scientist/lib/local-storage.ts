import type { StoredDataset, DatasetProfile } from "./types"

const STORAGE_KEY = "ai-data-scientist-dataset"
const MAX_ROWS_FOR_STORAGE = 2000

type StoredDatasetStub = {
  datasetId: string
  source?: string
  profile?: DatasetProfile
  sampleRows?: Record<string, unknown>[]
}

export type CachedDataset = StoredDataset | StoredDatasetStub

export function saveDatasetToLocalStorage(dataset: StoredDataset): void {
  if (typeof window === "undefined") return
  
  try {
    const payload: CachedDataset =
      dataset.rows.length > MAX_ROWS_FOR_STORAGE
        ? {
            datasetId: dataset.datasetId,
            source: "entrestate",
            profile: dataset.profile,
            sampleRows: dataset.sampleRows,
          }
        : dataset

    const serialized = JSON.stringify(payload)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.warn("Failed to save dataset to localStorage:", error)
  }
}

export function getDatasetFromLocalStorage(): CachedDataset | null {
  if (typeof window === "undefined") return null
  
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return null
    return JSON.parse(serialized) as CachedDataset
  } catch (error) {
    console.warn("Failed to load dataset from localStorage:", error)
    return null
  }
}

export function clearDatasetFromLocalStorage(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function hasDatasetInLocalStorage(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) !== null
}
