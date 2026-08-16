"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Database, 
  ShieldCheck, 
  LineChart, 
  MapPin, 
  Building2, 
  Layers,
  Sparkles,
  Zap,
  Activity,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDatasetFromLocalStorage, clearDatasetFromLocalStorage } from "@/lib/local-storage"
import { saveDatasetToLocalStorage } from "@/lib/local-storage"

type IntelligenceSnapshot = {
  marketRegime: string
  marketSummary: string
  riskBias: number
  yieldVsSafety: number
  horizon: string
  dataAsOf?: string
}

const focusSignals = [
  { label: "Delivery Confidence", color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Price Pressure", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Developer Execution", color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Liquidity Timeline", color: "text-violet-400", bg: "bg-violet-500/10" },
  { label: "Capital Efficiency", color: "text-rose-400", bg: "bg-rose-500/10" },
]

export default function MarketDeskPage() {
  const router = useRouter()
  const [savedDatasetId, setSavedDatasetId] = useState<string | null>(null)
  const [isLoadingDesk, setIsLoadingDesk] = useState(false)
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot | null>(null)

  const intelligenceTrace = useMemo(() => {
    if (!intelligence) {
      return [
        "Calibrating market regime from pulse volume and BUY ratio.",
        "Normalizing yield vs safety bias to portfolio intent.",
        "Synthesizing execution posture with horizon constraints.",
      ]
    }

    const riskLabel = intelligence.riskBias > 0.7 ? "Aggressive" : intelligence.riskBias < 0.3 ? "Defensive" : "Core-Plus"
    const yieldLabel = intelligence.yieldVsSafety > 0.6 ? "Yield" : intelligence.yieldVsSafety < 0.4 ? "Safety" : "Balanced"

    return [
      `Market regime detected: ${intelligence.marketRegime}.`,
      `Risk posture calibrated: ${riskLabel} (${Math.round(intelligence.riskBias * 100)}%).`,
      `Allocation tilt: ${yieldLabel} (${Math.round(intelligence.yieldVsSafety * 100)}%).`,
    ]
  }, [intelligence])

  useEffect(() => {
    const saved = getDatasetFromLocalStorage()
    if (saved?.datasetId) {
      setSavedDatasetId(saved.datasetId)
    }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const loadIntelligence = async () => {
      try {
        const response = await fetch("/api/market-pulse", { signal: controller.signal })
        if (!response.ok) {
          throw new Error("Failed to load market pulse")
        }
        const data = await response.json()
        const summary = data?.summary ?? {}
        const buySignals = summary.buy_signals ?? 0
        const total = summary.total ?? 1
        const buyRatio = total > 0 ? buySignals / total : 0

        let regime = "Stable Yield Accumulation"
        if (buyRatio > 0.15) regime = "High-Velocity Expansion"
        else if (buyRatio < 0.05) regime = "Price-Corrective Rebalancing"
        else if (summary.avg_price && summary.avg_price > 2500000) regime = "Supply-Constrained Plateau"

        if (!active) return
        setIntelligence({
          marketRegime: regime,
          marketSummary: data?.data_as_of ? `Market pulse as of ${data.data_as_of}.` : "Market data currently normalizing.",
          riskBias: 0.65,
          yieldVsSafety: 0.5,
          horizon: "Ready",
          dataAsOf: data?.data_as_of,
        })
      } catch (error) {
        if (!active) return
        console.error("Failed to load intelligence synthesis:", error)
      }
    }

    loadIntelligence()
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const handleContinue = () => {
    if (savedDatasetId) {
      router.push(`/explore?datasetId=${savedDatasetId}`)
    }
  }

  const handleClearSaved = () => {
    clearDatasetFromLocalStorage()
    setSavedDatasetId(null)
  }

  const handleLoadDesk = async () => {
    setIsLoadingDesk(true)
    try {
      const res = await fetch("/api/dataset/entrestate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to load market desk")
      const data = await res.json()

      if (data.storedDataset) {
        saveDatasetToLocalStorage(data.storedDataset)
      }

      router.push(`/explore?datasetId=${data.datasetId}`)
    } catch (error) {
      console.error("Failed to load market desk:", error)
    } finally {
      setIsLoadingDesk(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden selection:bg-blue-500/30">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* ── Header Section ── */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Sparkles className="h-3 w-3" />
              Institutional Data Substrate
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-3xl leading-[1.1]">
                Strategic AI <span className="text-blue-400">Workbench</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                Analyze high-fidelity market inventory with deep first-principles reasoning. Transform raw signals into defensible investment mandates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button 
                onClick={handleLoadDesk} 
                disabled={isLoadingDesk}
                className="h-14 px-8 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all flex items-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
              >
                {isLoadingDesk ? "Initializing Workbench..." : "Initialize Mandate"}
                <Zap className="h-5 w-5 fill-current" />
              </Button>
              <Button 
                variant="outline" 
                className="h-14 px-8 rounded-2xl border-slate-800 bg-slate-900/40 backdrop-blur-xl text-white font-semibold hover:border-slate-700 hover:bg-slate-900/60 transition-all"
              >
                Documentation Reference
              </Button>
            </div>
          </div>

          {/* ── Active Session ── */}
          {savedDatasetId && (
            <div className="group relative overflow-hidden rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 backdrop-blur-2xl transition-all hover:border-blue-500/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="rounded-2xl bg-blue-500/20 p-3">
                    <Database className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Active Mandate Context</h3>
                    <p className="text-sm text-blue-400 opacity-80 font-mono text-[10px] tracking-widest uppercase">ID: {savedDatasetId.slice(0, 8)}... ACTIVE</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={handleClearSaved}>Terminate</Button>
                  <Button onClick={handleContinue} className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">
                    Resume Intelligence
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Capabilities Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Inventory Coverage", desc: "100% verified supply from L1 Canonical layers.", icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10" },
              { title: "Area Dynamics", desc: "Live absorption and momentum signals.", icon: MapPin, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { title: "Decision Guardrails", desc: "Risk class and readiness markers.", icon: ShieldCheck, color: "text-violet-400", bg: "bg-violet-500/10" },
            ].map((item) => (
              <div key={item.title} className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl group hover:border-slate-700 transition-all">
                <div className={`inline-flex p-3 rounded-2xl ${item.bg} ${item.color} mb-6`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Active Intelligence Synthesis ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Active Intelligence Synthesis
                </h2>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">
                  {intelligence?.marketRegime ?? "Synthesizing market regime"}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {intelligence?.marketSummary ?? "Live pulse, pricing pressure, and signal velocity are converging into a strategic regime."}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { label: "Risk Bias", value: intelligence ? `${Math.round(intelligence.riskBias * 100)}%` : "--", color: "text-blue-400" },
                  { label: "Yield vs Safety", value: intelligence ? `${Math.round(intelligence.yieldVsSafety * 100)}%` : "--", color: "text-emerald-400" },
                  { label: "Horizon", value: intelligence?.horizon ?? "Ready", color: "text-slate-200" },
                  { label: "Pulse Stamp", value: intelligence?.dataAsOf ?? "Loading", color: "text-slate-400" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
                    <p className={`mt-1 text-lg font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <LineChart className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  First-Principles Trace
                </h2>
              </div>
              <div className="space-y-4">
                {intelligenceTrace.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 text-xs text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Intelligence Substrate Panel ── */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="h-5 w-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Live Strategic Signals</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {focusSignals.map((item) => (
                <div
                  key={item.label}
                  className={`px-5 py-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 ${item.color} text-xs font-bold uppercase tracking-wider transition-all hover:bg-slate-900/60 hover:border-slate-700`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <footer className="pt-12 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <p className="text-slate-500 text-sm">Entrestate Intelligence OS · Workbench v4.2</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">API Docs</a>
              <a href="#" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Compliance</a>
              <a href="#" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Status</a>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
