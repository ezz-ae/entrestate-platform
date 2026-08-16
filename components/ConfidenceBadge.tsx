"use client"

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getConfidenceBadge, type TrustConfidence } from "@/lib/copy/trust"

type ConfidenceBadgeProps = {
  confidence: TrustConfidence
  showTooltip?: boolean
  className?: string
}

function resolveIcon(confidence: TrustConfidence) {
  if (confidence === "HIGH") return ShieldCheck
  if (confidence === "MEDIUM") return Shield
  return ShieldAlert
}

export function ConfidenceBadge({
  confidence,
  showTooltip = true,
  className,
}: ConfidenceBadgeProps) {
  const config = getConfidenceBadge(confidence)
  const Icon = resolveIcon(confidence)

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        className,
      )}
      style={{
        color: config.color,
        borderColor: `${config.color}33`,
        backgroundColor: `${config.color}12`,
      }}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  )

  if (!showTooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent sideOffset={6} className="max-w-xs">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
