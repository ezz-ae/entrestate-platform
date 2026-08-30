/**
 * THE CATALOG CROSSES THE WIRE; THE PLUMBING NEVER DOES.
 *
 * /api/store/catalog exists so the Terminal's account area can show what this
 * business sells without copying the catalog (a vendored copy already
 * swallowed a price guard once). Three things must stay true:
 *
 *   1. The route reads STORE from lib/freehold/app-store.ts — one spelling.
 *   2. The response never carries `engine` — which internal modules power a
 *      product is plumbing, and the sites just spent a week un-printing
 *      their own plumbing.
 *   3. The route is on the fail-closed API wall's public list, and only the
 *      Entrestate origins are in its CORS set.
 */
import { readFileSync } from "node:fs"

const fail = (msg: string) => {
  console.error(`store-bridge-test: ${msg}`)
  process.exit(1)
}

const route = readFileSync("app/api/store/catalog/route.ts", "utf8")
const routeCode = route.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

if (!routeCode.includes('from "@/lib/freehold/app-store"')) {
  fail("the route must read STORE from lib/freehold/app-store.ts — no second catalog")
}
if (/engine/.test(routeCode)) {
  fail("`engine` appears in the route's code — internal module names must never cross the wire")
}
if (!routeCode.includes("terminal.entrestate.com")) {
  fail("the Terminal origin is missing from the CORS allowlist")
}
if (/access-control-allow-origin.*\*/.test(routeCode)) {
  fail("CORS must reflect an allowlisted origin, never *")
}

const proxy = readFileSync("proxy.ts", "utf8")
if (!proxy.includes('"/api/store/catalog"')) {
  fail("/api/store/catalog is not on the public API allowlist — the fail-closed wall will 401 the Terminal")
}

console.log("store-bridge-test: catalog served from one source, plumbing stays home ✓")
