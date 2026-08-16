import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import type { ArabicDocsPageContent } from "@/lib/docs-arabic-pages"

export function ArabicDocPage({
  locale,
  content,
}: {
  locale: AppLocale
  content: ArabicDocsPageContent
}) {
  return (
    <>
      <Link
        href={prefixLocalePath("/docs", locale)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة إلى مركز الوثائق
      </Link>

      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{content.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">{content.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{content.intro}</p>
      </header>

      <section className="space-y-4">
        {content.sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      {content.related && content.related.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-6">
          <h2 className="text-lg font-semibold text-foreground">روابط مرتبطة</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {content.related.map((item) => (
              <Link
                key={item.href}
                href={prefixLocalePath(item.href, locale)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
