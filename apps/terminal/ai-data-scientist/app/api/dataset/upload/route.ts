import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Uploads are disabled for the market desk." },
    { status: 403 },
  )
}
