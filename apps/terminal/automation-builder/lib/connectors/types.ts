export type ConnectorQuery = {
  market?: string
  city?: string
  area?: string
  budget?: number
  bedrooms?: string
  timeline?: string
  riskTolerance?: string
}

export type ConnectorResult = {
  source: string
  summary: string
  items: Array<Record<string, unknown>>
}

export type ConnectorContext = {
  teamId: string
  strictMode: boolean
}

export type ConnectorClient = {
  id: string
  name: string
  type: "listings" | "projects" | "market_intel" | "crm"
  enabled: boolean
  query: (query: ConnectorQuery, context: ConnectorContext) => Promise<ConnectorResult>
}
