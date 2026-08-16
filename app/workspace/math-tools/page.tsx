"use client"

import { useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, Calculator, Percent } from "lucide-react"

export default function MathToolsPage() {
  const [price, setPrice] = useState("1500000")
  const [annualRent, setAnnualRent] = useState("90000")
  const [serviceFee, setServiceFee] = useState("12000")
  const [planTotal, setPlanTotal] = useState("2000000")
  const [bookingPct, setBookingPct] = useState("10")
  const [handoverPct, setHandoverPct] = useState("40")
  const [postPct, setPostPct] = useState("10")

  const yieldSummary = useMemo(() => {
    const priceValue = Number(price)
    const rentValue = Number(annualRent)
    const feeValue = Number(serviceFee)
    if (!Number.isFinite(priceValue) || priceValue <= 0) return null
    const gross = rentValue / priceValue
    const net = (rentValue - feeValue) / priceValue
    return {
      gross: gross * 100,
      net: net * 100,
    }
  }, [price, annualRent, serviceFee])

  const planSummary = useMemo(() => {
    const total = Number(planTotal)
    const booking = Number(bookingPct)
    const handover = Number(handoverPct)
    const post = Number(postPct)
    if (!Number.isFinite(total) || total <= 0) return null
    const upfront = (total * booking) / 100
    const handoverAmt = (total * handover) / 100
    const postAmt = (total * post) / 100
    const remaining = total - upfront - handoverAmt - postAmt
    return {
      total,
      upfront,
      handoverAmt,
      postAmt,
      remaining,
    }
  }, [planTotal, bookingPct, handoverPct, postPct])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Workspace</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Math tools
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Convert market facts into clear, defensible calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calculator className="w-4 h-4 text-accent" />
                Yield calculator
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Estimate gross and net yield from price and rent.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Price (AED)</label>
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Annual rent (AED)</label>
                  <input
                    value={annualRent}
                    onChange={(event) => setAnnualRent(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Service fee (AED)</label>
                  <input
                    value={serviceFee}
                    onChange={(event) => setServiceFee(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Gross yield</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {yieldSummary ? `${yieldSummary.gross.toFixed(2)}%` : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Net yield</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {yieldSummary ? `${yieldSummary.net.toFixed(2)}%` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Percent className="w-4 h-4 text-accent" />
                Payment plan builder
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Split a project price across booking, handover, and post-handover.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Total price (AED)</label>
                  <input
                    value={planTotal}
                    onChange={(event) => setPlanTotal(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Booking %</label>
                  <input
                    value={bookingPct}
                    onChange={(event) => setBookingPct(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Handover %</label>
                  <input
                    value={handoverPct}
                    onChange={(event) => setHandoverPct(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Post-handover %</label>
                  <input
                    value={postPct}
                    onChange={(event) => setPostPct(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Booking amount</span>
                  <span className="text-foreground">
                    {planSummary ? `AED ${planSummary.upfront.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Handover amount</span>
                  <span className="text-foreground">
                    {planSummary ? `AED ${planSummary.handoverAmt.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Post-handover amount</span>
                  <span className="text-foreground">
                    {planSummary ? `AED ${planSummary.postAmt.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining balance</span>
                  <span className="text-foreground">
                    {planSummary ? `AED ${planSummary.remaining.toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Open market calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
