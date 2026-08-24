import { notFound, redirect } from 'next/navigation'
import { tenantByPortalSlug } from '@/lib/ctrl/tenants'
import { balanceFils, billLead } from '@/lib/ctrl/wallet'
import {
  availableLeads, purchasedLeads, projectCards, connectedAssets, canBuy, subscribe,
} from '@/lib/ctrl/marketplace'
import { ingestTenantLeads } from '@/lib/ctrl/sync'
import { filsToAed } from '@/lib/ctrl/pricing'

export const dynamic = 'force-dynamic'

/**
 * THE STOREFRONT — lead by lead, in the client's own language.
 *
 * The shelf shows MASKED previews (lib/ctrl/marketplace.ts owns that wall); the
 * buy button is the one door money moves through in marketplace mode, and it
 * reuses the same transactional billLead the auto path uses — one debit
 * discipline, two doors. A bought lead unlocks here immediately AND lands in
 * the client's own CRM on their system's next sync, because "delivered" is one
 * state, not two.
 *
 * Above the shelf: the client's own connected pages (where our ads run under
 * THEIR name) and the PROJECT CATALOG — they choose a project, set their own
 * lead ceiling, and only then does that project's shelf open to them. The limit
 * gate (canBuy) runs BEFORE the debit, every purchase.
 */
async function buyLead(formData: FormData) {
  'use server'
  const slug = String(formData.get('slug') ?? '')
  const leadId = String(formData.get('leadId') ?? '')
  const tenant = await tenantByPortalSlug(slug)
  if (!tenant || !leadId) redirect(`/portal/${slug}`)
  if (!(await canBuy(tenant.id, leadId))) redirect(`/portal/${slug}?limit=1`)
  const ok = await billLead(tenant.id, leadId)
  redirect(`/portal/${slug}${ok ? '?bought=1' : '?short=1'}`)
}

async function chooseProject(formData: FormData) {
  'use server'
  const slug = String(formData.get('slug') ?? '')
  const projectId = String(formData.get('projectId') ?? '')
  const limit = Number(formData.get('leadLimit'))
  const tenant = await tenantByPortalSlug(slug)
  if (tenant && projectId && Number.isFinite(limit) && limit > 0) {
    await subscribe(tenant.id, projectId, limit)
  }
  redirect(`/portal/${slug}`)
}

