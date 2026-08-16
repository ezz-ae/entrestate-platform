import { NextResponse } from "next/server"
import { LATEST_LIBRARY_REPORT } from "@/lib/latest-library-report"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let email: string | undefined
  try {
    const body = await req.json()
    email = typeof body.email === "string" ? body.email.trim() : undefined
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(apiKey)
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.entrestate.com"
      const reportUrl = `${origin}${LATEST_LIBRARY_REPORT.href}`

      await resend.emails.send({
        from: "Entrestate Research <reports@entrestate.com>",
        to: email,
        subject: `Entrestate Report: ${LATEST_LIBRARY_REPORT.title}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #e2e8f0; background: #0d1117;">
            <div style="margin-bottom: 32px;">
              <div style="display: inline-flex; gap: 4px; margin-bottom: 16px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: #f8fafc;"></div>
                <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(248,250,252,0.5);"></div>
                <div style="width: 10px; height: 10px; border-radius: 2px; background: #14b8a6;"></div>
              </div>
              <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #14b8a6; margin: 0 0 10px;">${LATEST_LIBRARY_REPORT.category}</p>
              <h1 style="font-size: 22px; font-weight: 600; color: #f8fafc; margin: 0 0 12px; line-height: 1.3;">${LATEST_LIBRARY_REPORT.title}</h1>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">${LATEST_LIBRARY_REPORT.subtitle}</p>
            </div>
            <div style="border: 1px solid #1e293b; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; background: #0f172a;">
              <p style="font-size: 12px; color: #475569; margin: 0;">Published ${LATEST_LIBRARY_REPORT.date} · Entrestate Research</p>
            </div>
            <a href="${reportUrl}" style="display: inline-block; background: #14b8a6; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-bottom: 24px;">
              Read Full Report →
            </a>
            <p style="font-size: 12px; color: #334155; margin: 0;">
              You requested this report via Entrestate. No ongoing subscription was created.<br/>
              <a href="${origin}/reports/library" style="color: #475569;">Browse all published reports</a>
            </p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Library report email failed:", err)
      // Still return ok — don't fail the user request
    }
  }

  return NextResponse.json({ ok: true })
}
