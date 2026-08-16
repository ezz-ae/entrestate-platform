"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, X, Mail, ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { useNewReport, markReportSeen } from "@/hooks/use-new-report"
import { stripLocalePrefix } from "@/i18n/locale"

export function ReportNudge() {
  const pathname = usePathname()
  const normalizedPathname = stripLocalePrefix(pathname)
  const { report, dismiss } = useNewReport()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)

  // Quietly fade in after a short delay — no aggressive entrance
  useEffect(() => {
    if (!report) return
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [report])

  // Auto-dismiss when user navigates to their reports
  useEffect(() => {
    if (
      normalizedPathname.startsWith("/account/reports") ||
      normalizedPathname.startsWith("/reports/generated") ||
      normalizedPathname.startsWith("/reports/library")
    ) {
      setVisible(false)
    }
  }, [normalizedPathname])

  const handleDismiss = () => {
    setVisible(false)
    setOpen(false)
    // Small delay so the fade-out finishes before marking seen
    setTimeout(() => report && dismiss(report.id), 400)
  }

  const handleEmail = async () => {
    if (!report || sending) return
    setSending(true)
    try {
      await fetch(`/api/reports/${report.id}/email`, { method: "POST" })
      setEmailSent(true)
      // Mark seen after email sent — won't show this report again
      markReportSeen(report.id)
      setTimeout(handleDismiss, 2200)
    } catch {
      setEmailSent(true)
    } finally {
      setSending(false)
    }
  }

  if (!report) return null

  return (
    <div
      className="fixed bottom-6 right-5 z-[200] flex flex-col items-end gap-0"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* ── Expanded card — only when open ── */}
      <div
        style={{
          maxHeight: open ? "220px" : "0px",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease",
          marginBottom: open ? "6px" : "0px",
        }}
      >
        <div className="w-[290px] rounded-2xl border border-border/60 bg-card/96 shadow-xl shadow-black/30 backdrop-blur-xl overflow-hidden">
          {/* Glow line */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-4">
            {emailSent ? (
              <div className="flex flex-col items-center justify-center gap-2 py-3 text-center">
                <Mail className="h-5 w-5 text-primary" />
                <p className="text-xs font-medium text-foreground">Sent to your inbox</p>
                <p className="text-[10px] text-muted-foreground/60">Check your email — it's on its way.</p>
              </div>
            ) : (
              <>
                {/* Report row */}
                <div className="mb-3 flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/60 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground leading-snug">
                      {report.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEmail}
                    disabled={sending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    {sending ? "Sending…" : "Email me this"}
                  </button>
                  <Link
                    href={`/reports/${report.publicId}`}
                    onClick={handleDismiss}
                    className="flex items-center justify-center gap-1 rounded-lg border border-border/50 px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating pill ── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-card/90 px-3.5 py-2 shadow-md shadow-black/20 backdrop-blur-md transition-all hover:border-border hover:bg-card"
          >
            <div className="relative">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <span className="max-w-[140px] truncate text-[11px] text-muted-foreground">
              {report.title}
            </span>
          </button>

          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-card/80 text-muted-foreground/50 backdrop-blur-md transition-all hover:border-border/60 hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
