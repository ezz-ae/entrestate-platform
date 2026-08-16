"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  LogoIcon,
  BrainIcon,
  LinkIcon,
  CheckSquareIcon,
  SlidersIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons"
import Link from "next/link"
import { Search, Sparkles, ArrowRight, Clapperboard, Clock, Image } from "lucide-react"
import { AppShell } from "@/seq/components/app-shell"
import { CreditsDisplay } from "@/seq/components/shared"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/seq/components/ui/dialog"
import { Input } from "@/seq/components/ui/input"
import { useRouter } from "next/navigation"
import { PROMPT_LIBRARY, type ProjectOption } from "@/seq/lib/creation-library"

type HeroSlide = {
  title: string
  description: string
  tag: string
  cta: string
  ctaLink: string
  mediaUrl?: string
  projectName?: string
  projectLocation?: string
}

const MEDIA_SURFACES = [
  {
    title: "Storyboard Builder",
    description: "Turn project media into a cinematic storyboard in minutes.",
    href: "/storyboard",
    tag: "Storyboard",
    icon: Clapperboard,
  },
  {
    title: "Launch Timeline",
    description: "Arrange scenes, timing, and transitions for launch campaigns.",
    href: "/timeline",
    tag: "Timeline",
    icon: Clock,
  },
  {
    title: "Image Studio",
    description: "Create listing-ready visuals and social packs from your library.",
    href: "/image-playground",
    tag: "Images",
    icon: Image,
  },
]

// Hero slides for carousel
const BASE_SLIDES: HeroSlide[] = [
  {
    title: "Create project marketing videos",
    description: "Turn listing media into cinematic sequences, timelines, and launch assets in minutes.",
    tag: "Launch",
    cta: "Start a Storyboard",
    ctaLink: "/storyboard",
  },
  {
    title: "Storyboard real estate narratives",
    description: "Draft a full sequence from a single brief, then refine every frame with precision.",
    tag: "Storyboard",
    cta: "Open Storyboard",
    ctaLink: "/storyboard",
  },
  {
    title: "Build visual asset packs fast",
    description: "Create hero renders, amenity stills, and social-ready visuals from project media.",
    tag: "Assets",
    cta: "Explore Images",
    ctaLink: "/image-playground",
  },
]

const isPlaceholderCover = (url?: string) => Boolean(url && url.startsWith("/covers/"))

