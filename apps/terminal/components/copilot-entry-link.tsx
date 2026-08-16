"use client"

import * as React from "react"
import Link, { type LinkProps } from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { authClient } from "@/lib/auth/client"
import { type AppLocale } from "@/i18n/locale"
import { buildCopilotEntryHref } from "@/lib/copilot/navigation"
import { useRuntimeShell } from "@/hooks/use-runtime-shell"

type AnchorProps = Omit<React.ComponentPropsWithoutRef<"a">, keyof LinkProps>

type CopilotEntryLinkProps = Omit<LinkProps, "href"> &
  AnchorProps & {
    prompt?: string | null
    sessionId?: string | null
  }

export const CopilotEntryLink = React.forwardRef<HTMLAnchorElement, CopilotEntryLinkProps>(
  function CopilotEntryLink({ prompt, sessionId, onClick, scroll, children, ...props }, ref) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const locale = useLocale() as AppLocale
    const runtimeShell = useRuntimeShell()
    const { data: session } = authClient.useSession()
    const authenticated = Boolean(session?.user)
    const search = searchParams?.toString() ?? ""

    const href = buildCopilotEntryHref({
      authenticated,
      locale,
      pathname,
      search,
      prompt,
      sessionId,
      preferShell: runtimeShell === "mobile",
    })

    return (
      <Link
        ref={ref}
        href={href}
        scroll={scroll}
        {...props}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return

          const isMobileViewport =
            typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches

          if (authenticated || runtimeShell === "mobile" || isMobileViewport) {
            const shellHref = buildCopilotEntryHref({
              authenticated,
              locale,
              pathname,
              search,
              prompt,
              sessionId,
              preferShell: true,
            })

            if (shellHref !== href) {
              event.preventDefault()
              router.push(shellHref, { scroll })
            }
          }
        }}
      >
        {children}
      </Link>
    )
  },
)
