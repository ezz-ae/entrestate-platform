"use client"

import { useRuntimeShellContext } from "@/components/runtime-shell-provider"

export function useRuntimeShell() {
  return useRuntimeShellContext()
}
