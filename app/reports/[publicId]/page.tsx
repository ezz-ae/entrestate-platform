import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { prisma } from "@/lib/prisma"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { SEO, absoluteUrl } from "@/lib/seo"

type ReportParams = { params: Promise<{ publicId: string }> }

export async function generateMetadata({ params }: ReportParams): Promise<Metadata> {
  const { publicId } = await params
  const report = await prisma.assistantReport.findUnique({
    where: { publicId },
    select: { title: true, publicId: true, createdAt: true, payload: true },
  })

  if (!report) {
    return {
      title: "Report Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const transcript = ((report.payload as { transcript?: string } | null)?.transcript ?? "").trim()
  const description = transcript ? `${transcript.slice(0, 150)}...` : "Investor-grade market intelligence report by Entrestate."
  const url = `/reports/${report.publicId}`

  return {
    title: report.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${report.title} | ${SEO.siteName}`,
      description,
      url,
      type: "article",
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    twitter: {
      card: "summary_large_image",
      title: `${report.title} | ${SEO.siteName}`,
      description,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

export default async function ReportPage({ params }: ReportParams) {
  const { publicId } = await params
  const report = await prisma.assistantReport.findUnique({
    where: { publicId },
  })

  if (!report) {
    notFound()
  }

  const content = report.payload as {
    transcript: string,
    cards: any[],
    comparison: any[],
    scenario: any,
    generatedAt: string,
    profile: {
        evidence: {
            tableHash: string,
            sources: string[],
            filters: any[],
            assumptions: string[],
            signals: string[],
            scope: any,
            timeRange: any,
        }
            }
  };

  const reportJsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    headline: report.title,
    datePublished: report.createdAt.toISOString(),
    dateModified: report.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
    mainEntityOfPage: absoluteUrl(`/reports/${report.publicId}`),
  }

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reportJsonLd) }}
      />
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl reading-container">
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance mb-6">
              {report.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
              Generated on {new Date(report.createdAt).toLocaleDateString()}
            </p>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 mb-8">
              <ReadingControls />
              <div className="mt-3 flex flex-wrap gap-2">
                <ExplainWithChat prompt={`Explain the report "${report.title}" and the key takeaways.`} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Use Reading mode for calmer spacing. Switch Day/Night for eye comfort.
              </p>
            </div>

            <div className="prose dark:prose-invert max-w-none reading-copy">
              <p className="text-base text-foreground/90 leading-relaxed">
                {content.transcript}
              </p>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Evidence Drawer</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Sources</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {content.profile.evidence.sources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Assumptions</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {content.profile.evidence.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Signals</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {content.profile.evidence.signals.map((signal, index) => (
                      <li key={index}>{signal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
