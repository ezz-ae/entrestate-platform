import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

type BuildCopilotShellHrefOptions = {
  authenticated: boolean
  locale: AppLocale
  pathname?: string | null
  search?: string | URLSearchParams | null
  prompt?: string | null
  sessionId?: string | null
}

export function getCopilotShellBasePath(authenticated: boolean) {
  return authenticated ? "/me" : "/"
}

export function buildLocalizedChatHref(
  locale: AppLocale,
  options?: {
    prompt?: string | null
    sessionId?: string | null
  },
) {
  const url = new URL(prefixLocalePath("/chat", locale), "https://entrestate.local")

  if (options?.sessionId) {
    url.searchParams.set("id", options.sessionId)
  }

  if (options?.prompt) {
    url.searchParams.set("q", options.prompt)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function buildCopilotShellHref({
  authenticated,
  locale,
  pathname,
  search,
  prompt,
  sessionId,
}: BuildCopilotShellHrefOptions) {
  const localizedBasePath = prefixLocalePath(
    stripLocalePrefix(pathname || getCopilotShellBasePath(authenticated)),
    locale,
  )
  const url = new URL(localizedBasePath, "https://entrestate.local")
  const searchParams = typeof search === "string"
    ? new URLSearchParams(search.replace(/^\?/, ""))
    : new URLSearchParams(search ?? undefined)

  searchParams.set("openChat", "true")

  if (sessionId) {
    searchParams.set("id", sessionId)
  } else {
    searchParams.delete("id")
  }

  if (prompt) {
    searchParams.set("prompt", prompt)
  } else {
    searchParams.delete("prompt")
  }

  searchParams.delete("q")
  url.search = searchParams.toString()

  return `${url.pathname}${url.search}${url.hash}`
}

export function buildCopilotEntryHref(
  options: BuildCopilotShellHrefOptions & {
    preferShell?: boolean
  },
) {
  if (options.authenticated || options.preferShell) {
    return buildCopilotShellHref(options)
  }

  return buildLocalizedChatHref(options.locale, {
    prompt: options.prompt,
    sessionId: options.sessionId,
  })
}
