'use client'

/**
 * THE DEPARTMENT SWITCHER — the header's one drop-down.
 *
 * Meta's Ads Manager puts the ad account in the header and the account's own
 * screens in the rail; the owner asked for the same shape with the four
 * departments in the header's place. The button names where you are (or Home);
 * the menu lists the departments this person may enter, each with the one
 * line a newcomer needs, and lands on the department's first door.
 *
 * It decides nothing about roles or plans — lib/freehold/departments.ts
 * already filtered the list through the guards' own functions.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Home } from 'lucide-react'
import { useSession } from '@/lib/freehold/use-session'
import { useBrand } from '@/components/whitelabel/brand-provider'
import { useT } from '@/lib/i18n/provider'
import { departmentForPath, departmentHome, visibleDepartments } from '@/lib/freehold/departments'

const HOME_HREF = '/freehold-intelligence'

export function DepartmentSwitcher() {
  const pathname = usePathname()
  const { user } = useSession()
  const { plan } = useBrand()
  const t = useT()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const departments = visibleDepartments(user?.role, plan)
  const currentId = departmentForPath(pathname)
  const current = departments.find((d) => d.id === currentId) ?? null

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  // A realtor's or an account's home is not the hub, and the guard would
  // bounce them; the switcher only offers departments then, never Home.
  const offerHome = plan !== 'realtor' && user?.role !== 'broker'
  const CurrentIcon = current?.Icon ?? Home

  return (
    <div ref={rootRef} className="relative flex h-full shrink-0 items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('dept.switch')}
        data-coach="dept-switcher"
        className="flex h-full items-center gap-2 border-e border-white/[0.07] px-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] sm:px-4"
      >
        <CurrentIcon className="h-4 w-4 text-gold" />
        <span className="hidden max-w-[16rem] truncate sm:inline">{current ? t(`dept.${current.id}`) : t('nav.home')}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('dept.departments')}
          className="absolute start-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/[0.12] bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
        >
          <div className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">{t('dept.departments')}</div>
          {offerHome && (
            <Link
              role="menuitem"
              href={HOME_HREF}
              onClick={() => setOpen(false)}
              aria-current={current === null && pathname === HOME_HREF ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06] ${current === null ? 'text-white' : 'text-slate-300'}`}
            >
              <Home className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-medium">{t('nav.home')}</span>
            </Link>
          )}
          {departments.map((d) => {
            const active = d.id === currentId
            return (
              <Link
                key={d.id}
                role="menuitem"
                href={departmentHome(d.id, user?.role, plan)}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                data-coach={`dept-${d.id}`}
                className={`flex items-start gap-3 border-t border-white/[0.05] px-4 py-3 transition-colors hover:bg-white/[0.06] ${active ? 'bg-white/[0.04]' : ''}`}
              >
                <d.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-gold' : 'text-slate-400'}`} />
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${active ? 'text-white' : 'text-slate-200'}`}>{t(`dept.${d.id}`)}</span>
                  <span className="block text-xs leading-snug text-slate-500">{t(`dept.${d.id}.blurb`)}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
