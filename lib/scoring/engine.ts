import type { UserProfile } from "../profile"
import type { TimeTableRow } from "../time-table"
import type { MatchScoreWeights, MarketScoreWeights, ScoreResult, ScoreWeights, ScoredRow } from "./types"

const riskScores: Record<string, number> = {
  "Institutional Safe": 90,
  "Capital Safe": 80,
  "Balanced": 65,
  "Opportunistic": 45,
  "Speculative": 30,
}

const liquidityScores: Record<string, number> = {
  "Short (1-2yr)": 85,
  "Medium (2-4yr)": 65,
  "Long (4yr+)": 40,
}

const appetiteIndex: Record<UserProfile["riskAppetite"], number> = {
  conservative: 0.2,
  balanced: 0.5,
  growth: 0.7,
  opportunistic: 0.85,
}

const riskIndex: Record<string, number> = {
  "Institutional Safe": 0.2,
  "Capital Safe": 0.35,
  "Balanced": 0.5,
  "Opportunistic": 0.75,
  "Speculative": 0.9,
}

const horizonBands: Record<UserProfile["horizon"], string[]> = {
  ready: ["Completed", "Ready"],
  "6-12mo": ["2025", "Completed"],
  "1-2yr": ["2025", "2026"],
  "2-4yr": ["2026", "2027", "2028"],
  "4yr+": ["2028", "2029", "2030"],
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const getNumber = (row: TimeTableRow, field: string) => {
  const value = row[field]
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export const DEFAULT_MARKET_SCORE_WEIGHTS: MarketScoreWeights = {
  yield: 0.4,
  risk: 0.25,
  liquidity: 0.2,
  price: 0.15,
}

export const DEFAULT_MATCH_SCORE_WEIGHTS: MatchScoreWeights = {
  area: 0.35,
  budget: 0.25,
  beds: 0.15,
  risk: 0.15,
  horizon: 0.1,
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  market: DEFAULT_MARKET_SCORE_WEIGHTS,
  match: DEFAULT_MATCH_SCORE_WEIGHTS,
}

export function computeMarketScore(row: TimeTableRow, weights: MarketScoreWeights): ScoreResult {
  const yieldPct = getNumber(row, "yield_pct")
  const priceAed = getNumber(row, "price_aed")
  const riskBand = typeof row.risk_band === "string" ? row.risk_band : ""
  const liquidityBand = typeof row.liquidity_band === "string" ? row.liquidity_band : ""

  const yieldScore = yieldPct === null ? 50 : clamp((yieldPct / 10) * 100)
  const riskScore = riskScores[riskBand] ?? 55
  const liquidityScore = liquidityScores[liquidityBand] ?? 55

  let priceScore = 60
  if (priceAed !== null) {
    if (priceAed <= 1_000_000) priceScore = 90
    else if (priceAed <= 2_000_000) priceScore = 75
    else if (priceAed <= 3_500_000) priceScore = 60
    else priceScore = 45
  }

  const totalWeight = weights.yield + weights.risk + weights.liquidity + weights.price
  const marketScore =
    (yieldScore * weights.yield +
      riskScore * weights.risk +
      liquidityScore * weights.liquidity +
      priceScore * weights.price) /
    totalWeight

  return {
    marketScore: clamp(marketScore),
    matchScore: 0,
    totalScore: clamp(marketScore),
    reasons: ["market_score"],
  }
}

export function computeMatchScore(row: TimeTableRow, profile: UserProfile, weights: MatchScoreWeights): ScoreResult {
  const area = typeof row.area === "string" ? row.area.toLowerCase() : ""
  const priceAed = getNumber(row, "price_aed")
  const beds = getNumber(row, "beds")
  const riskBand = typeof row.risk_band === "string" ? row.risk_band : ""
  const statusBand = typeof row.status_band === "string" ? row.status_band : ""

  const areaScore = profile.preferredAreas?.some((pref) => pref.toLowerCase() === area) ? 100 : 60

  let budgetScore = 60
  if (profile.budgetAed && priceAed !== null) {
    if (priceAed <= profile.budgetAed) budgetScore = 100
    else if (priceAed <= profile.budgetAed * 1.1) budgetScore = 75
    else budgetScore = 40
  }

  let bedsScore = 60
  if (profile.beds && beds !== null) {
    bedsScore = beds === profile.beds ? 100 : 55
  }

  const appetite = appetiteIndex[profile.riskAppetite]
  const riskValue = riskIndex[riskBand] ?? 0.5
  const riskScore = clamp(100 - Math.abs(appetite - riskValue) * 120)

  const horizonMatches = horizonBands[profile.horizon].some((band) => statusBand.includes(band))
  const horizonScore = horizonMatches ? 100 : 60

  const totalWeight = weights.area + weights.budget + weights.beds + weights.risk + weights.horizon
  const matchScore =
    (areaScore * weights.area +
      budgetScore * weights.budget +
      bedsScore * weights.beds +
      riskScore * weights.risk +
      horizonScore * weights.horizon) /
    totalWeight

  return {
    marketScore: 0,
    matchScore: clamp(matchScore),
    totalScore: clamp(matchScore),
    reasons: ["match_score"],
  }
}

export function scoreRow(row: TimeTableRow, profile: UserProfile, weights: ScoreWeights): ScoreResult {
  const market = computeMarketScore(row, weights.market)
  const match = computeMatchScore(row, profile, weights.match)
  const totalScore = clamp(market.marketScore * 0.65 + match.matchScore * 0.35)
  return {
    marketScore: market.marketScore,
    matchScore: match.matchScore,
    totalScore,
    reasons: [...market.reasons, ...match.reasons],
  }
}

export function rankRows(rows: TimeTableRow[], profile: UserProfile, weights = DEFAULT_SCORE_WEIGHTS): ScoredRow[] {
  return rows
    .map((row) => {
      const result = scoreRow(row, profile, weights)
      return {
        ...row,
        market_score: Number(result.marketScore.toFixed(1)),
        match_score: Number(result.matchScore.toFixed(1)),
        total_score: Number(result.totalScore.toFixed(1)),
      }
    })
    .sort((a, b) => (b.total_score as number) - (a.total_score as number))
}