export default async function PortalPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ bought?: string; short?: string; limit?: string }>
}) {
  const { slug } = await params
  const flags = await searchParams
  const tenant = await tenantByPortalSlug(slug)
  if (!tenant) notFound()

  // Opening the shop restocks the shelf.
  await ingestTenantLeads(tenant.id).catch(() => undefined)

  const [balance, shelf, owned, projects, assets] = await Promise.all([
    balanceFils(tenant.id),
    availableLeads(tenant.id),
    purchasedLeads(tenant.id),
    projectCards(tenant.id),
    connectedAssets(tenant.id),
  ])

  const projectName = new Map(projects.map((p) => [p.id, p.name]))
  const atLimit = new Set(
    projects.filter((p) => p.leadLimit !== null && p.taken >= p.leadLimit).map((p) => p.id),
  )
  const CONTACT = /(phone|mobile|whatsapp|tel|mail|name)/

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 860 }}>
      <h1>سوق العملاء المحتملين</h1>
      <p className="dim">{tenant.name} — الرصيد: <b className="amount">AED {filsToAed(balance)}</b></p>

      {flags.bought && <p style={{ color: 'var(--good)' }}>تم الشراء — بيانات العميل كاملة تحت في «مشترياتك»، وهينزل في نظامك تلقائياً خلال دقائق.</p>}
      {flags.short && <p style={{ color: 'var(--bad)' }}>الرصيد لا يغطي هذا العميل — اشحن ثم أعد المحاولة. لم يُخصم شيء.</p>}
      {flags.limit && <p style={{ color: 'var(--bad)' }}>وصلت للحد الذي اخترته لهذا المشروع — ارفع الحد من كارت المشروع ثم أعد المحاولة. لم يُخصم شيء.</p>}

      {assets.length > 0 && (
        <>
          <h2>صفحاتك المربوطة</h2>
          <div className="card">
            <p className="dim" style={{ marginTop: 0 }}>الإعلانات تنشر باسم صفحاتك أنت — التفاعل والمتابعون يرجعون لك.</p>
            <table>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={i}>
                    <th style={{ width: '30%' }}>{a.kind === 'instagram' ? 'إنستجرام' : 'صفحة فيسبوك'}</th>
                    <td>{a.name || a.refId}</td>
                    <td><span className={`pill ${a.access === 'read_write' ? 'good' : ''}`}>
                      {a.access === 'read_write' ? 'قراءة + نشر' : a.access === 'read' ? 'قراءة فقط' : 'بدون صلاحية'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {projects.length > 0 && (
        <>
          <h2>المشاريع</h2>
          <p className="dim">اختر مشروعاً وحدّد أقصى عدد عملاء تريده منه — عملاء المشروع يظهرون في السوق بعد اختياره، ولن تتجاوز الحد الذي وضعته أبداً.</p>
          {projects.map((p) => (
            <div className="card" key={p.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <b>{p.name}</b>
                {p.priceFilsOverride !== null && (
                  <span className="pill good amount">AED {filsToAed(p.priceFilsOverride)} / عميل</span>
                )}
                <span className="dim">{p.availableCount} متاح الآن</span>
              </div>
              {p.description && <p className="dim" style={{ marginBottom: 8 }}>{p.description}</p>}
              {p.leadLimit !== null ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`pill ${p.taken >= p.leadLimit ? 'bad' : 'good'} amount`}>
                    {p.taken} / {p.leadLimit} من حدك
                  </span>
                  <form action={chooseProject} className="row" style={{ margin: 0 }}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="projectId" value={p.id} />
                    <input name="leadLimit" type="number" min={1} defaultValue={p.leadLimit}
                      style={{ width: 90 }} aria-label="حد العملاء" />
                    <button type="submit" className="ghost">عدّل الحد</button>
                  </form>
                </div>
              ) : (
                <form action={chooseProject} className="row" style={{ margin: 0 }}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="projectId" value={p.id} />
                  <input name="leadLimit" type="number" min={1} placeholder="أقصى عدد عملاء"
                    style={{ width: 140 }} />
                  <button type="submit">اختر هذا المشروع</button>
                </form>
              )}
            </div>
          ))}
        </>
      )}

      <h2>متاح الآن — تدفع فقط لما تشتري</h2>
      {shelf.length === 0 ? (
        <div className="card"><p className="dim">لا يوجد عملاء متاحون حالياً — الرف يمتلئ تلقائياً مع وصول عملاء جدد من الحملات.</p></div>
      ) : shelf.map((l) => {
        const blocked = l.projectId !== null && atLimit.has(l.projectId)
        return (
          <div className="card" key={l.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <b>{l.displayName || 'عميل محتمل'}</b>
              {l.projectId && <span className="pill">{projectName.get(l.projectId) ?? 'مشروع'}</span>}
              <span className="dim">{l.createdTime.slice(0, 16)}</span>
              <span className="pill good amount">AED {filsToAed(l.priceFils)}</span>
            </div>
            <table style={{ marginTop: 8 }}>
              <tbody>
                {l.answers.map((a, i) => (
                  <tr key={i}><th style={{ width: '38%' }}>{a.question}</th><td>{a.answer}</td></tr>
                ))}
                {l.answers.length === 0 && <tr><td className="dim">استمارة بدون أسئلة إضافية</td></tr>}
              </tbody>
            </table>
            {blocked ? (
              <p className="dim" style={{ marginBottom: 0 }}>وصلت لحدك في هذا المشروع — ارفع الحد من كارت المشروع فوق لتشتري.</p>
            ) : (
              <form action={buyLead} className="row">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="leadId" value={l.id} />
                <button type="submit">اشترِ هذا العميل — AED {filsToAed(l.priceFils)}</button>
              </form>
            )}
          </div>
        )
      })}

      <h2>مشترياتك — {owned.length}</h2>
      {owned.length === 0 ? (
        <div className="card"><p className="dim">لم تشترِ أي عميل بعد.</p></div>
      ) : owned.map((l) => (
        <div className="card" key={l.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="dim">اشتُري {String(l.deliveredAt ?? '').slice(0, 16)}</span>
            <span className="pill amount">AED {filsToAed(l.priceFils)}</span>
          </div>
          <table style={{ marginTop: 8 }}>
            <tbody>
              {l.fieldData.map((f, i) => {
                const isContact = CONTACT.test(String(f.name).toLowerCase().replace(/[^a-z]/g, ''))
                return (
                  <tr key={i}>
                    <th style={{ width: '38%' }}>{String(f.name).replace(/[_-]+/g, ' ')}</th>
                    <td style={isContact ? { color: 'var(--good)', fontWeight: 600 } : undefined}>
                      {String(f.values?.[0] ?? '')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      <p className="dim" style={{ marginTop: 24 }}>
        كل عميل هنا أكّد رقم هاتفه بكود SMS قبل التسجيل. تدفع لكل عميل على حدة — لا اشتراك ولا حد أدنى —
        وكل عملية شراء تظهر فوراً في كشف حسابك وفي نظامك.
      </p>
    </main>
  )
}
