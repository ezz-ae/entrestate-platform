"use client"

import React from "react"
import { cn } from "@/seq/lib/utils"
import { ShieldCheck, TrendingUp, DollarSign } from "lucide-react"

export type BrandedOverlayData = {
  projectName?: string
  area?: string
  price?: string
  yield?: string
  score?: number
}

type BrandedOverlayProps = {
  data: BrandedOverlayData
  isVisible: boolean
  className?: string
}

export function BrandedOverlay({ data, isVisible, className }: BrandedOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none flex flex-col justify-between p-8", className)}>
      {/* ── Top Branding / Score ── */}
      <div className="flex items-start justify-between">
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
             <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Entrestate OS verified</p>
            <p className="text-sm font-bold text-white leading-none">Institutional Asset</p>
          </div>
        </div>

        {data.score && (
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 rounded-full h-14 w-14 flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-emerald-400 leading-none">SCORE</p>
            <p className="text-xl font-black text-white">{data.score}</p>
          </div>
        )}
      </div>

      {/* ── Bottom Project Info ── */}
      <div className="space-y-4">
        <div className="max-w-[70%] bg-slate-950/80 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-3xl font-black text-white tracking-tight underline elevation-1">
            {data.projectName || "Dubai Waterfront Portfolio"}
          </h2>
          <p className="mt-1 text-lg font-medium text-slate-300">{data.area || "Prime District 1"}</p>
          
          <div className="mt-6 flex items-center gap-8 border-t border-white/10 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Entry Price</span>
              </div>
              <p className="text-xl font-bold text-white">{data.price || "AED 1.2M"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Target Yield</span>
              </div>
              <p className="text-xl font-bold text-white">{data.yield || "8.2% Net"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium ml-2">
           <span>DLD L1 CANONICAL DATA</span>
           <span className="h-1 w-1 rounded-full bg-white/20" />
           <span>GENERATED VIA ENTRESTATE OS</span>
        </div>
      </div>

      {/* ── Vignette Overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40 -z-10" />
    </div>
  )
}
