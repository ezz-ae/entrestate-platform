type ValidationResult = { valid: boolean; warning?: string }

export function validateToolOutput(output: Record<string, unknown>): ValidationResult {
  if (output.l1_canonical_price === null) {
    return { valid: true, warning: "Price data unavailable" }
  }

  if (output.l1_confidence === "LOW") {
    return { valid: true, warning: "LOW confidence — limited data sources" }
  }

  if (output.l4_dld_avg_txn_price === null) {
    return { valid: true, warning: "No DLD transaction overlay available" }
  }

  return { valid: true }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function collectFromValue(value: unknown, warnings: string[]) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const record = asRecord(entry)
      if (record) collectFromRecord(record, warnings)
    }
    return
  }

  const record = asRecord(value)
  if (!record) return
  collectFromRecord(record, warnings)
}

function collectFromRecord(record: Record<string, unknown>, warnings: string[]) {
  const result = validateToolOutput(record)
  if (result.warning) warnings.push(result.warning)

  for (const value of Object.values(record)) {
    collectFromValue(value, warnings)
  }
}

export function collectGuardrailWarnings(toolOutput: unknown): string[] {
  const warnings: string[] = []
  collectFromValue(toolOutput, warnings)
  return Array.from(new Set(warnings))
}

