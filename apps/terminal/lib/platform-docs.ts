import { type AppLocale } from "@/i18n/locale"

export type PlatformDocsSection = {
  slug: string
  title: string
  summary: string
  highlights: string[]
}

export const platformDocsSectionsEn: PlatformDocsSection[] = [
  {
    slug: "documentation",
    title: "Platform Architecture",
    summary:
      "The complete technical blueprint: 10-Phase Data Pipeline, 5-Layer Evidence Stack, 4-Stage Decision Tunnel, and the unified Pipeline-to-Tunnel operating model.",
    highlights: [
      "10-Phase Sequential Pipeline: from raw HTML ingestion to evidence compilation",
      "5-Layer Evidence Stack: epistemic truth hierarchy (L1 Canonical to L5 Raw)",
      "4-Stage Decision Tunnel: Intent, Evidence, Judgment, Action",
      "Investment Score engine and 65/35 weighting logic",
    ],
  },
  {
    slug: "investors-relations",
    title: "Investor Relations",
    summary:
      "Investment thesis, market opportunity, competitive moat, traction metrics, and diligence-ready documentation for strategic partners and institutional capital.",
    highlights: [
      "Decision infrastructure replacing $2B+ listing portal market",
      "Live scored inventory, rated developers, and evidence-backed BUY signals",
      "Evidence-first architecture creates defensible trust moat",
      "Tier-based monetization: Free, Pro, Enterprise",
    ],
  },
  {
    slug: "partners-apis",
    title: "Partners & APIs",
    summary:
      "Partnership architecture, integration surfaces, API capabilities, and co-build lanes for data providers, brokerages, and distribution partners.",
    highlights: [
      "Data partner integration with traceable source lineage",
      "Brokerage decision desks and advisory workflow APIs",
      "Embed SDK: white-label intelligence modules",
      "Attribution engine and viral growth mechanics",
    ],
  },
  {
    slug: "data-information",
    title: "Data & Evidence Model",
    summary:
      "The epistemic foundation: how raw market signals become institutional-grade truths through the 5-Layer Evidence Stack, exclusion policies, and canonical data governance.",
    highlights: [
      "L1-L5 truth hierarchy with confidence scoring",
      "DLD, RERA, Property Finder sensor integration",
      "Exclusion policy: distressed sales, internal transfers, duplicates",
      "Static Truth Recovery and Aggressive Field Extraction",
    ],
  },
  {
    slug: "industry",
    title: "Industry & Market Intelligence",
    summary:
      "UAE real estate market structure, competitive landscape analysis, predictive analytics, stress resilience scoring, and responsible AI positioning.",
    highlights: [
      "71% of UAE inventory classified Speculative, only 99 Conservative plays",
      "Growth areas: 12.3% median ROI vs Premium areas: 7.1%",
      "Volatility-gated price refreshes (event-driven, not clock-based)",
      "Transparent evidence lineage and confidence disclosure",
    ],
  },
  {
    slug: "careers-intern",
    title: "Careers & Internships",
    summary:
      "Join the team building the operating system for UAE real estate. Engineering, data science, partnerships, and operations roles across Dubai.",
    highlights: [
      "Platform engineering and AI infrastructure",
      "Market intelligence and data pipeline operations",
      "Partnership development and enterprise solutions",
      "Internship tracks with mentorship and real project ownership",
    ],
  },
]

