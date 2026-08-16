import { describe, expect, it } from "vitest"
import { getPublicErrorMessage } from "@/lib/api-errors"
import { GET as marketsGet } from "@/app/api/markets/route"

describe("api error helpers", () => {
  it("hides error details in production", () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    expect(getPublicErrorMessage(new Error("Sensitive"), "Service unavailable.")).toBe("Service unavailable.")
    process.env.NODE_ENV = original
  })

  it("returns error details outside production", () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = "test"
    expect(getPublicErrorMessage(new Error("Sensitive"), "Service unavailable.")).toBe("Sensitive")
    process.env.NODE_ENV = original
  })
})

describe("api error shape", () => {
  it("returns requestId on validation errors", async () => {
    const response = await marketsGet(new Request("http://localhost/api/markets?limit=not-a-number"))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty("error")
    expect(body).toHaveProperty("requestId")
  })
})
