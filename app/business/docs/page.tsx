import type { Metadata } from 'next'
import { Section, Eyebrow, Lede } from '@/components/business/ui'
import { GuideCard, docsCategoryId } from '@/components/business/docs'
import { DOCS_CATEGORIES, GUIDES, type DocsCategory } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Learn',
  description:
    'Short guides to how each part of Entrestate behaves — leads, pages, campaigns, budgets and the month-end numbers, in plain language.',
  alternates: { canonical: '/business/docs' },
}

/* One calm line per branch, shown beside the category heading. */
const CATEGORY_LINES: Record<DocsCategory, string> = {
  'CRM & brokers': 'Where leads land, who owns them, and how the day is worked.',
  'Inventory & pages': 'The stock you sell, and the page every listing gets.',
  'Lead machine': 'Campaigns, audiences, and the rules that govern spend.',
  'Creative studio': 'The ads, made from the listing you already have.',
  Finance: 'Commission against expenses, and what everything cost.',
  'Getting set up': 'From signup to the first lead, week by week.',
}

export default function DocsHubPage() {
  return (
    <Section className="pb-20 pt-14 lg:pb-28 lg:pt-20">
      <div className="max-w-[44rem]">
        <Eyebrow>Learn</Eyebrow>
        <h1 className="mt-5 font-serif text-[2.5rem] leading-[1.1] tracking-[-0.02em] text-white sm:text-[3rem]">
          Learn Entrestate
        </h1>
        <Lede className="mt-5">
          Short guides to how each part behaves — in plain words, in the order you would use them.
        </Lede>
      </div>

      <div className="mt-14 space-y-14 lg:mt-16 lg:space-y-16">
        {DOCS_CATEGORIES.map((category) => {
          const items = GUIDES.filter((g) => g.category === category)
          if (!items.length) return null
          return (
            // The id matters: every guide's breadcrumb links back to /business/docs#<id>.
            <section key={category} id={docsCategoryId(category)} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/[0.07] pb-4">
                <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-white">{category}</h2>
                <p className="text-[0.875rem] text-[#6E747C]">{CATEGORY_LINES[category]}</p>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((g) => (
                  <GuideCard key={g.href} guide={g} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </Section>
  )
}
