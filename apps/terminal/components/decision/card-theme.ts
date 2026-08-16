type DecisionCardTheme = {
  surfaceGradient: string
  haloGradient: string
  strokeGradient: string
  chipClassName: string
}

const DECISION_CARD_THEMES: DecisionCardTheme[] = [
  {
    surfaceGradient: "from-blue-500/[0.08] to-transparent",
    haloGradient: "from-blue-500/20 via-sky-400/10 to-transparent",
    strokeGradient: "from-blue-400/55 via-sky-300/30 to-transparent",
    chipClassName: "border-blue-300/30 hover:border-blue-300/60 hover:text-blue-200",
  },
  {
    surfaceGradient: "from-sky-500/[0.08] to-transparent",
    haloGradient: "from-sky-500/20 via-cyan-400/10 to-transparent",
    strokeGradient: "from-sky-400/55 via-cyan-300/30 to-transparent",
    chipClassName: "border-sky-300/30 hover:border-sky-300/60 hover:text-sky-200",
  },
  {
    surfaceGradient: "from-indigo-500/[0.08] to-transparent",
    haloGradient: "from-indigo-500/20 via-blue-400/10 to-transparent",
    strokeGradient: "from-indigo-400/55 via-blue-300/30 to-transparent",
    chipClassName: "border-indigo-300/30 hover:border-indigo-300/60 hover:text-indigo-200",
  },
  {
    surfaceGradient: "from-violet-500/[0.07] to-transparent",
    haloGradient: "from-violet-500/18 via-indigo-400/10 to-transparent",
    strokeGradient: "from-violet-400/50 via-indigo-300/28 to-transparent",
    chipClassName: "border-violet-300/30 hover:border-violet-300/60 hover:text-violet-200",
  },
]

function hashSeed(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getDecisionCardTheme(seed: string): DecisionCardTheme {
  const index = hashSeed(seed) % DECISION_CARD_THEMES.length
  return DECISION_CARD_THEMES[index]
}
