import Link from "next/link"
import { Button } from "@/components/ui/button"

type Tier = {
  name: string
  price: string
  description: string
  href: string
  cta: string
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Solo Analyst",
    price: "$299/mo",
    description: "Professional research for independent investors with L1 provenance.",
    href: "/pricing",
    cta: "Get Started",
  },
  {
    name: "Realtor Pro",
    price: "$499/mo",
    description: "Institutional evidence with personal branding for client deliverables.",
    href: "/pricing",
    cta: "Get Started",
  },
  {
    name: "Entrestate OS",
    price: "$2,500/mo",
    description: "Full infrastructure: 5 seats, API substrate, and Automation Studio.",
    href: "/pricing",
    cta: "Go Enterprise",
  },
  {
    name: "Institutional",
    price: "Custom",
    description: "Unlimited scale, on-prem AI, and custom data node integration.",
    href: "mailto:hello@entrestate.com",
    cta: "Contact Sales",
  },
]

export function PricingSection({ tiers = DEFAULT_TIERS }: { tiers?: Tier[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Pricing</p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.slice(0, 4).map((tier) => (
          <article key={tier.name} className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-semibold text-foreground">{tier.name}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{tier.price}</p>
            <p className="mt-2 text-xs text-muted-foreground">{tier.description}</p>
            <Button className="mt-4 w-full" variant={tier.name === "Starter" ? "outline" : "default"} asChild>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
