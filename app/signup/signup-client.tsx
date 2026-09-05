'use client'

/**
 * Self-serve trial signup — the public door into the SaaS.
 *
 * One screen: brand (company, subdomain with live availability, product word,
 * accent, logo) with a live brand preview. Submitting provisions the tenant
 * and redirects straight into {sub}.TENANT_BASE_DOMAIN via the claim endpoint
 * — the broker lands inside THEIR branded instance, already signed in. Only
 * meaningful when NEXT_PUBLIC_TENANT_BASE_DOMAIN is set.
 *
 * THERE IS NO NAME, EMAIL OR PASSWORD ON THIS FORM ANY MORE. The owner is the
 * Entrestate account already signed in — ./page.tsx reads it server-side and
 * passes it down as `signedInAs`, and a stranger never reaches this component
 * at all (they are sent to the Terminal's sign-up first). The old block asked
 * for a second password and wrote it into the tenant schema as a second
 * identity; that path was removed, not hidden. See lib/tenancy/onboard.ts.
 *
 * ?plan=realtor flips the same screen into the Meta for Realtors door: a
 * one-person desk on OUR off-plan inventory. Same rails, different story —
 * the product word disappears (their product IS Meta for Realtors) and the
 * submit carries plan: 'realtor' so provisioning marks the tenant row.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { I18nProvider, useT } from '@/lib/i18n/provider'
import { BusinessHeader, BusinessFooter } from '@/components/business/shell'
import { WELCOME_CREDIT_AED } from '@/lib/business/full-system'
import { SAAS_TENANCY, TENANT_BASE_DOMAIN } from '@/lib/tenancy/config'
import { SUBDOMAIN_RE, RESERVED_SUBDOMAINS } from '@/lib/tenancy/reserved'

const MAX_LOGO_DIM = 256 // px — downscale before upload so the row stays small
const DEFAULT_ACCENT = 'var(--brand)'

/** Downscale an uploaded image to a small PNG data URL via canvas. */
function downscaleToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, MAX_LOGO_DIM / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas unavailable.'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

type SubState = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid'

export type SignedInAs = { name: string | null; email: string }

export default function SignupClient({ signedInAs }: { signedInAs: SignedInAs }) {
  return (
    <I18nProvider>
      {/* useSearchParams inside — Next wants a Suspense boundary above it. */}
      <Suspense fallback={null}>
        <SignupForm signedInAs={signedInAs} />
      </Suspense>
    </I18nProvider>
  )
}

