import { areaCoordinates } from "@/lib/area-coordinates"

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  dubai: { lat: 25.2048, lng: 55.2708 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  sharjah: { lat: 25.3463, lng: 55.4209 },
  ajman: { lat: 25.4052, lng: 55.5136 },
  "ras al khaimah": { lat: 25.8007, lng: 55.9762 },
  fujairah: { lat: 25.1288, lng: 56.3265 },
  "umm al quwain": { lat: 25.5647, lng: 55.5552 },
}

function hashToUnit(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return (hash % 1000) / 999
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function tileCoordinate(latitude: number, longitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180
  const n = 2 ** zoom
  const x = Math.floor(((longitude + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y }
}

export function getAreaCoordinates(areaName: unknown, city?: unknown) {
  const normalizedArea = typeof areaName === "string" ? areaName.trim().toLowerCase() : ""
  if (normalizedArea) {
    const exact = areaCoordinates[normalizedArea]
    if (exact) return exact
  }

  const normalizedCity = typeof city === "string" && city.trim().length > 0 ? city.trim().toLowerCase() : "dubai"
  const center = CITY_CENTERS[normalizedCity] ?? CITY_CENTERS.dubai
  const seed = normalizedArea || normalizedCity || "dubai"

  return {
    lat: clamp(center.lat + (hashToUnit(`${seed}-lat`) - 0.5) * 0.18, 22.8, 26.7),
    lng: clamp(center.lng + (hashToUnit(`${seed}-lng`) - 0.5) * 0.22, 51.8, 56.9),
  }
}

export function buildAreaStaticMapTileUrl(areaName: unknown, city?: unknown) {
  const { lat, lng } = getAreaCoordinates(areaName, city)
  const zoom = 11
  const { x, y } = tileCoordinate(lat, lng, zoom)
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}
