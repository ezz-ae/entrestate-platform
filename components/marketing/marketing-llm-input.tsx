"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, Globe, Zap } from "lucide-react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth/client"
import { type AppLocale } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"

const PLACEHOLDERS: Record<AppLocale, string[]> = {
  en: [
    "Ask anything about the real estate market...",
    "Find 2BR projects under AED 2M in Dubai Marina...",
    "Compare Emaar vs Damac reliability scores...",
    "What is the rental yield in Business Bay today?",
    "Show the V1 stress profile for Marina Vista...",
  ],
  ar: [
    "اسأل أي شيء عن سوق العقارات...",
    "اعرض مشاريع غرفتين تحت AED 2M في دبي مارينا...",
    "قارن موثوقية إعمار وداماك...",
    "ما العائد الإيجاري في الخليج التجاري اليوم؟",
    "اعرض ملف الضغط V1 لمارينا فيستا...",
  ],
}

export function MarketingLLMInput() {
  const { data: session } = authClient.useSession()
  const locale = useLocale() as AppLocale
  const canUpload = Boolean(session?.user)
  const [input, setInput] = useState("")
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const placeholders = PLACEHOLDERS[locale] ?? PLACEHOLDERS.en
  const inventoryValue = formatAed(45_000_000_000, locale, { compact: true })
  const attachTitle = canUpload
    ? locale === "ar" ? "إرفاق ملف" : "Attach file"
    : locale === "ar" ? "سجّل الدخول لإرفاق الملفات" : "Log in to attach files"

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholders.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto px-6 group">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_8px_30px_rgba(47,90,166,0.1)] focus-within:border-primary/40 transition-all p-2">
          <div className="relative min-h-[100px]">
            <AnimatePresence mode="wait">
              {!input && (
                <motion.div
                  key={placeholderIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-4 left-4 text-muted-foreground/50 pointer-events-none text-base"
                >
                  {placeholders[placeholderIdx]}
                </motion.div>
              )}
            </AnimatePresence>
            <Textarea
              className="min-h-[100px] w-full bg-transparent border-0 focus-visible:ring-0 resize-none py-4 px-4 text-base relative z-10"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between p-2 border-t border-border/10">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl"
                disabled={!canUpload}
                title={attachTitle}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl">
                <Globe className="h-4 w-4" />
              </Button>
              <div className="h-8 w-px bg-border/40 mx-1" />
              <Button variant="ghost" size="sm" className="h-9 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 font-normal rounded-xl transition-all">
                <Zap className="h-4 w-4" />
                {locale === "ar" ? "فحص عميق" : "Deep Scan"}
              </Button>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                disabled={!input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {locale === "ar" ? "تغذية DLD المباشرة نشطة" : "Live DLD Feed Active"}
        </span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>{locale === "ar" ? `تم تقييم مخزون بقيمة ${inventoryValue}` : `Scored ${inventoryValue} in inventory`}</span>
      </div>
    </div>
  )
}
