import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import {
  adminExists,
  buildSessionCookie,
  createSession,
  getUserByEmailForAuth,
  hashPassword,
  logActivity,
} from "@/lib/auth"
import { upsertUserProfile } from "@/lib/data"

export const runtime = "nodejs"

const getSetupKey = () =>
  process.env.CRM_ADMIN_SETUP_KEY?.trim() || process.env.ADMIN_SETUP_KEY?.trim() || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const setupKey = String(body?.setupKey || "").trim()
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "")
      .trim()
      .toLowerCase()
    const password = String(body?.password || "")

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      )
    }

    const expectedKey = getSetupKey()
    if (!expectedKey) {
      return NextResponse.json(
        { error: "Admin bootstrap is disabled. Set CRM_ADMIN_SETUP_KEY and try again." },
        { status: 503 },
      )
    }

    if (setupKey !== expectedKey) {
      return NextResponse.json({ error: "Invalid setup key." }, { status: 403 })
    }

    // FIRST ADMIN ONLY. Documented since day one (docs/route-auth-matrix.md,
    // DEPLOYMENT.md §5.1: "endpoint disables itself once an admin exists") and
    // never implemented. The upsert below is ON CONFLICT (email) DO UPDATE with
    // role and password_hash, so without this gate anyone holding the setup key
    // could post an EXISTING owner's email and replace their password — account
    // takeover, with a long-lived env var as the only secret. Losing a password
    // is what /api/auth/request-reset is for; it is never what a bootstrap
    // endpoint is for. adminExists() fails closed on an unreadable database.
    if (await adminExists()) {
      return NextResponse.json(
        {
          error:
            "An admin already exists — first-run bootstrap is closed. Use password reset, or have an existing admin add the user in Team.",
        },
        { status: 409 },
      )
    }

    const existing = await getUserByEmailForAuth(email)
    const passwordHash = await hashPassword(password)

    const record = await upsertUserProfile({
      id: existing?.id || randomUUID(),
      name: name || existing?.name || "Admin",
      email,
      role: "admin",
      org_title: existing?.org_title || existing?.role || "Admin",
      phone: existing?.phone || null,
      commission_rate: existing?.commission_rate || null,
      language: existing?.language || null,
      ai_tone: existing?.ai_tone || null,
      ai_verbosity: existing?.ai_verbosity || null,
      notifications: existing?.notifications || null,
      password_hash: passwordHash,
    })

    const { token } = await createSession(record.id)
    await logActivity("bootstrap_admin", record.id, { email })

    const response = NextResponse.json({
      user: {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
      },
    })
    response.cookies.set(buildSessionCookie(token))
    return response
  } catch (error) {
    console.error("[auth-bootstrap-admin] error", error)
    return NextResponse.json({ error: "Failed to bootstrap admin." }, { status: 500 })
  }
}
