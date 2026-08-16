"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ArrowLeft,
  Search,
  Building2,
  BarChart3,
  Layers,
  FileText,
  Download,
  Bookmark,
  Copy,
  Check,
  ChevronRight,
  Send,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Clock,
  Scale,
  Target,
  Grid3X3,
  Eye,
  Zap,
  ArrowUpRight,
} from "lucide-react"

/* ================================================================
   TYPES
   ================================================================ */

type PlayCategory = "area-study" | "best-offer" | "comparison" | "multi-offer" | "analysis-report"

interface PlayDefinition {
  id: string
  category: PlayCategory
  title: string
  subtitle: string
  description: string
  icon: React.ElementType
  steps: string[]
  tags: string[]
  depth: "quick" | "standard" | "deep"
}

interface SessionStep {
  label: string
  status: "pending" | "active" | "completed"
}

interface SessionMessage {
  id: string
  role: "system" | "user"
  content: string
  timestamp: Date
  cards?: ResultCard[]
  options?: SelectOption[]
}

interface ResultCard {
  type: "stat" | "area" | "project" | "unit" | "comparison"
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "flat"
  trendValue?: string
  tag?: string
}

interface SelectOption {
  label: string
  value: string
  description?: string
}

interface SessionOutput {
  title: string
  playId: string
  steps: string[]
  results: ResultCard[]
  timestamp: Date
}

/* ================================================================
   PLAY DEFINITIONS — no AI words, no "prompt", no "generate"
   ================================================================ */

