"use client"

import { createContext, useContext } from "react"
import type { RuntimeShell } from "@/lib/runtime-host"

const RuntimeShellContext = createContext<RuntimeShell>("default")

export function RuntimeShellProvider({
  shell,
  children,
}: {
  shell: RuntimeShell
  children: React.ReactNode
}) {
  return <RuntimeShellContext.Provider value={shell}>{children}</RuntimeShellContext.Provider>
}

export function useRuntimeShellContext() {
  return useContext(RuntimeShellContext)
}
