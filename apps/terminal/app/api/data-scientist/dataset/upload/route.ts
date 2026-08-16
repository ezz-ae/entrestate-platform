import { NextResponse } from "next/server"
export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Uploads are disabled. Use the managed Entrestate data sources." },
    { status: 403 },
  )
}
