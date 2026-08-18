import type { AppLocale } from "@/i18n/locale"

export type BillingCadence = "monthly" | "annual"
export type BillingProcessor = "stripe" | "tap"
export type PaidTier = "pro" | "team" | "institutional"
export type PublicTier = "free" | PaidTier

type LocalizedText = {
  en: string
  ar: string
}

type PricingPlan = {
  tier: PublicTier
  name: LocalizedText
  tagline: LocalizedText
  description: LocalizedText
  badge: LocalizedText
  monthlyAed: number | null
  annualAed: number | null
  features: LocalizedText[]
  ctaLabel: LocalizedText
  ctaHref: string
  highlight?: boolean
  stripePriceEnv?: Partial<Record<BillingCadence, string>>
  tapPriceEnv?: Partial<Record<BillingCadence, string>>
}

export const pricingPlans: Record<PublicTier, PricingPlan> = {
  free: {
    tier: "free",
    name: { en: "Free Access", ar: "الوصول المجاني" },
    tagline: { en: "Start with core evidence surfaces.", ar: "ابدأ من طبقات الأدلة الأساسية." },
    description: {
      en: "Open the Decision Terminal, inspect scored inventory, and learn the product before you subscribe.",
      ar: "افتح محطة القرار، وراجع المخزون المقيّم، وتعرّف على المنتج قبل الاشتراك.",
    },
    badge: { en: "AED 0", ar: "0 درهم" },
    monthlyAed: 0,
    annualAed: 0,
    features: [
      { en: "Decision Terminal access", ar: "الوصول إلى محطة القرار" },
      { en: "Search and map surfaces", ar: "سطح البحث والخريطة" },
      { en: "Evidence-backed responses", ar: "ردود مدعومة بالأدلة" },
    ],
    ctaLabel: { en: "Open free access", ar: "افتح الوصول المجاني" },
    ctaHref: "/chat",
  },
  pro: {
    tier: "pro",
    name: { en: "Pro", ar: "احترافي" },
    tagline: {
      en: "Evidence-backed research access for independent investors and operators.",
      ar: "وصول مدعوم بالأدلة للمستثمرين والمشغلين المستقلين.",
    },
    description: {
      en: "Single-seat access to scored projects, investor memos, and inspectable verdicts.",
      ar: "وصول فردي إلى المشاريع المقيّمة والمذكرات الاستثمارية والأحكام القابلة للفحص.",
    },
    badge: { en: "AED 299 / month", ar: "299 درهم / شهرياً" },
    monthlyAed: 299,
    annualAed: 2_988,
    features: [
      { en: "Decision Terminal access", ar: "الوصول إلى محطة القرار" },
      { en: "L1 canonical data provenance", ar: "توثيق بيانات L1 Canonical" },
      { en: "Search, map, and scored project screening", ar: "البحث والخريطة وفرز المشاريع المقيّمة" },
      { en: "Investor memo generation", ar: "إنشاء مذكرات استثمار" },
      { en: "BUY / HOLD / WAIT verdict access", ar: "الوصول إلى أحكام BUY / HOLD / WAIT" },
      { en: "DLD transaction history and benchmarks", ar: "سجل معاملات DLD والمعايير" },
    ],
    ctaLabel: { en: "Continue to checkout", ar: "المتابعة إلى الدفع" },
    ctaHref: "/checkout?tier=pro",
    stripePriceEnv: {
      monthly: "STRIPE_PRICE_PRO_MONTHLY",
      annual: "STRIPE_PRICE_PRO_ANNUAL",
    },
    tapPriceEnv: {
      monthly: "TAP_PRICE_PRO_MONTHLY",
      annual: "TAP_PRICE_PRO_ANNUAL",
    },
  },
  team: {
    tier: "team",
    name: { en: "Team", ar: "فريق" },
    tagline: {
      en: "Shared intelligence workflows with branded outputs for advisory and brokerage teams.",
      ar: "مسارات استخبارات مشتركة مع مخرجات تحمل هويتك للفرق الاستشارية والوساطة.",
    },
    description: {
      en: "Branded outputs, team workflows, and faster operating loops for brokerage and advisory teams.",
      ar: "مخرجات بعلامتك ومسارات عمل للفريق وسرعة أعلى لفرق الوساطة والاستشارات.",
    },
    badge: { en: "AED 999 / month", ar: "999 درهم / شهرياً" },
    monthlyAed: 999,
    annualAed: 9_588,
    features: [
      { en: "Everything in Pro", ar: "كل ما في الخطة الاحترافية" },
      { en: "Light team workspace", ar: "مساحة فريق خفيفة" },
      { en: "Personal + Entrestate branded outputs", ar: "مخرجات بعلامتك + Entrestate" },
      { en: "Client-ready PDF exports", ar: "تصدير ملفات PDF جاهزة للعملاء" },
      { en: "Priority response processing", ar: "أولوية في معالجة الطلبات" },
      { en: "Workflow support for advisory desks", ar: "دعم مسارات العمل لفرق الاستشارة" },
    ],
    ctaLabel: { en: "Continue to checkout", ar: "المتابعة إلى الدفع" },
    ctaHref: "/checkout?tier=team",
    highlight: true,
    stripePriceEnv: {
      monthly: "STRIPE_PRICE_TEAM_MONTHLY",
      annual: "STRIPE_PRICE_TEAM_ANNUAL",
    },
    tapPriceEnv: {
      monthly: "TAP_PRICE_TEAM_MONTHLY",
      annual: "TAP_PRICE_TEAM_ANNUAL",
    },
  },
  institutional: {
    tier: "institutional",
    name: { en: "Institutional", ar: "مؤسسية" },
    tagline: {
      en: "White-label platform deployment, governed API delivery, and rollout support for firms.",
      ar: "نشر White-label مع حمولة API محكومة ودعم إطلاق مخصص للشركات.",
    },
    description: {
      en: "Custom commercial terms for white-label delivery, API access, and governed rollout.",
      ar: "شروط تجارية مخصصة للنشر بعلامتك والوصول إلى الـ API والإطلاق المحكوم.",
    },
    badge: { en: "Custom contract", ar: "عقد مخصص" },
    monthlyAed: null,
    annualAed: null,
    features: [
      { en: "Full firm branding (white-label)", ar: "علامة تجارية كاملة للشركة" },
      { en: "Automation Studio and governed team controls", ar: "استوديو الأتمتة وضوابط الفريق المحكومة" },
      { en: "Enterprise API substrate access", ar: "الوصول إلى طبقة الـ API المؤسسية" },
      { en: "Portfolio-level monitoring", ar: "مراقبة المحافظ على مستوى الشركة" },
      { en: "PDPL + GDPR legal pack", ar: "حزمة قانونية PDPL + GDPR" },
      { en: "Named subprocessors and DPA support", ar: "صفحة المعالِجين من الباطن ودعم DPA" },
    ],
    ctaLabel: { en: "Talk to sales", ar: "تواصل مع المبيعات" },
    ctaHref: "/contact",
  },
}

