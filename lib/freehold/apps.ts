/**
 * App registry — the SINGLE source of truth for "what apps exist" in
 * Freehold Intelligence.
 *
 * Both the persistent navigation spine (spaces-nav) and the hub launcher grid
 * (app/freehold-intelligence/page.tsx) read from this list, so the two can
 * never drift apart again. Add or rename an app here and it updates everywhere.
 *
 * Model (Meta Business Suite, not a Google Cloud maze):
 *   - Each entry is a self-contained app workspace with its own internal
 *     navigation and tools (its own layout.tsx).
 *   - Apps connect to each other for input/output (closed loops), they do not
 *     re-implement each other.
 *   - "Management" is system-level, role-aware reporting that aggregates across
 *     apps — it is NOT an app that owns Finance/Inventory/Ads tools.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Users, UsersRound, Megaphone, DollarSign, TrendingUp, Bot, Package,
  ShieldCheck, Settings, BookOpen, BarChart3, UserCircle, Clapperboard, CalendarDays, HardDrive, Wallet,
} from 'lucide-react'
import type { Role } from './session-types'
import { MANAGEMENT_ROLES } from './session-types'

export interface AppDef {
  id:    string
  label: string
  sub:   string
  href:  string
  Icon:  LucideIcon
  /** default metric shown on the hub card; pages may override with live data */
  metric: string
  /** default badge count; pages may override with live data */
  badge:  number
  accent: string
  /** hub card border classes */
  card:   string
  /** hub card icon-chip classes */
  icon:   string
  /** only management roles (admin/ceo/director) may see this app */
  managementOnly?: boolean
  /** hidden from brokers */
  brokerHide?: boolean
  /** visible ONLY to brokers — e.g. the personal agent workspace */
  brokerOnly?: boolean
  /** the personal-ACCOUNT plan's own surface (e.g. Fund) — never reached through
   *  company/realtor role visibility; only the account plan lists it explicitly. */
  accountOnly?: boolean
  /** explicit allow-list of roles — single source of truth; when set it takes
   *  precedence over the flags above and MUST match the section's route guard. */
  roles?: Role[]
  /** show in the persistent top spine (defaults true) */
  spine?: boolean
  /** extra path prefixes that light this tab active (e.g. Drive lit while in Notebook) */
  match?: string[]
}

// Canonical role lists reused by both nav visibility and route guards.
export const ALL_ROLES: Role[] = ['broker', 'team_leader', 'admin', 'sales_manager', 'director', 'ceo', 'marketing']
// A team leader is not a broker — they belong wherever "everyone except the
// individual agent" is meant, which is what this list has always expressed.
export const NON_BROKER_ROLES: Role[] = ['team_leader', 'admin', 'sales_manager', 'director', 'ceo', 'marketing']
export const MGMT_ROLES: Role[] = ['admin', 'sales_manager', 'director', 'ceo']
export const STUDIO_ROLES: Role[] = ['admin', 'director', 'ceo', 'marketing']
export const SETTINGS_ROLES: Role[] = ['admin', 'director', 'ceo']
/**
 * Team app: management PLUS team leaders. The leader sees their own team here
 * and management sees everyone — the page scopes the roster, the guard only
 * decides who may open the door. Deliberately NOT MGMT_ROLES: leading a team
 * has to be visible somewhere, and this is that somewhere.
 */
export const TEAM_APP_ROLES: Role[] = [...MGMT_ROLES, 'team_leader']

