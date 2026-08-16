'use client'

/**
 * The ads hub's primary action, pointed at the launcher the plan actually sells.
 *
 * Company plan → the four-step wizard, where every decision is a decision worth
 * making on someone else's budget. Realtor plan → the lite launcher, because
 * Meta for Realtors is sold as "pick a project, set a budget, go" and sending
 * that customer into a four-step wizard is the product not being the product.
 *
 * A client island of its own, not a named export on either page: the hub is an
 * async server component, and hanging this off the launcher's module would pull
 * that whole module into the hub's client bundle to read one field.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useBrand } from '@/components/whitelabel/brand-provider'

export function LaunchCtaLink({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { plan } = useBrand()
  const href =
    plan === 'realtor'
      ? '/freehold-intelligence/lead-machine/campaigns/quick'
      : '/freehold-intelligence/lead-machine/campaigns/new'
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
