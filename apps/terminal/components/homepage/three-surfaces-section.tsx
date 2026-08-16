import Link from "next/link"
import { MessageSquareText, Table2, Map } from "lucide-react"
import { CopilotEntryLink } from "@/components/copilot-entry-link"

type SurfaceItem = {
  title: string
  description: string
  href: string
}

const DEFAULT_SURFACES: SurfaceItem[] = [
  {
    title: "Decision Tunnel",
    description: "Share your target and constraints. Get a clear shortlist.",
    href: "/chat",
  },
  {
    title: "Market Table Builder",
    description: "Build, save, and compare structured market tables.",
    href: "/top-data",
  },
  {
    title: "Area Trust Map",
    description: "Supply pressure heatmaps and neighborhood patterns.",
    href: "/markets",
  },
]

function iconForTitle(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes("time") || normalized.includes("table")) return Table2
  if (normalized.includes("map") || normalized.includes("spatial")) return Map
  return MessageSquareText
}

export function ThreeSurfacesSection({ surfaces = DEFAULT_SURFACES }: { surfaces?: SurfaceItem[] }) {
  return (
    <section className="mt-8">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Three Workflows</p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {surfaces.slice(0, 3).map((surface) => {
          const Icon = iconForTitle(surface.title)
          const className = "rounded-2xl border border-border/70 bg-card/70 p-5"
          const content = (
            <>
              <Icon className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-foreground">{surface.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{surface.description}</p>
            </>
          )

          return surface.href === "/chat" ? (
            <CopilotEntryLink key={surface.title} className={className}>
              {content}
            </CopilotEntryLink>
          ) : (
            <Link key={surface.title} href={surface.href} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
