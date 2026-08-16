const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const SHARED_SITE_SUBDOMAINS = new Set(["www", "m"])

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, "")
}

function toCookieDomain(hostname: string | null | undefined) {
  if (!hostname) return undefined

  const normalized = normalizeHost(hostname).replace(/^\.+/, "")
  if (!normalized || LOCAL_HOSTS.has(normalized)) {
    return undefined
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return undefined
  }

  const labels = normalized.split(".").filter(Boolean)
  const apexHostname = labels.length > 2 && SHARED_SITE_SUBDOMAINS.has(labels[0])
    ? labels.slice(1).join(".")
    : normalized
  if (!apexHostname.includes(".")) {
    return undefined
  }

  return `.${apexHostname}`
}

export function getSharedAuthCookieDomain(host?: string | null) {
  const explicitDomain = toCookieDomain(process.env.NEON_AUTH_COOKIE_DOMAIN)
  if (explicitDomain) {
    return explicitDomain
  }

  const configuredOrigins = [
    process.env.NEON_AUTH_TRUSTED_ORIGIN?.trim(),
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
  ].filter(Boolean) as string[]

  for (const origin of configuredOrigins) {
    try {
      const configuredDomain = toCookieDomain(new URL(origin).hostname)
      if (configuredDomain) {
        return configuredDomain
      }
    } catch {
      const configuredDomain = toCookieDomain(origin)
      if (configuredDomain) {
        return configuredDomain
      }
    }
  }

  if (host) {
    return toCookieDomain(host)
  }

  return undefined
}

export function applyCookieDomain(setCookieValue: string, cookieDomain?: string) {
  if (!cookieDomain) {
    return setCookieValue
  }

  if (/;\s*domain=/i.test(setCookieValue)) {
    return setCookieValue.replace(/;\s*domain=[^;]+/i, `; Domain=${cookieDomain}`)
  }

  return `${setCookieValue}; Domain=${cookieDomain}`
}
