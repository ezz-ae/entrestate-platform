#!/usr/bin/env tsx

import { parseArgs } from "node:util"
import { PrismaClient } from "@prisma/client"

const { values } = parseArgs({
  options: {
    keep: { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: false,
})

const prisma = new PrismaClient()

const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const userId = `smoke-enterprise-${uniqueSuffix}`
const userEmail = `smoke+${uniqueSuffix}@entrestate.dev`
const billingAccountKey = `smoke-account-${uniqueSuffix}`
const billingSubscriptionId = `smoke-sub-${uniqueSuffix}`

let chatSessionId = ""
let decisionObjectId = ""

async function ensureTableExists(tableName: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
      SELECT EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    tableName,
  )

  if (!rows[0]?.exists) {
    throw new Error(`Required table missing: public.${tableName}`)
  }
}

async function ensureBillingTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS billing_entitlements (
      account_key TEXT PRIMARY KEY,
      email TEXT,
      tier TEXT NOT NULL DEFAULT 'free',
      provider TEXT NOT NULL DEFAULT 'paypal',
      paypal_subscription_id TEXT,
      paypal_plan_id TEXT,
      paypal_status TEXT,
      last_event_id TEXT,
      last_event_type TEXT,
      last_event_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function seedRows() {
  await Promise.all([
    ensureTableExists("users"),
    ensureTableExists("user_profiles"),
    ensureTableExists("chat_sessions"),
    ensureTableExists("chat_messages"),
    ensureTableExists("decision_objects"),
  ])
  await ensureBillingTables()

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO users (id, email, name, role)
      VALUES ($1, $2, 'Smoke Enterprise User', 'agent')
    `,
    userId,
    userEmail,
  )

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO user_profiles (
        user_id,
        email,
        display_name,
        risk_bias,
        yield_vs_safety,
        preferred_markets,
        horizon,
        preferred_cities,
        preferred_property_types,
        golden_visa_required,
        role,
        updated_at
      )
      VALUES (
        $1,
        $2,
        'Smoke Enterprise User',
        0.67,
        0.58,
        ARRAY['Dubai Marina'],
        'Ready',
        ARRAY['Dubai'],
        ARRAY['Apartment'],
        false,
        'member',
        NOW()
      )
    `,
    userId,
    userEmail,
  )

  const sessionRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      INSERT INTO chat_sessions (
        user_id,
        title,
        strategic_context,
        session_summary,
        active_project_ids,
        message_count,
        tool_calls_count,
        last_message_at,
        updated_at
      )
      VALUES (
        $1,
        'Smoke chat session',
        '{}'::jsonb,
        'validation seed',
        ARRAY[]::text[],
        1,
        0,
        NOW(),
        NOW()
      )
      RETURNING id
    `,
    userId,
  )

  chatSessionId = sessionRows[0]?.id ?? ""
  if (!chatSessionId) {
    throw new Error("Failed to create chat session")
  }

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO chat_messages (
        session_id,
        user_id,
        role,
        content,
        tool_calls,
        tool_results,
        cited_project_ids,
        cited_sources,
        model
      )
      VALUES (
        $1,
        $2,
        'user',
        'Smoke validation message',
        '[]'::jsonb,
        '[]'::jsonb,
        ARRAY[]::text[],
        '[]'::jsonb,
        'smoke-script'
      )
    `,
    chatSessionId,
    userId,
  )

  const decisionRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      INSERT INTO decision_objects (
        owner_id,
        team_id,
        title,
        object_type,
        content,
        summary,
        project_ids,
        area_ids,
        developer_ids,
        status,
        shared_with,
        model_used,
        session_id,
        generation_params,
        updated_at
      )
      VALUES (
        $1,
        NULL,
        'Smoke Decision Object',
        'report',
        '{"source":"enterprise-seed-validate"}'::jsonb,
        'Smoke report entry',
        ARRAY[]::text[],
        ARRAY[]::text[],
        ARRAY[]::text[],
        'draft',
        ARRAY[]::text[],
        'smoke-script',
        $2,
        '{"mode":"validation"}'::jsonb,
        NOW()
      )
      RETURNING id
    `,
    userId,
    chatSessionId,
  )

  decisionObjectId = decisionRows[0]?.id ?? ""
  if (!decisionObjectId) {
    throw new Error("Failed to create decision object")
  }

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO billing_entitlements (
        account_key,
        email,
        tier,
        provider,
        paypal_subscription_id,
        paypal_status,
        last_event_type,
        updated_at,
        created_at
      )
      VALUES ($1, $2, 'team', 'paypal', $3, 'active', 'SMOKE_TEST', NOW(), NOW())
      ON CONFLICT (account_key) DO UPDATE
      SET
        email = EXCLUDED.email,
        tier = EXCLUDED.tier,
        provider = EXCLUDED.provider,
        paypal_subscription_id = EXCLUDED.paypal_subscription_id,
        paypal_status = EXCLUDED.paypal_status,
        last_event_type = EXCLUDED.last_event_type,
        updated_at = NOW()
    `,
    billingAccountKey,
    userEmail,
    billingSubscriptionId,
  )
}

