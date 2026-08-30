/**
 * PHASE 1 OF THE ACCOUNT FOUNDATION, PINNED (docs/ACCOUNT-FOUNDATION.md).
 *
 * The business recognises the Terminal session by reading the SAME cookie
 * with the SAME library and the SAME env values the Terminal writes it with.
 * Three things keep that safe, and each is a runnable assertion here:
 *
 *   1. SAME MEANS SAME. The library is pinned to the Terminal's exact
 *      version — a drifted verifier that "mostly" reads the cookie is an
 *      auth bug wearing a patch bump. Both env names must appear in the
 *      module (parity with the Terminal's lib/auth/server.ts).
 *   2. FAIL CLOSED, RENDER OPEN. Every failure returns null; the module
 *      never throws into a selling surface. Recognition is a bonus — the
 *      anonymous page is the product.
 *   3. THE CLIENT'S COOKIE IS NOT TOUCHED. freehold_site_session belongs to
 *      the client's live product. The Terminal-session module must not even
 *      mention it.
 */
import { readFileSync } from "node:fs"

const fail = (msg: string) => {
  console.error(`terminal-session-test: ${msg}`)
  process.exit(1)
}

const src = readFileSync("lib/terminal-session.ts", "utf8")
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

// 1 — same library, same version, same env pair.
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>
}
const pinned = pkg.dependencies?.["@neondatabase/auth"]
if (pinned !== "0.2.0-beta.1") {
  fail(
    `@neondatabase/auth is "${pinned}" — it must be pinned to the Terminal's exact version (0.2.0-beta.1); bump BOTH repos together or not at all`,
  )
}
if (!code.includes("NEON_AUTH_BASE_URL") || !code.includes("NEON_AUTH_COOKIE_SECRET")) {
  fail("the module must read NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET — the pair the owner aligned across both projects")
}
if (!code.includes('from "@neondatabase/auth/next/server"')) {
  fail("verification must come from the shared library, never a re-implementation")
}

// 2 — fail closed: the catch returns null, and no throw survives it.
if (!/catch\s*\{\s*[\s\S]*?return null/m.test(code)) {
  fail("getTerminalUser must swallow every failure into null — a selling surface never 500s over recognition")
}
if (/throw\s/.test(code)) {
  fail("the module throws — every failure mode must be null")
}

// 3 — the client's world stays his. The header COMMENT names the cookie to
// document the prohibition (that is what headers are for); the CODE must
// never reference it, so the ban scans comment-stripped source.
if (code.toLowerCase().includes("freehold_site_session")) {
  fail("the Terminal-session module touches the client's session cookie — different auth, different world")
}

// The store page actually uses it, as a bonus and not a gate: the grid must
// render regardless (the strip is conditional, the sections are not).
const store = readFileSync("app/business/store/page.tsx", "utf8")
if (!store.includes("getTerminalUser")) {
  fail("the store page no longer reads the Terminal session — phase 1's visible proof is gone")
}
if (!/terminalUser\s*\?\s*\(/.test(store)) {
  fail("recognition must be conditional decoration — the anonymous page is the product")
}

console.log("terminal-session-test: one cookie, one library, fail-closed recognition ✓")
