import { getEntrestateRows } from "@/lib/daas/data"
import { priceValue, resolveColumns, toStringValue } from "@/lib/daas/engine"
import type { ConnectorClient, ConnectorQuery, ConnectorResult, ConnectorContext } from "./types"

const listFromMarket = async (query: ConnectorQuery): Promise<ConnectorResult> => {
  const { rows, source, sourceTable } = await getEntrestateRows()
  const columns = resolveColumns(rows)
  const filtered = rows.filter((row) => {
    const city = columns.city ? toStringValue(row[columns.city])?.toLowerCase() ?? "" : ""
    const area = columns.area ? toStringValue(row[columns.area])?.toLowerCase() ?? "" : ""
    const budget = priceValue(row, columns) ?? 0

    if (query.city && !city.includes(query.city.toLowerCase())) return false
    if (query.area && !area.includes(query.area.toLowerCase())) return false
    if (query.budget && budget > 0 && budget > query.budget * 1.15) return false
    return true
  })

  const sample = filtered.slice(0, 6).map((row) => ({
    name: columns.name ? toStringValue(row[columns.name]) : null,
    city: columns.city ? toStringValue(row[columns.city]) : null,
    area: columns.area ? toStringValue(row[columns.area]) : null,
    price_from_aed: priceValue(row, columns),
    delivery: columns.status ? toStringValue(row[columns.status]) : null,
    developer: columns.developer ? toStringValue(row[columns.developer]) : null,
  }))

  return {
    source: sourceTable ?? source,
    summary: `Found ${filtered.length} verified listings`,
    items: sample,
  }
}

const marketIntel = async (query: ConnectorQuery): Promise<ConnectorResult> => {
  const { rows, source, sourceTable } = await getEntrestateRows()
  const columns = resolveColumns(rows)
  const city = query.city?.toLowerCase()
  const relevant = city
    ? rows.filter((row) =>
        columns.city ? (toStringValue(row[columns.city]) ?? "").toLowerCase().includes(city) : false,
      )
    : rows

  const prices = relevant.map((row) => priceValue(row, columns)).filter((value): value is number => value !== null)
  const avgPrice = prices.reduce((sum, value) => sum + value, 0) / Math.max(prices.length, 1)

  return {
    source: sourceTable ?? source,
    summary: "Market intelligence snapshot from verified inventory.",
    items: [
      {
        market: query.market || "UAE",
        average_price: Number.isFinite(avgPrice) ? Math.round(avgPrice) : null,
        sample_count: relevant.length,
      },
    ],
  }
}

const mockCrm: ConnectorClient = {
  id: "crm",
  name: "CRM Connector",
  type: "crm",
  enabled: true,
  async query(_: ConnectorQuery, context: ConnectorContext) {
    return {
      source: "crm",
      summary: `CRM access ${context.strictMode ? "locked to verified leads" : "available"}.`,
      items: [],
    }
  },
}

const listingsConnector: ConnectorClient = {
  id: "listings",
  name: "Listings Connector",
  type: "listings",
  enabled: true,
  query: async (query) => listFromMarket(query),
}

const projectsConnector: ConnectorClient = {
  id: "projects",
  name: "Projects Connector",
  type: "projects",
  enabled: true,
  query: async (query) => listFromMarket(query),
}

const marketConnector: ConnectorClient = {
  id: "market_intel",
  name: "Market Intelligence Connector",
  type: "market_intel",
  enabled: true,
  query: async (query) => marketIntel(query),
}

export const connectorRegistry: ConnectorClient[] = [
  listingsConnector,
  projectsConnector,
  marketConnector,
  mockCrm,
]

export function getConnectorByType(type: ConnectorClient["type"]) {
  return connectorRegistry.find((connector) => connector.type === type)
}
