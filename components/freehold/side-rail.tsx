'use client'

/**
 * THE SIDE RAIL — the department's own screens, Ads-Manager style.
 *
 * A strip of icons on the start side; it opens to full labels on hover, on
 * keyboard focus, or when pinned. What it lists is decided in
 * lib/freehold/departments.ts:
 *
 *   · inside a department  → that department's rail (the Terminal door first
 *                            in Market), then the company doors;
 *   · on the home / a company screen → the four departments as doors, then
 *                            the company doors.
 *
 * It overlays the page when it opens rather than pushing it, so a glance at
 * a label never reflows a table. Pinned, it takes its width for real.
 *
 * It draws only doors the guards would open — the department module filters
 * the rail through the same functions the route guards use — and it decides
 * nothing itself. Phones do not get it; the bottom tab bar is their rail.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, LifeBuoy } from 'lucide-react'
import { useSession } from '@/lib/freehold/use-session'
import { useBrand } from '@/components/whitelabel/brand-provider'
import { useT } from '@/lib/i18n/provider'
import {
  ALL_TOOLS_EVENT, DEPARTMENTS, TERMINAL_DOOR, companyRailFor, departmentForPath, departmentHome, railFor, visibleDepartments,
  type DepartmentId,
} from '@/lib/freehold/departments'

const PIN_KEY = 'fi.rail.pinned'

/** Coach anchors the tours already know, kept on the doors they meant. */
const DOOR_COACH: Record<DepartmentId, string> = {
  market: 'nav-analytics', inventory: 'nav-inventory', marketing: 'nav-ads', crm: 'nav-crm',
}

const APP_NAV_KEY: Record<string, string> = {
  management: 'nav.management', finance: 'nav.finance', fund: 'nav.fund', team: 'nav.team',
  integrations: 'nav.integrations', store: 'nav.store', settings: 'nav.settings',
}

/**
 * The pin is per browser, deliberately — "do I want the rail open on THIS
 * screen" is a fact about the desk, not the account. Read as an external
 * store so the server renders it closed and the browser opens it without a
 * flash of the wrong width or a set-state-in-effect.
 */
const pinListeners = new Set<() => void>()
function readPinned(): boolean {
  try { return window.localStorage.getItem(PIN_KEY) === '1' } catch { return false }
}
function writePinned(v: boolean) {
  try { window.localStorage.setItem(PIN_KEY, v ? '1' : '0') } catch { /* a convenience, never a requirement */ }
  pinListeners.forEach((l) => l())
}
function subscribePinned(cb: () => void) {
  pinListeners.add(cb)
  return () => { pinListeners.delete(cb) }
}

const isUnder = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/')

