/**
 * THE FOUR DEPARTMENTS — the workspace's navigation, arranged the way Meta's
 * Ads Manager arranges it, because the owner asked for exactly that:
 *
 *   "side navigation with its extended tools is amazing for detailed
 *    navigation so they know what is where — while the header drop-down
 *    shifts between Market Terminal, Inventory System, Campaigns and
 *    Marketing, Lead Machine CRM. Those are the 4 main departments on the
 *    platform. Everyone should have a side drop with its internal
 *    departments."
 *
 * Three levels, three places, one list:
 *
 *   header switcher  — the DEPARTMENT you are in (this file's DEPARTMENTS).
 *   side rail        — that department's own screens (each department's
 *                      `rail`, tool ids from lib/freehold/tools.ts), plus the
 *                      company-level doors every department shares.
 *   All tools (⌘K)   — everything, searchable (lib/freehold/tools.ts as before).
 *
 * The rail is CURATED — the screens a person opens every day, in the order
 * the work happens — not every route the app has. What the rail leaves out
 * is one keystroke away in All tools; a rail that lists forty things is a
 * list, not a map. Every id here must exist in TOOLS; the guard
 * (scripts/departments-test.ts) fails the build when one does not, so a
 * renamed route cannot leave a dead door on the rail.
 *
 * Which department a pathname is in is decided HERE (departmentForPath), by
 * the longest rail href that prefixes it, then by the app that owns the
 * route — so the switcher, the rail and the page can never disagree about
 * where you are.
 *
 * Roles and plans are not decided here. The rail is filtered through the
 * same functions the guards use (visibleTools, realtorAllowsPath,
 * accountAllowsPath); a door the guard would close is never drawn.
 */
import type { LucideIcon } from 'lucide-react'
import { LineChart, Package, Megaphone, Users, ExternalLink } from 'lucide-react'
import type { Role } from './session-types'
import { APPS, visibleApps, realtorAllowsPath, accountAllowsPath, type TenantPlan } from './apps'
import { TOOLS, visibleTools, toolById, type ToolDef } from './tools'

const FI = '/freehold-intelligence'

export type DepartmentId = 'market' | 'inventory' | 'marketing' | 'crm'

export interface Department {
  id: DepartmentId
  Icon: LucideIcon
  /** Where the switcher lands you. Must be a rail tool's href. */
  href: string
  /** apps.ts ids this department owns — decides the department of a route the rail does not list. */
  apps: readonly string[]
  /** The rail, top to bottom — tool ids from tools.ts. */
  rail: readonly string[]
}

/**
 * The Terminal is the family's data product on its own deployment; under the
 * one-account rule the workspace's session IS a Terminal session, so this
 * door opens signed in. It heads the Market department's rail as an external
 * link rather than a tool, because it is not a route of this app.
 */
export const TERMINAL_DOOR = {
  id: 'terminal',
  href: 'https://terminal.entrestate.com/me',
  labelKey: 'dept.terminal',
  Icon: ExternalLink,
} as const

export const DEPARTMENTS: readonly Department[] = [
  {
    // What the market is doing — before a dirham is spent on it. The
    // Terminal itself, then the workspace's own market screens.
    id: 'market', Icon: LineChart, href: `${FI}/analytics/market`,
    apps: ['analytics', 'notebook'],
    rail: ['an.market', 'an.home', 'inv.offPlan', 'web.areas', 'web.developers', 'web.insights', 'notebook'],
  },
  {
    // The stock, its score, and the public face built from it.
    id: 'inventory', Icon: Package, href: `${FI}/inventory/projects`,
    apps: ['inventory', 'ai-manager', 'drive'],
    rail: ['inv.projects', 'inv.new', 'inv.ready', 'inv.quality', 'inv.landings', 'inv.landingReqs', 'web.listings', 'web.pages', 'web.microsites', 'drive.home', 'drive.web'],
  },
  {
    // From a scored listing to a live ad, through the gate.
    id: 'marketing', Icon: Megaphone, href: `${FI}/lead-machine/campaigns`,
    apps: ['ads', 'creative-studio'],
    rail: ['ads.campaigns', 'ads.launch', 'ads.machine', 'ads.live', 'ads.creatives', 'ads.forms', 'ads.audiences', 'ads.targeting', 'ads.permissions', 'ads.attribution', 'g.campaigns', 'cs.home'],
  },
  {
    // Where the lead lands, who owns it, and what happens next.
    id: 'crm', Icon: Users, href: `${FI}/crm/leads`,
    apps: ['crm', 'calendar', 'agent'],
    // agent.home leads because it is only ever drawn for a broker, whose own
    // desk it is; everyone else's rail starts at the inbox.
    rail: ['agent.home', 'crm.inbox', 'crm.leads', 'crm.pipeline', 'crm.board', 'crm.followUp', 'crm.assignment', 'crm.duplicates', 'crm.agents', 'crm.activity', 'crm.reports', 'tasks', 'calendar'],
  },
] as const