export const pricingFaq = [
  {
    q: {
      en: "Are prices quoted in AED or USD?",
      ar: "هل الأسعار معروضة بالدرهم أم بالدولار؟",
    },
    a: {
      en: "Pricing is quoted in AED. VAT is added at checkout where applicable. Any non-AED display should be treated as informational only.",
      ar: "يتم عرض التسعير بالدرهم الإماراتي. تتم إضافة ضريبة القيمة المضافة عند الدفع حيثما تنطبق. وأي عرض بعملة أخرى يكون لغرض المعلومات فقط.",
    },
  },
  {
    q: {
      en: "Which payment processors are live?",
      ar: "ما هي معالجات الدفع المتاحة؟",
    },
    a: {
      en: "AE and SA card traffic is routed to Tap when configured. Other traffic is routed to Stripe. Institutional contracts are handled directly by the sales team.",
      ar: "يتم توجيه بطاقات الإمارات والسعودية إلى Tap عند تهيئته. ويتم توجيه باقي الحركة إلى Stripe. أما العقود المؤسسية فتتم مباشرة مع فريق المبيعات.",
    },
  },
  {
    q: {
      en: "Can I switch plans later?",
      ar: "هل يمكنني تغيير الخطة لاحقاً؟",
    },
    a: {
      en: "Yes. The account tier model remains Pro, Team, and Institutional, so upgrades can be mapped cleanly without changing your workspace identity.",
      ar: "نعم. نموذج الباقات يبقى احترافي، فريق، ومؤسسي، لذلك يمكن ترحيل الترقية بدون تغيير هوية مساحة العمل.",
    },
  },
  {
    q: {
      en: "What legal/compliance material is available for enterprise buyers?",
      ar: "ما المواد القانونية والامتثالية المتاحة للعملاء المؤسسيين؟",
    },
    a: {
      en: "Privacy, terms, cookie policy, subprocessors, data residency, and a standard DPA route are published on the public site.",
      ar: "سياسة الخصوصية، الشروط، سياسة الكوكيز، المعالِجون من الباطن، توطين البيانات، ومسار DPA القياسي منشورة على الموقع العام.",
    },
  },
] as const