const plays: PlayDefinition[] = [
  /* ---- AREA STUDY ---- */
  {
    id: "area-overview",
    category: "area-study",
    title: "Area Overview",
    subtitle: "Full market snapshot for any area",
    description: "Study an area from every angle: price behavior, transaction volume, unit mix, developer presence, and historical shifts.",
    icon: MapPin,
    steps: ["Select Area", "Review Data", "Explore Segments", "Save Findings"],
    tags: ["prices", "volume", "history"],
    depth: "standard",
  },
  {
    id: "area-deep-dive",
    category: "area-study",
    title: "Area Deep Dive",
    subtitle: "Multi-layer area intelligence",
    description: "Go beyond surface numbers. Understand which unit types move, how prices shifted by bedroom count, and which projects lead the area.",
    icon: Layers,
    steps: ["Select Area", "Price Layers", "Unit Breakdown", "Project Leaders", "Session Report"],
    tags: ["layers", "segments", "leaders"],
    depth: "deep",
  },
  {
    id: "area-compare-time",
    category: "area-study",
    title: "Area Over Time",
    subtitle: "Track how an area evolved",
    description: "See how price ranges, transaction counts, and developer activity changed across quarters for any area.",
    icon: Clock,
    steps: ["Select Area", "Choose Period", "View Timeline", "Export"],
    tags: ["timeline", "quarterly", "shifts"],
    depth: "standard",
  },
  /* ---- BEST OFFER ---- */
  {
    id: "best-offer-area",
    category: "best-offer",
    title: "Best in Area",
    subtitle: "Surface the strongest positions in an area",
    description: "Start with an area, filter by your criteria, and let the data surface units with the best price-per-sqft, yield, or value relative to the area median.",
    icon: Target,
    steps: ["Select Area", "Set Criteria", "View Results", "Refine", "Save Selection"],
    tags: ["value", "yield", "position"],
    depth: "standard",
  },
  {
    id: "best-offer-budget",
    category: "best-offer",
    title: "Best for Budget",
    subtitle: "Find the strongest position for a specific budget",
    description: "Enter a budget range and preferences. The system surfaces units across all areas that represent the strongest value at that price point.",
    icon: Zap,
    steps: ["Set Budget", "Set Preferences", "Cross-Area Results", "Compare Top 5", "Save"],
    tags: ["budget", "cross-area", "value"],
    depth: "standard",
  },
  /* ---- COMPARISON ---- */
  {
    id: "compare-areas",
    category: "comparison",
    title: "Area vs Area",
    subtitle: "Side-by-side area comparison",
    description: "Pick two or three areas and compare them on price, yield, volume, momentum, unit mix, and developer quality.",
    icon: Scale,
    steps: ["Select Areas", "View Comparison", "Drill Into Segments", "Export Report"],
    tags: ["side-by-side", "multi-area"],
    depth: "standard",
  },
  {
    id: "compare-projects",
    category: "comparison",
    title: "Project vs Project",
    subtitle: "Compare specific projects",
    description: "Select projects from the same area or across areas. See unit-level pricing, developer track record, and price movement side by side.",
    icon: Building2,
    steps: ["Select Projects", "Compare Metrics", "Unit-Level View", "Export"],
    tags: ["projects", "developers", "units"],
    depth: "deep",
  },
  /* ---- MULTI-OFFER ---- */
  {
    id: "multi-offer-builder",
    category: "multi-offer",
    title: "Multi-Position Builder",
    subtitle: "Create a set of positions from data",
    description: "Build a collection of 3-10 unit positions across areas. Each position is data-backed with price context, area behavior, and comparison to similar units.",
    icon: Grid3X3,
    steps: ["Define Strategy", "Add Positions", "Review Set", "Validate Data", "Export Package"],
    tags: ["positions", "collection", "package"],
    depth: "deep",
  },
  {
    id: "multi-offer-scenario",
    category: "multi-offer",
    title: "Scenario Builder",
    subtitle: "Model different position strategies",
    description: "Create two or three scenarios with different area/budget mixes and compare the projected outcomes based on historical behavior.",
    icon: Eye,
    steps: ["Set Scenario A", "Set Scenario B", "Compare Outcomes", "Adjust", "Final Report"],
    tags: ["scenarios", "models", "outcomes"],
    depth: "deep",
  },
  /* ---- ANALYSIS REPORT ---- */
  {
    id: "report-area-summary",
    category: "analysis-report",
    title: "Area Summary Report",
    subtitle: "Exportable area report",
    description: "A structured, data-backed summary of any area: key metrics, top projects, price behavior, and market position. Ready to share or save.",
    icon: FileText,
    steps: ["Select Area", "Review Data", "Customize Sections", "Export Report"],
    tags: ["report", "export", "summary"],
    depth: "standard",
  },
  {
    id: "report-market-position",
    category: "analysis-report",
    title: "Market Position Report",
    subtitle: "Where does a unit stand in its market?",
    description: "For a specific project or unit type: how it prices relative to the area, what the transaction history shows, and where it sits in the market.",
    icon: BarChart3,
    steps: ["Select Project", "Position Analysis", "Context Layer", "Export"],
    tags: ["position", "context", "relative"],
    depth: "standard",
  },
]

const categoryLabels: Record<PlayCategory, { label: string; description: string }> = {
  "area-study": { label: "Area Study", description: "Understand any area from the data up" },
  "best-offer": { label: "Best Offer", description: "Surface the strongest positions" },
  "comparison": { label: "Comparison", description: "Side-by-side market analysis" },
  "multi-offer": { label: "Multi-Offer", description: "Build data-backed position sets" },
  "analysis-report": { label: "Analysis Report", description: "Structured exportable reports" },
}

