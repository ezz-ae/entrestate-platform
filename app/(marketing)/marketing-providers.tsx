"use client"

import type React from "react"
import { Suspense } from "react"
import { ErrorBoundary } from "@/seq/components/error-boundary"
import { Toaster, ToastProvider } from "@/seq/components/ui/sonner"
import { DeploymentNotice } from "@/seq/components/deployment-notice"

export function MarketingProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Suspense fallback={null}>{children}</Suspense>
      </ErrorBoundary>
      <Toaster />
      <DeploymentNotice />
    </ToastProvider>
  )
}
