import { pricingPlans } from "@/lib/pricing/plans"
import type { AppLocale } from "@/i18n/locale"

/**
 * THE FOUR PRODUCTS, as the Terminal's pricing page sells them.
 *
 * This page used to sell a second catalogue — Pro / Team / Institutional —
 * while entrestate.com/business/pricing sold Lead Machine, the Mega Brokerage
 * Platform and Meta for Realtors. Same company, two price lists: a buyer who
 * clicked from one page to the other was quoted different names and different
 * numbers, which reads as either disorganisation or a negotiating trick, and
 * both lose the deal.
 *
 * The owner resolved it by MAPPING, not deletion: the tiers are old names for
 * the products (Team = Lead Machine, Institutional = Mega Brokerage), and the
 * tier strings stay accepted everywhere money code reads them —
 * resolvePaidTier, the webhooks, billing_entitlements rows. Only what the
 * PAGE SELLS changes. Pro survives as the one thing the Terminal itself
 * sells: a single seat on the data terminal.
 *
 * PRICES ARE DERIVED, NEVER RETYPED. Lead Machine reads
 * pricingPlans.team.monthlyAed — the same literal Tap would charge and the
 * same one scripts/terminal-price-test.ts freezes — so this page cannot
 * disagree with the till or with the platform page (the guard's cross-surface
 * section holds all three together). The token price is the one figure that
 * cannot be imported here (lib/freehold/credits-shared.ts lives in the other
 * build root), so it is written out and the guard asserts the digit agrees.
 */
export interface ProductCard {
  key: "lead-machine" | "mega-brokerage" | "meta-for-realtors"
  /** Old tier anchor kept alive — links in the wild deep-link to #team. */
  aliasAnchor: "team" | "institutional" | null
  name: { en: string; ar: string }
  who: { en: string; ar: string }
  priceLine: { en: string; ar: string }
  annualLine: { en: string; ar: string } | null
  line: { en: string; ar: string }
  features: Array<{ en: string; ar: string }>
  cta: { label: { en: string; ar: string }; href: string }
  highlight?: boolean
}

const aed = (n: number) => new Intl.NumberFormat("en-AE").format(n)

