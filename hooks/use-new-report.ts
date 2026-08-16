"use client"

import { useState, useEffect, useCallback } from "react"

const LS_KEY = "entrestate_seen_report_ids"

export type NewReport = {
  id: string
  publicId: string
  title: string
  createdAt: string
}

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function markReportSeen(id: string) {
  try {
    const seen = getSeenIds()
    if (!seen.includes(id)) {
      localStorage.setItem(LS_KEY, JSON.stringify([...seen, id]))
    }
  } catch {}
}

export function useNewReport() {
  const [report, setReport] = useState<NewReport | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLatest = useCallback(() => {
    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((data) => {
        const all: NewReport[] = data.reports ?? []
        const seen = getSeenIds()
        const next = all.find((r) => !seen.includes(r.id)) ?? null
        setReport(next)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchLatest()
  }, [fetchLatest])

  useEffect(() => {
    window.addEventListener("entrestate:report-created", fetchLatest)
    return () => window.removeEventListener("entrestate:report-created", fetchLatest)
  }, [fetchLatest])

  const dismiss = useCallback((id: string) => {
    markReportSeen(id)
    setReport(null)
  }, [])

  return { report, loading, dismiss }
}
