"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { GridBackground } from "@/components/grid-background"
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Building2,
  Users,
  Globe,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const DUBAI_TIME_ZONE = "Asia/Dubai"
const DUBAI_OFFSET_HOURS = 4
const DUBAI_SLOT_DEFINITIONS = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 17, minute: 0 },
]
const arabicWeekDays = ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
const englishWeekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const BASE_TIME_ZONE_OPTIONS = [
  { value: DUBAI_TIME_ZONE, label: "Dubai (GST, UTC+4)" },
  { value: "Europe/London", label: "London (BST/GMT)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "Asia/Riyadh", label: "Riyadh (AST)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
]

function formatInZone(
  date: Date,
  locale: AppLocale,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    timeZone,
    ...options,
  }).format(date)
}

function getDatePart(date: Date, timeZone: string, part: "year" | "month" | "day") {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone,
    [part]: "numeric",
  })
    .formatToParts(date)
    .find((entry) => entry.type === part)?.value

  return Number(value ?? 0)
}

function getDubaiToday() {
  const now = new Date()
  return {
    year: getDatePart(now, DUBAI_TIME_ZONE, "year"),
    month: getDatePart(now, DUBAI_TIME_ZONE, "month"),
    day: getDatePart(now, DUBAI_TIME_ZONE, "day"),
  }
}

function getWeekdayIndex(year: number, monthIndex: number, day: number) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: DUBAI_TIME_ZONE,
    weekday: "short",
  }).format(new Date(Date.UTC(year, monthIndex, day, 12)))

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday)
}

function buildDubaiSlotDate(year: number, monthIndex: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, monthIndex, day, hour - DUBAI_OFFSET_HOURS, minute))
}

function getBenefits(locale: AppLocale) {
  return locale === "ar"
    ? [
        { icon: Building2, text: "تغطية سوقية تناسب احتياجك", sub: "المشاريع · المناطق · المطورون" },
        { icon: Users, text: "فريق مختص يتابع معك", sub: "جلسة عملية بدل عرض مبيعات عام" },
        { icon: Globe, text: "تشغيل إقليمي من دبي", sub: "جلسات مهيأة لسوق الخليج" },
      ]
    : [
        { icon: Building2, text: "Custom market coverage", sub: "Projects · areas · developers" },
        { icon: Users, text: "A team that stays with the account", sub: "Operator walkthrough, not generic sales" },
        { icon: Globe, text: "Regional operation from Dubai", sub: "Built for UAE and Gulf workflows" },
      ]
}

function getSessionOutcomes(locale: AppLocale) {
  return locale === "ar"
    ? [
        {
          icon: Sparkles,
          title: "كيف تُبنى طبقة القرار",
          body: "نرتب لك مسار المشاريع والمناطق والمطورين والطبقة الداعمة للأدلة داخل نفس الجلسة.",
        },
        {
          icon: ShieldCheck,
          title: "ما الذي يمكن الوثوق به",
          body: "نوضح مصدر الأرقام، طبقة الثقة، وكيف تتعامل فرقك مع السجلات المشكوك فيها أو الناقصة.",
        },
        {
          icon: Video,
          title: "ما الذي يخرج به فريقك",
          body: "خطة واضحة لما يجب تفعيله أولاً: الشاشات، الصفحات، فرق المبيعات أو الاستثمار، ومسار التكامل.",
        },
      ]
    : [
        {
          icon: Sparkles,
          title: "How the decision layer is structured",
          body: "We walk through projects, areas, developers, and the evidence spine as one operating surface.",
        },
        {
          icon: ShieldCheck,
          title: "What your team can trust",
          body: "We make the source logic explicit, including confidence handling and how uncertain records are contained.",
        },
        {
          icon: Video,
          title: "What the team leaves with",
          body: "A concrete activation path across screens, pages, sales workflows, investment workflows, and integrations.",
        },
      ]
}

function getTimeZoneLabel(options: Array<{ value: string; label: string }>, timeZone: string) {
  return options.find((option) => option.value === timeZone)?.label ?? timeZone
}

