import React from "react"
import { cn } from "@/lib/utils"
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react"

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW"

interface ConfidenceBadgeProps {
  score?: number // 0-100
  level?: ConfidenceLevel
  className?: string
  showLabel?: boolean
  showIcon?: boolean
}

export function ConfidenceBadge({
  score,
  level,
  className,
  showLabel = true,
  showIcon = true,
}: ConfidenceBadgeProps) {
  // Resolve level from score if not explicitly provided
  const resolvedLevel: ConfidenceLevel = level || (
    score !== undefined 
      ? (score >= 80 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW")
      : "MEDIUM"
  )

  const configs = {
    HIGH: {
      color: "text-green-600 bg-green-600/10 border-green-600/20",
      icon: ShieldCheck,
      label: "High Confidence",
    },
    MEDIUM: {
      color: "text-yellow-600 bg-yellow-600/10 border-yellow-600/20",
      icon: Shield,
      label: "Medium Confidence",
    },
    LOW: {
      color: "text-red-600 bg-red-600/10 border-red-600/20",
      icon: ShieldAlert,
      label: "Low Confidence",
    },
  }

  const { color, icon: Icon, label } = configs[resolvedLevel]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider",
        color,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {showLabel && <span>{label}</span>}
      {score !== undefined && <span className="opacity-60 ml-0.5">{score}%</span>}
    </div>
  )
}
