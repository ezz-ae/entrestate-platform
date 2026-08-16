import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

export function normalizeNextPath(nextPath: string | null | undefined, fallback = "/account") {
  const trimmed = nextPath?.trim() ?? ""
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  const [pathWithQuery, hashPart] = trimmed.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const normalizedPath = stripLocalePrefix(pathname || "/")

  return `${normalizedPath}${queryPart ? `?${queryPart}` : ""}${hashPart ? `#${hashPart}` : ""}`
}

export function buildLoginHref(locale: AppLocale, nextPath = "/me") {
  const safeNextPath = normalizeNextPath(nextPath, "/me")
  return prefixLocalePath(`/login?next=${encodeURIComponent(safeNextPath)}`, locale)
}

export function resolvePostLoginHref(
  locale: AppLocale,
  nextPath: string | null | undefined,
  fallback = "/me",
) {
  const normalizedPath = normalizeNextPath(nextPath, fallback)
  const [pathWithQuery, hashPart] = normalizedPath.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const sourceParams = new URLSearchParams(queryPart ?? "")

  if (pathname === "/chat" || sourceParams.get("openChat") === "true") {
    const shellParams = new URLSearchParams()
    shellParams.set("openChat", "true")

    const sessionId = sourceParams.get("id")
    if (sessionId) {
      shellParams.set("id", sessionId)
    }

    const prompt = sourceParams.get("prompt") ?? sourceParams.get("q")
    if (prompt) {
      shellParams.set("prompt", prompt)
    }

    return prefixLocalePath(`/me?${shellParams.toString()}${hashPart ? `#${hashPart}` : ""}`, locale)
  }

  return prefixLocalePath(normalizedPath, locale)
}
