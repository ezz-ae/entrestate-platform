export type DataSyncKey = "areas" | "developers" | "search" | "properties" | "topData"

export type DataSyncContract = {
  endpoint: string
  primaryView: string
  fallbackViews: string[]
}

export type DataSyncMeta = DataSyncContract & {
  syncedAt: string
}

export const DATA_SYNC_CONTRACT: Record<DataSyncKey, DataSyncContract> = {
  areas: {
    endpoint: "/api/areas",
    primaryView: "api.areas_v1",
    fallbackViews: ["api.area_intelligence_v1", "public.entrestate_areas_api"],
  },
  developers: {
    endpoint: "/api/developers",
    primaryView: "api.developers_v1",
    fallbackViews: ["api.developer_leaderboard_v1", "api.entrestate_developers_api"],
  },
  search: {
    endpoint: "/api/search",
    primaryView: "api.search_index",
    fallbackViews: ["api.projects_v1", "public.entrestate_projects_api"],
  },
  properties: {
    endpoint: "/en/properties",
    primaryView: "api.projects_v1",
    fallbackViews: ["api.search_index", "public.entrestate_projects_api"],
  },
  topData: {
    endpoint: "/api/top-data",
    primaryView: "api.market_pulse_v1",
    fallbackViews: [
      "entrestate_top_data",
      "api.area_intelligence_v1",
      "api.developer_leaderboard_v1",
      "api.dld_transactions_v1",
      "api.notifications_v1",
    ],
  },
}

export function buildDataSyncMeta(key: DataSyncKey, syncedAt?: string | null): DataSyncMeta {
  return {
    ...DATA_SYNC_CONTRACT[key],
    syncedAt: syncedAt ?? new Date().toISOString(),
  }
}
