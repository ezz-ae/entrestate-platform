import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { getUserListing, deleteUserListing, ListingError } from "@/lib/listings/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  const { id } = await params
  try {
    const listing = await getUserListing(id)
    if (!listing) return NextResponse.json({ error: "Not found", requestId }, { status: 404 })
    return NextResponse.json({ listing, requestId })
  } catch (err) {
    if (err instanceof ListingError) {
      const status = err.code === "unauthorized" ? 401 : 500
      return NextResponse.json({ error: err.message, requestId }, { status })
    }
    return NextResponse.json({ error: "Internal error", requestId }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  const { id } = await params
  try {
    await deleteUserListing(id)
    return NextResponse.json({ ok: true, requestId })
  } catch (err) {
    if (err instanceof ListingError) {
      const status = err.code === "unauthorized" ? 401 : 500
      return NextResponse.json({ error: err.message, requestId }, { status })
    }
    return NextResponse.json({ error: "Internal error", requestId }, { status: 500 })
  }
}
