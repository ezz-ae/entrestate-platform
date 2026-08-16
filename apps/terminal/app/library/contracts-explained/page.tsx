import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Scale, Clock, ArrowRight } from "lucide-react"
import { libraryArticles } from "@/lib/library-data"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"

export default function ContractsExplainedPage() {
  const contracts = libraryArticles.filter((article) => article.category === "contracts")

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Library</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Contracts explained
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Clear guides for MOUs, transfer fees, and transaction timelines.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 mb-12">
            <ReadingControls />
            <div className="mt-3">
              <ExplainWithChat prompt="Explain the contract guides and when to use each one." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((article) => (
              <Link
                key={article.slug}
                href={`/library/${article.slug}`}
                className="group p-6 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                    {article.tag}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Scale className="w-3.5 h-3.5 text-accent" />
                  <span>{article.date}</span>
                </div>
                <h3 className="text-base font-medium text-foreground mb-2 leading-snug group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {article.description}
                </p>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  Read guide
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
