import type { UserProfile } from "../profile"
import type { TimeTableRow } from "../time-table"

export type MarketScoreWeights = {
  yield: number
  risk: number
  liquidity: number
  price: number
}

export type MatchScoreWeights = {
  area: number
  budget: number
  beds: number
  risk: number
  horizon: number
}

export type ScoreWeights = {
  market: MarketScoreWeights
  match: MatchScoreWeights
}

export type ScoreResult = {
  marketScore: number
  matchScore: number
  totalScore: number
  reasons: string[]
}

export type ScoredRow = TimeTableRow & {
  market_score: number
  match_score: number
  total_score: number
}

export type ScoreContext = {
  row: TimeTableRow
  profile: UserProfile
  weights: ScoreWeights
}
