import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_COVERS = [
  "/covers/cover-01.svg",
  "/covers/cover-02.svg",
  "/covers/cover-03.svg",
  "/covers/cover-04.svg",
  "/covers/cover-05.svg",
  "/covers/cover-06.svg",
]

const NULLISH = new Set(["", "null", "undefined", "nan", "none"])

type MediaRow = {
  project_id: number | null
  name: string | null
  area: string | null
  city_clean: string | null
  hero_image_url: string | null
  amenities_list: string | null
  payment_plan_structure: string | null
  delivery_date: string | null
  bedroom_types: string | null
  demand_hotness: string | null
  verified_image: string | null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeValue(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

function parseList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  const raw = normalizeValue(value)
  if (!raw || NULLISH.has(raw.toLowerCase())) return []
  if ((raw.startsWith("[") && raw.endsWith("]")) || raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean)
      }
    } catch {
      // Fall through to string parsing.
    }
  }
  return raw
    .replace(/^\[|\]$/g, "")
    .split(/\s*[|,;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function dedupe(list: string[]) {
  const seen = new Set<string>()
  return list.filter((item) => {
    const key = item.trim()
    if (!key || NULLISH.has(key.toLowerCase()) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "60", 10)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 60

  let rows: MediaRow[] = []
  try {
    rows = await prisma.$queryRaw<MediaRow[]>(Prisma.sql`
      SELECT
        me.project_id,
        me.name,
        em.area,
        COALESCE(em.city_clean, em.city) AS city_clean,
        me.hero_image_url,
        me.amenities_list,
        me.payment_plan_structure,
        me.delivery_date,
        me.bedroom_types,
        me.demand_hotness,
        me.verified_image
      FROM media_enrichment AS me
      LEFT JOIN entrestate_master AS em
        ON em.project_id = me.project_id
      WHERE me.name IS NOT NULL
      ORDER BY me.verified_image DESC NULLS LAST, me.project_id DESC
      LIMIT ${limit};
    `)
  } catch (error) {
    console.error("Media library query failed, using fallback:", error)
    rows = await prisma.$queryRaw<MediaRow[]>(Prisma.sql`
      SELECT
        me.project_id,
        me.name,
        NULL::text AS area,
        NULL::text AS city_clean,
        me.hero_image_url,
        me.amenities_list,
        me.payment_plan_structure,
        me.delivery_date,
        me.bedroom_types,
        me.demand_hotness,
        me.verified_image
      FROM media_enrichment AS me
      WHERE me.name IS NOT NULL
      ORDER BY me.verified_image DESC NULLS LAST, me.project_id DESC
      LIMIT ${limit};
    `)
  }

  const projects = rows
    .filter((row) => row.name)
    .map((row, index) => {
      const media = dedupe([row.hero_image_url ?? ""]).filter(Boolean)
      const cover =
        row.hero_image_url ||
        media[0] ||
        FALLBACK_COVERS[index % FALLBACK_COVERS.length] ||
        FALLBACK_COVERS[0]

      const location = [row.area, row.city_clean].filter(Boolean).join(", ")
      const name = row.name?.trim() || "Untitled Project"
      const id = row.project_id ? String(row.project_id) : slugify(name) || `project-${index + 1}`

      return {
        id,
        name,
        location: location || "UAE",
        cover,
        media: media.length > 0 ? media.slice(0, 8) : [cover],
      }
    })

  return NextResponse.json({
    projects,
    source: "media_enrichment",
    count: projects.length,
  })
}
