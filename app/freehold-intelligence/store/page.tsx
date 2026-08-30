'use client'

/**
 * THE APP STORE — the storefront the catalogue never had.
 *
 * lib/freehold/app-store.ts has described nine products, what each one turns
 * on, which plan may buy it and which workspace it opens, guarded by
 * scripts/app-store-test.ts — and nothing imported it. A catalogue with no
 * storefront is a spreadsheet: the rules were enforced, and no customer could
 * read a word of it. This page is the one reader, which is also what makes the
 * guard suite protect something.
 *
 * Three things it deliberately does NOT do:
 *
 *   · It does not sell. There is no entitlement record, no charge and no
 *     checkout anywhere in this system yet, so a Buy button would be a promise
 *     the product cannot keep. The page says what it is and asks for a
 *     conversation — the same reason lib/tenancy/trial.ts refuses to threaten a
 *     cut-off it cannot perform.
 *   · It does not claim results. Capabilities are what a product DOES
 *     (CAPABILITY_LABELS), never what it achieves. Every number this platform
 *     shows is evidence-gated (lib/freehold/min-evidence.ts) and a catalogue is
 *     the last place to start inventing them.
 *   · It does not hide what is unbuilt. A `planned` product is shown, in its
 *     own group, saying the workspace does not exist yet. Selling a door that
 *     does not open is the worst thing a store can do — rule 2 of the
 *     catalogue — so the honest version is visible rather than absent.
 *
 * What it owns instead: it is the only place a customer can see the whole
 * product surface at once, and the only place "already yours / available / not
 * built" is answered in one screen.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { Check, ArrowUpRight, Hammer } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { useSession } from '@/lib/freehold/use-session'
import { useBrand } from '@/components/whitelabel/brand-provider'
import { APPS, visibleApps, type TenantPlan } from '@/lib/freehold/apps'
import {
  productsForPlan,
  capabilityLabel,
  getProduct,
  type StoreProduct,
} from '@/lib/freehold/app-store'

function appFor(appId: string | null) {
  return appId ? APPS.find((a) => a.id === appId) ?? null : null
}

function ProductCard({
  product,
  owned,
  t,
}: {
  product: StoreProduct
  owned: boolean
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  const app = appFor(product.appId)
  const full = product.liteOf ? getProduct(product.liteOf) : undefined
  const planned = product.status === 'planned'

  return (
    <div
      className={`flex flex-col border p-5 transition ${
        owned
          ? 'border-[#D4AF37]/25 bg-[#D4AF37]/[0.03]'
          : planned
            ? 'border-white/10 bg-white/[0.01]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[0.9375rem] font-semibold text-white">{product.name}</h3>
        {owned ? (
          <Check className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
        ) : planned ? (
          <Hammer className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        ) : null}
      </div>

      {full ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {t('store.liteOf', { name: full.name })}
        </p>
      ) : null}

      <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-400">{product.tagline}</p>

      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {t('store.turnsOn')}
        </div>
        <ul className="mt-2 space-y-1.5">
          {product.capabilities.map((c) => (
            <li key={c} className="flex gap-2 text-[0.8125rem] leading-snug text-slate-300">
              <span aria-hidden className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-slate-600" />
              {capabilityLabel(c)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-4">
        {planned ? (
          <p className="text-[0.75rem] text-slate-500">{t('store.plannedNote')}</p>
        ) : app && owned ? (
          <Link
            href={app.href}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[#D4AF37] transition hover:text-[#E5C158]"
          >
            {t('store.open')} · {app.label}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : app ? (
          <p className="text-[0.75rem] text-slate-500">
            {t('store.opens')}: {app.label}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Group({
  title,
  empty,
  products,
  owned,
  t,
}: {
  title: string
  empty: string
  products: StoreProduct[]
  owned: boolean
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h2>
      {products.length === 0 ? (
        <p className="text-[0.8125rem] text-slate-600">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} owned={owned} t={t} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function StorePage() {
  const t = useT()
  const { user } = useSession()
  const { plan } = useBrand()

  const groups = useMemo(() => {
    const effectivePlan: TenantPlan = plan ?? 'company'
    const forPlan = productsForPlan(effectivePlan)
    // "Already yours" is answered by the navigation, which is the only thing in
    // this system that currently knows what an account can open. When real
    // entitlement records exist they replace this line and nothing else on the
    // page has to change — the card reads a boolean, not a plan.
    const openable = new Set(visibleApps(user?.role, effectivePlan).map((a) => a.id))

    return {
      inWorkspace: forPlan.filter((p) => p.status === 'live' && p.appId && openable.has(p.appId)),
      available: forPlan.filter((p) => p.status === 'live' && !(p.appId && openable.has(p.appId))),
      planned: forPlan.filter((p) => p.status === 'planned'),
      total: forPlan.length,
    }
  }, [plan, user?.role])

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-10">
      <header className="mb-8">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.01em] text-white">
          {t('store.title')}
        </h1>
        <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-slate-400">
          {t('store.sub')}
        </p>
        <p className="mt-4 max-w-[62ch] border-l-2 border-white/10 pl-4 text-[0.8125rem] leading-relaxed text-slate-500">
          {t('store.note')}
        </p>
      </header>

      <Group
        title={t('store.group.inWorkspace')}
        empty={t('store.empty.inWorkspace')}
        products={groups.inWorkspace}
        owned
        t={t}
      />
      <Group
        title={t('store.group.available')}
        empty={t('store.empty.available')}
        products={groups.available}
        owned={false}
        t={t}
      />
      <Group
        title={t('store.group.planned')}
        empty={t('store.empty.planned')}
        products={groups.planned}
        owned={false}
        t={t}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
        {t('store.count', { n: groups.total })}
      </p>
    </div>
  )
}
