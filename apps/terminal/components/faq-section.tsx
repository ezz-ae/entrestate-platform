"use client"

import { useEffect, useRef, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does Entrestate pricing work?",
    answer:
      "Plans are monthly and tied to market coverage and team size. Enterprise plans add custom data extracts, priority refreshes, and dedicated support.",
  },
  {
    question: "How often is the market data refreshed?",
    answer:
      "Core inventory refreshes weekly. Safety and scoring update after each refresh. Media packs update on a rolling basis.",
  },
  {
    question: "What do the safety tiers mean?",
    answer:
      "Safety tiers classify projects by delivery confidence, pricing stability, and liquidity signals. They help you screen inventory quickly without guessing.",
  },
  {
    question: "Do you cover ready and off-plan projects?",
    answer:
      "Yes. Coverage spans ready inventory and off-plan projects with delivery bands so you can filter by timing.",
  },
  {
    question: "Can I bring my own listings?",
    answer:
      "Yes. You can align your internal listings with Entrestate signals and compare them against the broader market.",
  },
  {
    question: "How is the data licensed?",
    answer:
      "Data is licensed for internal use by your team. For redistribution or syndication, we provide custom agreements.",
  },
]

export function FaqSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden bg-background">
      {/* Subtle horizontal blur ray */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[100px] rounded-full opacity-[0.08] blur-[80px] pointer-events-none bg-primary" />

      <div className="w-full flex justify-center px-4 md:px-6">
        <div className="max-w-3xl w-full">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2
              className={`text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance ${
                isVisible ? "animate-slide-up-section" : "opacity-0"
              }`}
            >
              Frequently asked questions
            </h2>
            <p
              className={`text-muted-foreground text-lg max-w-2xl mx-auto ${
                isVisible ? "animate-slide-up-section-delayed" : "opacity-0"
              }`}
            >
              Everything you need to know about Entrestate and the market data platform.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div
            className={`${isVisible ? "animate-slide-up-section-delayed" : "opacity-0"}`}
            style={{ animationDelay: "0.3s" }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10 group">
                  <AccordionTrigger className="text-left text-base md:text-lg font-medium text-foreground hover:text-primary hover:no-underline py-5 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}
