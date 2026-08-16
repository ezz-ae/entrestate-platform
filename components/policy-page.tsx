import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GridBackground } from "@/components/grid-background"
import { ScrollToTop } from "@/components/scroll-to-top"

export type PolicySection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type PolicyDocument = {
  eyebrow: string
  title: string
  subtitle: string
  intro: string
  sections: PolicySection[]
  footerNote?: string
  footerLink?: {
    href: string
    label: string
  }
}

export function PolicyPage({ document }: { document: PolicyDocument }) {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <GridBackground />

      <div className="relative pb-24 pt-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-accent">{document.eyebrow}</p>
            <h1 className="mb-3 text-4xl font-bold text-foreground md:text-5xl">{document.title}</h1>
            <p className="mb-4 text-sm text-muted-foreground">{document.subtitle}</p>

            <div className="rounded-xl border border-border/50 bg-card/50 p-8 md:p-10">
              <p className="mb-10 leading-relaxed text-muted-foreground">{document.intro}</p>

              <div className="space-y-8">
                {document.sections.map((section) => (
                  <section key={section.title} className="border-b border-border/40 pb-8 last:border-0 last:pb-0">
                    <h2 className="mb-4 text-xl font-semibold text-foreground">{section.title}</h2>

                    <div className="space-y-3">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="leading-relaxed text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {section.bullets && section.bullets.length > 0 ? (
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 leading-relaxed">
                            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              {document.footerNote ? (
                <div className="mt-12 border-t border-border/50 pt-8 text-sm text-muted-foreground">
                  <span>{document.footerNote}</span>
                  {document.footerLink ? (
                    <>
                      {" "}
                      <Link href={document.footerLink.href} className="text-primary hover:underline">
                        {document.footerLink.label}
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
