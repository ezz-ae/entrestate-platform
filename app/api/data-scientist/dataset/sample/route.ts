import { NextResponse } from "next/server"
export async function POST() {
  return NextResponse.json(
    { error: "Sample datasets are disabled in this workspace." },
    { status: 403 },
  )
}

export async function GET() {
  return NextResponse.json({ error: "Sample datasets are disabled in this workspace." }, { status: 403 })
}
