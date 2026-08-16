export function getRequestId(request?: Request) {
  const headerId = request?.headers.get("x-request-id")
  if (headerId && headerId.trim()) return headerId
  return crypto.randomUUID()
}

export function getPublicErrorMessage(error: unknown, fallback: string) {
  if (process.env.NODE_ENV === "production") return fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}