async function validateRows() {
  const [profileRows, sessionRows, messageRows, decisionRows, billingRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM user_profiles WHERE user_id = $1`,
      userId,
    ),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      chatSessionId,
      userId,
    ),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM chat_messages WHERE session_id = $1 AND user_id = $2`,
      chatSessionId,
      userId,
    ),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM decision_objects WHERE id = $1 AND owner_id = $2`,
      decisionObjectId,
      userId,
    ),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM billing_entitlements WHERE account_key = $1`,
      billingAccountKey,
    ),
  ])

  return {
    userProfile: (profileRows[0]?.count ?? 0) > 0,
    chatSession: (sessionRows[0]?.count ?? 0) > 0,
    chatMessage: (messageRows[0]?.count ?? 0) > 0,
    decisionObject: (decisionRows[0]?.count ?? 0) > 0,
    billingEntitlement: (billingRows[0]?.count ?? 0) > 0,
  }
}

async function cleanupRows() {
  await prisma.$executeRawUnsafe(`DELETE FROM billing_entitlements WHERE account_key = $1`, billingAccountKey)
  if (decisionObjectId) {
    await prisma.$executeRawUnsafe(`DELETE FROM decision_objects WHERE id = $1`, decisionObjectId)
  }
  if (chatSessionId) {
    await prisma.$executeRawUnsafe(`DELETE FROM chat_messages WHERE session_id = $1`, chatSessionId)
    await prisma.$executeRawUnsafe(`DELETE FROM chat_sessions WHERE id = $1`, chatSessionId)
  }
  await prisma.$executeRawUnsafe(`DELETE FROM user_profiles WHERE user_id = $1`, userId)
  await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = $1`, userId)
}

async function main() {
  console.log("Running enterprise seed validation...")
  await seedRows()
  const checks = await validateRows()

  const entries = Object.entries(checks)
  let failed = 0
  for (const [name, passed] of entries) {
    const icon = passed ? "✅" : "❌"
    console.log(`${icon} ${name}`)
    if (!passed) failed += 1
  }

  if (!values.keep) {
    await cleanupRows()
    console.log("Cleanup complete.")
  } else {
    console.log("Keeping seeded rows because --keep was provided.")
    console.log(`userId=${userId}`)
    console.log(`chatSessionId=${chatSessionId}`)
    console.log(`decisionObjectId=${decisionObjectId}`)
    console.log(`billingAccountKey=${billingAccountKey}`)
  }

  if (failed > 0) {
    throw new Error(`Enterprise validation failed (${failed}/${entries.length}).`)
  }

  console.log(`Enterprise validation passed (${entries.length}/${entries.length}).`)
}

void main()
  .catch(async (error) => {
    console.error(error)
    if (!values.keep) {
      try {
        await cleanupRows()
      } catch (cleanupError) {
        console.error("Cleanup after failure also failed:", cleanupError)
      }
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

