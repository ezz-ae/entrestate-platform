export type DocsArticle = {
  slug: string
  title: string
  category: string
  summary: string
  scope: string[]
  execution: string[]
}

type ArticleSeed = {
  title: string
  category: string
  summary: string
  scope: string[]
  execution: string[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const articleSeeds: ArticleSeed[] = [
  {
    title: "Entrestate Decision Infrastructure",
    category: "Foundation",
    summary: "The complete operating architecture that connects intent, evidence, judgment, and action.",
    scope: [
      "Defines the canonical workflow for the platform",
      "Aligns product, data, and commercial functions",
      "Supports partner and investor due diligence narratives",
    ],
    execution: [
      "Maintain a versioned system map",
      "Map every output to evidence lineage",
      "Publish periodic architecture updates to stakeholders",
    ],
  },
  {
    title: "Decision Tunnel (Workflow)",
    category: "Decision Tunnel",
    summary: "The core four-stage decision pipeline from user intent to execution-ready outputs.",
    scope: [
      "Transforms raw requests into explicit contracts",
      "Controls quality gates between stages",
      "Provides explainability for every recommendation",
    ],
    execution: [
      "Track throughput and drop-off at every stage",
      "Instrument confidence and freshness metrics",
      "Continuously harden stage-level policies",
    ],
  },
  {
    title: "Stage 1: Intent",
    category: "Decision Tunnel",
    summary: "Converts natural language goals into deterministic platform instructions.",
    scope: ["Intent capture", "Constraint normalization", "Questioning for ambiguity"],
    execution: ["Compile TableSpec", "Apply profile defaults", "Publish intent confidence"],
  },
  {
    title: "NL Goal to TableSpec JSON",
    category: "Decision Tunnel",
    summary: "Compiler layer that maps natural-language goals into machine-executable TableSpec payloads.",
    scope: ["Entity extraction", "Schema mapping", "Validation and fallback behavior"],
    execution: ["Emit deterministic JSON", "Attach inferred assumptions", "Log compilation diagnostics"],
  },
  {
    title: "Intent-Aware Parsing",
    category: "Decision Tunnel",
    summary: "Parsing strategy that adapts to user objective, risk profile, and time horizon.",
    scope: ["Goal intent classification", "Priority signal capture", "Language normalization"],
    execution: ["Route to parser profile", "Apply confidence thresholds", "Ask clarifying follow-ups"],
  },
  {
    title: "Hidden Parameter Extraction",
    category: "Decision Tunnel",
    summary: "Derives implicit filters that users do not explicitly provide in their request.",
    scope: ["Budget bands", "Location constraints", "Asset lifecycle preferences"],
    execution: ["Infer candidate parameters", "Validate against profile history", "Surface inferred assumptions"],
  },
  {
    title: "Stage 2: Evidence",
    category: "Decision Tunnel",
    summary: "Collects, validates, and structures data from the evidence hierarchy before scoring.",
    scope: ["Source retrieval", "Policy filtering", "Lineage and confidence assembly"],
    execution: ["Apply exclusion policy", "Merge canonical records", "Generate evidence bundle"],
  },
  {
    title: "Exclusion Policy (Filter Distressed/Duplicates)",
    category: "Decision Tunnel",
    summary: "Ruleset that removes non-representative, duplicate, and low-integrity records.",
    scope: ["Distressed sale exclusion", "Duplicate suppression", "Low-quality field handling"],
    execution: ["Run exclusion filters", "Persist rejection reasons", "Audit policy impact"],
  },
  {
    title: "5-Layer Evidence Stack",
    category: "Decision Tunnel",
    summary: "Structured trust model that separates canonical, derived, dynamic, external, and raw evidence.",
    scope: ["Trust boundaries", "Lineage policy", "Escalation and override constraints"],
    execution: ["Tag layer of origin", "Block unsafe layer overrides", "Expose layer confidence"],
  },
  {
    title: "Data Hygiene (Canonical Graph)",
    category: "Decision Tunnel",
    summary: "Normalization and entity-resolution process that builds a reliable canonical graph.",
    scope: ["Field standardization", "Identity resolution", "Canonical relationship integrity"],
    execution: ["Run normalization jobs", "Resolve entity collisions", "Maintain correction logs"],
  },
  {
    title: "Stage 3: Judgment",
    category: "Decision Tunnel",
    summary: "Transforms validated evidence into ranked opportunities with transparent score logic.",
    scope: ["Signal weighting", "Profile fit adjustment", "Ranking stability"],
    execution: ["Calculate score components", "Produce explanation payload", "Store ranking artifacts"],
  },
  {
    title: "65% Market Score (Objective Quality)",
    category: "Decision Tunnel",
    summary: "Objective score contribution based on market and asset quality characteristics.",
    scope: ["Market structure quality", "Liquidity and resilience", "Yield and timing quality"],
    execution: ["Compute objective component", "Version weight policy", "Track calibration drift"],
  },
  {
    title: "35% Personal Match (Subjective Lens)",
    category: "Decision Tunnel",
    summary: "Profile-adjusted score contribution aligned to user preference and strategy.",
    scope: ["Risk appetite fit", "Time horizon fit", "Outcome intent fit"],
    execution: ["Apply profile lens", "Explain personalization impact", "Log profile override events"],
  },
  {
    title: "Ranking & Scoring Engine",
    category: "Decision Tunnel",
    summary: "Deterministic ranking engine that combines objective and subjective scoring components.",
    scope: ["Score aggregation", "Tie-breaking policy", "Ranking consistency checks"],
    execution: ["Run deterministic ranking", "Emit score explainability", "Persist versioned score traces"],
  },
  {
    title: "Stage 4: Action",
    category: "Decision Tunnel",
    summary: "Converts ranked outcomes into artifacts and next-step execution workflows.",
    scope: ["Artifact generation", "Stakeholder communication", "Execution handoff"],
    execution: ["Generate decision outputs", "Attach evidence drawer", "Trigger operational follow-through"],
  },
  {
    title: "Branded Decision Objects (PDF/Memos)",
    category: "Decision Tunnel",
    summary: "Produces client-facing outputs suitable for internal and external decision communication.",
    scope: ["Report templates", "Memo and deck generation", "Channel-specific formatting"],
    execution: ["Render artifact bundles", "Include assumptions and caveats", "Track distribution status"],
  },
  {
    title: "Evidence Drawer (Transparency/Footnotes)",
    category: "Decision Tunnel",
    summary: "Transparency layer that exposes sources, filters, assumptions, and confidence for outputs.",
    scope: ["Source citation", "Footnote and caveat payload", "Confidence explanation"],
    execution: ["Attach evidence references", "Link source-level metadata", "Support compliance review"],
  },
  {
    title: "Automation Studio",
    category: "Decision Tunnel",
    summary: "Workflow orchestration layer for repeatable, event-driven decision and communication tasks.",
    scope: ["Task automation", "Stateful workflow execution", "Operational event handling"],
    execution: ["Define workflow nodes", "Monitor run health", "Route exceptions for human approval"],
  },
  {
    title: "Evidence Stack Hierarchy",
    category: "Evidence Stack",
    summary: "Trust-stratified evidence model that governs how data is used in decisioning.",
    scope: ["Layer definitions", "Trust boundaries", "Promotion and reconciliation rules"],
    execution: ["Classify incoming records", "Enforce upward promotion gates", "Expose layer usage in outputs"],
  },
  {
    title: "L1: Canonical (Static Truths/Audited)",
    category: "Evidence Stack",
    summary: "Highest-trust audited layer for foundational facts.",
    scope: ["Audited truth records", "Identity keys", "Stable dimensions"],
    execution: ["Protect from low-trust overwrites", "Maintain audit chain", "Use as primary reference"],
  },
  {
    title: "L2: Derived (Calculated Truths)",
    category: "Evidence Stack",
    summary: "Deterministic metrics calculated from trusted evidence inputs.",
    scope: ["Derived KPIs", "Reproducible formulas", "Calculation lineage"],
    execution: ["Version formulas", "Validate deterministic outputs", "Track derivation provenance"],
  },
  {
    title: "L3: Dynamic (Living States/Inventory)",
    category: "Evidence Stack",
    summary: "Live and near-live inventory and operational status data.",
    scope: ["Availability updates", "Listing state changes", "Pipeline movements"],
    execution: ["Capture state transitions", "Reconcile stale records", "Expose freshness windows"],
  },
  {
    title: "L4: External (Market Sensors/RERA/DLD)",
    category: "Evidence Stack",
    summary: "External regulatory and market intelligence feeds enriching internal decisioning context.",
    scope: ["Regulator feeds", "Market benchmarks", "Third-party sensor inputs"],
    execution: ["Validate source authority", "Map external schemas", "Track source-level confidence"],
  },
  {
    title: "L5: Raw (Unprocessed Extraction)",
    category: "Evidence Stack",
    summary: "Raw ingestion staging layer for unprocessed inputs before normalization.",
    scope: ["Source payload capture", "Unstructured extraction", "Pre-validation staging"],
    execution: ["Preserve source snapshots", "Queue cleaning workflows", "Prevent direct decision usage"],
  },
  {
    title: "Market Scoring Signals",
    category: "Market Scoring",
    summary: "Core objective signals used to evaluate opportunity quality and timing.",
    scope: ["Signal taxonomy", "Weight policy", "Score explainability"],
    execution: ["Calibrate signal weights", "Measure signal drift", "Publish confidence overlays"],
  },
  {
    title: "Timing Signals (Entry/Exit Windows)",
    category: "Market Scoring",
    summary: "Signals that indicate attractive entry, hold, and exit timing windows.",
    scope: ["Cycle inflection detection", "Momentum and liquidity", "Window confidence"],
    execution: ["Update timing model", "Flag opportunity windows", "Attach timing caveats"],
  },
  {
    title: "Stress Resilience (Grade A-F)",
    category: "Market Scoring",
    summary: "Resilience grading that estimates downside behavior under stress conditions.",
    scope: ["Volatility sensitivity", "Drawdown behavior", "Recovery profile"],
    execution: ["Compute stress grade", "Backtest stress periods", "Expose grade rationale"],
  },
  {
    title: "Verified Gross Yield",
    category: "Market Scoring",
    summary: "Yield metric anchored in verified inputs for transparent return comparisons.",
    scope: ["Rent validation", "Occupancy assumptions", "Comparable consistency"],
    execution: ["Normalize yield inputs", "Publish methodology", "Track variance by segment"],
  },
  {
    title: "Data Confidence Level",
    category: "Market Scoring",
    summary: "Confidence indicator combining completeness, freshness, and source agreement.",
    scope: ["Completeness scoring", "Freshness monitoring", "Source agreement checks"],
    execution: ["Calculate confidence bands", "Show confidence in outputs", "Escalate low-confidence decisions"],
  },
  {
    title: "Broker Dashboard Features",
    category: "Broker Dashboard",
    summary: "Execution-facing feature stack for brokers using intelligence in production workflows.",
    scope: ["Lead handling", "Communication workflows", "Actionable analytics"],
    execution: ["Instrument adoption metrics", "Measure conversion impact", "Monitor feature quality"],
  },
  {
    title: "AI Assistant (Gemini 1.5)",
    category: "Broker Dashboard",
    summary: "Conversational co-pilot for explanation, analysis support, and operational guidance.",
    scope: ["Query understanding", "Insight summarization", "Decision support dialogue"],
    execution: ["Ground answers in evidence", "Capture assistant feedback", "Track response quality"],
  },
  {
    title: "Brochure-to-Listing Automation",
    category: "Broker Dashboard",
    summary: "Automation flow that turns brochure assets into structured listing entries.",
    scope: ["Document extraction", "Field normalization", "Review workflow"],
    execution: ["Parse brochure payloads", "Map into schema", "Send for publish approval"],
  },
  {
    title: "AI Lead Scoring (Hot/Warm/Cold)",
    category: "Broker Dashboard",
    summary: "Lead prioritization model for conversion-focused sales operations.",
    scope: ["Intent scoring", "Urgency classification", "Queue prioritization"],
    execution: ["Score inbound leads", "Trigger follow-up actions", "Recalibrate from outcomes"],
  },
  {
    title: "Sales Communication Coach",
    category: "Broker Dashboard",
    summary: "Coaching assistant for better message quality and stage-appropriate communication.",
    scope: ["Script guidance", "Tone adaptation", "Objection handling support"],
    execution: ["Generate draft responses", "Track coaching adoption", "Measure conversion uplift"],
  },
  {
    title: "Market Intelligence Analytics",
    category: "Broker Dashboard",
    summary: "Analytical layer surfacing market movement, opportunity clusters, and risk context.",
    scope: ["Trend analysis", "Segment comparison", "Opportunity diagnostics"],
    execution: ["Publish insight dashboards", "Detect anomalies", "Tie analytics to actions"],
  },
  {
    title: "Core Data Objects",
    category: "Core Data Objects",
    summary: "Canonical data contracts that power platform logic, APIs, and user-facing artifacts.",
    scope: ["Object schema policy", "Cross-service compatibility", "Traceability contracts"],
    execution: ["Version object schemas", "Maintain backward compatibility", "Audit object lineage"],
  },
  {
    title: "Time Table (Atomic Intelligence Unit)",
    category: "Core Data Objects",
    summary: "Primary intelligence container for scoped datasets, metrics, and decision context.",
    scope: ["Row and metric payload", "Refreshability", "Artifact-ready data packaging"],
    execution: ["Create and persist tables", "Support refresh lifecycles", "Link tables to outputs"],
  },
  {
    title: "TableSpec (Query Blueprint)",
    category: "Core Data Objects",
    summary: "Deterministic query blueprint generated from intent and profile constraints.",
    scope: ["Filter and scope definitions", "Grouping and grain", "Validation defaults"],
    execution: ["Compile from intent", "Validate schema contract", "Store spec version history"],
  },
  {
    title: "Decision Objects (Outcome Artifacts)",
    category: "Core Data Objects",
    summary: "Generated outputs used for communication, approvals, and execution handoff.",
    scope: ["Reports and memos", "Presentation formats", "Distribution workflow metadata"],
    execution: ["Render artifacts", "Attach references", "Track consumption and revisions"],
  },
  {
    title: "Profile Intelligence (User Preferences)",
    category: "Core Data Objects",
    summary: "Preference memory and personalization model that shapes ranking and communication.",
    scope: ["Risk and horizon preferences", "Behavioral hints", "Personalization policy"],
    execution: ["Capture profile updates", "Apply profile lens", "Explain personalized adjustments"],
  },
  {
    title: "Data & Information",
    category: "Data & Information",
    summary: "Governance layer for source reliability, ownership, and investor-ready data communication.",
    scope: ["Source hierarchy policy", "Stewardship responsibilities", "Disclosure and reporting standards"],
    execution: ["Publish source-of-truth registry", "Define owner per critical dataset", "Track disclosure freshness"],
  },
  {
    title: "Dubai Land Department (DLD)",
    category: "Data & Information",
    summary: "Regulatory and transaction authority context used for market validation and trust.",
    scope: ["Regulatory source mapping", "DLD-aligned validation", "Authority-grade references"],
    execution: ["Integrate DLD-compatible fields", "Track synchronization quality", "Expose DLD provenance tags"],
  },
  {
    title: "Stakeholders",
    category: "Data & Information",
    summary: "Stakeholder map for platform operators, partners, regulators, and investors.",
    scope: ["Role expectations", "Decision ownership", "Communication pathways"],
    execution: ["Maintain stakeholder matrix", "Align artifacts to audience", "Document governance responsibilities"],
  },
  {
    title: "Investor Relations",
    category: "Data & Information",
    summary: "Investor communication structure, diligence framing, and traction reporting standards.",
    scope: ["Narrative consistency", "KPI and milestone reporting", "Diligence documentation"],
    execution: ["Maintain investor packet", "Track key metrics", "Keep governance disclosures current"],
  },
]

export const docsArticles: DocsArticle[] = articleSeeds.map((seed) => ({
  slug: slugify(seed.title),
  ...seed,
}))

export const articleCategories = Array.from(new Set(docsArticles.map((article) => article.category)))

export function getArticleBySlug(slug: string) {
  return docsArticles.find((article) => article.slug === slug)
}

export function getArticleByTitle(title: string) {
  return docsArticles.find((article) => article.title === title)
}

const articleCategoryArabicMap: Record<string, string> = {
  Foundation: "الأساس",
  "Decision Tunnel": "مسار القرار",
  "Evidence Stack": "طبقات الأدلة",
  "Market Scoring": "تقييم السوق",
  "Broker Dashboard": "لوحة الوسيط",
  Automation: "الأتمتة",
  "Core Data Objects": "كائنات البيانات الأساسية",
  "Data & Information": "البيانات والمعلومات",
}

const articleTitleArabicOverrides: Record<string, string> = {
  "Entrestate Decision Infrastructure": "بنية القرار في Entrestate",
  "Decision Tunnel (Workflow)": "مسار القرار داخل المنصة",
  "Stage 1: Intent": "المرحلة 1: فهم الطلب",
  "NL Goal to TableSpec JSON": "تحويل الطلب إلى TableSpec",
  "Intent-Aware Parsing": "فهم الطلب بحسب نية المستخدم",
  "Hidden Parameter Extraction": "استخراج الشروط الضمنية",
  "Stage 2: Evidence": "المرحلة 2: جمع الأدلة",
  "Exclusion Policy (Filter Distressed/Duplicates)": "سياسة الاستبعاد وتنظيف السجل",
  "5-Layer Evidence Stack": "طبقات الأدلة الخمس",
  "Data Hygiene (Canonical Graph)": "تنظيف البيانات وبناء الرسم المعتمد",
  "Stage 3: Judgment": "المرحلة 3: التقييم",
  "65% Market Score (Objective Quality)": "نتيجة السوق 65%",
  "35% Personal Match (Subjective Lens)": "الملاءمة الشخصية 35%",
  "Ranking & Scoring Engine": "محرك الترتيب والنتيجة",
  "Stage 4: Action": "المرحلة 4: التنفيذ",
  "Branded Decision Objects (PDF/Memos)": "مخرجات القرار الجاهزة",
  "Evidence Drawer (Transparency/Footnotes)": "درج الأدلة",
  "Automation Studio": "استوديو الأتمتة",
  "Evidence Stack Hierarchy": "هيكل طبقات الأدلة",
  "L1: Canonical (Static Truths/Audited)": "L1: المصدر المعتمد",
  "L2: Derived (Calculated Truths)": "L2: البيانات المشتقة",
  "L3: Dynamic (Living States/Inventory)": "L3: الحالة الحية للمخزون",
  "L4: External (Market Sensors/RERA/DLD)": "L4: المصادر الخارجية",
  "L5: Raw (Unprocessed Extraction)": "L5: المدخلات الخام",
  "Market Scoring Signals": "إشارات تقييم السوق",
  "Timing Signals (Entry/Exit Windows)": "إشارات التوقيت",
  "Stress Resilience (Grade A-F)": "مرونة الضغط",
  "Verified Gross Yield": "العائد الإجمالي الموثق",
  "Data Confidence Level": "مستوى الثقة في البيانات",
  "Broker Dashboard Features": "قدرات لوحة الوسيط",
  "AI Assistant (Gemini 1.5)": "المساعد الذكي",
  "Core Data Objects": "كائنات البيانات الأساسية",
  "Time Table (Atomic Intelligence Unit)": "الوحدة الذكية Time Table",
  "TableSpec (Query Blueprint)": "مخطط الاستعلام TableSpec",
  "Decision Objects (Outcome Artifacts)": "مخرجات القرار",
  "Profile Intelligence (User Preferences)": "ملف تفضيلات المستخدم",
  "Data & Information": "البيانات والمعلومات",
  "Dubai Land Department (DLD)": "دائرة الأراضي والأملاك",
  Stakeholders: "أصحاب العلاقة",
  "Investor Relations": "علاقات المستثمرين",
}

function localizeArticleTitle(title: string) {
  return articleTitleArabicOverrides[title] ?? `ملف تشغيلي: ${title}`
}

function localizeArticleCategory(category: string) {
  return articleCategoryArabicMap[category] ?? "وثائق المنصة"
}

export function getLocalizedDocsArticle(article: DocsArticle, locale: string): DocsArticle {
  if (locale !== "ar") return article

  const localizedTitle = localizeArticleTitle(article.title)
  const localizedCategory = localizeArticleCategory(article.category)

  return {
    ...article,
    title: localizedTitle,
    category: localizedCategory,
    summary: `شرح مختصر لدور ${localizedTitle} داخل Entrestate، ومتى يُستخدم، وكيف ينعكس أثره على القرار والمخرجات التشغيلية.`,
    scope: [
      `يوضح هذا الملف وظيفة ${localizedTitle} داخل المنصة ومسار العمل.`,
      `يربط هذا الموضوع بين ${localizedCategory} وبقية طبقات القرار والبيانات.`,
      "يصلح كمرجع سريع للشركاء والفرق الداخلية عند المراجعة أو الشرح.",
    ],
    execution: [
      `استخدم هذا الملف لفهم موضع ${localizedTitle} داخل التشغيل اليومي للمنصة.`,
      "راجع علاقته بالأدلة والحوكمة قبل أي تعديل في المنطق أو العرض.",
      "اعتمد عليه كمرجع موحّد عند التطوير أو التدقيق أو تجهيز المواد الخارجية.",
    ],
  }
}

export function getLocalizedDocsArticles(locale: string) {
  return docsArticles.map((article) => getLocalizedDocsArticle(article, locale))
}

export function getLocalizedArticleBySlug(slug: string, locale: string) {
  const article = getArticleBySlug(slug)
  if (!article) return undefined
  return getLocalizedDocsArticle(article, locale)
}

export function getLocalizedArticleCategories(locale: string) {
  const articles = getLocalizedDocsArticles(locale)
  return Array.from(new Set(articles.map((article) => article.category)))
}
