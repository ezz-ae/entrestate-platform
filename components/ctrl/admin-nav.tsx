'use client'

/**
 * THE ADMIN'S SIDEBAR — every vendor desk under one roof.
 *
 * The owner: "put it all in one complete admin — it is not consistent with
 * itself: partners here, /ctrl there, keys somewhere else. Coupons are part
 * of Marketing, the wallets are Finance, both inside one integrated panel,
 * and every admin page that exists joins it." So the sections below ARE the
 * map of the vendor's desks; a desk that is not listed here does not exist
 * as far as the person running the company is concerned.
 *
 * `ADMIN_SECTIONS` is exported so scripts/admin-panel-test.ts can prove
 * every link resolves to a route in app/ (or a named external screen) and
 * that no admin page is left outside the roof.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface AdminLink { href: string; label: string; /** Lives outside /ctrl — opened in the workspace shell. */ external?: boolean }
export interface AdminSection { title: string; links: AdminLink[] }

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { title: 'Company', links: [
    { href: '/ctrl', label: 'Overview' },
    { href: '/ctrl/workspaces', label: 'Workspaces' },
  ] },
  { title: 'Marketing', links: [
    { href: '/ctrl/coupons', label: 'Coupons & vouchers' },
  ] },
  { title: 'Finance', links: [
    { href: '/ctrl/finance', label: 'Credit & requests' },
    { href: '/freehold-intelligence/finance/wallets', label: 'Ads Coin bank', external: true },
  ] },
  { title: 'Partners', links: [
    { href: '/ctrl/partners', label: 'Lead marketplace' },
    { href: '/ctrl/projects', label: 'Projects catalog' },
  ] },
  { title: 'Access', links: [
    { href: '/wl-admin', label: 'Access keys', external: true },
  ] },
] as const

const isActive = (pathname: string, href: string) =>
  href === '/ctrl' ? pathname === '/ctrl' : pathname === href || pathname.startsWith(`${href}/`)

export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname() ?? ''
  return (
    <aside className="ctrl-side" aria-label="Admin">
      <Link href="/ctrl" className="brand">
        <span className="dot" aria-hidden />
        <b>entrestate</b>
        <small>admin</small>
      </Link>
      {ADMIN_SECTIONS.map((s) => (
        <div key={s.title}>
          <div className="section">{s.title}</div>
          {s.links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav${isActive(pathname, l.href) ? ' active' : ''}`} aria-current={isActive(pathname, l.href) ? 'page' : undefined}>
              <span>{l.label}</span>
              {l.external ? <span className="ext" aria-label="opens in the workspace">↗</span> : null}
            </Link>
          ))}
        </div>
      ))}
      <div className="who">
        <b>Signed in</b>
        {email ?? 'staff'}
      </div>
    </aside>
  )
}
