import Link from "next/link"
import { Button } from "@/components/ui/button"

type Shortcut = {
  label: string
  href: string
}

const DEFAULT_GOLDEN_PATHS: Shortcut[] = [
  { label: "Underwrite Development Site", href: "/tools/stress-test" },
  { label: "Compare Area Yields", href: "/areas" },
  { label: "Draft SPA Contract", href: "/tools/memo" },
  { label: "Golden Visa Qualifier", href: "/golden-visa" },
  { label: "Stress Test Portfolio", href: "/tools/portfolio" },
]

export function GoldenPathsSection({ shortcuts = DEFAULT_GOLDEN_PATHS }: { shortcuts?: Shortcut[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Golden Path Shortcuts</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {shortcuts.slice(0, 5).map((path) => (
          <Button key={path.label} variant="outline" asChild>
            <Link href={path.href}>{path.label}</Link>
          </Button>
        ))}
      </div>
    </section>
  )
}