const depthLabels: Record<string, { label: string; color: string }> = {
  quick: { label: "Quick", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  standard: { label: "Standard", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  deep: { label: "Deep", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
}

/* ================================================================
   SAMPLE DATA — UAE market data for demo sessions
   ================================================================ */

const uaeAreas = [
  "Downtown Dubai", "Dubai Marina", "JBR", "Palm Jumeirah", "Business Bay",
  "JVC", "Dubai Hills Estate", "DAMAC Hills", "Creek Harbour", "MBR City",
  "Al Reem Island", "Saadiyat Island", "Yas Island", "Al Raha Beach", "Al Marjan Island", "Al Majaz",
]

function getAreaData(area: string): ResultCard[] {
  const data: Record<string, ResultCard[]> = {
    "Downtown Dubai": [
      { type: "stat", title: "Avg Price/sqft", value: "AED 2,520", trend: "up", trendValue: "+7.7% (12M)" },
      { type: "stat", title: "Transaction Volume", value: "847", subtitle: "Last 30 days", trend: "up", trendValue: "+18%" },
      { type: "stat", title: "Rental Yield", value: "5.2%", subtitle: "Avg across unit types" },
      { type: "stat", title: "Active Units", value: "28,400", subtitle: "Across 89 projects" },
      { type: "unit", title: "Studio", value: "AED 1,200/sqft", subtitle: "Entry segment", trend: "up", trendValue: "+8.2%" },
      { type: "unit", title: "1BR", value: "AED 2,100/sqft", subtitle: "Highest demand", trend: "up", trendValue: "+9.1%" },
      { type: "unit", title: "2BR", value: "AED 2,680/sqft", subtitle: "Family segment", trend: "up", trendValue: "+6.4%" },
      { type: "unit", title: "3BR+", value: "AED 3,400/sqft", subtitle: "Premium segment", trend: "up", trendValue: "+5.4%" },
    ],
    "Dubai Marina": [
      { type: "stat", title: "Avg Price/sqft", value: "AED 1,980", trend: "up", trendValue: "+4.2% (12M)" },
      { type: "stat", title: "Transaction Volume", value: "1,024", subtitle: "Last 30 days", trend: "up", trendValue: "+12%" },
      { type: "stat", title: "Rental Yield", value: "5.8%", subtitle: "Avg across unit types" },
      { type: "stat", title: "Active Units", value: "31,200", subtitle: "Across 76 projects" },
      { type: "unit", title: "Studio", value: "AED 1,100/sqft", subtitle: "High demand", trend: "up", trendValue: "+5.8%" },
      { type: "unit", title: "1BR", value: "AED 1,750/sqft", subtitle: "Core segment", trend: "up", trendValue: "+4.1%" },
      { type: "unit", title: "2BR", value: "AED 2,200/sqft", subtitle: "Family", trend: "up", trendValue: "+3.8%" },
    ],
    "Business Bay": [
      { type: "stat", title: "Avg Price/sqft", value: "AED 1,720", trend: "up", trendValue: "+5.4% (12M)" },
      { type: "stat", title: "Transaction Volume", value: "1,567", subtitle: "Last 30 days", trend: "up", trendValue: "+22%" },
      { type: "stat", title: "Rental Yield", value: "6.8%", subtitle: "Highest in prime Dubai" },
      { type: "stat", title: "Active Units", value: "42,000", subtitle: "Across 98 projects" },
    ],
    "Saadiyat Island": [
      { type: "stat", title: "Avg Price/sqft", value: "AED 2,180", trend: "up", trendValue: "+14.2% (12M)" },
      { type: "stat", title: "Transaction Volume", value: "234", subtitle: "Last 30 days", trend: "up", trendValue: "+34%" },
      { type: "stat", title: "Rental Yield", value: "4.8%", subtitle: "Premium positioning" },
      { type: "stat", title: "Active Units", value: "6,800", subtitle: "Across 16 projects" },
    ],
  }
  return data[area] || [
    { type: "stat", title: "Avg Price/sqft", value: "AED 1,450", trend: "up", trendValue: "+5.2% (12M)" },
    { type: "stat", title: "Transaction Volume", value: "320", subtitle: "Last 30 days" },
    { type: "stat", title: "Rental Yield", value: "6.1%", subtitle: "Avg across unit types" },
    { type: "stat", title: "Active Units", value: "8,400", subtitle: "Market tracked" },
  ]
}

/* ================================================================
   GROUND PLAY SESSION — the full play runner
   ================================================================ */

function PlaySession({
  play,
  onClose,
  onSaveOutput,
}: {
  play: PlayDefinition
  onClose: () => void
  onSaveOutput: (output: SessionOutput) => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<SessionStep[]>(
    play.steps.map((label, i) => ({
      label,
      status: i === 0 ? "active" : "pending",
    }))
  )
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [input, setInput] = useState("")
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [collectedResults, setCollectedResults] = useState<ResultCard[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* Boot the first step on mount */
  useEffect(() => {
    bootStep(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMessage = useCallback((msg: Omit<SessionMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random()}`, timestamp: new Date() },
    ])
  }, [])

  function bootStep(stepIndex: number) {
    const stepLabel = play.steps[stepIndex]
    const isComparison = play.category === "comparison"
    const isMultiOffer = play.category === "multi-offer"
    const isBestOffer = play.category === "best-offer"
    const isReport = play.category === "analysis-report"

    if (stepLabel === "Select Area" || stepLabel === "Select Project") {
      addMessage({
        role: "system",
        content: isReport
          ? `Choose an area to build your ${play.title.toLowerCase()}. The report will pull all tracked data for the selected area.`
          : `Choose an area to begin. All data shown is from tracked unit records across UAE markets.`,
        options: uaeAreas.map((a) => ({ label: a, value: a })),
      })
    } else if (stepLabel === "Select Areas" || stepLabel === "Select Projects") {
      addMessage({
        role: "system",
        content: "Select two or three areas to compare. You can pick from any tracked market in the UAE.",
        options: uaeAreas.map((a) => ({ label: a, value: a })),
      })
    } else if (stepLabel === "Set Budget") {
      addMessage({
        role: "system",
        content: "What budget range are you working with? Select a range or type a specific amount.",
        options: [
          { label: "Under AED 500K", value: "0-500000", description: "Studio / small 1BR" },
          { label: "AED 500K - 1M", value: "500000-1000000", description: "1BR / entry 2BR" },
          { label: "AED 1M - 2M", value: "1000000-2000000", description: "2BR / family units" },
          { label: "AED 2M - 5M", value: "2000000-5000000", description: "Premium / large units" },
          { label: "AED 5M+", value: "5000000-999999999", description: "Luxury / villas" },
        ],
      })
    } else if (stepLabel === "Set Criteria" || stepLabel === "Set Preferences") {
      addMessage({
        role: "system",
        content: "What matters most for this search? This determines how results are ranked.",
        options: [
          { label: "Best Price/sqft", value: "price-sqft", description: "Lowest price relative to area" },
          { label: "Highest Yield", value: "yield", description: "Best rental return" },
          { label: "Below Area Median", value: "below-median", description: "Units priced under area average" },
          { label: "Strong Momentum", value: "momentum", description: "Areas trending upward" },
          { label: "Large Layout", value: "large-layout", description: "Biggest sqft for the price" },
        ],
      })
    } else if (stepLabel === "Define Strategy") {
      addMessage({
        role: "system",
        content: "How do you want to build this position set?",
        options: [
          { label: "Same Area, Different Projects", value: "same-area", description: "Concentrate in one area" },
          { label: "Cross-Area Mix", value: "cross-area", description: "Spread across markets" },
          { label: "Budget-Split", value: "budget-split", description: "Divide a total budget into positions" },
        ],
      })
    } else if (stepLabel === "Choose Period") {
      addMessage({
        role: "system",
        content: "What timeframe do you want to study?",
        options: [
          { label: "Last 3 Months", value: "3m" },
          { label: "Last 6 Months", value: "6m" },
          { label: "Last 12 Months", value: "12m" },
          { label: "Last 24 Months", value: "24m" },
          { label: "Full History", value: "all" },
        ],
      })
    } else if (stepLabel === "Set Scenario A" || stepLabel === "Set Scenario B") {
      addMessage({
        role: "system",
        content: `Define ${stepLabel.replace("Set ", "")}. Select an area and budget allocation for this scenario.`,
        options: uaeAreas.slice(0, 8).map((a) => ({ label: a, value: a })),
      })
    } else if (stepLabel.includes("Review") || stepLabel.includes("View") || stepLabel.includes("Compare") || stepLabel.includes("Position") || stepLabel.includes("Drill") || stepLabel.includes("Context")) {
      const area = selectedArea || selectedAreas[0] || "Downtown Dubai"
      const areaData = getAreaData(area)
      setCollectedResults((prev) => [...prev, ...areaData])

      if (isComparison && selectedAreas.length >= 2) {
        const allCards: ResultCard[] = []
        for (const a of selectedAreas) {
          const d = getAreaData(a)
          allCards.push(...d.map((c) => ({ ...c, tag: a })))
        }
        setCollectedResults((prev) => [...prev, ...allCards])
        addMessage({
          role: "system",
          content: `Comparison loaded: ${selectedAreas.join(" vs ")}. Here is the side-by-side data. Scroll through the cards or ask a question to explore deeper.`,
          cards: allCards.slice(0, 8),
        })
      } else if (isBestOffer) {
        const bestCards: ResultCard[] = [
          { type: "unit", title: "Unit A — Marina Gate T2", value: "AED 1,640/sqft", subtitle: "1BR, 780 sqft | Dubai Marina", trend: "up", trendValue: "12% below area avg" },
          { type: "unit", title: "Unit B — Bay Central", value: "AED 1,520/sqft", subtitle: "1BR, 820 sqft | Business Bay", trend: "up", trendValue: "8% below area avg" },
          { type: "unit", title: "Unit C — Pixel Tower", value: "AED 1,180/sqft", subtitle: "Studio, 480 sqft | Al Reem Island", trend: "up", trendValue: "14% below area avg" },
          { type: "unit", title: "Unit D — JVC Bloom", value: "AED 780/sqft", subtitle: "1BR, 640 sqft | JVC", trend: "up", trendValue: "7.4% yield" },
        ]
        setCollectedResults((prev) => [...prev, ...bestCards])
        addMessage({
          role: "system",
          content: `Found ${bestCards.length} strong positions matching your criteria in ${area}. Each unit is priced below the area median with above-average yield. Select any card to see full unit context.`,
          cards: bestCards,
        })
      } else {
        addMessage({
          role: "system",
          content: `Data loaded for ${area}. ${areaData.length} data points across prices, volume, yield, and unit segments. You can ask questions or move to the next step.`,
          cards: areaData,
        })
      }
    } else if (stepLabel.includes("Refine") || stepLabel.includes("Adjust") || stepLabel.includes("Add")) {
      addMessage({
        role: "system",
        content: "You can refine the results. Ask a question, change your criteria, or move to the next step when ready.",
      })
    } else if (stepLabel.includes("Customize")) {
      addMessage({
        role: "system",
        content: "Choose which sections to include in your report. You can add or remove sections below.",
        options: [
          { label: "Price Overview", value: "price", description: "Area pricing summary" },
          { label: "Transaction History", value: "transactions", description: "Volume and frequency" },
          { label: "Unit Breakdown", value: "units", description: "By bedroom count" },
          { label: "Top Projects", value: "projects", description: "Leading projects in area" },
          { label: "Yield Analysis", value: "yield", description: "Rental return data" },
        ],
      })
    } else if (stepLabel.includes("Save") || stepLabel.includes("Export") || stepLabel.includes("Final") || stepLabel.includes("Report") || stepLabel.includes("Package")) {
      addMessage({
        role: "system",
        content: `Session complete. You have ${collectedResults.length} data points collected. Save this session to your workspace or export the results.`,
        cards: collectedResults.slice(0, 6),
      })
    } else {
      addMessage({
        role: "system",
        content: `Step: ${stepLabel}. Continue exploring or move to the next step.`,
      })
    }
  }

  function advanceStep() {
    if (currentStep >= steps.length - 1) return
    const next = currentStep + 1
    setSteps((prev) =>
      prev.map((s, i) => ({
        ...s,
        status: i < next ? "completed" : i === next ? "active" : "pending",
      }))
    )
    setCurrentStep(next)
    bootStep(next)
  }

  function handleOptionSelect(option: SelectOption) {
    addMessage({ role: "user", content: option.label })

    const stepLabel = play.steps[currentStep]
    if (stepLabel === "Select Area" || stepLabel === "Select Project") {
      setSelectedArea(option.value)
    }
    if (stepLabel === "Select Areas" || stepLabel === "Select Projects") {
      setSelectedAreas((prev) => {
        if (prev.includes(option.value)) return prev.filter((a) => a !== option.value)
        if (prev.length >= 3) return prev
        return [...prev, option.value]
      })
    }

    setTimeout(() => advanceStep(), 400)
  }

  function handleSend() {
    if (!input.trim()) return
    addMessage({ role: "user", content: input.trim() })
    setInput("")
    setTimeout(() => {
      const lower = input.toLowerCase()
      let response = `Based on current tracked data for ${selectedArea || "the UAE market"}, `

      if (lower.includes("balcon") || lower.includes("layout") || lower.includes("large")) {
        response += "there are 847 units with balconies above 15 sqm. Dubai Marina leads with 312 such units. The average premium for large-balcony units is +8.2% over comparable standard layouts."
      } else if (lower.includes("yield") || lower.includes("return")) {
        response += `yield ranges from 4.8% (premium segments) to 7.8% (emerging areas). ${selectedArea || "This area"} currently sits at ${selectedArea === "Downtown Dubai" ? "5.2%" : selectedArea === "Business Bay" ? "6.8%" : "5.8%"} average.`
      } else if (lower.includes("price") || lower.includes("trend")) {
        response += `prices have moved ${selectedArea === "Saadiyat Island" ? "+14.2%" : selectedArea === "JVC" ? "+8.2%" : "+5.4%"} over the last 12 months. Transaction volume has increased in line with price movement.`
      } else if (lower.includes("developer") || lower.includes("project")) {
        response += `the top developers by unit count are Emaar, Aldar, DAMAC, and Select Group. Emaar leads in Downtown Dubai and Creek Harbour. Aldar dominates Abu Dhabi markets.`
      } else {
        response += "I can look deeper into that. Try asking about specific price segments, unit features, developer activity, or historical changes."
      }
      addMessage({ role: "system", content: response })
    }, 600)
  }

  function handleSaveSession() {
    const output: SessionOutput = {
      title: `${play.title} — ${selectedArea || selectedAreas.join(", ") || "UAE"}`,
      playId: play.id,
      steps: steps.filter((s) => s.status === "completed").map((s) => s.label),
      results: collectedResults,
      timestamp: new Date(),
    }
    onSaveOutput(output)
  }

  function handleCopyResults() {
    const text = collectedResults
      .map((r) => `${r.title}: ${r.value}${r.subtitle ? ` (${r.subtitle})` : ""}${r.trendValue ? ` | ${r.trendValue}` : ""}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all ${isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-[680px]"}`}>
      {/* Session Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{play.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedArea || selectedAreas.join(", ") || play.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopyResults} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary" title="Copy results">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleSaveSession} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary" title="Save session">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setMessages([]); setCurrentStep(0); setSelectedArea(null); setSelectedAreas([]); setCollectedResults([]); setSteps(play.steps.map((l, i) => ({ label: l, status: i === 0 ? "active" : "pending" }))); setTimeout(() => bootStep(0), 100) }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary" title="Restart">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border bg-secondary/30 overflow-x-auto">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              step.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
              step.status === "active" ? "bg-primary text-primary-foreground" :
              "bg-secondary text-muted-foreground"
            }`}>
              {step.status === "completed" && <Check className="w-3 h-3" />}
              <span>{step.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
            {msg.role === "user" ? (
              <div className="max-w-[80%] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg rounded-br-sm">
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="px-4 py-3 bg-secondary/60 rounded-lg rounded-bl-sm">
                  <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                </div>

                {/* Data Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {msg.cards.map((card, i) => (
                      <div key={`${card.title}-${i}`} className="px-3 py-2.5 bg-background border border-border rounded-md hover:border-accent/30 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-1.5 mb-1">
                          {card.type === "stat" && <BarChart3 className="w-3 h-3 text-accent" />}
                          {card.type === "area" && <MapPin className="w-3 h-3 text-accent" />}
                          {card.type === "project" && <Building2 className="w-3 h-3 text-accent" />}
                          {card.type === "unit" && <Layers className="w-3 h-3 text-accent" />}
                          {card.type === "comparison" && <Scale className="w-3 h-3 text-accent" />}
                          <span className="text-xs text-muted-foreground truncate">{card.title}</span>
                        </div>
                        <p className="text-sm font-mono font-medium text-foreground">{card.value}</p>
                        {card.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>}
                        {card.tag && <p className="text-xs text-accent mt-0.5">{card.tag}</p>}
                        {card.trend && card.trendValue && (
                          <div className="flex items-center gap-1 mt-1">
                            {card.trend === "up" ? <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> :
                             card.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" /> :
                             <Minus className="w-3 h-3 text-muted-foreground" />}
                            <span className="text-xs text-muted-foreground">{card.trendValue}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selection Options */}
                {msg.options && msg.options.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionSelect(opt)}
                        className={`flex flex-col items-start px-3 py-2.5 text-left border rounded-md transition-all ${
                          selectedAreas.includes(opt.value)
                            ? "bg-accent/10 border-accent/40 text-accent"
                            : "bg-background border-border hover:border-accent/30 text-foreground"
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        {opt.description && <span className="text-xs text-muted-foreground mt-0.5">{opt.description}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input + Actions */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask about this data..."
            className="flex-1 px-3 py-2.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
          {currentStep < steps.length - 1 && (
            <button
              onClick={advanceStep}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-accent border border-accent/30 rounded-md hover:bg-accent/10 transition-colors"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {currentStep === steps.length - 1 && (
            <button
              onClick={handleSaveSession}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Save
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
            {collectedResults.length > 0 && ` | ${collectedResults.length} data points`}
          </p>
          {currentStep === steps.length - 1 && (
            <button onClick={handleCopyResults} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy all results"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN EXPORT — Ground Plays Library
   ================================================================ */

export function GroundPlays() {
  const [activeCategory, setActiveCategory] = useState<PlayCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activePlay, setActivePlay] = useState<PlayDefinition | null>(null)
  const [savedOutputs, setSavedOutputs] = useState<SessionOutput[]>([])
  const [showSaved, setShowSaved] = useState(false)

  const filteredPlays = plays.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categories = Object.entries(categoryLabels)

  function handleSaveOutput(output: SessionOutput) {
    setSavedOutputs((prev) => [output, ...prev])
  }

  /* Active play session */
  if (activePlay) {
    return (
      <PlaySession
        play={activePlay}
        onClose={() => setActivePlay(null)}
        onSaveOutput={handleSaveOutput}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Library Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-foreground">Ground Plays</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Structured paths through market data. Click to run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedOutputs.length > 0 && (
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                showSaved ? "bg-accent/10 border-accent/30 text-accent" : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved ({savedOutputs.length})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
            />
          </div>
        </div>
      </div>

      {/* Saved Outputs Panel */}
      {showSaved && savedOutputs.length > 0 && (
        <div className="p-4 bg-secondary/30 border border-border rounded-lg space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Saved Sessions</h3>
            <button onClick={() => setShowSaved(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
          {savedOutputs.map((output, i) => (
            <div key={`${output.playId}-${i}`} className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-md">
              <div>
                <p className="text-sm font-medium text-foreground">{output.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {output.results.length} data points | {output.steps.length} steps completed | {output.timestamp.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All Plays
        </button>
        {categories.map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as PlayCategory)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCategory === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Plays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlays.map((play) => {
          const Icon = play.icon
          const depth = depthLabels[play.depth]
          return (
            <button
              key={play.id}
              onClick={() => setActivePlay(play)}
              className="group flex flex-col items-start p-5 bg-card border border-border rounded-lg hover:border-accent/30 transition-all text-left"
            >
              <div className="flex items-start justify-between w-full mb-3">
                <div className="p-2 bg-secondary rounded-md">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${depth.color}`}>{depth.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors mb-1">{play.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{play.description}</p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-xs text-muted-foreground">{play.steps.length} steps</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {play.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 text-xs bg-secondary text-muted-foreground rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {filteredPlays.length === 0 && (
        <div className="py-12 text-center">
          <Search className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No plays found</p>
          <p className="text-xs text-muted-foreground">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