export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id)

/**
 * The window event the rail's "All tools" button fires. CommandNav (the
 * popup's one implementation) listens for it, so the rail owns no second
 * copy of the panel.
 */
export const ALL_TOOLS_EVENT = 'fi:all-tools'

/**
 * Company-level doors, drawn under the department's rail in every
 * department — apps.ts ids, so role and plan visibility is the registry's
 * own (visibleApps). Management, money, people, setup: the desk behind the
 * four departments, never a fifth department.
 */
export const COMPANY_RAIL: readonly string[] = ['management', 'finance', 'fund', 'team', 'integrations', 'store', 'settings']

const byId = (id: DepartmentId) => DEPARTMENTS.find((d) => d.id === id)!

const isUnder = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/')

/** Every rail tool across departments, with the department it sits in. */
const RAIL_INDEX: Array<{ tool: ToolDef; dept: DepartmentId }> = DEPARTMENTS.flatMap((d) =>
  d.rail.flatMap((id) => { const tool = toolById(id); return tool ? [{ tool, dept: d.id }] : [] }),
)

/** The department a tool files under — by its rail, else by its app. */
export function departmentForTool(tool: ToolDef): DepartmentId | null {
  const onRail = RAIL_INDEX.find((r) => r.tool.id === tool.id)
  if (onRail) return onRail.dept
  return DEPARTMENTS.find((d) => d.apps.includes(tool.app))?.id ?? null
}

/**
 * The department a pathname is in, or null for the home and the company
 * doors. Longest rail href first (so /crm/reports is CRM even though its
 * tool files under Analyze in All tools), then the owning app.
 */
export function departmentForPath(pathname: string): DepartmentId | null {
  const hit = RAIL_INDEX
    .filter((r) => isUnder(pathname, r.tool.href))
    .sort((a, b) => b.tool.href.length - a.tool.href.length)[0]
  if (hit) return hit.dept
  const tool = TOOLS
    .filter((t) => isUnder(pathname, t.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (tool) return DEPARTMENTS.find((d) => d.apps.includes(tool.app))?.id ?? null
  const app = APPS
    .filter((a) => [a.href, ...(a.match ?? [])].some((h) => isUnder(pathname, h)))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (app) return DEPARTMENTS.find((d) => d.apps.includes(app.id))?.id ?? null
  return null
}

/**
 * The tools this person may open — the same rule All tools (command-nav)
 * applies. On a realtor or account tenant the PLAN is the authority: one
 * person, so the company role flags describe a hierarchy that does not
 * exist for them; the plan guard's own prefix list decides, whatever the
 * user row's role says. On a company tenant the role decides.
 */
function allowedTools(role?: Role, plan?: TenantPlan): ToolDef[] {
  if (plan === 'realtor') return TOOLS.filter((t) => realtorAllowsPath(t.href))
  if (plan === 'account') return TOOLS.filter((t) => accountAllowsPath(t.href))
  return visibleTools(role)
}

/**
 * A department's rail for this person: the curated ids, in order, minus any
 * door the role or the plan guard would close.
 */
export function railFor(dept: DepartmentId, role?: Role, plan?: TenantPlan): ToolDef[] {
  const allowed = new Set(allowedTools(role, plan).map((t) => t.id))
  return byId(dept).rail
    .map((id) => toolById(id))
    .filter((t): t is ToolDef => !!t && allowed.has(t.id))
}

/** The departments this person can enter at all — one with an empty rail is not offered. */
export function visibleDepartments(role?: Role, plan?: TenantPlan): Department[] {
  return DEPARTMENTS.filter((d) => railFor(d.id, role, plan).length > 0)
}

/** The company doors for this person, from the app registry's own visibility. */
export function companyRailFor(role?: Role, plan?: TenantPlan) {
  const visible = visibleApps(role, plan)
  return COMPANY_RAIL
    .map((id) => visible.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a)
}

/** Where the switcher lands for this person — the first rail door they may open. */
export function departmentHome(dept: DepartmentId, role?: Role, plan?: TenantPlan): string {
  const rail = railFor(dept, role, plan)
  const preferred = byId(dept).href
  return rail.some((t) => t.href === preferred) ? preferred : (rail[0]?.href ?? preferred)
}
