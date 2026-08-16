export const COPY_RULES = [
  {
    rule: "Never say '100% accurate'",
    forbidden: ["100% accurate"],
    sayInstead: "'Verified against [source names]'",
    appliesTo: "All confidence labels",
  },
  {
    rule: "Never say 'our algorithm'",
    forbidden: ["our algorithm"],
    sayInstead: "'our calculation' or show the formula",
    appliesTo: "Score explanations, Evidence Drawer",
  },
  {
    rule: "Never say 'you don't have access'",
    forbidden: ["you don't have access"],
    sayInstead: "'Unlock' or 'upgrade to see'",
    appliesTo: "All paywall and tier gates",
  },
  {
    rule: "Never write 'N/A'",
    forbidden: ["n/a"],
    sayInstead: "'Not available'",
    appliesTo: "Empty cells, missing fields",
  },
  {
    rule: "Never say 'real-time'",
    forbidden: ["real-time"],
    sayInstead: "State the actual refresh cadence",
    appliesTo: "Trust bar, freshness labels",
  },
  {
    rule: "Never say 'AI says'",
    forbidden: ["ai says"],
    sayInstead: "Quote the source directly",
    appliesTo: "Narrative notes, chat responses",
  },
] as const

export const FORBIDDEN_COPY_PHRASES = COPY_RULES.flatMap((rule) => rule.forbidden)
