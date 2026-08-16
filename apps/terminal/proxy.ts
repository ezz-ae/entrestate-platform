import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { defaultLocale, isLocale, localeCookieName, prefixLocalePath, stripLocalePrefix } from "@/i18n/locale"
import { getMobileWebHostname, isPrimaryWebHost, resolveRuntimeShell } from "@/lib/runtime-host"

const AUTOMATION_BUILDER_PATHS = ["/apps/automation-builder", "/api/automation-builder"]
const KILL_SWITCH_PATHS = ["/api/time-table", "/api/scoring", "/api/profile", "/api/distribution"]
const LOCALE_SHORTCUT_REDIRECTS: Record<string, string> = {
  "/apis": "/docs/partners-apis",
}

function applyLocaleCookie(response: NextResponse, locale: string, secure: boolean) {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure,
    httpOnly: false,
  })
  return response
}

function isMobileUserAgent(userAgent: string | null) {
  return /mobile|android|iphone|ipad|phone/i.test(userAgent ?? "")
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
  const runtimeShell = resolveRuntimeShell(requestHost)
  const segments = pathname.split("/").filter(Boolean)
  const pathLocale = segments[0]
  const internalPathname = isLocale(pathLocale) ? stripLocalePrefix(pathname) : pathname
  const headerLocale = request.headers.get("x-entrestate-locale")
  const cookieLocale = request.cookies.get(localeCookieName)?.value
  const activeLocale = isLocale(pathLocale)
    ? pathLocale
    : isLocale(headerLocale)
      ? headerLocale
      : isLocale(cookieLocale)
        ? cookieLocale
        : defaultLocale
  const notFoundText = activeLocale === "ar" ? "غير موجود" : "Not Found"
  const unavailableText = activeLocale === "ar" ? "الخدمة غير متاحة" : "Service Unavailable"
  const isAutomationBuilderRoute = AUTOMATION_BUILDER_PATHS.some((path) => internalPathname.startsWith(path))
  const isKillSwitchRoute = KILL_SWITCH_PATHS.some((path) => internalPathname.startsWith(path))
  const secureCookie = request.nextUrl.protocol === "https:"
  const userAgent = request.headers.get("user-agent")

  if (
    request.method === "GET"
    && isPrimaryWebHost(requestHost)
    && isMobileUserAgent(userAgent)
    && !pathname.startsWith("/_next/")
    && !pathname.startsWith("/api/")
    && !/\.[a-z0-9]+$/i.test(pathname)
    && request.nextUrl.searchParams.get("desktop") !== "1"
  ) {
    const mobileHostname = getMobileWebHostname(requestHost)
    if (mobileHostname) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.hostname = mobileHostname
      return applyLocaleCookie(NextResponse.redirect(redirectUrl, 307), activeLocale, secureCookie)
    }
  }

  if (isAutomationBuilderRoute) {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER === "true"
    if (process.env.NODE_ENV === "production" && !enabled) {
      return new NextResponse(notFoundText, { status: 404 })
    }
  }

  if (isKillSwitchRoute && process.env.ENTRESTATE_KILL_SWITCH === "true") {
    return new NextResponse(unavailableText, { status: 503 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-entrestate-locale", activeLocale)
  requestHeaders.set("x-entrestate-shell", runtimeShell)

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname.replace(/\/+$/, "")
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 308), activeLocale, secureCookie)
  }

  if (internalPathname === "/api" || internalPathname.startsWith("/api/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (isLocale(pathLocale) && LOCALE_SHORTCUT_REDIRECTS[internalPathname]) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = prefixLocalePath(LOCALE_SHORTCUT_REDIRECTS[internalPathname], activeLocale)
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 308), activeLocale, secureCookie)
  }

  if (/^\/(en|ar)\/plans\/?$/.test(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname.replace("/plans", "/pricing")
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 301), activeLocale, secureCookie)
  }

  if (isLocale(pathLocale)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = internalPathname

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })

    return applyLocaleCookie(response, activeLocale, secureCookie)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  return applyLocaleCookie(response, activeLocale, secureCookie)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
