import type { UserProfile } from "@/lib/profile/types"

type SimulatedProject = {
  slug: string
  name: string
  area: string
  developer: string
  l1_canonical_price: number
  l1_canonical_yield: number
  l2_stress_test_grade: string
  l3_timing_signal: string
  engine_god_metric: number
  l1_confidence: string
  match_score: number // Dynamic score based on user profile
}

const BASE_PROJECTS: SimulatedProject[] = [
  {
    slug: "sim-downtown-views",
    name: "Downtown Views II",
    area: "Downtown Dubai",
    developer: "Emaar",
    l1_canonical_price: 3200000,
    l1_canonical_yield: 5.8,
    l2_stress_test_grade: "A",
    l3_timing_signal: "HOLD",
    engine_god_metric: 78,
    l1_confidence: "HIGH",
    match_score: 0,
  },
  {
    slug: "sim-jvc-residence",
    name: "Oxford Terraces",
    area: "JVC",
    developer: "Iman",
    l1_canonical_price: 950000,
    l1_canonical_yield: 7.4,
    l2_stress_test_grade: "B",
    l3_timing_signal: "BUY",
    engine_god_metric: 84,
    l1_confidence: "MEDIUM",
    match_score: 0,
  },
  {
    slug: "sim-marina-shores",
    name: "Marina Shores",
    area: "Dubai Marina",
    developer: "Select Group",
    l1_canonical_price: 2100000,
    l1_canonical_yield: 6.2,
    l2_stress_test_grade: "A",
    l3_timing_signal: "BUY",
    engine_god_metric: 81,
    l1_confidence: "HIGH",
    match_score: 0,
  },
]

export function calculateMatchScore(project: SimulatedProject, profile: UserProfile): number {
  let score = 50 // Base match score

  // 1. Yield vs Safety Bias
  // If user wants Yield (bias > 0.5), boost high yield projects
  // If user wants Safety (bias < 0.5), boost high grade projects
  const yieldBias = (profile.yieldVsSafety - 0.5) * 2 // -1 (Safety) to +1 (Yield)
  
  if (yieldBias > 0) {
    // Boosting for Yield
    score += (project.l1_canonical_yield - 5) * 10 * yieldBias
  } else {
    // Boosting for Safety (Negative yieldBias becomes positive multiplier for safety)
    const safetyMultiplier = Math.abs(yieldBias)
    if (project.l2_stress_test_grade === "A") score += 20 * safetyMultiplier
    if (project.l2_stress_test_grade === "B") score += 10 * safetyMultiplier
    if (project.l2_stress_test_grade === "D") score -= 20 * safetyMultiplier
  }

  // 2. Risk Bias (Aggressive vs Conservative)
  // High Risk Bias (> 0.5) = Tolerates lower confidence or timing risks for better metrics
  // Low Risk Bias (< 0.5) = Penalizes non-A grades and non-HIGH confidence heavily
  const riskAversion = 1 - profile.riskBias // 0 (Aggressive) to 1 (Conservative)
  
  if (riskAversion > 0.6) {
    // Conservative penalty
    if (project.l3_timing_signal !== "BUY" && project.l3_timing_signal !== "HOLD") score -= 15
    if (project.l1_confidence !== "HIGH") score -= 10
  }

  // 3. Horizon Matching
  if (profile.horizon === "Ready" && project.l3_timing_signal === "WAIT") score -= 30
  if (profile.horizon === "10yr+" && project.l3_timing_signal === "BUY") score += 10

  return Math.min(Math.max(Math.round(score), 0), 100)
}

export function getSimulatedProjects(profile: UserProfile): SimulatedProject[] {
  return BASE_PROJECTS.map(p => ({
    ...p,
    match_score: calculateMatchScore(p, profile)
  })).sort((a, b) => b.match_score - a.match_score)
}
