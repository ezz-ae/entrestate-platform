export const MOBILE_CHAT_SHORTCUTS = {
  screenBuyProjects: "Screen 2BR projects under AED 2M with BUY signal and Grade A/B risk.",
  compareMarinaVsJbr: "Compare Dubai Marina vs JBR on yield, price, stress grade, and timing label.",
  marinaVistaMemo: "Generate an investor memo for Marina Vista covering price, area, developer, stress, and verdict.",
} as const

export const GOLDEN_PATH_PROMPTS = {
  underwrite_development_site:
    "Underwrite a UAE development site using price reality, area risk, handover timing, payment structure, and developer reliability. Return a decision-ready summary.",
  compare_area_yields:
    "Compare the top UAE submarkets on price, yield, stress grade, timing label, and investor score. Tell me which area screens stronger right now and why.",
  draft_spa_contract:
    "Draft a SPA readiness brief for a UAE off-plan property covering payment plan, handover, fees, developer checks, and major contract risks.",
} as const

export function getGoldenPathPrompt(pathId: string | null | undefined) {
  if (!pathId) return null
  return GOLDEN_PATH_PROMPTS[pathId as keyof typeof GOLDEN_PATH_PROMPTS] ?? null
}