export const platformDocsSectionsAr: PlatformDocsSection[] = [
  {
    slug: "documentation",
    title: "بنية المنصة",
    summary:
      "المخطط التقني الكامل: خط معالجة البيانات من 10 مراحل، طبقات الأدلة الخمس، مسار القرار المكون من 4 مراحل، ونموذج التشغيل الموحد.",
    highlights: [
      "خط معالجة متسلسل من 10 مراحل: من استلام البيانات الخام إلى تجميع الأدلة",
      "طبقات الأدلة الخمس: هرمية الحقيقة المعرفية (من L1 المعتمد إلى L5 الخام)",
      "مسار القرار من 4 مراحل: النية، الأدلة، الحكم، التنفيذ",
      "محرك نتيجة الاستثمار ومنطق الوزن 65/35",
    ],
  },
  {
    slug: "investors-relations",
    title: "علاقات المستثمرين",
    summary:
      "أطروحة الاستثمار، فرص السوق، الخندق التنافسي، مقاييس الجذب، والوثائق الجاهزة للفحص للشركاء الاستراتيجيين ورؤوس الأموال المؤسسية.",
    highlights: [
      "بنية تحتية للقرار تحل محل سوق بوابات العقارات الذي تبلغ قيمته 2 مليار دولار",
      "مخزون حي مصنّف، ومطورون مقيمون، وإشارات BUY مدعومة بالأدلة",
      "بنية قائمة على الأدلة تخلق خندقاً من الثقة القابلة للدفاع عنها",
      "نموذج ربحي قائم على الفئات: مجاني، احترافي، مؤسسي",
    ],
  },
  {
    slug: "partners-apis",
    title: "الشركاء وواجهات البرمجة",
    summary:
      "بنية الشراكة، واجهات التكامل، قدرات API، ومسارات البناء المشترك لمزودي البيانات والوسطاء وشركاء التوزيع.",
    highlights: [
      "تكامل شركاء البيانات مع تتبع أصل المصدر",
      "مكاتب قرار الوسطاء وواجهات سير عمل الاستشارات",
      "حزمة تطوير البرمجيات (Embed SDK): وحدات تشغيل بيضاء",
      "محرك العزو وآليات النمو الفيروسي",
    ],
  },
  {
    slug: "data-information",
    title: "نموذج البيانات والأدلة",
    summary:
      "الأساس المعرفي: كيف تتحول إشارات السوق الخام إلى حقائق مؤسسية من خلال طبقات الأدلة الخمس، سياسات الاستبعاد، وحوكمة البيانات المعتمدة.",
    highlights: [
      "هرمية الحقيقة L1-L5 مع تسجيل مستويات الثقة",
      "تكامل مستشعرات DLD و RERA و Property Finder",
      "سياسة الاستبعاد: البيع الاضطراري، التحويلات الداخلية، التكرار",
      "استعادة الحقيقة الثابتة واستخراج الحقول المكثف",
    ],
  },
  {
    slug: "industry",
    title: "القطاع وتحليل السوق",
    summary:
      "هيكل سوق العقارات في الإمارات، تحليل المشهد التنافسي، التحليلات التوقعية، تقييم مرونة الضغط، والذكاء الاصطناعي المسؤول.",
    highlights: [
      "71% من مخزون الإمارات مصنف كمضاربة، فقط 99 خياراً محافظاً",
      "مناطق النمو: متوسط عائد 12.3% مقابل المناطق الممتازة: 7.1%",
      "تحديثات الأسعار المرتبطة بالتقلبات (تعتمد على الأحداث، وليس الوقت)",
      "تسلسل أدلة شفاف وإفصاح كامل عن مستويات الثقة",
    ],
  },
  {
    slug: "careers-intern",
    title: "الوظائف والتدريب",
    summary:
      "انضم إلى الفريق الذي يبني نظام تشغيل العقارات في الإمارات. أدوار في الهندسة، علوم البيانات، الشراكات، والعمليات في دبي.",
    highlights: [
      "هندسة المنصة والبنية التحتية للذكاء الاصطناعي",
      "تحليل السوق وعمليات خط معالجة البيانات",
      "تطوير الشراكات والحلول المؤسسية",
      "مسارات تدريبية مع توجيه وملكية حقيقية للمشاريع",
    ],
  },
]

export function getPlatformDocsSections(locale: AppLocale) {
  return locale === "ar" ? platformDocsSectionsAr : platformDocsSectionsEn
}

export type MindMapNode = {
  title: string
  children?: MindMapNode[]
}

export type MindMapBranch = {
  title: string
  nodes: MindMapNode[]
}

export const platformDocsSections: PlatformDocsSection[] = platformDocsSectionsEn