function SignupForm({ signedInAs }: { signedInAs: SignedInAs }) {
  const t = useT()
  // The realtor door is the same form told a different story — see file header.
  const isRealtor = useSearchParams().get('plan') === 'realtor'
  const [company, setCompany] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [subState, setSubState] = useState<SubState>('idle')
  const [product, setProduct] = useState('Lead Machine')
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [logo, setLogo] = useState('')
  const [error, setError] = useState('')
  const [createdUrl, setCreatedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const checkSeq = useRef(0)

  // Live availability, debounced. Local grammar/reserved checks answer
  // instantly; only plausible names hit the API.
  useEffect(() => {
    const sub = subdomain.trim().toLowerCase()
    if (!sub) { setSubState('idle'); return }
    if (!SUBDOMAIN_RE.test(sub)) { setSubState('invalid'); return }
    if (RESERVED_SUBDOMAINS.has(sub)) { setSubState('reserved'); return }
    setSubState('checking')
    const seq = ++checkSeq.current
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wl/subdomain-check?sub=${encodeURIComponent(sub)}`)
        const data = (await res.json().catch(() => ({}))) as { available?: boolean; reason?: string | null }
        if (seq !== checkSeq.current) return // a newer keystroke superseded this check
        if (data.available) setSubState('available')
        else if (data.reason === 'reserved') setSubState('reserved')
        else if (data.reason === 'invalid_subdomain') setSubState('invalid')
        else setSubState('taken')
      } catch {
        if (seq === checkSeq.current) setSubState('idle') // advisory only — createTenant re-checks
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [subdomain])

  if (!SAAS_TENANCY) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-app p-6 text-center text-ink/70">
        {t('wl.signup.notEnabled')}
      </div>
    )
  }

  const onPickLogo = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      setLogo(await downscaleToDataUrl(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wl.signup.errGeneric'))
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!company.trim()) return setError(t(isRealtor ? 'wl.signup.errDesk' : 'wl.signup.errCompany'))
    if (!subdomain.trim() || subState === 'invalid' || subState === 'reserved' || subState === 'taken') {
      return setError(t('wl.signup.errSubdomain'))
    }
    setLoading(true)
    try {
      const res = await fetch('/api/wl/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          subdomain: subdomain.trim().toLowerCase(),
          // A realtor's product IS Meta for Realtors — the field is hidden.
          product: isRealtor ? 'Meta for Realtors' : product.trim(),
          plan: isRealtor ? 'realtor' : 'company',
          accent,
          logo,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; redirect?: string; error?: string }
      if (!res.ok || !data.ok || !data.redirect) {
        setLoading(false)
        const key = {
          taken: 'wl.signup.taken',
          reserved: 'wl.signup.reserved',
          invalid_subdomain: 'wl.signup.invalid',
          rate_limited: 'wl.signup.errRate',
          // The session expired or was never verified between page load and
          // submit. Both point the person back to the Terminal.
          signed_out: 'wl.signup.errSignedOut',
          email_unverified: 'wl.signup.errUnverified',
        }[data.error ?? ''] ?? 'wl.signup.errGeneric'
        return setError(t(key))
      }
      // Full navigation onto THEIR subdomain — the claim endpoint signs them
      // in. The address is shown for a beat first: it is the one thing the
      // broker must not lose, and if the wildcard DNS is still propagating the
      // hop can fail while the address stays right here on screen.
      const redirect = data.redirect
      setCreatedUrl(redirect)
      setTimeout(() => { window.location.href = redirect }, 1600)
    } catch {
      setLoading(false)
      setError(t('wl.signup.errGeneric'))
    }
  }

  const previewName = company.trim() || t(isRealtor ? 'wl.signup.deskNamePh' : 'wl.signup.companyPh')
  const previewProduct = isRealtor ? 'Meta for Realtors' : product.trim() || t('wl.signup.productPh')
  const subHintByState: Record<SubState, { text: string; tone: string }> = {
    idle: { text: t('wl.signup.subdomainHint'), tone: 'text-ink/40' },
    checking: { text: t('wl.signup.checking'), tone: 'text-ink/40' },
    available: { text: t('wl.signup.available'), tone: 'text-emerald-400' },
    taken: { text: t('wl.signup.taken'), tone: 'text-red-400' },
    reserved: { text: t('wl.signup.reserved'), tone: 'text-red-400' },
    invalid: { text: t('wl.signup.invalid'), tone: 'text-red-400' },
  }
  const subHint = subHintByState[subState]

  return (
    <div className="theme-terminal min-h-screen bg-app font-sans text-ink antialiased [color-scheme:dark]" style={{ ['--wl-accent' as string]: accent }}>
      <BusinessHeader />
      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-10 px-6 pb-24 pt-14 md:grid-cols-2 lg:pt-20">
        {/* Created: show the address before the automatic hop onto it. */}
        {createdUrl ? (
          <div className="order-2 md:order-1">
            <div className="rounded-2xl border border-brand/30 bg-[#0F131A] p-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#34D399]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                {t('wl.signup.createdEyebrow')}
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t('wl.signup.createdTitle')}</h1>
              <div dir="ltr" className="mt-5 truncate rounded-lg border border-line bg-surface-2 px-4 py-3 font-mono text-sm text-ink">
                https://{subdomain.trim()}.{TENANT_BASE_DOMAIN}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{t('wl.signup.createdNote')}</p>
              <a
                href={createdUrl}
                className="mt-6 inline-block rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-ink"
              >
                {t('wl.signup.createdOpen')}
              </a>
            </div>
          </div>
        ) : (
        <form onSubmit={submit} className="order-2 md:order-1">
          <div className="mb-8">
            <div className="mb-2 inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink/60">
              {t(isRealtor ? 'wl.signup.realtorEyebrow' : 'wl.signup.eyebrow')}
            </div>
            <h1 className="text-3xl font-bold">{t(isRealtor ? 'wl.signup.realtorTitle' : 'wl.signup.title')}</h1>
            <p className="mt-2 text-sm text-ink/60">{t(isRealtor ? 'wl.signup.realtorSubtitle' : 'wl.signup.subtitle')}</p>
          </div>

          <label className="mb-1 block text-xs font-medium text-ink/60">
            {t(isRealtor ? 'wl.signup.deskName' : 'wl.signup.company')}
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t(isRealtor ? 'wl.signup.deskNamePh' : 'wl.signup.companyPh')}
            maxLength={40}
            className="mb-4 w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:border-[var(--wl-accent)]"
          />

          <label className="mb-1 block text-xs font-medium text-ink/60">{t('wl.signup.subdomain')}</label>
          <div className="flex items-center gap-2">
            <input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
              placeholder={t('wl.signup.subdomainPh')}
              maxLength={40}
              dir="ltr"
              className="w-full rounded-lg border border-line bg-surface-2 px-4 py-3 font-mono text-sm outline-none focus:border-[var(--wl-accent)]"
            />
            <span dir="ltr" className="whitespace-nowrap font-mono text-xs text-ink/50">.{TENANT_BASE_DOMAIN}</span>
          </div>
          <p className={`mb-4 mt-1 text-xs ${subHint.tone}`}>{subHint.text}</p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            {/* Realtors don't name a product — theirs is Meta for Realtors. */}
            {isRealtor ? null : (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">{t('wl.signup.product')}</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder={t('wl.signup.productPh')}
                  maxLength={24}
                  className="w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:border-[var(--wl-accent)]"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">{t('wl.signup.accent')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
                />
                <span className="font-mono text-xs text-ink/50">{accent}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm hover:bg-surface-2"
            >
              {logo ? t('wl.signup.logoChange') : t('wl.signup.logoUpload')}
            </button>
            {logo ? (
              <button type="button" onClick={() => setLogo('')} className="text-xs text-ink/50 hover:text-ink/80">
                {t('wl.signup.logoRemove')}
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickLogo(e.target.files?.[0])}
            />
          </div>

          {/*
            Who owns this workspace. Read-only on purpose: the identity is the
            Entrestate account that is signed in, proved by Neon, and the only
            way to make it somebody else is to sign in as somebody else.
          */}
          <div className="mb-6 rounded-xl border border-line bg-surface-2 p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-ink/40">
              {t('wl.signup.ownerTitle')}
            </div>
            <p className="text-sm text-ink">{signedInAs.name || signedInAs.email}</p>
            {signedInAs.name ? <p className="mt-0.5 text-xs text-ink/50" dir="ltr">{signedInAs.email}</p> : null}
            <p className="mt-2 text-xs text-ink/40">{t('wl.signup.ownerHint')}</p>
          </div>

          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-ink transition disabled:opacity-60"
            style={{ background: 'var(--wl-accent)' }}
          >
            {loading ? t('wl.signup.submitting') : t('wl.signup.submit')}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            {isRealtor ? t('wl.signup.realtorNote') : t('wl.signup.trialNote', { credit: WELCOME_CREDIT_AED })}
          </p>
        </form>
        )}

        {/* Live preview */}
        <div className="order-1 md:order-2">
          <div className="rounded-2xl border border-line bg-surface-2 p-6">
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-ink/40">
              {t('wl.signup.previewTitle')}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-[#0F131A] px-4 py-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-6 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="h-3 w-3 rounded-full" style={{ background: 'var(--wl-accent)' }} />
              )}
              <span className="text-sm font-semibold">
                {previewName}
                <span className="ml-1" style={{ color: 'var(--wl-accent)' }}>
                  {previewProduct}
                </span>
              </span>
            </div>
            <div dir="ltr" className="mt-3 truncate rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-ink/50">
              https://{subdomain.trim() || t('wl.signup.subdomainPh')}.{TENANT_BASE_DOMAIN}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(['previewLeads', 'previewDeals', 'previewRevenue'] as const).map((k) => (
                <div key={k} className="rounded-xl border border-line bg-surface-2 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-ink/40">{t(`wl.signup.${k}`)}</div>
                  <div className="mt-1 text-lg font-bold" style={{ color: 'var(--wl-accent)' }}>
                    ••
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink/40">{t('wl.signup.previewNote')}</p>
          </div>
        </div>
      </main>
      <BusinessFooter />
    </div>
  )
}