export function SideRail() {
  const pathname = usePathname()
  const { user } = useSession()
  const { plan } = useBrand()
  const t = useT()
  const role = user?.role

  const pinned = useSyncExternalStore(subscribePinned, readPinned, () => false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const expanded = pinned || hovered || focused

  const deptId = departmentForPath(pathname)
  const dept = DEPARTMENTS.find((d) => d.id === deptId) ?? null
  const rail = dept ? railFor(dept.id, role, plan) : []
  const departments = visibleDepartments(role, plan)
  const company = companyRailFor(role, plan)

  // One lit door: the longest href that prefixes the path, across both lists.
  const candidates = [...rail.map((x) => x.href), ...company.map((a) => a.href)]
  const lit = candidates.filter((h) => isUnder(pathname, h)).sort((a, b) => b.length - a.length)[0] ?? null

  const item = (
    key: string, href: string, Icon: React.ComponentType<{ className?: string }>, label: string,
    opts: { active?: boolean; coach?: string; external?: boolean } = {},
  ) => {
    const cls = [
      'group/item relative flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors',
      opts.active ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
    ].join(' ')
    const inner = (
      <>
        {opts.active && <span aria-hidden className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-gold" />}
        <Icon className={`h-[18px] w-[18px] shrink-0 ${opts.active ? 'text-gold' : ''}`} />
        <span className={`truncate ${expanded ? '' : 'sr-only'}`}>{label}</span>
      </>
    )
    return opts.external ? (
      <a key={key} href={href} target="_blank" rel="noopener" className={cls} title={expanded ? undefined : label} data-coach={opts.coach}>
        {inner}
      </a>
    ) : (
      <Link key={key} href={href} className={cls} title={expanded ? undefined : label} aria-current={opts.active ? 'page' : undefined} data-coach={opts.coach}>
        {inner}
      </Link>
    )
  }

  const heading = (text: string) => (
    <div className={`px-2.5 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-slate-500 ${expanded ? '' : 'sr-only'}`}>{text}</div>
  )

  return (
    <div className={`relative hidden shrink-0 md:block ${pinned ? 'w-64' : 'w-14'}`}>
      <nav
        aria-label={t('dept.rail')}
        data-coach="nav-spine"
        data-expanded={expanded}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false) }}
        className={[
          'absolute inset-y-0 start-0 z-30 flex flex-col border-e border-white/[0.07] bg-chrome backdrop-blur-xl transition-[width] duration-150',
          expanded ? 'w-64 shadow-[12px_0_40px_rgba(0,0,0,0.45)]' : 'w-14',
        ].join(' ')}
      >
        <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-1.5 py-2" style={{ scrollbarWidth: 'none' }}>
          {dept ? (
            <>
              {heading(t(`dept.${dept.id}`))}
              {dept.id === 'market' && item(TERMINAL_DOOR.id, TERMINAL_DOOR.href, TERMINAL_DOOR.Icon, t(TERMINAL_DOOR.labelKey), { external: true, coach: 'nav-terminal' })}
              {rail.map((tool) => item(tool.id, tool.href, tool.Icon, t(tool.labelKey), {
                active: tool.href === lit,
                coach: tool.id === 'agent.home' ? 'nav-agent' : `tool-${tool.id}`,
              }))}
            </>
          ) : (
            <>
              {heading(t('dept.departments'))}
              {departments.map((d) => item(d.id, departmentHome(d.id, role, plan), d.Icon, t(`dept.${d.id}`), { coach: DOOR_COACH[d.id] }))}
            </>
          )}

          {company.length > 0 && (
            <>
              <div aria-hidden className="mx-2 my-2 border-t border-white/[0.07]" />
              {heading(t('dept.company'))}
              {company.map((app) => {
                const key = APP_NAV_KEY[app.id]
                return item(app.id, app.href, app.Icon, key ? t(key) : app.label, {
                  active: app.href === lit, coach: `nav-${app.id}`,
                })
              })}
            </>
          )}
        </div>

        <div className="space-y-0.5 border-t border-white/[0.07] px-1.5 py-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(ALL_TOOLS_EVENT))}
            title={expanded ? undefined : `${t('nav.allTools')} (⌘K)`}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LayoutGrid className="h-[18px] w-[18px] shrink-0" />
            <span className={`truncate ${expanded ? '' : 'sr-only'}`}>{t('nav.allTools')}</span>
            {expanded && <kbd className="ms-auto rounded border border-white/[0.12] px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>}
          </button>
          {item('help', '/freehold-intelligence/help', LifeBuoy, t('common.help'), { active: lit === null && isUnder(pathname, '/freehold-intelligence/help') })}
          <button
            type="button"
            onClick={() => writePinned(!pinned)}
            aria-pressed={pinned}
            title={expanded ? undefined : t(pinned ? 'dept.unpin' : 'dept.pin')}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {pinned
              ? <PanelLeftClose className="h-[18px] w-[18px] shrink-0 rtl:-scale-x-100" />
              : <PanelLeftOpen className="h-[18px] w-[18px] shrink-0 rtl:-scale-x-100" />}
            <span className={`truncate ${expanded ? '' : 'sr-only'}`}>{t(pinned ? 'dept.unpin' : 'dept.pin')}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