export const PRODUCT_CARDS: ProductCard[] = [
  {
    key: "lead-machine",
    aliasAnchor: "team",
    name: { en: "Lead Machine", ar: "آلة العملاء" },
    who: { en: "For brokerages", ar: "لشركات الوساطة" },
    priceLine: {
      en: `AED ${aed(pricingPlans.team.monthlyAed ?? 0)} / month`,
      ar: `${aed(pricingPlans.team.monthlyAed ?? 0)} درهم / شهرياً`,
    },
    annualLine: {
      en: `AED ${aed(pricingPlans.team.annualAed ?? 0)} / year`,
      ar: `${aed(pricingPlans.team.annualAed ?? 0)} درهم / سنوياً`,
    },
    line: {
      en: "Makes leads from your listings, then works them to the deal — the whole system, your brand.",
      ar: "تصنع عملاء من وحداتك ثم تعمل عليهم حتى الصفقة — النظام كامل، باسمك.",
    },
    features: [
      { en: "Inventory, pages, ads, CRM, reports", ar: "المخزون، الصفحات، الإعلانات، إدارة العملاء، التقارير" },
      { en: "A landing page for every project, on your domain", ar: "صفحة هبوط لكل مشروع، على نطاقك" },
      { en: "Roles for agents, managers, marketing, directors", ar: "أدوار للوسطاء والمدراء والتسويق والإدارة" },
      { en: "English, العربية, Русский", ar: "English, العربية, Русский" },
      { en: "14-day trial, no card", ar: "تجربة ١٤ يوماً، بلا بطاقة" },
    ],
    cta: { label: { en: "Start a 14-day trial", ar: "ابدأ تجربة ١٤ يوماً" }, href: "https://entrestate.com/signup" },
    highlight: true,
  },
  {
    key: "mega-brokerage",
    aliasAnchor: "institutional",
    name: { en: "Mega Brokerage Platform", ar: "منصة الوساطة الكبرى" },
    who: { en: "For companies needing the public face", ar: "للشركات التي تحتاج واجهتها العامة" },
    // Priced per setup — no deciding literal exists anywhere in the
    // repository, and the guard asserts no number appears here.
    priceLine: { en: "Priced per setup", ar: "تسعير حسب التجهيز" },
    annualLine: null,
    line: {
      en: "Your public site and the desk behind it — one catalogue, a page per project, ads and CRM.",
      ar: "موقعك العام والمكتب خلفه — كتالوج واحد، صفحة لكل مشروع، إعلانات وإدارة عملاء.",
    },
    features: [
      { en: "Your public site, on your domain", ar: "موقعك العام، على نطاقك" },
      { en: "Enquiries land in the CRM, owned", ar: "الاستفسارات تصل إلى إدارة العملاء ولها مالك" },
      { en: "Your own database — no other company reads it", ar: "قاعدة بياناتك الخاصة — لا تقرؤها شركة أخرى" },
      { en: "Everything in Lead Machine behind it", ar: "كل ما في آلة العملاء خلفها" },
    ],
    cta: { label: { en: "Talk to us", ar: "تحدث معنا" }, href: "https://entrestate.com/business/contact" },
  },
  {
    key: "meta-for-realtors",
    aliasAnchor: null,
    name: { en: "Meta for Realtors", ar: "ميتا للوسطاء" },
    who: { en: "For one agent", ar: "لوسيط واحد" },
    // The token price the ledger charges by (TOKEN_PRICE_AED = 5 in
    // lib/freehold/credits-shared.ts). Written out because that module lives
    // in the other build root; scripts/terminal-price-test.ts asserts the
    // digit here agrees with the one there.
    priceLine: { en: "AED 5 per token", ar: "٥ دراهم لكل رمز" },
    annualLine: { en: "No monthly fee", ar: "بلا رسوم شهرية" },
    line: {
      en: "A full lead-ads system on Meta — our off-plan inventory, your budget, a few clicks.",
      ar: "نظام كامل لإعلانات ميتا — من مخزوننا، بميزانيتك، بنقرات قليلة.",
    },
    features: [
      { en: "Pay with tokens as you run ads", ar: "ادفع بالرموز أثناء تشغيل الإعلانات" },
      { en: "Campaigns built from our off-plan inventory", ar: "حملات مبنية من مخزوننا على الخارطة" },
      { en: "Budgets with caps you set", ar: "ميزانيات بحدود تضعها أنت" },
      { en: "Ad spend stays in your own Meta account", ar: "إنفاق الإعلانات يبقى في حساب ميتا الخاص بك" },
    ],
    cta: { label: { en: "Start as a realtor", ar: "ابدأ كوسيط" }, href: "https://entrestate.com/signup?plan=realtor" },
  },
]

/** The one thing the Terminal itself sells: a seat on the data terminal. */
export const SEAT = {
  anchor: "pro" as const,
  name: { en: "Decision Terminal Pro", ar: "محطة القرار — احترافي" },
  priceLine: {
    en: `AED ${aed(pricingPlans.pro.monthlyAed ?? 0)} / month`,
    ar: `${aed(pricingPlans.pro.monthlyAed ?? 0)} درهم / شهرياً`,
  },
  annualLine: {
    en: `AED ${aed(pricingPlans.pro.annualAed ?? 0)} / year`,
    ar: `${aed(pricingPlans.pro.annualAed ?? 0)} درهم / سنوياً`,
  },
  line: {
    en: "One seat on the data terminal — scored projects, investor memos, DLD history, inspectable verdicts.",
    ar: "مقعد واحد على محطة البيانات — مشاريع مقيّمة، مذكرات استثمار، سجل معاملات، أحكام قابلة للفحص.",
  },
  cta: { label: { en: "Continue to checkout", ar: "المتابعة إلى الدفع" }, href: "/checkout?tier=pro" },
}

export function productText(v: { en: string; ar: string }, locale: AppLocale): string {
  return locale === "ar" ? v.ar : v.en
}
