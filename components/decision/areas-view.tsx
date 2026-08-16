"use client"

import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"
import { DecisionRecord } from "@/lib/decision-infrastructure"

const AreaMap = dynamic(() => import("./area-map").then((m) => m.AreaMap), { ssr: false })
const AreaMapDesktop = dynamic(
  () => import("./area-map-desktop").then((m) => m.AreaMapDesktop),
  { ssr: false }
)

type AreasViewProps = {
  areas: Array<DecisionRecord & { slug: string }>
}

export function AreasView({ areas }: AreasViewProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <AreaMap areas={areas} />
  }

  return <AreaMapDesktop areas={areas} />
}
