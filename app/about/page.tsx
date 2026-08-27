import { getPageContent } from "@/lib/freehold/site-content"
import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/freehold/brand"

// The company name is the brand config's — the platform's own by default, a
// client's when they set NEXT_PUBLIC_BRAND_*. No hardcoded client legacy name.
const LEGAL_ENTITY = BRAND.legalName
import { Target, Eye, ArrowRight, Quote } from "lucide-react"
import Link from "next/link"
import { getPublishedFrontLayout } from "@/lib/freehold/front-layout"
import { FrontCanvas } from "@/components/front/render"

export const metadata = {
  title: `About ${BRAND.legalName} — Dubai Real Estate`,
  description: `${LEGAL_ENTITY} — Dubai real estate advisory and market intelligence: sales, leasing, investments, and consultancy for global investors.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${BRAND.legalName} — Dubai Real Estate`,
    description: "Full-service Dubai brokerage with deep market knowledge and ethical practice — sales, leasing, advisory, and valuation.",
    url: "/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `About ${BRAND.legalName} UAE` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About ${BRAND.legalName} UAE`,
    images: ["/og-image.png"],
  },
}

const chapters = [
  {
    eyebrow: "01 · Mission",
    title: "Make Dubai property decisions clear.",
    body: "Full-service brokerage with deep market knowledge and ethical practice — sales, leasing, advisory, and valuation, all from one desk.",
    icon: Target,
  },
  {
    eyebrow: "02 · Vision",
    title: "The standard for institutional advisory.",
    body: "Innovation, productivity, and integrity — the way we think about every project, every client, every brief.",
    icon: Eye,
  },
]

// Brokerage track-record claims — brand-driven and withheld when empty, so the
// platform never attributes another company's numbers to itself.
const stats = [
  BRAND.yearsExperience ? { value: BRAND.yearsExperience, suffix: "yrs", label: "in the Dubai market" } : null,
  BRAND.projectsMapped ? { value: BRAND.projectsMapped, suffix: "", label: "Projects mapped" } : null,
  BRAND.clientsServed ? { value: BRAND.clientsServed, suffix: "", label: "Clients served" } : null,
].filter(Boolean) as Array<{ value: string; suffix: string; label: string }>

const principles = [
  { number: "01", title: "Conviction over volume", body: "We curate, we don't carpet-bomb. A shortlist of five with reasoning beats fifty without." },
  { number: "02", title: "Numbers, not narratives", body: "Every recommendation comes with ROI math, payment-plan modeling, and exit assumptions." },
  { number: "03", title: "Senior team, not relays", body: "You speak with the advisor who handles your brief — same line from first call to closing." },
]

export default async function AboutPage() {
  // Web Studio → Content overrides; built-in words are the fallback.
  const content = await getPageContent('about')
  // Web Studio → Page Builder. Null = the built-in order and colors.
  const layout = await getPublishedFrontLayout('about')

  const sections: Record<string, React.ReactNode> = {

    hero: (
      <section className="relative overflow-hidden fp-dark-bg pt-32 pb-28 text-white md:pt-40 md:pb-40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(212,175,55,0.18),transparent)]" />
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.10),transparent_55%)] blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <div className="grid items-end gap-14 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] fp-accent-soft backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full fp-accent-bg" />
                About {BRAND.company}
              </span>
              <h1 className="mt-8 font-serif text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
                {content.heroTitle ?? <>Dubai property,<br />
                <span className="freehold-text-gradient italic">decoded.</span></>}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/55">
                {content.heroIntro ?? `${LEGAL_ENTITY} is built around one idea — clients should never have to guess. Deep Dubai market coverage, projects mapped and scored from the transaction record, and senior advisors who own every brief end-to-end.`}
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-10">
                {stats.slice(0, 2).map((s) => (
                  <div key={s.label}>
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-5xl font-bold text-white md:text-6xl">{s.value}</span>
                      <span className="text-2xl font-bold fp-accent">{s.suffix}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote card */}
            <aside className="relative">
              <div className="absolute -inset-3 -z-10 rounded-[36px] bg-gradient-to-br from-[#D4AC50]/15 via-transparent to-transparent opacity-70 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
                <Quote className="h-8 w-8 fp-accent/60" />
                <blockquote className="mt-6 font-serif text-xl leading-relaxed text-white md:text-2xl">
                  &quot;Navigating Dubai&apos;s growth corridors with institutional rigor.&quot;
                </blockquote>
                <div className="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AC50]/25 bg-gradient-to-br from-[#D4AC50]/20 to-transparent">
                    <Target className="h-5 w-5 fp-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] fp-accent">Conviction Desk</p>
                    <p className="mt-1 text-[13px] text-white/60">Curated exclusively · senior advisors</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    ),

    mission: (
      <section className="relative bg-background py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_20%,rgba(198,155,62,0.04),transparent)]" />
        <div className="container relative z-10">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
            {chapters.map((c) => {
              const Icon = c.icon
              return (
                <article key={c.eyebrow} className="group relative overflow-hidden rounded-[28px] border border-foreground/[0.06] bg-white p-8 shadow-[0_24px_80px_-50px_rgba(21,46,36,0.18)] transition-all hover:-translate-y-1 hover:border-primary/25 md:p-10">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/[0.04] text-primary ring-1 ring-primary/15">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/35">{c.eyebrow}</span>
                  </div>
                  <h2 className="mt-7 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">{c.title}</h2>
                  <p className="mt-5 text-[15px] leading-relaxed text-foreground/60 md:text-base">{c.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    ),

    principles: (
      <section className="relative fp-cream-bg py-20 md:py-28">
        <div className="container">
          <div className="mb-14 max-w-2xl md:mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">How We Operate</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-[1.05] text-foreground md:text-5xl">
              Three things we won't compromise on.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:gap-7">
            {principles.map((p) => (
              <div key={p.number} className="relative rounded-[24px] border border-foreground/[0.06] bg-white p-8 transition-all hover:border-primary/30 hover:shadow-[0_24px_60px_-40px_rgba(21,46,36,0.2)]">
                <div className="font-serif text-[68px] font-bold leading-none text-primary/25">{p.number}</div>
                <h3 className="mt-3 font-serif text-xl font-semibold text-foreground md:text-2xl">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/55">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    stats: (
      <section className="relative overflow-hidden bg-foreground py-24 text-white md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,155,62,0.10),transparent)]" />
        <div className="container relative z-10">
          <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] fp-accent">By the Numbers</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
              The track record speaks.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {stats.map((s) => (
              <div key={s.label} className="group rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-7 text-center backdrop-blur-sm transition-all hover:border-[#D4AC50]/30 hover:bg-white/[0.05] md:p-9">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-serif text-5xl font-bold text-white transition-transform duration-500 group-hover:scale-105 md:text-6xl">{s.value}</span>
                  <span className="text-2xl font-bold fp-accent">{s.suffix}</span>
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    cta: (
      <section className="relative overflow-hidden bg-background py-24 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Start a Brief</p>
            <h2 className="mt-5 font-serif text-4xl font-bold leading-[1.02] text-foreground md:text-6xl lg:text-7xl">
              Talk to the<br/><span className="freehold-text-gradient italic">conviction desk.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-foreground/55">
              A 30-minute call with a senior advisor. We'll map the goal, the budget, and the next two moves.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="freehold-gradient h-14 rounded-xl px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground" asChild>
                <Link href="/contact">Schedule Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 rounded-xl border-foreground/10 bg-white px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground hover:bg-white/80" asChild>
                <Link href="/properties">Portfolio Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    ),
  }

  return <FrontCanvas page="about" layout={layout} sections={sections} className="bg-background" />
}
