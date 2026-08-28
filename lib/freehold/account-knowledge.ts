/**
 * THE ACCOUNT'S OWN KNOWLEDGE — what makes the assistant speak YOUR business.
 *
 * notebook-context.ts grounds the AI on real-estate tables (projects, market,
 * campaigns) — which is exactly why the product is real-estate-shaped. To let
 * one account be a broker and the next a dentist or a car dealer, the domain
 * can't live in the schema; it has to live in the ACCOUNT.
 *
 * So this is a GENERIC, per-account knowledge store: the account throws in its
 * own links, files and text (leadformation's notebook), and the assistant
 * retrieves from it the same message-aware way projectsBlock retrieves a
 * project's llm_context. The engine stops being about real estate and starts
 * being about whatever THIS account sells — the horizontal switch.
 *
 * Two rules this file exists to keep, and their why:
 *   1. EVERY read is scoped to account_ref. One account's knowledge is never
 *      retrievable by another — a knowledge base that leaked across accounts
 *      is worse than none, and the guard asserts every query carries the scope.
 *   2. STORE-ONLY. ingest takes text the caller already extracted; it never
 *      fetches a URL itself — a server-side fetch of a user-supplied link is an
 *      SSRF foot-gun. Link extraction happens in the caller, deliberately.
 */
import { query, ensureOnce } from '@/lib/db'

export type KnowledgeKind = 'link' | 'file' | 'text'
const KINDS: KnowledgeKind[] = ['link', 'file', 'text']

export interface KnowledgeDoc {
  id: string
  accountRef: string
  kind: KnowledgeKind
  title: string
  sourceUrl: string | null
  content: string
  createdAt: string
}

async function ensure(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS freehold_account_knowledge (
      id          text PRIMARY KEY,
      account_ref text NOT NULL,
      kind        text NOT NULL CHECK (kind IN ('link','file','text')),
      title       text NOT NULL DEFAULT '',
      source_url  text,
      content     text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS fak_account_created
     ON freehold_account_knowledge (account_ref, created_at DESC)`,
  )
}
export const ensureAccountKnowledgeSchema = () => ensureOnce('freehold_account_knowledge', ensure)

const clean = (s: string | undefined | null): string => (s ?? '').trim()

/** Validate an ingest request. Pure — the guard tests this with no database. */
export function validateKnowledge(input: { accountRef?: string; kind?: string; content?: string }):
  { ok: true } | { ok: false; reason: string } {
  if (!clean(input.accountRef)) return { ok: false, reason: 'account_ref required' }
  if (!KINDS.includes(input.kind as KnowledgeKind)) return { ok: false, reason: 'kind must be link|file|text' }
  if (clean(input.content).length < 2) return { ok: false, reason: 'content required' }
  return { ok: true }
}

export async function ingestKnowledge(input: {
  accountRef: string; kind: KnowledgeKind; content: string; title?: string; sourceUrl?: string
}): Promise<{ id: string }> {
  const v = validateKnowledge(input)
  if (!v.ok) throw new Error(`invalid_knowledge:${v.reason}`)
  await ensureAccountKnowledgeSchema()
  const id = `kn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  await query(
    `INSERT INTO freehold_account_knowledge (id, account_ref, kind, title, source_url, content)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id, clean(input.accountRef), input.kind, clean(input.title).slice(0, 200),
      input.sourceUrl ? clean(input.sourceUrl).slice(0, 2000) : null,
      clean(input.content).slice(0, 200_000),
    ],
  )
  return { id }
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'about', 'what', 'which', 'that', 'this', 'from', 'have', 'your',
  'make', 'create', 'give', 'show', 'tell', 'write', 'draft', 'best', 'need', 'want', 'please', 'help',
])

/** Message → the words worth matching. Pure — same shape as notebook-context. */
export function knowledgeTokens(message: string): string[] {
  return Array.from(new Set(
    message.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
  )).slice(0, 8)
}

type KRow = { title: string; kind: string; source_url: string | null; content: string }

/**
 * The account's knowledge, retrieved for a message — message-aware when there
 * are words to match, most-recent otherwise. ALWAYS scoped to account_ref.
 * Returns a text block for the notebook context, or null when the account has
 * taught the system nothing yet (a source with nothing to say renders nothing).
 */
export async function retrieveAccountKnowledge(
  accountRef: string, message?: string, limit = 6,
): Promise<string | null> {
  const ref = clean(accountRef)
  if (!ref) return null
  const lim = Math.max(1, Math.min(limit, 12))
  try {
    await ensureAccountKnowledgeSchema()
    const tokens = message ? knowledgeTokens(message) : []
    let rows: KRow[] = []
    if (tokens.length) {
      const conds = tokens.map((_, i) => `(title ILIKE $${i + 2} OR content ILIKE $${i + 2})`)
      rows = await query<KRow>(
        `SELECT title, kind, source_url, content FROM freehold_account_knowledge
         WHERE account_ref = $1 AND (${conds.join(' OR ')})
         ORDER BY created_at DESC LIMIT ${lim}`,
        [ref, ...tokens.map((t) => `%${t}%`)],
      )
    }
    if (!rows.length) {
      rows = await query<KRow>(
        `SELECT title, kind, source_url, content FROM freehold_account_knowledge
         WHERE account_ref = $1 ORDER BY created_at DESC LIMIT ${lim}`,
        [ref],
      )
    }
    if (!rows.length) return null
    const blocks = rows.map((r) => {
      const head = [r.title || r.kind, r.source_url].filter(Boolean).join(' · ')
      return `${head}\n${r.content.trim().slice(0, 1400)}`
    })
    return `THIS ACCOUNT'S OWN KNOWLEDGE (links / files / notes it taught the system):\n${blocks.join('\n---\n')}`
  } catch {
    return null
  }
}

export async function listAccountKnowledge(accountRef: string): Promise<KnowledgeDoc[]> {
  const ref = clean(accountRef)
  if (!ref) return []
  try {
    await ensureAccountKnowledgeSchema()
    const rows = await query<{
      id: string; account_ref: string; kind: KnowledgeKind; title: string
      source_url: string | null; content: string; created_at: string
    }>(
      `SELECT id, account_ref, kind, title, source_url, content, created_at::text AS created_at
       FROM freehold_account_knowledge WHERE account_ref = $1 ORDER BY created_at DESC`,
      [ref],
    )
    return rows.map((r) => ({
      id: r.id, accountRef: r.account_ref, kind: r.kind, title: r.title,
      sourceUrl: r.source_url, content: r.content, createdAt: r.created_at,
    }))
  } catch {
    return []
  }
}

export async function deleteKnowledge(accountRef: string, id: string): Promise<void> {
  const ref = clean(accountRef)
  if (!ref || !clean(id)) return
  await query(`DELETE FROM freehold_account_knowledge WHERE account_ref = $1 AND id = $2`, [ref, clean(id)])
}
