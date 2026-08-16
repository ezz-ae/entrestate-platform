export type RuntimeShell = "default" | "mobile"
const PRIMARY_WEB_HOSTS = new Set(["entrestate.com", "www.entrestate.com"])

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? ""
}

export function getRequestHostname(host: string | null | undefined) {
  return firstHeaderValue(host).replace(/:\d+$/, "").toLowerCase()
}

export function isMobileWebHost(host: string | null | undefined) {
  const hostname = getRequestHostname(host)
  return hostname === "m.entrestate.com" || hostname === "m.localhost" || hostname.startsWith("m.")
}

export function isPrimaryWebHost(host: string | null | undefined) {
  return PRIMARY_WEB_HOSTS.has(getRequestHostname(host))
}

export function getMobileWebHostname(host: string | null | undefined) {
  const hostname = getRequestHostname(host)
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "m.localhost"
  }
  if (PRIMARY_WEB_HOSTS.has(hostname)) {
    return "m.entrestate.com"
  }
  return isMobileWebHost(hostname) ? hostname : ""
}

export function resolveRuntimeShell(host: string | null | undefined): RuntimeShell {
  return isMobileWebHost(host) ? "mobile" : "default"
}
