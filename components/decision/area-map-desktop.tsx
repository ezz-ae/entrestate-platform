"use client"

import { useState, useMemo } from "react"
import { useLocale } from "next-intl"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Link from "next/link"
import { getAreaCoordinates } from "@/lib/area-geo"
import { DecisionRecord } from "@/lib/decision-infrastructure"
import { pickLocalizedText } from "@/lib/format/entities"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatInteger } from "@/lib/format/number"
import {
  MapPin,
  Building2,
  ArrowRight,
  Layers,
  ChevronRight,
} from "lucide-react"

type Area = DecisionRecord & { slug: string }

function yieldColor(y: number): string {
  if (y >= 7) return "#10b981"
  if (y >= 5) return "#14b8a6"
  return "#f59e0b"
}

function slugifyProject(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function createMarkerIcon(color: string, dotSize: number, isSelected: boolean): L.DivIcon {
  const pad = isSelected ? 28 : 6
  const total = dotSize + pad * 2
  const c = total / 2

  return L.divIcon({
    className: "",
    iconSize: [total, total],
    iconAnchor: [c, c],
    html: `
      <div style="
        position:relative;
        width:${total}px;
        height:${total}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${isSelected ? `
          <div style="
            position:absolute;
            width:${dotSize}px;
            height:${dotSize}px;
            border-radius:50%;
            border:2px solid ${color};
            top:50%;left:50%;
            margin-left:-${dotSize / 2}px;
            margin-top:-${dotSize / 2}px;
            animation:es-pulse 2.2s cubic-bezier(0.2,0.8,0.2,1) infinite;
          "></div>
          <div style="
            position:absolute;
            width:${dotSize}px;
            height:${dotSize}px;
            border-radius:50%;
            border:1.5px solid ${color};
            top:50%;left:50%;
            margin-left:-${dotSize / 2}px;
            margin-top:-${dotSize / 2}px;
            animation:es-pulse 2.2s cubic-bezier(0.2,0.8,0.2,1) infinite 0.8s;
          "></div>
        ` : ""}
        <div style="
          width:${dotSize}px;
          height:${dotSize}px;
          border-radius:50%;
          background:${color};
          border:${isSelected ? "2.5px" : "1.5px"} solid rgba(255,255,255,${isSelected ? 0.5 : 0.2});
          box-shadow:0 0 ${isSelected ? "14px 5px" : "4px 1px"} ${color}80;
          cursor:pointer;
          transition:box-shadow 0.25s ease;
        "></div>
      </div>
    `,
  })
}

// ── FlyTo helper ──────────────────────────────────────────────────────────────

function FlyToArea({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  if (coords) {
    map.flyTo(coords, 13, { duration: 1.1, easeLinearity: 0.25 })
  }
  return null
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function AreaDetailPanel({ area, areas }: { area: Area | null; areas: Area[] }) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const withYield = areas.filter((a) => typeof a.avg_yield === "number")
  const globalAvgYield =
    withYield.length > 0
      ? withYield.reduce((s, a) => s + (a.avg_yield as number), 0) / withYield.length
      : null

  if (!area) {
    return (
      <div className="flex h-full flex-col justify-between p-8">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            {isArabic ? "Entrestate · المناطق" : "Entrestate · Area Intelligence"}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-medium text-foreground">
            {isArabic ? "خريطة المناطق في الإمارات" : "UAE Market Map"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground/70">
            {isArabic
              ? `${formatInteger(areas.length, locale, "0")} منطقة مع السعر والعائد والمشاريع. اضغط على أي نقطة للاستكشاف.`
              : `${formatInteger(areas.length, locale, "0")} area profiles with yield, pricing, and project data. Click any dot to explore.`}
          </p>
        </div>

        {/* Aggregate stats */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
              {isArabic ? "ملخص سريع" : "Market snapshot"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{isArabic ? "عدد المناطق" : "Areas tracked"}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatInteger(areas.length, locale, "0")}</p>
              </div>
              {globalAvgYield !== null && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{isArabic ? "متوسط العائد" : "Avg yield"}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
                    {globalAvgYield.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
              {isArabic ? "العائد · لون النقطة" : "Yield · Dot color"}
            </p>
            <div className="space-y-2">
              {[
                { color: "#10b981", label: isArabic ? "عائد 7%+" : "7%+ gross yield", dot: "bg-emerald-500" },
                { color: "#14b8a6", label: isArabic ? "عائد 5–7%" : "5–7% gross yield", dot: "bg-teal-500" },
                { color: "#f59e0b", label: isArabic ? "أقل من 5%" : "Below 5%", dot: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-muted-foreground/60">{item.label}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/30" />
                <span className="text-xs text-muted-foreground/40">{isArabic ? "حجم النقطة يعكس عدد المشاريع" : "Dot size = project count"}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={prefixLocalePath("/areas", locale)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border/50 py-3 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
        >
          <Layers className="h-4 w-4" />
          {isArabic ? "عرض جميع المناطق" : "Browse all area profiles"}
        </Link>
      </div>
    )
  }

  // ── Selected area detail ──
  const yieldVal = typeof area.avg_yield === "number" ? area.avg_yield : null
  const color = yieldVal !== null ? yieldColor(yieldVal) : "#64748b"
  const topProjects = Array.isArray(area.top_projects)
    ? (area.top_projects as string[]).slice(0, 5)
    : []
  const areaLabel = pickLocalizedText(locale, area.area_ar, area.area, "Area")

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Color accent top bar */}
      <div className="h-0.5 w-full shrink-0" style={{ background: color }} />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Area name */}
        <div>
          {area.city && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              <MapPin className="h-2.5 w-2.5" />
              {area.city}
            </span>
          )}
          <h2 className="mt-3 font-serif text-3xl font-medium leading-snug text-foreground">
            {areaLabel}
          </h2>
          {typeof area.projects === "number" && (
            <p className="mt-1 text-sm text-muted-foreground/50">
              {isArabic ? `${formatInteger(area.projects, locale, "0")} مشروعاً خاضعاً للتقييم` : `${formatInteger(area.projects, locale, "0")} active projects scored`}
            </p>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/40 bg-card/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40">{isArabic ? "متوسط السعر" : "Avg Price"}</p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground">
              {typeof area.avg_price === "number" ? formatAed(area.avg_price, locale, { compact: true, fallback: "—" }) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40">{isArabic ? "متوسط العائد" : "Avg Yield"}</p>
            <p className="mt-1.5 text-lg font-bold tabular-nums" style={{ color: yieldVal !== null ? color : undefined }}>
              {yieldVal !== null ? `${yieldVal.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>

        {/* Yield bar */}
        {yieldVal !== null && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40">{isArabic ? "قوة العائد" : "Yield strength"}</p>
              <p className="text-[10px] tabular-nums text-muted-foreground/40">{yieldVal.toFixed(1)}% / 10%</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/30">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (yieldVal / 10) * 100)}%`, background: color }}
              />
            </div>
          </div>
        )}

        {/* Top projects */}
        {topProjects.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground/40" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
                {isArabic ? "أهم المشاريع" : "Top projects"}
              </p>
            </div>
            <div className="space-y-1.5">
              {topProjects.map((project) => (
                <Link
                  key={project}
                  href={prefixLocalePath(`/properties/${slugifyProject(project)}`, locale)}
                  className="group flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 text-sm transition-all hover:border-border/60 hover:bg-card/60"
                >
                  <span className="truncate text-foreground/80 group-hover:text-foreground">{project}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link
            href={prefixLocalePath(`/areas/${area.slug}`, locale)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: color, boxShadow: `0 4px 24px -4px ${color}60` }}
          >
            {isArabic ? `استكشف ${areaLabel}` : `Explore ${String(area.area ?? "area")}`}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AreaMapDesktop({ areas }: { areas: Area[] }) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const center: [number, number] = [25.118, 55.2]

  const markers = useMemo(() => {
    return areas
      .map((area) => {
        const coords = getAreaCoordinates(area.area, area.city)
        const hasYield = typeof area.avg_yield === "number"
        const yieldVal = hasYield ? (area.avg_yield as number) : 0
        const color = yieldColor(yieldVal)
        const projectCount = typeof area.projects === "number" ? area.projects : 0
        const dotSize = Math.max(10, Math.min(22, 10 + projectCount * 0.35))
        const isSelected = selectedArea?.slug === area.slug
        const icon = createMarkerIcon(color, dotSize, isSelected)
        return { area, coords, icon, isSelected }
      })
      .filter(Boolean) as Array<{
        area: Area
        coords: { lat: number; lng: number }
        icon: L.DivIcon
        isSelected: boolean
      }>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, selectedArea])

  function handleMarkerClick(area: Area, coords: { lat: number; lng: number }) {
    setSelectedArea(area)
    setFlyTarget([coords.lat, coords.lng])
  }

  return (
    <>
      <style>{`
        @keyframes es-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .leaflet-container { background: #0a0d12; font-family: inherit; }
        .leaflet-control-zoom a {
          background: hsl(222,47%,10%) !important;
          color: hsl(210,20%,80%) !important;
          border-color: hsl(215,20%,18%) !important;
        }
        .leaflet-control-zoom a:hover { background: hsl(222,47%,14%) !important; }
        .leaflet-control-attribution {
          background: rgba(10,13,18,0.7) !important;
          color: #334155 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #475569 !important; }
      `}</style>

      <div className="flex overflow-hidden rounded-2xl border border-border/50" style={{ height: "calc(100vh - 18rem)", minHeight: "560px" }}>

        {/* ── Map pane ── */}
        <div className="relative flex-1">
          <MapContainer
            center={center}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            <FlyToArea coords={flyTarget} />
            {markers.map(({ area, coords, icon }) => (
              <Marker
                key={`${area.slug}-${selectedArea?.slug ?? "none"}`}
                position={[coords.lat, coords.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => handleMarkerClick(area, coords),
                }}
              />
            ))}
          </MapContainer>

          {/* Instruction overlay (only before selection) */}
          {!selectedArea && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/40 bg-background/80 px-4 py-2 text-[11px] text-muted-foreground/60 backdrop-blur-md">
              {isArabic ? "اضغط على أي نقطة لاستكشاف تلك المنطقة" : "Click any dot to explore that area"}
            </div>
          )}
        </div>

        {/* ── Side panel ── */}
        <div className="w-[340px] shrink-0 border-l border-border/40 bg-background xl:w-[380px]">
          <AreaDetailPanel area={selectedArea} areas={areas} />
        </div>

      </div>
    </>
  )
}
