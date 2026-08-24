/**
 * Graph API client for ENTRESTATE'S OWN ad account — the one that spends.
 *
 * Everything here reads; nothing writes. The plane's job is to watch our
 * account, price what it produces, and serve it to tenants — campaign
 * management itself stays in Ads Manager where it belongs.
 *
 * Fail-soft: an unreachable Graph returns empty lists, and the tenant API on
 * top of this degrades to "nothing new" rather than an error — a Meta outage
 * must never read as the plane being down.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

const token = (): string => (process.env.META_ACCESS_TOKEN ?? '').trim()
const account = (): string => (process.env.META_AD_ACCOUNT_ID ?? '').trim()

export const metaConfigured = (): boolean => token() !== '' && account() !== ''

async function graphGet(path: string, params: Record<string, string> = {}): Promise<unknown | null> {
  if (!metaConfigured()) return null
  const qs = new URLSearchParams({ ...params, access_token: token() })
  try {
    const res = await fetch(`${GRAPH}/${path}?${qs}`, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) {
      console.error(`[meta] ${path} → ${res.status}`, (await res.text()).slice(0, 300))
      return null
    }
    return await res.json()
  } catch (e) {
    console.error(`[meta] ${path} failed`, e)
    return null
  }
}

export interface MetaCampaign {
  id: string
  name: string
  status: string
  /** OUR spend in fils, from insights. null when Meta reported nothing. */
  spendFils: number | null
  leads: number
  frequency: number | null
  dateStop: string | null
}

/** Lead count out of an insights actions array. */
function leadActions(actions: unknown): number {
  if (!Array.isArray(actions)) return 0
  const hit = actions.find((a) => (a as { action_type?: string })?.action_type === 'lead')
  const n = Number((hit as { value?: string })?.value)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

export async function listCampaigns(): Promise<MetaCampaign[]> {
  const d = await graphGet(`${account()}/campaigns`, {
    fields: 'id,name,status,insights{spend,actions,frequency,date_stop}',
    limit: '100',
  })
  const rows = (d as { data?: unknown[] } | null)?.data
  return (Array.isArray(rows) ? rows : []).map((c): MetaCampaign => {
    const x = c as Record<string, unknown>
    const ins = ((x.insights as { data?: unknown[] } | undefined)?.data?.[0] ?? null) as Record<string, unknown> | null
    const spend = Number(ins?.spend)
    const freq = Number(ins?.frequency)
    return {
      id: String(x.id ?? ''),
      name: String(x.name ?? ''),
      status: String(x.status ?? 'PAUSED'),
      // Meta reports spend in whole AED (account currency) — fils here.
      spendFils: Number.isFinite(spend) && spend > 0 ? Math.round(spend * 100) : null,
      leads: leadActions(ins?.actions),
      frequency: Number.isFinite(freq) && freq > 0 ? freq : null,
      dateStop: typeof ins?.date_stop === 'string' ? ins.date_stop : null,
    }
  }).filter((c) => c.id !== '')
}

export interface MetaFormMeta {
  id: string
  name: string
  status: string
  leadsCount: number
  createdTime: string | null
  questions: unknown[]
}

export async function getForm(formId: string): Promise<MetaFormMeta | null> {
  const d = await graphGet(formId, { fields: 'id,name,status,leads_count,created_time,questions' })
  if (!d) return null
  const x = d as Record<string, unknown>
  const n = Number(x.leads_count)
  return {
    id: String(x.id ?? formId),
    name: String(x.name ?? ''),
    status: String(x.status ?? 'ACTIVE'),
    leadsCount: Number.isFinite(n) && n > 0 ? Math.round(n) : 0,
    createdTime: typeof x.created_time === 'string' ? x.created_time : null,
    questions: Array.isArray(x.questions) ? x.questions : [],
  }
}

export interface MetaLead {
  id: string
  createdTime: string | null
  fieldData: Array<{ name: string; values: string[] }>
}

export async function getFormLeads(formId: string, sinceSeconds?: number): Promise<MetaLead[]> {
  const params: Record<string, string> = { fields: 'id,created_time,field_data', limit: '200' }
  if (typeof sinceSeconds === 'number' && Number.isFinite(sinceSeconds) && sinceSeconds > 0) {
    params.filtering = JSON.stringify([{ field: 'time_created', operator: 'GREATER_THAN', value: Math.floor(sinceSeconds) }])
  }
  const d = await graphGet(`${formId}/leads`, params)
  const rows = (d as { data?: unknown[] } | null)?.data
  return (Array.isArray(rows) ? rows : []).map((l): MetaLead => {
    const x = l as Record<string, unknown>
    return {
      id: String(x.id ?? ''),
      createdTime: typeof x.created_time === 'string' ? x.created_time : null,
      fieldData: (Array.isArray(x.field_data) ? x.field_data : []).map((f) => {
        const y = f as Record<string, unknown>
        return {
          name: String(y.name ?? ''),
          values: Array.isArray(y.values) ? (y.values as unknown[]).map((v) => String(v ?? '')) : [],
        }
      }),
    }
  }).filter((l) => l.id !== '')
}