export function getLocalizedText(value: LocalizedText, locale: AppLocale) {
  return locale === "ar" ? value.ar : value.en
}

export function getPaidPlan(tier: PaidTier) {
  return pricingPlans[tier]
}

export function resolvePaidTier(value: string | null | undefined): PaidTier | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null

  switch (normalized) {
    case "pro":
    case "solo":
    case "solo-analyst":
      return "pro"
    // "realtor" and "realtor-pro" USED TO ALIAS TO TEAM, and must never again.
    // Meta for Realtors is the ONE-AGENT product: no monthly fee, funded by
    // tokens at TOKEN_PRICE_AED (lib/freehold/credits-shared.ts). Team is the
    // BROKERAGE tier at AED 999/month. So /checkout?tier=realtor quoted the
    // brokerage price for the solo product — and nothing errored, because
    // resolvePaidTier returned a VALID tier that both app/checkout/page.tsx
    // and app/api/billing/checkout/route.ts accept. Nothing in either app has
    // ever emitted tier=realtor: the four emitters all write ?plan=realtor,
    // which app/api/wl/signup/route.ts reads instead. The alias was liability
    // with no traffic on it. Falling through to null makes that URL 400.
    case "team":
      return "team"
    case "institutional":
    case "enterprise":
    case "enterprise-os":
    case "os":
      return "institutional"
    default:
      return null
  }
}

export function isCheckoutTier(tier: PublicTier): tier is PaidTier {
  return tier === "pro" || tier === "team" || tier === "institutional"
}

export function getPricingComparisonRows(locale: AppLocale) {
  return [
    {
      feature: locale === "ar" ? "محطة القرار" : "Decision Terminal",
      values: [locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included"],
    },
    {
      feature: locale === "ar" ? "البحث + الخريطة" : "Search + Map",
      values: [locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included", locale === "ar" ? "مضمن" : "Included"],
    },
    {
      feature: locale === "ar" ? "العلامة على المخرجات" : "Branded outputs",
      values: [
        locale === "ar" ? "Entrestate فقط" : "Entrestate only",
        locale === "ar" ? "Entrestate فقط" : "Entrestate only",
        locale === "ar" ? "شخصية + Entrestate" : "Personal + Entrestate",
        locale === "ar" ? "White-label" : "White-label",
      ],
    },
    {
      feature: locale === "ar" ? "مساحة الفريق" : "Team workspace",
      values: ["—", "—", locale === "ar" ? "خفيفة" : "Light", locale === "ar" ? "RBAC كامل" : "Full RBAC"],
    },
    {
      feature: locale === "ar" ? "التسليم عبر API / التضمين" : "API / embed delivery",
      values: ["—", "—", "—", locale === "ar" ? "مضمن" : "Included"],
    },
    {
      feature: locale === "ar" ? "مواد الامتثال" : "Compliance pack",
      values: ["—", "—", locale === "ar" ? "أساسي" : "Basic", locale === "ar" ? "كامل" : "Full"],
    },
  ]
}

export function getPricingTrustLinks(locale: AppLocale) {
  return [
    {
      title: locale === "ar" ? "الحالة العامة" : "Public status",
      href: "/status",
    },
    {
      title: locale === "ar" ? "صفحة المعالِجين" : "Subprocessors",
      href: "/subprocessors",
    },
    {
      title: locale === "ar" ? "توطين البيانات" : "Data residency",
      href: "/data-residency",
    },
    {
      title: locale === "ar" ? "الخصوصية + الشروط" : "Privacy + terms",
      href: "/privacy",
    },
  ]
}