export const mindMapBranches = [
  {
    title: "Decision Tunnel (Workflow)",
    nodes: [
      "Stage 1: Intent",
      "NL Goal to TableSpec JSON",
      "Intent-Aware Parsing",
      "Hidden Parameter Extraction",
      "Stage 2: Evidence",
      "Exclusion Policy (Filter Distressed/Duplicates)",
      "5-Layer Evidence Stack",
      "Data Hygiene (Canonical Graph)",
      "Stage 3: Judgment",
      "65% Market Score (Objective Quality)",
      "35% Personal Match (Subjective Lens)",
      "Ranking & Scoring Engine",
      "Stage 4: Action",
      "Branded Decision Objects (PDF/Memos)",
      "Evidence Drawer (Transparency/Footnotes)",
      "Automation Studio",
    ],
  },
  {
    title: "Evidence Stack Hierarchy",
    nodes: [
      "L1: Canonical (Static Truths/Audited)",
      "L2: Derived (Calculated Truths)",
      "L3: Dynamic (Living States/Inventory)",
      "L4: External (Market Sensors/RERA/DLD)",
      "L5: Raw (Unprocessed Extraction)",
    ],
  },
  {
    title: "Market Scoring Signals",
    nodes: [
      "Timing Signals (Entry/Exit Windows)",
      "Stress Resilience (Grade A-F)",
      "Verified Gross Yield",
      "Data Confidence Level",
    ],
  },
  {
    title: "Broker Dashboard Features",
    nodes: [
      "AI Copilot",
      "Brochure-to-Listing Automation",
      "AI Lead Scoring (Hot/Warm/Cold)",
      "Sales Communication Coach",
      "Market Intelligence Analytics",
    ],
  },
  {
    title: "Core Data Objects",
    nodes: [
      "Time Table (Atomic Intelligence Unit)",
      "TableSpec (Query Blueprint)",
      "Decision Objects (Outcome Artifacts)",
      "Profile Intelligence (User Preferences)",
    ],
  },
  {
    title: "Data & Information",
    nodes: ["Dubai Land Department (DLD)", "Stakeholders", "Investor Relations"],
  },
]

export const documentationMindMap: {
  root: string
  branches: MindMapBranch[]
} = {
  root: "Entrestate Decision Infrastructure",
  branches: [
    {
      title: "Decision Tunnel (Workflow)",
      nodes: [
        {
          title: "Stage 1: Intent",
          children: ["NL Goal to TableSpec JSON", "Intent-Aware Parsing", "Hidden Parameter Extraction"].map((title) => ({ title })),
        },
        {
          title: "Stage 2: Evidence",
          children: [
            "Exclusion Policy (Filter Distressed/Duplicates)",
            "5-Layer Evidence Stack",
            "Data Hygiene (Canonical Graph)",
          ].map((title) => ({ title })),
        },
        {
          title: "Stage 3: Judgment",
          children: [
            "65% Market Score (Objective Quality)",
            "35% Personal Match (Subjective Lens)",
            "Ranking & Scoring Engine",
          ].map((title) => ({ title })),
        },
        {
          title: "Stage 4: Action",
          children: ["Branded Decision Objects (PDF/Memos)", "Evidence Drawer (Transparency/Footnotes)", "Automation Studio"].map(
            (title) => ({ title }),
          ),
        },
      ],
    },
    {
      title: "Evidence Stack Hierarchy",
      nodes: [
        "L1: Canonical (Static Truths/Audited)",
        "L2: Derived (Calculated Truths)",
        "L3: Dynamic (Living States/Inventory)",
        "L4: External (Market Sensors/RERA/DLD)",
        "L5: Raw (Unprocessed Extraction)",
      ].map((title) => ({ title })),
    },
    {
      title: "Market Scoring Signals",
      nodes: [
        "Timing Signals (Entry/Exit Windows)",
        "Stress Resilience (Grade A-F)",
        "Verified Gross Yield",
        "Data Confidence Level",
      ].map((title) => ({ title })),
    },
    {
      title: "Broker Dashboard Features",
      nodes: [
        "AI Assistant (Gemini 1.5)",
        "Brochure-to-Listing Automation",
        "AI Lead Scoring (Hot/Warm/Cold)",
        "Sales Communication Coach",
        "Market Intelligence Analytics",
      ].map((title) => ({ title })),
    },
    {
      title: "Core Data Objects",
      nodes: [
        "Time Table (Atomic Intelligence Unit)",
        "TableSpec (Query Blueprint)",
        "Decision Objects (Outcome Artifacts)",
        "Profile Intelligence (User Preferences)",
      ].map((title) => ({ title })),
    },
    {
      title: "Data & Information",
      nodes: ["Dubai Land Department (DLD)", "Stakeholders", "Investor Relations"].map((title) => ({ title })),
    },
  ],
}
