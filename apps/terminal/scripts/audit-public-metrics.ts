/**
 * Audit script that scans the codebase for hardcoded user-facing market counts.
 *
 * Senior reviewers spot inconsistency immediately. This catches:
 *   - Hardcoded "2,813 / 2813 / 36,841 / 36841" etc. in user-facing files.
 *   - Files that quote a specific count outside the canonical
 *     `lib/platform-metrics.ts` source.
 *
 * Usage:
 *   npx tsx scripts/audit-public-metrics.ts
 *
 * Exits non-zero on any violation so you can wire it into CI/precommit.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
// Allowed exceptions: the canonical fallback file, the audit script itself,
// scripts/seed/sample data not exposed to users.
const ALLOWED_FILES = new Set<string>([
  "lib/platform-metrics.ts",
  "lib/platform-metrics.server.ts",
  "scripts/audit-public-metrics.ts",
])
const ALLOWED_PATH_PREFIXES = [
  "node_modules/",
  ".next/",
  "seq/",
  "data-scientist/",
  "ai-data-scientist/",
  "scripts/etl/",
  "scripts/parity-check.ts",
  "scripts/smoke",
  "scripts/post-deploy-smoke",
  "tests/",
  "lib/sample",
]

const SCAN_DIRS = ["app", "components", "lib", "hooks"]
const SCAN_EXT = [".ts", ".tsx", ".mdx"]

// Patterns that should not appear unbracketed in user-facing copy:
const FLAG_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  { regex: /\b2[, ]?813\b/g, reason: "Hardcoded scoredProjects count (2,813)" },
  { regex: /\b1[, ]?946\b/g, reason: "Stale legacy scoredProjects count (1,946)" },
  { regex: /\b36[, ]?841\b/g, reason: "Hardcoded DLD transaction count (36,841)" },
  { regex: /\b36[, ]?634\b/g, reason: "Hardcoded DLD feed count (36,634)" },
]

const violations: Array<{ file: string; line: number; reason: string; snippet: string }> = []

function shouldSkip(relPath: string) {
  if (ALLOWED_FILES.has(relPath)) return true
  return ALLOWED_PATH_PREFIXES.some((prefix) => relPath.startsWith(prefix))
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      yield* walk(full)
    } else if (SCAN_EXT.some((ext) => entry.endsWith(ext))) {
      yield full
    }
  }
}

for (const rel of SCAN_DIRS) {
  const dir = join(ROOT, rel)
  try {
    statSync(dir)
  } catch {
    continue
  }
  for (const file of walk(dir)) {
    const relPath = relative(ROOT, file).replace(/\\/g, "/")
    if (shouldSkip(relPath)) continue
    const content = readFileSync(file, "utf8")
    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const { regex, reason } of FLAG_PATTERNS) {
        regex.lastIndex = 0
        if (regex.test(line)) {
          violations.push({ file: relPath, line: i + 1, reason, snippet: line.trim().slice(0, 160) })
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`\n[audit-public-metrics] ${violations.length} violation(s) found:\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.reason}`)
    console.error(`    ${v.snippet}`)
  }
  console.error(`\nFix: read counts from /api/platform-metrics, lib/platform-metrics, or use directional copy ("multi-thousand", "current scored inventory").`)
  process.exit(1)
}

console.log("[audit-public-metrics] OK — no hardcoded conflicting counts in user-facing surfaces.")
