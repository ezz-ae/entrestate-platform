import "server-only"
import { generateText } from "ai"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { upsertBookPage, type BookDetail, type BookPage, type BookPageType } from "@/lib/notebook/queries"
import {
  executeDealScreener,
  executeAreaRiskBrief,
  executeDeveloperDueDiligence,
  executeGenerateInvestorMemo,
  executePriceRealityCheck,
  executeDldAreaBenchmark,
  executeDldTransactionSearch,
} from "@/lib/copilot/executor"

const PAGE_PROMPTS: Record<string, (book: BookDetail) => string> = {
  overview: (book) => `
You are the Entrestate Decision Terminal. Generate an OVERVIEW page for a ${book.type} notebook titled "${book.title}".
Subject: ${book.subject}

Output a structured intelligence brief. Use this exact format:

\`\`\`
${book.title} — Overview
${"─".repeat(40)}
Type:     ${book.type.toUpperCase()}
Subject:  ${book.subject}

[KEY METRICS]
[Pull the most important 4-6 metrics from the data — price, yield, stress, timing, score, developer]

[SIGNALS]
[List 3-5 key signals in bullet form]

[VERDICT]
[One-line decision: STRONG_BUY / BUY / HOLD / WAIT / AVOID with rationale]
\`\`\`

Use only structured blocks. No paragraphs. No filler.`,

  risk: (book) => `
You are the Entrestate Decision Terminal. Generate a RISK page for a ${book.type} notebook.
Subject: ${book.subject}

Output a structured risk assessment. Use this exact format:

\`\`\`
Risk Assessment — ${book.subject}
${"─".repeat(40)}
Stress Grade:    [A/B/C/D/E from data]
Stress Score:    [0-100]

Developer Risk:  [score + label]
Supply Risk:     [score + label]
Liquidity Risk:  [score + label]
Market Risk:     [score + label]

Risk Flags:
• [flag 1]
• [flag 2]

Verdict: [SAFE / CAUTION / AVOID]
\`\`\`

Only use real data from the database. Never fabricate scenario analysis.`,

  memo: (book) => `
You are the Entrestate Decision Terminal. Generate a full INVESTMENT MEMO for: ${book.subject}

Structure:
1. Location Analysis
2. Market Timing
3. Yield Projection
4. Stress Profile (real grades only — no fabricated scenarios)
5. Exit Strategy
6. Verdict

Use structured blocks. No paragraphs. All data must come from database tools.`,

  opportunity: (book) => `
You are the Entrestate Decision Terminal. Identify the top OPPORTUNITIES related to: ${book.subject}

Output a ranked table:
| Rank | Project | Area | Price | Yield | Stress | Timing | Score | Signal |
|------|---------|------|-------|-------|--------|--------|-------|--------|

Then 3 bullets on why these are the top picks. No paragraphs.`,

  comparison: (book) => `
You are the Entrestate Decision Terminal. Generate a COMPARISON analysis for: ${book.subject}

Compare the top 2-3 relevant projects side by side:
| Dimension | Project A | Project B | Project C |
|-----------|-----------|-----------|-----------|
| Price     |           |           |           |
| Yield     |           |           |           |
| Stress    |           |           |           |
| Timing    |           |           |           |
| Score     |           |           |           |
| Signal    |           |           |           |

Verdict: [which wins and why — 2 lines max]`,

  transactions: (book) => `
You are the Entrestate Decision Terminal. Generate a TRANSACTIONS summary for: ${book.subject}

Pull recent DLD transactions and output:

\`\`\`
DLD Transaction Activity — ${book.subject}
${"─".repeat(40)}
Total Volume:    AED [X]
Transaction Count: [N]
Avg Deal Size:   AED [X]
Top Reg Type:    Off-Plan / Ready [%]

Recent Notable Deals:
• [date] [project] AED [amount] [type]
• [date] [project] AED [amount] [type]

Velocity Signal: [HIGH / MEDIUM / LOW]
\`\`\``,
}

async function fetchPageData(book: BookDetail, pageType: string): Promise<Record<string, unknown>> {
  const subject = book.subject

  try {
    if (pageType === "overview" || pageType === "risk" || pageType === "memo") {
      if (book.type === "project") {
        const [memo, price] = await Promise.allSettled([
          executeGenerateInvestorMemo({ project_name: subject, sections: ["price_reality", "area_risk", "developer", "stress_test"] }),
          executePriceRealityCheck({ project_name: subject }),
        ])
        return {
          memo: memo.status === "fulfilled" ? memo.value : null,
          price: price.status === "fulfilled" ? price.value : null,
        }
      }
      if (book.type === "area") {
        const [area, benchmark] = await Promise.allSettled([
          executeAreaRiskBrief({ area_name: subject }),
          executeDldAreaBenchmark({ area_name: subject }),
        ])
        return {
          area: area.status === "fulfilled" ? area.value : null,
          benchmark: benchmark.status === "fulfilled" ? benchmark.value : null,
        }
      }
      if (book.type === "client" || book.type === "portfolio") {
        const screen = await executeDealScreener({ filters: {}, sort_by: "investor_score_v1", limit: 10 })
        return { screen }
      }
    }

    if (pageType === "transactions") {
      const txns = await executeDldTransactionSearch({
        area: book.type === "area" ? subject : undefined,
        project: book.type === "project" ? subject : undefined,
        limit: 20,
      })
      return { txns }
    }

    if (pageType === "opportunity" || pageType === "comparison") {
      const area = book.type === "area" ? subject : undefined
      const screen = await executeDealScreener({
        filters: { area },
        sort_by: "investor_score_v1",
        limit: 5,
      })
      return { screen }
    }
  } catch {
    // return empty on error — generator will still produce page with available data
  }

  return {}
}

async function generatePageContent(
  book: BookDetail,
  pageType: string,
  data: Record<string, unknown>,
): Promise<{ text: string; content: Record<string, unknown> }> {
  const model = resolveCopilotModel()
  if (!model) {
    const text = `[No AI model configured. Data available: ${JSON.stringify(data).slice(0, 200)}]`
    return { text, content: { data, error: "no_model" } }
  }

  const promptFn = PAGE_PROMPTS[pageType]
  const basePrompt = promptFn ? promptFn(book) : `Generate a ${pageType} page for: ${book.subject}`
  const dataStr = Object.keys(data).length > 0
    ? `\n\nDATA FROM DATABASE:\n${JSON.stringify(data, null, 2).slice(0, 4000)}`
    : ""

  const { text } = await generateText({
    model,
    prompt: basePrompt + dataStr,
    maxOutputTokens: 1500,
  })

  return {
    text,
    content: { data, generated_at: new Date().toISOString() },
  }
}

export async function generateBookPages(
  book: BookDetail,
  pageTypes?: string[],
): Promise<BookPage[]> {
  const types: BookPageType[] = (pageTypes as BookPageType[]) ?? ["overview", "risk"]

  const pages: BookPage[] = []

  for (const pageType of types) {
    const data = await fetchPageData(book, pageType)
    const { text, content } = await generatePageContent(book, pageType, data)

    const page = await upsertBookPage({
      bookId: book.id,
      type: pageType as BookPageType,
      title: pageType.charAt(0).toUpperCase() + pageType.slice(1),
      content,
      rawText: text,
      status: "ready",
    })

    pages.push(page)
  }

  return pages
}
