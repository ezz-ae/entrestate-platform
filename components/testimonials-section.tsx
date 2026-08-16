"use client"

import { useEffect, useRef, useState } from "react"

const testimonials = [
  {
    body: "Occalizer turned our spend into a dial. We scale only when the system earns it.",
    author: {
      name: "Sarah Chen",
      handle: "sarahchen_dev",
      role: "Brokerage Partner",
      imageUrl: "/avatars/avatar-01.svg",
    },
  },
  {
    body: "Lead Direction removed guesswork. Ready leads are now obvious and measurable.",
    author: {
      name: "Marcus Rodriguez",
      handle: "marcusdev",
      role: "Sales Director",
      imageUrl: "/avatars/avatar-02.svg",
    },
  },
  {
    body: "Scenario Management saved our Q4 budget. The system hit the brakes before we saw waste.",
    author: {
      name: "Emily Watson",
      handle: "emwatson",
      role: "Marketing Lead",
      imageUrl: "/avatars/avatar-03.svg",
    },
  },
  {
    body: "Fairness % finally gives us a conservation law. We can defend every AED.",
    author: {
      name: "David Park",
      handle: "davidpark_ai",
      role: "Operations Head",
      imageUrl: "/avatars/avatar-04.svg",
    },
  },
  {
    body: "Our team stopped debating keywords. The system reads intent from the page.",
    author: {
      name: "Priya Sharma",
      handle: "priyacodes",
      role: "Campaign Manager",
      imageUrl: "/avatars/avatar-05.svg",
    },
  },
  {
    body: "Inventory anchors let us launch faster without losing correctness.",
    author: {
      name: "James Liu",
      handle: "jamesliu",
      role: "Portfolio Lead",
      imageUrl: "/avatars/avatar-06.svg",
    },
  },
  {
    body: "The decision surface is clear. We know when to push and when to protect.",
    author: {
      name: "Anna Kowalski",
      handle: "annak_tech",
      role: "Growth Strategy",
      imageUrl: "/avatars/avatar-07.svg",
    },
  },
  {
    body: "We finally have a system that respects broker time and lead quality.",
    author: {
      name: "Michael Foster",
      handle: "michaelfoster",
      role: "Regional Director",
      imageUrl: "/avatars/avatar-08.svg",
    },
  },
  {
    body: "Entrestate OS made our presence reliable. No more vanity metrics.",
    author: {
      name: "Rachel Green",
      handle: "rachelg_dev",
      role: "Founder",
      imageUrl: "/avatars/avatar-09.svg",
    },
  },
]

function TestimonialCard({ testimonial }: { testimonial: (typeof testimonials)[0] }) {
  return (
    <figure className="rounded-xl bg-surface-testimonial border border-primary/10 p-6 mb-4">
      <blockquote className="text-muted-foreground text-sm leading-relaxed">
        <p>{`"${testimonial.body}"`}</p>
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-x-3">
        <img
          alt=""
          src={testimonial.author.imageUrl || "/avatars/avatar-01.svg"}
          width={40}
          height={40}
          loading="lazy"
          className="size-10 rounded-full bg-muted"
        />
        <div>
          <div className="font-medium text-foreground text-sm">{testimonial.author.name}</div>
          <div className="text-muted-foreground text-xs">@{testimonial.author.handle}</div>
        </div>
      </figcaption>
    </figure>
  )
}

function ScrollingColumn({
  testimonials,
  direction = "up",
  duration = 25,
}: {
  testimonials: (typeof testimonials)[0][]
  direction?: "up" | "down"
  duration?: number
}) {
  return (
    <div className="relative h-[600px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-surface-dark to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-dark to-transparent z-10 pointer-events-none" />

      <div
        className={`flex flex-col ${direction === "up" ? "animate-scroll-up" : "animate-scroll-down"}`}
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {[...testimonials, ...testimonials].map((testimonial, idx) => (
          <TestimonialCard key={`${testimonial.author.handle}-${idx}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const col1 = testimonials.slice(0, 3)
  const col2 = testimonials.slice(3, 6)
  const col3 = testimonials.slice(6, 9)
  const allTestimonials = testimonials

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden bg-surface-dark">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[200px] rounded-full pointer-events-none bg-primary/[0.08] blur-[120px]" />

      <div className="w-full flex justify-center px-4">
        <div className="max-w-5xl w-full">
          <div className={`text-center mb-16 ${isVisible ? "animate-slide-up-section" : "opacity-0"}`}>
            <p className="text-primary text-sm font-medium mb-3">Field Proof</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance mb-4">
              Trusted by operators worldwide
            </h2>
            <p
              className={`text-muted-foreground max-w-2xl mx-auto ${isVisible ? "animate-slide-up-section-delayed" : "opacity-0"}`}
            >
              Join teams building disciplined market presence with Entrestate OS.
            </p>
          </div>

          <div className={`md:hidden ${isVisible ? "animate-fade-in-delayed" : "opacity-0"}`}>
            <ScrollingColumn testimonials={allTestimonials} direction="up" duration={45} />
          </div>

          <div className={`hidden md:grid md:grid-cols-3 gap-4 ${isVisible ? "animate-fade-in-delayed" : "opacity-0"}`}>
            <ScrollingColumn testimonials={col1} direction="up" duration={30} />
            <ScrollingColumn testimonials={col2} direction="down" duration={35} />
            <ScrollingColumn testimonials={col3} direction="up" duration={32} />
          </div>
        </div>
      </div>
    </section>
  )
}
