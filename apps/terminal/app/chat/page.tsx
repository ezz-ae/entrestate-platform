import { CopilotProvider } from "@/components/copilot-provider"
import { Navbar } from "@/components/navbar"
import { ChatInterface } from "@/components/ChatInterface"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getSessionUser } from "@/lib/auth/server"
import { loadChatSession } from "@/lib/copilot/persistence"
import { getCopilotDailyLimit, getCopilotDailyUsage } from "@/lib/copilot-usage"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { getTranslations } from "next-intl/server"
import type { GoldenPathId } from "@/components/ChatInterface"
import { getGoldenPathPrompt } from "@/lib/copilot/mobile-prompts"
import { buildCopilotShellHref } from "@/lib/copilot/navigation"
import { getRequestRuntimeShell } from "@/lib/runtime-shell"

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const runtimeShell = await getRequestRuntimeShell()
  const t = await getTranslations({ locale, namespace: "chatPage" })
  // Check for mobile user agent to handle "no chat page on mobile" requirement
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent)
  const params = (await searchParams) ?? {}
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id
  const goldenPathParam = Array.isArray(params.goldenPath) ? params.goldenPath[0] : params.goldenPath
  const promptParam = Array.isArray(params.prompt) ? params.prompt[0] : params.prompt
  const qParam = Array.isArray(params.q) ? params.q[0] : params.q
  const mobilePrompt = promptParam ?? qParam ?? getGoldenPathPrompt(goldenPathParam)
  const sessionUser = await getSessionUser()
  const restoredSession = sessionId && sessionUser?.id
    ? await loadChatSession(sessionId)
    : null
  const authorizedSession = restoredSession?.userId === sessionUser?.id
    ? restoredSession
    : null
  const initialMessages = authorizedSession?.messages
  const initialGoldenPath = goldenPathParam === "underwrite_development_site"
    || goldenPathParam === "compare_area_yields"
    || goldenPathParam === "draft_spa_contract"
    ? goldenPathParam as GoldenPathId
    : undefined

  if (isMobile || runtimeShell === "mobile") {
    redirect(
      buildCopilotShellHref({
        authenticated: Boolean(sessionUser),
        locale,
        pathname: sessionUser ? "/me" : "/",
        prompt: mobilePrompt,
        sessionId,
      }),
    )
  }

  const entitlement = await getCurrentEntitlement()
  const billingParam = Array.isArray(params.billing) ? params.billing[0] : params.billing
  const usage = entitlement.accountKey
    ? await getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
    : {
        accountKey: "",
        date: new Date().toISOString().slice(0, 10),
        used: 0,
        limit: getCopilotDailyLimit(entitlement.tier),
        remaining: getCopilotDailyLimit(entitlement.tier),
        blocked: false,
        resetAt: null,
        cooldownUntil: null,
        cooldownSecondsRemaining: null,
      }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1600px] px-6 pb-14 pt-28 md:pt-32">
        {billingParam === "success" ? (
          <p className="mb-4 text-sm text-emerald-600">{t("subscriptionActivated")}</p>
        ) : null}
        <CopilotProvider
          initialId={authorizedSession?.id}
          initialMessages={initialMessages}
        >
          <ChatInterface
            initialGoldenPath={initialGoldenPath}
            initialLimit={usage.limit}
            initialRemaining={usage.remaining}
            initialBlocked={usage.blocked}
            initialCooldownSecondsRemaining={usage.cooldownSecondsRemaining}
          />
        </CopilotProvider>
      </div>
    </main>
  )
}
