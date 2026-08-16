import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { documentationMindMap, type MindMapNode } from "@/lib/platform-docs"
import { getArticleByTitle } from "@/lib/docs-articles"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"

const branchThemes = [
  {
    shell: "border-sky-500/25 bg-sky-500/[0.05]",
    branch: "border-sky-500/35 bg-sky-500/10",
    node: "border-sky-500/25 hover:border-sky-400/45",
  },
  {
    shell: "border-violet-500/25 bg-violet-500/[0.05]",
    branch: "border-violet-500/35 bg-violet-500/10",
    node: "border-violet-500/25 hover:border-violet-400/45",
  },
  {
    shell: "border-emerald-500/25 bg-emerald-500/[0.05]",
    branch: "border-emerald-500/35 bg-emerald-500/10",
    node: "border-emerald-500/25 hover:border-emerald-400/45",
  },
  {
    shell: "border-amber-500/25 bg-amber-500/[0.05]",
    branch: "border-amber-500/35 bg-amber-500/10",
    node: "border-amber-500/25 hover:border-amber-400/45",
  },
  {
    shell: "border-rose-500/25 bg-rose-500/[0.05]",
    branch: "border-rose-500/35 bg-rose-500/10",
    node: "border-rose-500/25 hover:border-rose-400/45",
  },
  {
    shell: "border-cyan-500/25 bg-cyan-500/[0.05]",
    branch: "border-cyan-500/35 bg-cyan-500/10",
    node: "border-cyan-500/25 hover:border-cyan-400/45",
  },
]

function hasNestedChildren(nodes: MindMapNode[]) {
  return nodes.some((node) => Boolean(node.children?.length))
}

function ArticleNode({
  title,
  hrefBase,
  className,
  summary = false,
}: {
  title: string
  hrefBase: string
  className: string
  summary?: boolean
}) {
  const article = getArticleByTitle(title)

  if (!article) {
    return (
      <article className={className}>
        <p className="text-sm font-medium text-foreground">{title}</p>
      </article>
    )
  }

  return (
    <Link href={`${hrefBase}/${article.slug}`} className={`${className} block transition-colors`}>
      <p className="text-sm font-semibold text-foreground">{article.title}</p>
      {summary ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{article.summary}</p> : null}
    </Link>
  )
}

export async function DocumentationMindMap() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const rootArticle = getArticleByTitle(documentationMindMap.root)
  const articlesHref = prefixLocalePath("/docs/articles", locale)
  const copy = {
    title: isArabic ? "خريطة المنصة" : "Mind Map",
    openAll: isArabic ? "افتح جميع المقالات" : "Open all articles",
    rootArticle: isArabic ? "المقالة الجذرية" : "Root article",
    rootNode: isArabic ? "العقدة الجذرية" : "Root node",
    branchLabel: isArabic ? "مسار" : "Branch",
    stageLabel: isArabic ? "مرحلة" : "Stage",
  }

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/70 p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArabic
              ? "اقرأ البنية كمسارات مترابطة بدلاً من لوحة أفقية مزدحمة."
              : "Read the system as connected operating lanes instead of a crowded horizontal board."}
          </p>
        </div>
        <Link
          href={articlesHref}
          className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
        >
          {copy.openAll}
          <ArrowRight className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} />
        </Link>
      </div>

      <div className="relative">
        <div className="mx-auto max-w-xl">
          {rootArticle ? (
            <Link
              href={`${articlesHref}/${rootArticle.slug}`}
              className="block rounded-2xl border border-accent/40 bg-accent/10 px-5 py-5 text-center transition-colors hover:border-accent/60"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/75">{copy.rootArticle}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{documentationMindMap.root}</p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 px-5 py-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/75">{copy.rootNode}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{documentationMindMap.root}</p>
            </div>
          )}
        </div>

        <div className="mx-auto mt-5 hidden h-8 w-px bg-border/60 lg:block" />

        <div className="mt-5 space-y-4">
          {documentationMindMap.branches.map((branch, index) => {
            const theme = branchThemes[index % branchThemes.length]
            const nested = hasNestedChildren(branch.nodes)

            return (
              <article key={branch.title} className={`overflow-hidden rounded-[1.5rem] border p-4 sm:p-5 ${theme.shell}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <ArticleNode
                    title={branch.title}
                    hrefBase={articlesHref}
                    className={`rounded-2xl border px-4 py-4 ${theme.branch} lg:max-w-sm`}
                    summary
                  />
                  <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.branchLabel} {index + 1}
                  </div>
                </div>

                {nested ? (
                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {branch.nodes.map((stage, stageIndex) => (
                        <ArticleNode
                          key={`${branch.title}-${stage.title}`}
                          title={stage.title}
                          hrefBase={articlesHref}
                          className={`rounded-xl border bg-background/70 px-4 py-4 ${theme.node}`}
                        />
                      ))}
                    </div>

                    <div className="grid gap-3">
                      {branch.nodes.map((stage, stageIndex) => (
                        <section
                          key={`${branch.title}-${stage.title}-details`}
                          className="rounded-2xl border border-border/60 bg-background/60 p-4"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                              {copy.stageLabel} {stageIndex + 1}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {(stage.children ?? []).map((detailNode) => (
                              <ArticleNode
                                key={`${stage.title}-${detailNode.title}`}
                                title={detailNode.title}
                                hrefBase={articlesHref}
                                className={`rounded-xl border bg-background/80 px-3.5 py-3 ${theme.node}`}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {branch.nodes.map((node) => (
                      <ArticleNode
                        key={`${branch.title}-${node.title}`}
                        title={node.title}
                        hrefBase={articlesHref}
                        className={`rounded-xl border bg-background/70 px-4 py-4 ${theme.node}`}
                      />
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
