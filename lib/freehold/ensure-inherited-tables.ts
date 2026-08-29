/**
 * THE TABLES THIS CODEBASE READS BUT NEVER LEARNED TO CREATE.
 *
 * Almost every table here provisions itself: a CREATE TABLE IF NOT EXISTS runs
 * behind `ensureOnce` the first time something touches it, which is what makes
 * "point the deployment at an empty database and it works" true. Three tables
 * missed that treatment, because they arrived in the original deployment's
 * database before the convention existed and have simply always been there.
 *
 * On an inherited database nobody notices. On a FRESH one — which is exactly
 * what separating this product from the client's live database produces — two
 * of them break, in two different unhelpful ways:
 *
 *   · freehold_comments_tasks: the comments route INSERTs into it unguarded, so
 *     the first comment anyone leaves throws "relation does not exist".
 *   · freehold_site_area_profiles: the public route IS guarded, and answers a
 *     500 with source:'error'. An empty database is not an error, and a public
 *     endpoint that says it is teaches the operator to distrust a working
 *     deployment.
 *
 * A third, freehold_site_blog_posts, is deliberately NOT here. Its reads
 * already fail soft by design (lib/data.ts: "a missing table is no posts, never
 * a 500"), and nothing in this codebase writes a post — so creating the table
 * would add an empty relation nothing could ever fill.
 *
 * The shapes below are the real ones, read from the live schema rather than
 * guessed — a column list invented from the SELECT that reads it is how a
 * "fix" produces a table the next INSERT rejects.
 *
 * IF NOT EXISTS throughout: on a database that already has these, this does
 * nothing at all.
 */

import { ensureOnce, query } from '@/lib/db'

/** Area hubs — the public site's area pages and the market stats. Zone A market
 *  data: the rows are loaded by the data pipeline, but the TABLE has to exist
 *  before an empty deployment can answer "no areas yet" instead of failing. */
export async function ensureAreaProfilesTable(): Promise<void> {
  await ensureOnce('freehold_site_area_profiles', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_site_area_profiles (
        slug             text PRIMARY KEY,
        name             text NOT NULL,
        area_type        text,
        avg_score        integer,
        median_price_aed bigint,
        project_count    integer,
        avg_yield        numeric,
        image            text,
        hero_video       text,
        payload          jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at       timestamptz DEFAULT now(),
        llm_context      text,
        name_ar          text
      )
    `)
  })
}

/** In-app comments and the tasks they get converted into. */
export async function ensureCommentsTasksTable(): Promise<void> {
  await ensureOnce('freehold_comments_tasks', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_comments_tasks (
        item_id        serial PRIMARY KEY,
        kind           text DEFAULT 'comment',
        page_ref       text,
        body           text NOT NULL,
        author         text,
        assignee       text,
        status         text DEFAULT 'open',
        converted_from integer,
        created_at     timestamptz DEFAULT now(),
        resolved_at    timestamptz
      )
    `)
  })
}

/** Every table this module is responsible for — the list the guard walks so a
 *  third one cannot be added here without being ensured. */
export const INHERITED_TABLES = [
  'freehold_site_area_profiles',
  'freehold_comments_tasks',
] as const