export const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activePromptId, setActivePromptId] = useState<string | null>(null)
  const [projectQuery, setProjectQuery] = useState("")
  const [quickPrompt, setQuickPrompt] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectLibrary, setProjectLibrary] = useState<ProjectOption[]>([])
  const [projectSource, setProjectSource] = useState<"live" | "loading" | "unavailable">("loading")
  const [isProjectLoading, setIsProjectLoading] = useState(true)
  const router = useRouter()

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BASE_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      try {
        const response = await fetch("/api/seq/project-library?limit=60", { cache: "no-store" })
        if (!response.ok) throw new Error("Failed to load project library")
        const data = await response.json()
        if (!isMounted) return
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjectLibrary(data.projects)
          setProjectSource("live")
        } else {
          setProjectSource("unavailable")
        }
      } catch (error) {
        console.error("Unable to load media enrichment data:", error)
        if (isMounted) setProjectSource("unavailable")
      } finally {
        if (isMounted) setIsProjectLoading(false)
      }
    }

    loadProjects()
    return () => {
      isMounted = false
    }
  }, [])

  const slideCount = BASE_SLIDES.length
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slideCount)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount)
  const activePrompt = PROMPT_LIBRARY.find((prompt) => prompt.id === activePromptId) || null

  const heroSlides = useMemo(() => {
    if (projectSource !== "live") return BASE_SLIDES
    const picks = projectLibrary
      .map((project) => ({
        project,
        mediaUrl:
          (!isPlaceholderCover(project.cover) && project.cover) ||
          project.media?.find((url) => !isPlaceholderCover(url)),
      }))
      .filter((item) => Boolean(item.mediaUrl))
      .slice(0, 3)

    if (picks.length === 0) return BASE_SLIDES

    return BASE_SLIDES.map((slide, index) => {
      const pick = picks[index % picks.length]
      return {
        ...slide,
        mediaUrl: pick.mediaUrl,
        projectName: pick.project.name,
        projectLocation: pick.project.location,
      }
    })
  }, [projectLibrary, projectSource])

  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase()
    if (!query) return projectLibrary
    return projectLibrary.filter(
      (project) =>
        project.name.toLowerCase().includes(query) || project.location.toLowerCase().includes(query),
    )
  }, [projectLibrary, projectQuery])

  const openPrompt = (promptId: string) => {
    setActivePromptId(promptId)
    setProjectQuery("")
    setIsDialogOpen(true)
  }

  const buildPrompt = (template: string, projectName: string, projectLocation: string) => {
    return template
      .replace("{project}", projectName)
      .replace("{location}", projectLocation)
      .trim()
  }

  const handleProjectSelect = (projectId: string) => {
    if (!activePrompt) return
    const project = projectLibrary.find((item) => item.id === projectId)
    if (!project) return

    const promptText = buildPrompt(activePrompt.promptTemplate, project.name, project.location)
    const query = new URLSearchParams({
      prompt: promptText,
      project: project.id,
    })

    const mediaUrl =
      (!isPlaceholderCover(project.cover) && project.cover) ||
      project.media?.find((url) => !isPlaceholderCover(url))
    if (mediaUrl) query.set("media", mediaUrl)

    if (activePrompt.target === "timeline") {
      query.set("demo", "true")
    }

    router.push(`${activePrompt.href}?${query.toString()}`)
    setIsDialogOpen(false)
  }

  const handleQuickPromptSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = quickPrompt.trim()
    if (!trimmed) return

    const query = new URLSearchParams({ prompt: trimmed })
    router.push(`/storyboard?${query.toString()}`)
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--surface-0)] text-white overflow-x-hidden selection:bg-[var(--accent-muted)]">
        {/* Hero Carousel */}
        <section className="relative px-6 pt-6 pb-8">
          <div className="relative max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 px-5 py-4 backdrop-blur">
              <form onSubmit={handleQuickPromptSubmit} className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(event) => setQuickPrompt(event.target.value)}
                  placeholder="Describe the video you want to create"
                  className="w-full h-10 pl-10 pr-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-full text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] transition-colors"
                />
              </form>
              <div className="flex items-center gap-3">
                <CreditsDisplay credits="unlimited" />
                <Link
                  href="/storyboard"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gradient text-accent-text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-shadow)]"
                >
                  Create
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {/* Current Tab Indicator */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">Home</span>
            </div>

            {/* Carousel Container */}
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-[var(--surface-3)]">
              {/* Slides */}
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {/* Background Image */}
                  {slide.mediaUrl && (
                    <div className="absolute inset-0">
                      <img
                        src={slide.mediaUrl}
                        alt={slide.projectName ?? "Project media"}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  )}
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/70 to-slate-800/60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                  {/* Large Number/Visual Element */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center opacity-15">
                    <span className="text-[260px] font-bold text-white/20">{index + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <div className="max-w-xl">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-4"
                      >
                        {slide.tag}
                      </span>
                      <h2 className="text-3xl md:text-5xl font-semibold mb-3 leading-tight text-balance">{slide.title}</h2>
                      <p className="text-neutral-300 text-sm md:text-base mb-6 max-w-md">{slide.description}</p>
                      <Link
                        href={slide.ctaLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-sm transition-all hover:bg-white/90"
                      >
                        {slide.cta}
                      </Link>
                      {slide.projectName && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
                            Live media
                          </span>
                          <span>{slide.projectName} · {slide.projectLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel Progress Bar */}
            <div className="flex justify-center gap-1 mt-4">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="h-1 rounded-full transition-all overflow-hidden bg-white/20"
                  style={{ width: index === currentSlide ? "64px" : "32px" }}
                >
                  {index === currentSlide && (
                    <div
                      className="h-full bg-white rounded-full animate-progress"
                      style={{
                        animation: "progress 6s linear forwards",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEDIA_SURFACES.map((surface) => {
              const Icon = surface.icon
              return (
                <Link
                  key={surface.title}
                  href={surface.href}
                  className="group rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)]/80 px-5 py-4 transition-all hover:bg-[var(--surface-2)] hover:border-[var(--accent-border)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">{surface.tag}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{surface.title}</h3>
                      <p className="mt-2 text-sm text-neutral-400">{surface.description}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] flex items-center justify-center text-white/80 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/70 group-hover:text-white">
                    Open app
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Content Sections */}
        <section className="px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-white">Brief Library</h3>
                <p className="text-sm text-neutral-400">
                  Ready-to-run briefs for every marketing surface. Choose a brief, then pick a project.
                </p>
              </div>
              <div className="text-xs text-neutral-500">
                {isProjectLoading
                  ? "Loading live project media..."
                  : projectSource === "live"
                    ? "Live project media connected."
                    : "Media library not connected yet."}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {PROMPT_LIBRARY.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => openPrompt(prompt.id)}
                  className="group text-left rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-6 transition-all hover:border-[var(--accent-border)] hover:bg-[var(--surface-3)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--border-emphasis)] bg-[var(--surface-3)] text-neutral-300">
                        {prompt.badge}
                      </span>
                      <h4 className="text-base font-semibold text-white leading-snug">{prompt.title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">{prompt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl bg-[var(--surface-1)] border-[var(--border-default)] text-white">
            <DialogHeader>
              <DialogTitle>Select a project</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {projectSource !== "live"
                  ? "Connect the media library to load project media before launching a brief."
                  : activePrompt
                    ? buildPrompt(activePrompt.promptTemplate, "this project", "its location")
                    : "Pick a project to personalize the brief."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={projectQuery}
                onChange={(event) => setProjectQuery(event.target.value)}
                placeholder="Search projects or locations"
                className="bg-[var(--surface-2)] border-[var(--border-default)] text-white placeholder:text-neutral-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {projectSource === "live" && filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectSelect(project.id)}
                    className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] overflow-hidden text-left hover:border-[var(--accent-border)] transition-colors"
                  >
                    <div className="aspect-[4/3] bg-[var(--surface-3)] overflow-hidden">
                      {project.cover && !isPlaceholderCover(project.cover) ? (
                        <img
                          src={project.cover}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[var(--surface-3)]">
                          <span className="text-xs text-neutral-500">Media pending</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-white">{project.name}</p>
                      <p className="text-xs text-neutral-500">{project.location}</p>
                    </div>
                  </button>
                ))}
                {projectSource === "live" && !isProjectLoading && filteredProjects.length === 0 && (
                  <div className="col-span-full text-sm text-neutral-500">
                    No projects match that search.
                  </div>
                )}
                {isProjectLoading && (
                  <div className="col-span-full text-sm text-neutral-500">
                    Loading projects from the media library...
                  </div>
                )}
                {!isProjectLoading && projectSource !== "live" && (
                  <div className="col-span-full text-sm text-neutral-500">
                    Media library is not connected yet. Connect media enrichment to unlock live projects.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

            {/* Pipeline Section - Improved with design tokens */}
        <section className="py-16 bg-[var(--surface-0)] border-y border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg-subtle)] border border-[var(--accent-border)] text-xs font-medium text-[var(--accent-text)] mb-4">
                <BrainIcon className="w-3 h-3" />
                Launch Flow
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">From Brief to Timeline in 5 Steps</h2>
              <p className="text-neutral-400 text-sm max-w-lg mx-auto">
                The production flow handles the heavy lifting. You focus on the story.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {
                  icon: BrainIcon,
                  label: "Brief",
                  bgColor: "bg-violet-500/20",
                  textColor: "text-violet-400",
                },
                {
                  icon: LinkIcon,
                  label: "Transitions",
                  bgColor: "bg-purple-500/20",
                  textColor: "text-purple-400",
                },
                { icon: CheckSquareIcon, label: "Select", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400" },
                {
                  icon: SlidersIcon,
                  label: "Process",
                  bgColor: "bg-amber-500/20",
                  textColor: "text-amber-400",
                },
                {
                  icon: VideoIcon,
                  label: "Produce",
                  bgColor: "bg-rose-500/20",
                  textColor: "text-rose-400",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative p-4 rounded-xl bg-[var(--hover-overlay)] border border-[var(--border-default)] group hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-neutral-600">0{i + 1}</div>
                  <div
                    className={`w-8 h-8 rounded-lg ${step.bgColor} flex items-center justify-center ${step.textColor} mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <LogoIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-semibold text-white">Seq</span>
            </div>
            <div className="text-xs text-neutral-500">© 2025 Seq. All rights reserved.</div>
            <div className="flex gap-4">
              <Link href="/blog" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/docs" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/contact" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>

        {/* CSS for progress animation */}
        <style jsx>{`
          @keyframes progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </AppShell>
  )
}
