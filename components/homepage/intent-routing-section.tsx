import Link from "next/link"

type IntentCard = {
  key: string
  label: string
  count: number
}

type Props = {
  intents: IntentCard[]
}

export function IntentRoutingSection({ intents }: Props) {
  return (
    <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">What&apos;s Your Outcome?</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {intents.map((intent) => (
          <Link
            key={intent.key}
            href={`/properties?intent=${encodeURIComponent(intent.key)}`}
            className="rounded-xl border border-border/60 bg-background/40 p-4"
          >
            <p className="text-sm font-medium text-foreground">{intent.label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{intent.count.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
