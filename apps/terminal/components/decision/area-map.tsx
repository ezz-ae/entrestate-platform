"use client"

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useLocale } from "next-intl"
import { getAreaCoordinates } from "@/lib/area-geo"
import { DecisionRecord } from "@/lib/decision-infrastructure"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatAed } from "@/lib/format/currency"
import { formatInteger } from "@/lib/format/number"

type AreaMapProps = {
  areas: Array<DecisionRecord & { slug: string }>
}

function yieldColor(yieldVal: number): string {
  if (yieldVal >= 7) return "#10b981"
  if (yieldVal >= 5) return "#14b8a6"
  return "#f59e0b"
}

export function AreaMap({ areas }: AreaMapProps) {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const center: [number, number] = [25.118, 55.139]

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{
        height: "calc(100vh - 18rem)",
        minHeight: "560px",
        width: "100%",
        marginTop: "64px",
        position: "relative",
        zIndex: 0,
      }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />
      {areas.map((area) => {
        const coords = getAreaCoordinates(area.area, area.city)
        const areaLabel = pickLocalizedText(locale, area.area_ar, area.area, "Area")
        const hasYield = typeof area.avg_yield === "number"
        const yieldVal = hasYield ? (area.avg_yield as number) : 0
        const color = yieldColor(yieldVal)
        const projectCount = typeof area.projects === "number" ? (area.projects as number) : 0
        const radius = Math.max(8, Math.min(22, 8 + projectCount * 0.4))

        return (
          <CircleMarker
            key={area.slug}
            center={[coords.lat, coords.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.75,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ minWidth: "170px", padding: "12px 14px", fontFamily: "inherit" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "10px", color: "#e2e8f0", letterSpacing: "0.01em" }}>
                  {areaLabel}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {typeof area.avg_price === "number" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{isArabic ? "متوسط السعر" : "Avg. price"}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                        {formatAed(area.avg_price as number, locale, { compact: true, fallback: "—" })}
                      </span>
                    </div>
                  )}
                  {hasYield && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{isArabic ? "متوسط العائد" : "Avg. yield"}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color }}>{yieldVal.toFixed(1)}%</span>
                    </div>
                  )}
                  {projectCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{isArabic ? "عدد المشاريع" : "Projects"}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>{formatInteger(projectCount, locale, "0")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
