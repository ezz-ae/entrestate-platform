"use client"

import { useEffect, useState, useRef } from "react"
import { BookOpen, Play, Pause, RefreshCcw, ZoomIn, ZoomOut, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "entrestate.reading.mode"
const FONT_SIZE_KEY = "entrestate.reading.fontSize"
const DEFAULT_FONT_SIZE = 1.05

export function ReadingControls({ className }: { className?: string }) {
  const [readingMode, setReadingMode] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<number>()

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "on") {
      setReadingMode(true)
      document.documentElement.dataset.reading = "on"
    }

    const storedFontSize = window.localStorage.getItem(FONT_SIZE_KEY)
    if (storedFontSize) {
      setFontSize(parseFloat(storedFontSize))
    }
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.dataset.reading = readingMode ? "on" : "off"
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, readingMode ? "on" : "off")
    }
  }, [readingMode])

  useEffect(() => {
    const scroll = () => {
      window.scrollBy(0, 1)
      scrollRef.current = requestAnimationFrame(scroll)
    }

    if (autoScroll) {
      scrollRef.current = requestAnimationFrame(scroll)
    } else {
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current)
      }
    }

    return () => {
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current)
      }
    }
  }, [autoScroll])

  useEffect(() => {
    if (typeof document !== "undefined") {
      const readingCopyElements = document.querySelectorAll('.reading-copy')
      readingCopyElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.setProperty('--font-size', `${fontSize}rem`)
      });
      window.localStorage.setItem(FONT_SIZE_KEY, fontSize.toString())
    }
  }, [fontSize])

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4 text-accent" />
        Reading comfort
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={readingMode ? "default" : "outline"}
          size="sm"
          onClick={() => setReadingMode((prev) => !prev)}
        >
          {readingMode ? "Reading mode on" : "Reading mode"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAutoScroll((prev) => !prev)}
        >
          {autoScroll ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {autoScroll ? "Pause" : "Autoscroll"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFontSize(fs => fs + 0.1)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFontSize(fs => fs - 0.1)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFontSize}
        >
            <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
        >
          {copied ? "Copied!" : <Share2 className="h-4 w-4" />}
        </Button>
        <ThemeSwitcher />
      </div>
    </div>
  )
}
