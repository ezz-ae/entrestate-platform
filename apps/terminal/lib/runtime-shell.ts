import { headers } from "next/headers"
import { resolveRuntimeShell, type RuntimeShell } from "@/lib/runtime-host"

export async function getRequestRuntimeShell(): Promise<RuntimeShell> {
  const headerStore = await headers()
  const explicitShell = headerStore.get("x-entrestate-shell")?.split(",")[0]?.trim() ?? ""
  if (explicitShell === "mobile") {
    return "mobile"
  }

  const forwardedHost = headerStore.get("x-forwarded-host")
  const host = forwardedHost || headerStore.get("host")
  return resolveRuntimeShell(host)
}
