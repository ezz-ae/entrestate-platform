import { NextResponse } from 'next/server'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { SIGNUP_PLAN_COOKIE } from '@/app/signup/start/route'
import { emptyProfile, TOOLS, type Profile } from '@/lib/onestate/deck'
import { ONESTATE_COOKIE, ONESTATE_COOKIE_MAX_AGE, encode, keep } from '@/lib/onestate/setup'

/**
 * WHAT THE GAME LEARNED, WRITTEN DOWN BEFORE THE ROUND TRIP.
 *
 * Onestate runs before anybody has an account — that is the point of it, the
 * setup earns the sign-up rather than guarding it. But an Entrestate identity
 * is born in ONE place and it is the Terminal (app/signup/page.tsx states the
 * rule), and the Terminal's `next` parameter accepts relative paths only, so
 * nothing can be carried across in the URL.
 *
 * So the answers go into a cookie here, exactly as app/signup/start already
 * does with the plan, and /business/account reads them back to provision the
 * workspace with the tools and the levels the person actually chose. httpOnly
 * so no script can read a person's own answers back out of their browser;
 * Lax so the browser still sends it on the top-level navigation home from
 * terminal.entrestate.com — the whole trick depends on that; thirty minutes
 * because an abandoned game must not colour a workspace created next week.
 *
 * NOTHING IN THE BODY IS BELIEVED. The profile arrives from a page anybody can
 * open with a console, and the levels in it decide how much of somebody's
 * money a machine may move on its own, so this route rebuilds the profile from
 * scratch out of known tool ids and clamped numbers rather than storing what it
 * was handed. The evidence ceiling in lib/onestate/setup.ts then holds on top
 * of that, at provisioning time — two locks, because this one is reachable
 * from outside.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TERMINAL_SIGNUP = 'https://terminal.entrestate.com/signup?next=%2Fme'
const TOOL_IDS = new Set(TOOLS.map((t) => t.id))

/** A name a person typed about themselves, kept to a length a name has. */
function trim(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/** Rebuilt, not trusted: only known ids, only numbers, only 0…10. */
function cleanProfile(raw: unknown): Profile {
  const out = emptyProfile()
  if (!raw || typeof raw !== 'object') return out
  const p = raw as Record<string, unknown>

  if (p.warmth && typeof p.warmth === 'object') {
    for (const [tag, value] of Object.entries(p.warmth as Record<string, unknown>)) {
      if (typeof tag !== 'string' || tag.length > 24) continue
      const n = Number(value)
      if (!Number.isFinite(n)) continue
      out.warmth[tag] = Math.max(0, Math.min(1, n))
      if (Object.keys(out.warmth).length >= 60) break
    }
  }
  if (Array.isArray(p.areas)) {
    out.areas = p.areas.filter((v): v is string => typeof v === 'string' && v.length <= 40).slice(0, 12)
  }
  if (Array.isArray(p.devs)) {
    out.devs = p.devs.filter((v): v is string => typeof v === 'string' && v.length <= 40).slice(0, 12)
  }
  if (p.tools && typeof p.tools === 'object') {
    for (const [id, value] of Object.entries(p.tools as Record<string, unknown>)) {
      if (!TOOL_IDS.has(id)) continue
      const n = Number(value)
      if (!Number.isFinite(n)) continue
      out.tools[id] = Math.max(0, Math.min(10, Math.round(n)))
    }
  }
  if (Array.isArray(p.later)) {
    out.later = p.later.filter((v): v is string => typeof v === 'string' && TOOL_IDS.has(v)).slice(0, TOOLS.length)
  }
  return out
}

export async function POST(request: Request) {
  // This repository has no shared request-id helper; every route mints its
  // own, and the header is honoured when a proxy already set one.
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const fail = (error: string, status: number) =>
    NextResponse.json({ error, requestId }, { status, headers: { 'x-request-id': requestId } })

  if (!SAAS_TENANCY) return fail('Not available on this deployment.', 404)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('That did not go through. Try once more.', 400)
  }
  const input = (body ?? {}) as Record<string, unknown>

  const email = trim(input.email, 120).toLowerCase()
  // The address is only checked for shape. Whether it exists is the Terminal's
  // business, and it is the one that sends the code.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return fail('That address is missing something — check it and try again.', 400)
  }

  const packed = encode({
    ...keep(cleanProfile(input.profile), trim(input.name, 60), trim(input.company, 80)),
  })
  if (!packed) return fail('That did not go through. Try once more.', 400)

  const response = NextResponse.json(
    { next: TERMINAL_SIGNUP, requestId },
    { headers: { 'x-request-id': requestId } },
  )

  response.cookies.set(ONESTATE_COOKIE, packed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: ONESTATE_COOKIE_MAX_AGE,
  })

  // The plan the buyer clicked still rides along, the way it always did — the
  // realtor door and the company door provision differently.
  if (input.plan === 'realtor') {
    response.cookies.set(SIGNUP_PLAN_COOKIE, 'realtor', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: ONESTATE_COOKIE_MAX_AGE,
    })
  }

  return response
}
