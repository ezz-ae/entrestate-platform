"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type MarqueePromptsProps = {
  onPromptSelect?: (prompt: string) => void
}

const PROMPT_ROWS: Record<AppLocale, string[][]> = {
  en: [
    [
      "Screen 2BR projects under AED 2M with BUY signal",
      "Compare Dubai Marina vs JBR on yield and price",
      "Generate an investor memo for Marina Vista",
      "Show the V1 stress profile for a Dubai Harbour project",
      "Show Golden Visa eligible projects with high yield",
      "Explain what BUY/HOLD/WAIT signals mean",
    ],
    [
      "Rank developers by delivery reliability in Dubai",
      "Find top-performing areas by yield this quarter",
      "Price reality check for Downtown units",
      "Show latest DLD transactions in Business Bay",
      "Review real V1 resilience sub-scores for Marina Vista",
      "Compare off-plan vs ready assets for ROI",
    ],
    [
      "Find best secondary market deals in MBR City",
      "Compare Emaar vs Damac reliability scores",
      "Supply forecast for villas in Meydan",
      "Which areas have the strongest price momentum?",
      "Create a 12-month investment roadmap",
      "Summarize the latest market pulse",
    ],
  ],
  ar: [
    [
      "اعرض شقق غرفتين تحت AED 2M بإشارة BUY",
      "قارن دبي مارينا وJBR في العائد والسعر",
      "أنشئ مذكرة استثمار لمارينا فيستا",
      "اعرض ملف الضغط V1 لمشروع في دبي هاربور",
      "اعرض مشاريع الإقامة الذهبية ذات العائد المرتفع",
      "اشرح معنى إشارات BUY وHOLD وWAIT",
    ],
    [
      "رتّب المطورين حسب موثوقية التسليم في دبي",
      "ما أفضل المناطق أداءً في العائد هذا الربع؟",
      "افحص واقعية الأسعار لوحدات وسط دبي",
      "اعرض آخر صفقات DLD في الخليج التجاري",
      "اعرض درجات المرونة التفصيلية لمارينا فيستا",
      "قارن بين الأوف بلان والجاهز في العائد",
    ],
    [
      "اعثر على أفضل فرص السوق الثانوي في MBR City",
      "قارن موثوقية إعمار وداماك",
      "ما توقعات المعروض للفلل في ميدان؟",
      "أي المناطق لديها أقوى زخم سعري؟",
      "أنشئ خطة استثمار لمدة 12 شهراً",
      "لخّص نبض السوق الحالي",
    ],
  ],
}

export function MarqueePrompts({ onPromptSelect }: MarqueePromptsProps) {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const promptRows = PROMPT_ROWS[locale] ?? PROMPT_ROWS.en

  const handlePrompt = (prompt: string) => {
    if (onPromptSelect) {
      onPromptSelect(prompt)
      return
    }
    const params = new URLSearchParams({ prompt })
    router.push(prefixLocalePath(`/chat?${params.toString()}`, locale))
  }

  const isRtl = locale === "ar"

  return (
    <div className="relative w-full overflow-hidden py-12 flex flex-col gap-8">
      {promptRows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative flex overflow-hidden">
          <motion.div
            className="flex gap-6 whitespace-nowrap"
            animate={{
              x: isRtl 
                ? (rowIndex % 2 === 0 ? [1000, 0] : [0, 1000])
                : (rowIndex % 2 === 0 ? [0, -1000] : [-1000, 0]),
            }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 40 + rowIndex * 10,
                ease: "linear",
              },
            }}
            whileHover={{ scale: 0.98, opacity: 0.8 }}
          >
            {[...row, ...row, ...row].map((prompt, i) => (
              <button
                key={`${prompt}-${i}`}
                type="button"
                onClick={() => handlePrompt(prompt)}
                className="inline-flex items-center justify-center px-6 py-4 min-w-[320px] h-[84px] text-center cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all bg-card/40 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-border/40 rounded-2xl group"
                aria-label={locale === "ar" ? `افتح المحادثة بهذا الطلب: ${prompt}` : `Open chat with: ${prompt}`}
              >
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-normal line-clamp-2">
                  {prompt}
                </p>
              </button>
            ))}
          </motion.div>
        </div>
      ))}
      
      {/* Dynamic side masks for "perfect" fade */}
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
    </div>
  )
}
