"use client"

import Link from "next/link"
import { motion, useScroll, useTransform, type Variants } from "framer-motion"
import { useLocale } from "next-intl"
import { useRef } from "react"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Footer } from "@/components/footer"
import { MarqueePrompts } from "@/components/marketing/marquee-prompts"
import { MarketingLLMInput } from "@/components/marketing/marketing-llm-input"
import { usePlatformMetrics } from "@/hooks/use-platform-metrics"
import { ArrowRight, Command, Scale, Search, FileText, SlidersHorizontal, Gauge, ShieldAlert, BarChart3, Database, History, Activity, TrendingUp, MapPin, Building2, Users, Zap, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Bilingual data ────────────────────────────────────────────────────────────

const NAV_LINKS = {
  en: [
    { label: "Platform", href: "/overview" },
    { label: "Intelligence", href: "/ai" },
    { label: "Enterprise", href: "/pricing" },
    { label: "Pricing", href: "/pricing" },
  ],
  ar: [
    { label: "المنصة", href: "/overview" },
    { label: "التحليل", href: "/ai" },
    { label: "المؤسسات", href: "/pricing" },
    { label: "الأسعار", href: "/pricing" },
  ],
}

const commands = {
  en: [
    { id: "screen",  title: "/screen",  desc: "Find ranked projects with constraints", icon: Search },
    { id: "compare", title: "/compare", desc: "Direct area or project comparison",     icon: Scale },
    { id: "memo",    title: "/memo",    desc: "Generate full investor memo",            icon: FileText },
    { id: "risk",    title: "/risk",    desc: "Real V1 stress breakdown",              icon: SlidersHorizontal },
    { id: "price",   title: "/price",   desc: "Price reality check",                   icon: Gauge },
    { id: "area",    title: "/area",    desc: "Area-level risk brief",                 icon: ShieldAlert },
    { id: "pulse",   title: "/pulse",   desc: "Live DLD market pulse",                icon: BarChart3 },
    { id: "bench",   title: "/bench",   desc: "DLD area benchmark",                   icon: Database },
    { id: "history", title: "/history", desc: "DLD transaction search",               icon: History },
  ],
  ar: [
    { id: "screen",  title: "/screen",  desc: "ابحث عن مشاريع مصنّفة بمعايير محددة",   icon: Search },
    { id: "compare", title: "/compare", desc: "مقارنة مباشرة بين مناطق أو مشاريع",     icon: Scale },
    { id: "memo",    title: "/memo",    desc: "إنشاء مذكرة استثمار كاملة",              icon: FileText },
    { id: "risk",    title: "/risk",    desc: "تحليل ضغط V1 الحقيقي",                  icon: SlidersHorizontal },
    { id: "price",   title: "/price",   desc: "فحص واقعية الأسعار",                     icon: Gauge },
    { id: "area",    title: "/area",    desc: "موجز مخاطر المنطقة",                     icon: ShieldAlert },
    { id: "pulse",   title: "/pulse",   desc: "نبض سوق DLD المباشر",                   icon: BarChart3 },
    { id: "bench",   title: "/bench",   desc: "معيار منطقة DLD",                        icon: Database },
    { id: "history", title: "/history", desc: "بحث في معاملات DLD",                     icon: History },
  ],
}

const features = {
  en: [
    {
      icon: Brain,
      title: "Decision Terminal V1",
      desc: "Every project scored on timing, stress resilience, yield, and investor grade — not guesses.",
    },
    {
      icon: Zap,
      title: "Live DLD Data",
      desc: "Live transaction feed from Dubai Land Department. Prices anchored to verified deals.",
    },
    {
      icon: Building2,
      title: "Developer Reliability",
      desc: "Rated developer coverage across delivery reliability, track record, and market positioning.",
    },
  ],
  ar: [
    {
      icon: Brain,
      title: "محطة القرار V1",
      desc: "كل مشروع مُقيَّم بالتوقيت ومرونة الضغط والعائد ودرجة المستثمر — ليس تخمينات.",
    },
    {
      icon: Zap,
      title: "بيانات DLD مباشرة",
      desc: "رصد مباشر للمعاملات من دائرة الأراضي والأملاك. أسعار مرتبطة بصفقات مؤكدة.",
    },
    {
      icon: Building2,
      title: "ملف المطورين",
      desc: "تغطية المطورين المُقيَّمين عبر موثوقية التسليم والسجل والموقع السوقي.",
    },
  ],
}

const examples = {
  en: [
    "Find 2BR under AED 2M with BUY timing label",
    "Compare Dubai Marina vs JBR on yield",
    "Top 5 emerging areas for investment",
    "V1 stress profile for a Dubai Harbour project",
  ],
  ar: [
    "ابحث عن شقة غرفتين تحت AED 2M بإشارة شراء",
    "قارن دبي مارينا و JBR من حيث العائد",
    "أفضل 5 مناطق ناشئة للاستثمار",
    "ملف ضغط V1 لمشروع في دبي هاربر",
  ],
}

const COPY = {
  en: {
    engine:       "ENTRESTATE INTELLIGENCE V4.2",
    optimize:     "GEMINI POWERED",
    headline1:    "The future of real estate",
    headline2:    "is intelligent.",
    subtitle:     "Move beyond data. Access professional-grade market intelligence, automated risk benchmarks, and verified execution.",
    start:        "Start Intelligence Session",
    enterprise:   "Explore Enterprise Plans",
    sectionTitle: "Intelligence that thinks with you.",
    sectionBody:  "The platform doesn't just return rows. It analyzes context, benchmarks risks, and drafts professional insights using the same logic as the world's top real estate analysts.",
    sectionLink:  "Explore the Knowledge Engine",
    chat:         "Chat",
    logIn:        "Log in",
    getStarted:   "Get Started",
    advancedCmds: "Advanced Neural Commands",
  },
  ar: {
    engine:       "محرك القرار العقاري 4.2",
    optimize:     "مصمم بالعربية والإنجليزية",
    headline1:    "اسأل السوق",
    headline2:    "قبل القرار.",
    subtitle:     "ادخل مباشرة إلى قراءة المشاريع والمناطق والمخاطر والتوقيت من مكان واحد.",
    start:        "ابدأ جلسة التحليل",
    enterprise:   "استعرض خطط المؤسسات",
    sectionTitle: "تحليل يساند قرارك.",
    sectionBody:  "المنصة لا تعيد صفوفاً فحسب — بل تحلل السياق وتقيس المخاطر وتصيغ تقارير احترافية.",
    sectionLink:  "استكشف محرك المعرفة",
    chat:         "محادثة",
    logIn:        "تسجيل الدخول",
    getStarted:   "ابدأ الآن",
    advancedCmds: "أوامر عصبية متقدمة",
  },
}

// ── Animation ─────────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const } },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatLandingPage() {
  const locale  = useLocale()
  const isRTL   = locale === "ar"
  const metrics = usePlatformMetrics()
  const formatter = new Intl.NumberFormat(isRTL ? "ar-AE" : "en-US")
  const copy    = isRTL ? COPY.ar : COPY.en
  const navLinks = isRTL ? NAV_LINKS.ar : NAV_LINKS.en
  const cmds     = isRTL ? commands.ar : commands.en
  const st = [
    { value: formatter.format(metrics.totalProjects), label: isRTL ? "مشروع مُصنّف" : "Scored Projects", icon: Building2 },
    { value: formatter.format(metrics.totalAreas), label: isRTL ? "منطقة مغطاة" : "Areas Covered", icon: MapPin },
    { value: formatter.format(metrics.dldTransactions), label: isRTL ? "معاملة DLD" : "DLD Transactions", icon: TrendingUp },
    { value: formatter.format(metrics.ratedDevelopers), label: isRTL ? "مطور مُقيَّم" : "Developers Rated", icon: Users },
  ]
  const feat     = isRTL ? features.ar : features.en
  const ex       = isRTL ? examples.ar : examples.en

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroY       = useTransform(scrollYProgress, [0, 0.6], [0, -60])

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-primary/4 blur-[140px] rounded-full animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-accent/4 blur-[140px] rounded-full animate-pulse" style={{ animationDuration: "11s", animationDelay: "3s" }} />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-primary/3 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: "14s", animationDelay: "6s" }} />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl transition-all">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground/90 hover:text-foreground transition-colors">
              Entrestate
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <CopilotEntryLink className="text-sm font-bold text-primary relative group">
                {copy.chat}
                <span className="absolute -bottom-1 left-0 w-full h-px bg-primary" />
              </CopilotEntryLink>
              {navLinks.map(({ label, href }) => (
                <Link key={label} href={href} className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors relative group">
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{copy.logIn}</Link>
            <Button asChild size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 font-medium shadow-xl shadow-foreground/10">
              <Link href="/signup">{copy.getStarted}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center relative z-10">

        {/* ── Hero ── */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, y: heroY }}
          className="w-full pt-36 pb-20 flex flex-col items-center text-center px-6"
        >
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="container max-w-5xl mx-auto flex flex-col items-center">

            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/6 rounded-full border border-primary/15 backdrop-blur-sm shadow-inner cursor-default">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span className="tracking-wide">{copy.engine}</span>
                <div className="h-3 w-px bg-primary/20 mx-1" />
                <span className="text-primary/60 font-medium">{copy.optimize}</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[88px] font-serif text-foreground leading-[1.04] tracking-tight mb-8">
              {copy.headline1}
              <br />
              <span className="text-muted-foreground/35 italic">{copy.headline2}</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground/75 max-w-2xl mb-14 font-medium leading-relaxed">
              {copy.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-5 mb-20">
              <Button asChild size="lg" className="h-14 rounded-full px-10 gap-3 text-base bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <CopilotEntryLink>
                  {copy.start}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </CopilotEntryLink>
              </Button>
              <Link href="/pricing" className="group text-sm font-semibold flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                {copy.enterprise}
                <ArrowRight className={`w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl mb-24">
              {st.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-card/30 border border-border/30 backdrop-blur-sm">
                  <Icon className="w-4 h-4 text-primary/60 mb-0.5" />
                  <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
                  <span className="text-[11px] text-muted-foreground/60 font-medium text-center">{label}</span>
                </div>
              ))}
            </motion.div>

          </motion.div>
        </motion.section>

        {/* ── Marquee (Moving Blocks) ── */}
        <section className="w-full mb-0 select-none overflow-hidden">
          <MarqueePrompts />
        </section>

        {/* ── LLM Input ── */}
        <section className="w-full max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Example chips */}
            <div className="flex flex-wrap justify-center gap-2.5 mb-8">
              {ex.map((text, i) => (
                <button key={i} className="px-4 py-2 bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
                  {text}
                </button>
              ))}
            </div>
            <MarketingLLMInput />
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section className="w-full max-w-5xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {feat.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group p-7 bg-card/25 backdrop-blur-sm border border-border/30 rounded-3xl hover:border-primary/30 transition-all hover:bg-card/40"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Commands Grid ── */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-12 justify-center text-muted-foreground/40">
              <div className="h-px w-12 bg-border/40" />
              <Command className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">{copy.advancedCmds}</span>
              <div className="h-px w-12 bg-border/40" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4">
              {cmds.map((cmd) => (
                <motion.div
                  key={cmd.id}
                  whileHover={{ y: -4, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="group p-4 bg-card/25 backdrop-blur-sm border border-border/30 rounded-2xl hover:border-primary/40 transition-colors text-center flex flex-col items-center justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:shadow-primary/5 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                    <cmd.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] font-bold mb-1 text-primary/70 group-hover:text-primary transition-colors tracking-tight">{cmd.title}</div>
                    <div className="text-[9px] text-muted-foreground/55 font-medium leading-snug group-hover:text-muted-foreground/80 transition-colors">{cmd.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="w-full max-w-3xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl md:text-5xl font-serif text-foreground/90 leading-tight mb-6">
              {copy.sectionTitle}
            </h2>
            <p className="text-base text-muted-foreground/70 leading-relaxed mb-10 max-w-xl mx-auto">
              {copy.sectionBody}
            </p>
            <Link href="/overview" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4 transition-all">
              {copy.sectionLink}
              <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
