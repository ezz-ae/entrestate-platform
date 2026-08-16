"use client"

import { useEffect, useState } from "react"
import { PLATFORM_METRICS_FALLBACK, withPlatformMetricFallback, type PlatformMetrics } from "@/lib/platform-metrics"

export function usePlatformMetrics() {
  const [metrics, setMetrics] = useState<PlatformMetrics>(PLATFORM_METRICS_FALLBACK)

  useEffect(() => {
    let active = true

    fetch("/api/platform-metrics")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Platform metrics unavailable")
        }
        return response.json()
      })
      .then((payload) => {
        if (!active) return
        setMetrics(withPlatformMetricFallback(payload as Partial<PlatformMetrics>))
      })
      .catch(() => {
        if (active) setMetrics(PLATFORM_METRICS_FALLBACK)
      })

    return () => {
      active = false
    }
  }, [])

  return metrics
}