export default function ContactPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const benefits = getBenefits(locale)
  const sessionOutcomes = getSessionOutcomes(locale)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    teamSize: "",
    message: "",
  })
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedTimeZone, setSelectedTimeZone] = useState(DUBAI_TIME_ZONE)
  const [browserTimeZone, setBrowserTimeZone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!resolved) return
    setBrowserTimeZone(resolved)
    setSelectedTimeZone(resolved)
  }, [])

  const timeZoneOptions = browserTimeZone && !BASE_TIME_ZONE_OPTIONS.some((option) => option.value === browserTimeZone)
    ? [{ value: browserTimeZone, label: `${browserTimeZone} (${isArabic ? "المتصفح" : "Browser"})` }, ...BASE_TIME_ZONE_OPTIONS]
    : BASE_TIME_ZONE_OPTIONS

  const dubaiToday = getDubaiToday()
  const currentYear = dubaiToday.year
  const currentMonthIndex = dubaiToday.month - 1
  const currentMonthLabel = formatInZone(
    new Date(Date.UTC(currentYear, currentMonthIndex, 1, 12)),
    locale,
    DUBAI_TIME_ZONE,
    { month: "long" },
  )
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()
  const firstDayOfMonth = getWeekdayIndex(currentYear, currentMonthIndex, 1)

  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i += 1) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i += 1) {
    calendarDays.push(i)
  }

  const previewDay = selectedDate ?? dubaiToday.day
  const slotOptions = DUBAI_SLOT_DEFINITIONS.map((slot) => {
    const slotDate = buildDubaiSlotDate(currentYear, currentMonthIndex, previewDay, slot.hour, slot.minute)
    const id = `${slot.hour}:${String(slot.minute).padStart(2, "0")}`
    return {
      id,
      localTime: formatInZone(slotDate, locale, selectedTimeZone, { hour: "numeric", minute: "2-digit" }),
      localDate: formatInZone(slotDate, locale, selectedTimeZone, { weekday: "short", month: "short", day: "numeric" }),
      dubaiTime: formatInZone(slotDate, locale, DUBAI_TIME_ZONE, { hour: "numeric", minute: "2-digit" }),
    }
  })

  const selectedSlot = selectedTime ? slotOptions.find((slot) => slot.id === selectedTime) ?? null : null
  const selectedDateLabel = selectedDate
    ? formatInZone(
        new Date(Date.UTC(currentYear, currentMonthIndex, selectedDate, 12)),
        locale,
        DUBAI_TIME_ZONE,
        { weekday: "long", month: "long", day: "numeric" },
      )
    : null
  const selectedTimeZoneLabel = getTimeZoneLabel(timeZoneOptions, selectedTimeZone)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubmitted(true)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  if (isSubmitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
        <GridBackground />
        <div className="relative z-10 max-w-xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            {isArabic ? "تم استلام طلب الجولة" : "Walkthrough Request Received"}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            {isArabic
              ? `وصلنا طلبك، وسيؤكد فريق Entrestate الجلسة خلال 24 ساعة${selectedDateLabel && selectedSlot ? ` في ${selectedDateLabel} عند ${selectedSlot.localTime} (${selectedTimeZoneLabel})` : ""}.`
              : `Your request is in. The Entrestate team will confirm the session within 24 hours${selectedDateLabel && selectedSlot ? ` for ${selectedDateLabel} at ${selectedSlot.localTime} (${selectedTimeZoneLabel})` : ""}.`}
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href={prefixLocalePath("/", locale)}>{isArabic ? "العودة للرئيسية" : "Back to Home"}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GridBackground />

      <div
        className="absolute left-1/2 top-1/4 h-[440px] w-[860px] -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(34, 94, 223, 0.08) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1480px] gap-10 px-6 py-8 lg:grid-cols-[1.05fr_1.2fr] lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-8 lg:gap-12">
          <div>
            <Link href={prefixLocalePath("/", locale)} className="inline-flex items-center">
              <Image src="/entrestate-logo.svg" alt="Entrestate" width={138} height={32} priority />
            </Link>

            <div className="mt-10 max-w-xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {isArabic ? "جلسة تفعيل مؤسسية" : "Enterprise Activation Session"}
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
                {isArabic
                  ? "رتّب طبقة القرار. ثم ابنِ عليها."
                  : "Structure the decision layer. Then build from it."}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {isArabic
                  ? "هذه ليست جولة واجهة فقط. نستخدم الجلسة لربط صفحات المشاريع والمناطق والمطورين، وتوضيح أين تبدأ فرقك وأين يجب أن تثق بالأرقام."
                  : "This is not a generic feature tour. We use the session to line up projects, areas, developers, and the evidence spine so your team knows where to start and what to trust."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.text} className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">{benefit.text}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{benefit.sub}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-[28px] border border-border/60 bg-card/50 p-6">
            <div className="flex flex-col gap-3 border-b border-border/50 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
                  {isArabic ? "ما الذي سنرتبه معاً" : "What we’ll align together"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  {isArabic ? "جلسة مبنية على التشغيل الفعلي" : "A session built around real operation"}
                </h2>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                {isArabic ? "30 دقيقة · دبي" : "30 min · Dubai operated"}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {sessionOutcomes.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-border/50 bg-background/40 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {isArabic ? "تقويم الفريق مضبوط على توقيت دبي" : "Team calendar anchored to Dubai time"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {isArabic ? "نُظهر وقتك المحلي أثناء الحجز" : "Your local time is shown while booking"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-[32px] border border-border/60 bg-card/55 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-8">
            <div className="mb-8 flex flex-col gap-4 border-b border-border/50 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                  {isArabic ? "احجز الجلسة" : "Book the session"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">
                  {isArabic ? "جولة منتج بصياغة تشغيلية" : "A product walkthrough with operating context"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {isArabic
                    ? "نُشغّل تقويم الفريق من دبي (GST / UTC+4)، لكننا نعرض الأوقات بوضوح وفق منطقتك الزمنية حتى لا يقع الالتباس أثناء الحجز."
                    : "The team calendar is run from Dubai (GST / UTC+4), but we translate the slots into your local timezone so scheduling stays unambiguous."}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: isArabic ? "الفريق" : "Team", value: isArabic ? "دبي" : "Dubai" },
                  { label: isArabic ? "المدة" : "Length", value: isArabic ? "30 د" : "30 min" },
                  { label: isArabic ? "التنسيق" : "Format", value: isArabic ? "فيديو" : "Video" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background/45 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/55">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "الاسم الأول" : "First name"}
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder={isArabic ? "محمد" : "John"}
                    required
                    className="w-full rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "اسم العائلة" : "Last name"}
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder={isArabic ? "العتيبي" : "Doe"}
                    required
                    className="w-full rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "البريد المهني" : "Work email"}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "الشركة" : "Company"}
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder={isArabic ? "اسم الشركة" : "Acme Capital"}
                    required
                    className="w-full rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="jobTitle" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "المسمى الوظيفي" : "Job title"}
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder={isArabic ? "مدير الاستثمار" : "Head of Investments"}
                    required
                    className="w-full rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label htmlFor="teamSize" className="mb-2 block text-sm font-medium text-foreground">
                    {isArabic ? "حجم الفريق" : "Team size"}
                  </label>
                  <select
                    id="teamSize"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    required
                    className="w-full appearance-none rounded-xl border border-border/60 bg-background/45 px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>
                      {isArabic ? "اختر حجم الفريق" : "Select team size"}
                    </option>
                    <option value="1-10">{isArabic ? "من 1 إلى 10" : "1-10 employees"}</option>
                    <option value="11-50">{isArabic ? "من 11 إلى 50" : "11-50 employees"}</option>
                    <option value="51-200">{isArabic ? "من 51 إلى 200" : "51-200 employees"}</option>
                    <option value="201-500">{isArabic ? "من 201 إلى 500" : "201-500 employees"}</option>
                    <option value="500+">{isArabic ? "+500" : "500+ employees"}</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isArabic ? "عرض الأوقات وفق منطقتك الزمنية" : "Show availability in your timezone"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {isArabic
                        ? "التقويم الأساسي في دبي، لكن الأوقات أدناه تُترجم تلقائياً إلى منطقتك."
                        : "The master calendar lives in Dubai, but the slots below are translated into your local zone."}
                    </p>
                  </div>
                  <div className="min-w-full md:min-w-[260px]">
                    <select
                      value={selectedTimeZone}
                      onChange={(event) => setSelectedTimeZone(event.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {timeZoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="mb-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
                      {isArabic ? "تقويم دبي" : "Dubai calendar"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {currentMonthLabel} {currentYear}
                    </p>
                  </div>

                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs">
                    {(isArabic ? arabicWeekDays : englishWeekDays).map((day) => (
                      <span key={day} className="py-1 text-muted-foreground">
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isPast = day !== null && day < dubaiToday.day
                      const weekdayIndex = day !== null ? getWeekdayIndex(currentYear, currentMonthIndex, day) : -1
                      const isWeekend = weekdayIndex === 0 || weekdayIndex === 6
                      const isDisabled = day === null || isPast || isWeekend

                      return (
                        <button
                          key={`${day ?? "blank"}-${index}`}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!day || isDisabled) return
                            setSelectedDate(day)
                            setSelectedTime(null)
                          }}
                          className={`aspect-square rounded-lg text-xs transition-all ${
                            day === null
                              ? "invisible"
                              : isDisabled
                                ? "cursor-not-allowed text-muted-foreground/25"
                                : selectedDate === day
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    {isArabic
                      ? "نعرض فقط الأيام العملية. اختر اليوم أولاً، ثم سنظهر لك الجلسات وفق توقيتك."
                      : "We only expose business days. Pick the day first, then confirm the slot in your own timezone."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
                        {isArabic ? "الأوقات المتاحة" : "Available slots"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{selectedTimeZoneLabel}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {isArabic ? "30 دقيقة" : "30 min"}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {slotOptions.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedTime(slot.id)}
                        disabled={!selectedDate}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          !selectedDate
                            ? "cursor-not-allowed border-border/40 bg-card/30 text-muted-foreground/40"
                            : selectedTime === slot.id
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {slot.localTime}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {slot.localDate}
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/55">
                          {isArabic ? `دبي: ${slot.dubaiTime}` : `Dubai: ${slot.dubaiTime}`}
                        </p>
                      </button>
                    ))}
                  </div>

                  {!selectedDate ? (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {isArabic ? "اختر يوماً من التقويم لفتح الأوقات." : "Choose a day from the calendar to unlock the times."}
                    </p>
                  ) : null}

                  {selectedDate && selectedSlot ? (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/8 p-4">
                      <div className="flex items-start gap-3">
                        <Video className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {isArabic ? "ملخص الجلسة المختارة" : "Selected session"}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {isArabic
                              ? `${selectedDateLabel} · ${selectedSlot.localTime} (${selectedTimeZoneLabel}) · مكالمة فيديو لمدة 30 دقيقة مع فريق Entrestate.`
                              : `${selectedDateLabel} · ${selectedSlot.localTime} (${selectedTimeZoneLabel}) · 30-minute video call with the Entrestate team.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  {isArabic ? "ما الذي يجب أن نعرفه قبل الجلسة؟ (اختياري)" : "What should we know before the session? (optional)"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={isArabic ? "اكتب باختصار السوق أو الفريق أو نوع القرارات التي تريد تغطيتها..." : "Tell us about your market, team, or the decisions you want the session to cover..."}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-border/60 bg-background/45 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !selectedDate || !selectedTime}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isArabic ? "جارٍ تثبيت الموعد..." : "Scheduling..."}
                  </span>
                ) : (
                  isArabic ? "ثبّت الجلسة" : "Confirm the walkthrough"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isArabic ? "إذا لم تكن جاهزاً للجلسة بعد" : "If you are not ready for the session yet"}{" "}
              <Link href={prefixLocalePath("/pricing", locale)} className="font-medium text-primary hover:underline">
                {isArabic ? "راجع الباقات أولاً" : "review the pricing first"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