export const APPS: AppDef[] = [
  // Fund — the personal account's money surface: balance, top-up, activity.
  // ACCOUNT PLAN ONLY (a company sees Finance, a realtor sees Tokens), so it is
  // accountOnly and leads the account spine. Reuses the EXISTING wallet page —
  // nothing new is built here; the account plan just mounts it.
  {
    id: 'fund', label: 'Fund', sub: 'Balance · Top-up · Activity',
    href: '/freehold-intelligence/points', Icon: Wallet,
    metric: 'Your balance & spend', badge: 0, accent: '#3B82F6',
    card: 'border-blue-400/15 hover:border-blue-400/30',
    icon: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    accountOnly: true,
  },
  {
    id: 'crm', label: 'CRM', sub: 'Leads · Agents · Pipeline',
    href: '/freehold-intelligence/crm', Icon: Users,
    metric: 'Leads · pipeline · agents', badge: 0, accent: '#D4AF37',
    card: 'border-[#D4AF37]/15 hover:border-[#D4AF37]/35',
    icon: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20',
  },
  {
    id: 'ads', label: 'Ads', sub: 'Meta · Google · Forms · Live',
    href: '/freehold-intelligence/lead-machine', Icon: Megaphone,
    metric: 'Campaigns · creatives · attribution', badge: 0, accent: '#60A5FA',
    card: 'border-blue-400/15 hover:border-blue-400/30',
    icon: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    brokerHide: true,
    // The old /ads launcher redirects here; light the tab across the whole loop.
    match: ['/freehold-intelligence/lead-machine', '/freehold-intelligence/ads-live', '/freehold-intelligence/ads'],
  },
  {
    id: 'inventory', label: 'Inventory', sub: 'Properties · Projects · Off-plan',
    href: '/freehold-intelligence/inventory', Icon: Package,
    metric: 'properties · landings', badge: 0, accent: '#FBBF24',
    card: 'border-amber-400/15 hover:border-amber-400/30',
    icon: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  {
    id: 'finance', label: 'Finance', sub: 'Invoices · Payments · Credits',
    href: '/freehold-intelligence/finance', Icon: DollarSign,
    metric: 'Revenue · spend · budget', badge: 0, accent: '#34D399',
    card: 'border-emerald-400/15 hover:border-emerald-400/30',
    icon: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    roles: MGMT_ROLES,
  },
  {
    id: 'ai-manager', label: 'Web Studio', sub: 'Listings · SEO · Auto-content',
    href: '/freehold-intelligence/ai-manager', Icon: Bot,
    metric: 'Content · data quality', badge: 0, accent: '#38BDF8',
    card: 'border-sky-400/15 hover:border-sky-400/30',
    icon: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    roles: STUDIO_ROLES,
  },
  {
    id: 'analytics', label: 'Analytics', sub: 'Traffic · Conversions · Pages',
    href: '/freehold-intelligence/analytics', Icon: TrendingUp,
    metric: 'visitors · 30d', badge: 0, accent: '#A78BFA',
    card: 'border-violet-400/15 hover:border-violet-400/30',
    icon: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    brokerHide: true,
  },
  // Team — the ONE dashboard for every agent/broker control (roster, pipeline,
  // performance, credits, ad permissions, roles). Management-only: a broker
  // must never see other brokers' pipelines, money or access.
  {
    id: 'team', label: 'Team', sub: 'Roster · Pipeline · Credits · Access',
    href: '/freehold-intelligence/team', Icon: UsersRound,
    metric: 'Everyone on the team', badge: 0, accent: '#2DD4BF',
    card: 'border-teal-400/15 hover:border-teal-400/35',
    icon: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    roles: TEAM_APP_ROLES,
  },
  {
    id: 'calendar', label: 'Calendar', sub: 'Meetings · Bookings · Training · Follow-ups',
    href: '/freehold-intelligence/calendar', Icon: CalendarDays,
    metric: 'Company timeline', badge: 0, accent: '#F59E0B',
    card: 'border-amber-500/15 hover:border-amber-500/30',
    icon: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  // Assets — the one home for everything you make + one Editor that opens any
  // asset. Takes Notebook's spine slot; Notebook now lives inside it.
  //
  // Named Assets, not Drive: the store sells it as Assets (app-store.ts) and
  // the promise is a STORE, not a folder — every upload surface in the system
  // lands here, so an image attached on the ads desk is in the library the
  // moment it is attached. The id and href stay 'drive' on purpose: they are
  // load-bearing (routes, `match`, REALTOR_APP_IDS, saved links), and renaming
  // a route to match a label is how live links die.
  {
    id: 'drive', label: 'Assets', sub: 'Images · Video · Deployments · Editor',
    href: '/freehold-intelligence/drive', Icon: HardDrive,
    metric: 'Everything you create & edit', badge: 0, accent: '#2DD4BF',
    card: 'border-teal-400/15 hover:border-teal-400/30',
    icon: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    // Light the Drive tab while the user is anywhere under Notebook (it lives here now).
    match: ['/freehold-intelligence/drive', '/freehold-intelligence/notebook'],
  },
  {
    id: 'notebook', label: 'Notebook', sub: 'Research · Offers · Exports',
    href: '/freehold-intelligence/notebook', Icon: BookOpen,
    metric: 'AI research workspace', badge: 0, accent: '#F472B6',
    card: 'border-pink-400/15 hover:border-pink-400/30',
    icon: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    // Notebook now lives under Drive — off the top spine, still routable + hub card.
    spine: false,
  },
  {
    // Creative Hub — where the making tools live (app-store.ts sells it under
    // that name). Id and href stay 'creative-studio': load-bearing routes.
    id: 'creative-studio', label: 'Creative Hub', sub: 'Agentic · Video · Landings · Ads',
    href: '/freehold-intelligence/creative-studio', Icon: Clapperboard,
    metric: 'Visual AI workflow builder', badge: 0, accent: '#A78BFA',
    card: 'border-violet-400/15 hover:border-violet-400/30',
    icon: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    roles: STUDIO_ROLES,
  },
  {
    id: 'integrations', label: 'Integrations', sub: 'Meta · Google · HubSpot · Zapier',
    href: '/freehold-intelligence/integrations', Icon: ShieldCheck,
    metric: 'Meta · Google · HubSpot · more', badge: 0, accent: 'rgba(255,255,255,0.4)',
    card: 'border-slate-800 hover:border-white/[0.15]',
    icon: 'text-slate-400 bg-slate-800/40 border-slate-800',
    roles: STUDIO_ROLES,
  },
  {
    id: 'settings', label: 'Settings', sub: 'Team · Roles · Billing',
    href: '/freehold-intelligence/settings', Icon: Settings,
    metric: 'Team · roles · billing', badge: 0, accent: 'rgba(255,255,255,0.4)',
    card: 'border-slate-800 hover:border-white/[0.15]',
    icon: 'text-slate-400 bg-slate-800/40 border-slate-800',
    roles: SETTINGS_ROLES,
  },
  {
    id: 'management', label: 'Management', sub: 'Company-wide reporting · Team · ROI',
    href: '/freehold-intelligence/management', Icon: BarChart3,
    metric: 'System-level reporting', badge: 0, accent: '#D4AF37',
    card: 'border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    icon: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25',
    managementOnly: true,
  },
  // The broker's personal workspace — only brokers see this tab.
  // Managers can still visit /agent but don't need a spine tab for it.
  {
    id: 'agent', label: 'My Workspace', sub: 'Leads · Campaigns · Credits · AI',
    href: '/freehold-intelligence/agent', Icon: UserCircle,
    metric: 'My pipeline', badge: 0, accent: '#60A5FA',
    card: 'border-blue-400/15 hover:border-blue-400/30',
    icon: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    brokerOnly: true,
  },
]

/**
 * Workspace plan — mirrors saas_tenants.plan via the host-resolved brand
 * payload (useBrand().plan on the client, getTenantBrand() on the server).
 * 'realtor' is the one-person "Meta for Realtors" workspace: same tenancy
 * rails, but the surface shrinks to what a solo ad-running agent needs.
 */
export type TenantPlan = 'company' | 'realtor' | 'account'

/**
 * The realtor's few-clicks workspace, by app id. Plan — not role — is the
 * authority here: a realtor tenant is one person, so the company role flags
 * (brokerHide, MGMT_ROLES…) describe a hierarchy that doesn't exist for them.
 *   ads       → the wizard, campaign desk, creatives, audiences, live results
 *   crm       → their leads
 *   inventory → our catalogue IS their stock
 *   drive     → the creative essentials (Notebook rides along — it lives here)
 *   agent     → My Workspace: their leads/campaigns and the token surface
 * Deliberately absent: team, management, finance desk, web studio, creative
 * studio's agentic canvas, settings, analytics beyond their own ad results.
 */
const REALTOR_APP_IDS: string[] = ['ads', 'crm', 'inventory', 'drive', 'notebook', 'agent']

/** Where a realtor lands when they knock on a door they don't have. */
export const REALTOR_HOME = '/freehold-intelligence/lead-machine'

/**
 * Route prefixes a realtor plan may open — DERIVED from the registry entries
 * above (href + match, so relocated routes like the /ads stub and Notebook
 * under Drive stay covered), plus the personal surfaces every plan keeps.
 * Nav and route guard both read THIS list, so they can never disagree.
 */
export const REALTOR_ALLOWED_PREFIXES: string[] = [
  ...new Set(
    APPS.filter((a) => REALTOR_APP_IDS.includes(a.id)).flatMap((a) => [a.href, ...(a.match ?? [])]),
  ),
  // Integrations: Meta + WhatsApp only — the two rails their ads run on.
  '/freehold-intelligence/integrations/meta',
  '/freehold-intelligence/integrations/whatsapp',
  // Personal, per-user surfaces open to everyone (matches the user menu).
  '/freehold-intelligence/settings/connect',
  '/freehold-intelligence/help',
]

/** Whether a realtor-plan workspace may open this pathname. */
export function realtorAllowsPath(pathname: string): boolean {
  return REALTOR_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/**
 * The personal ACCOUNT plan — the individual's Account Hub. Same tenancy rails
 * as realtor/company, but the surface is the account primitives — the shell the
 * company system never had for one person. Every module here is the EXISTING
 * full app (CRM, Integrations, Drive, Calendar, Settings), MOUNTED, not rebuilt,
 * with Fund (the wallet) as the account's own money surface and the hook that
 * ties them together. AI chat is the Expert dock, always present in the shell.
 */
const ACCOUNT_APP_IDS: string[] = ['fund', 'crm', 'integrations', 'drive', 'calendar', 'settings']

/** The account's home — the existing hub briefing, reused. */
export const ACCOUNT_HOME = '/freehold-intelligence'

/**
 * Route prefixes an account plan may open — DERIVED from its module entries
 * (href + match), plus the personal surfaces every plan keeps. Nav and route
 * guard both read THIS list, so they can never disagree. The bare hub home is
 * NOT a prefix here (it would open every sub-route); accountAllowsPath allows
 * it exactly instead.
 */
export const ACCOUNT_ALLOWED_PREFIXES: string[] = [
  ...new Set(
    APPS.filter((a) => ACCOUNT_APP_IDS.includes(a.id)).flatMap((a) => [a.href, ...(a.match ?? [])]),
  ),
  '/freehold-intelligence/settings/connect',
  '/freehold-intelligence/help',
]

/** Whether an account-plan workspace may open this pathname. */
export function accountAllowsPath(pathname: string): boolean {
  if (pathname === ACCOUNT_HOME) return true
  return ACCOUNT_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** Whether a role may access an app — single source of truth for nav + guards. */
export function appAllowsRole(a: AppDef, role?: Role): boolean {
  // Account-plan surfaces (Fund) are never reached through company/realtor role
  // visibility — only the account plan lists them (see visibleApps).
  if (a.accountOnly)    return false
  if (a.roles)          return !!role && a.roles.includes(role)
  if (a.brokerOnly)     return role === 'broker'
  if (a.managementOnly) return role ? MANAGEMENT_ROLES.includes(role) : false
  if (a.brokerHide)     return role !== 'broker'
  return true
}

/** Resolve the allow-list of roles for a section id (for route guards). */
export function rolesForApp(id: string): Role[] {
  const a = APPS.find((x) => x.id === id)
  if (!a) return ALL_ROLES
  if (a.roles)          return a.roles
  if (a.brokerOnly)     return ['broker']
  if (a.managementOnly) return MANAGEMENT_ROLES
  if (a.brokerHide)     return NON_BROKER_ROLES
  return ALL_ROLES
}

/** Apps a given role is allowed to see; plan='realtor' overrides role. */
export function visibleApps(role?: Role, plan?: TenantPlan): AppDef[] {
  if (plan === 'realtor') return APPS.filter((a) => REALTOR_APP_IDS.includes(a.id))
  if (plan === 'account') return APPS.filter((a) => ACCOUNT_APP_IDS.includes(a.id))
  return APPS.filter((a) => appAllowsRole(a, role))
}

/** Apps shown in the persistent navigation spine for a role (and plan). */
export function spineApps(role?: Role, plan?: TenantPlan): AppDef[] {
  return visibleApps(role, plan).filter((a) => a.spine !== false)
}
