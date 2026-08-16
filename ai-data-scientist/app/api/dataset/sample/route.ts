import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Samples are disabled for the market desk." },
    { status: 403 },
  )
}

export async function GET() {
  return NextResponse.json(
    { error: "Samples are disabled for the market desk." },
    { status: 403 },
  )
}
