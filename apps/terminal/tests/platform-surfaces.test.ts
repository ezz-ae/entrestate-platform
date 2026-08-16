import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("platform score surfaces", () => {
  it("keeps core-surface routing on the homepage", () => {
    const home = read("app/page.tsx")
    expect(home).toContain('href: "/chat"')
    expect(home).toContain('href: "/search"')
    expect(home).toContain('href: "/map"')
    expect(home).toContain('href: "/pricing"')
    expect(home).toContain('href: "/status"')
    expect(home).toContain('href: "/docs/documentation"')
  })

  it("keeps pricing SEO and monetization clarity surfaces", () => {
    const pricingPage = read("app/pricing/page.tsx")
    const pricingLayout = read("app/pricing/layout.tsx")

    expect(pricingPage).toContain('"@type": "FAQPage"')
    expect(pricingPage).toContain('"@type": "OfferCatalog"')
    expect(pricingPage).toContain("Start free before you buy")
    expect(pricingPage).toContain("What changes across tiers?")
    expect(pricingLayout).toContain("generateMetadata")
  })

  it("keeps search and map discoverable in SEO surfaces", () => {
    const searchLayout = read("app/search/layout.tsx")
    const mapLayout = read("app/map/layout.tsx")
    const sitemap = read("app/sitemap.ts")
    const searchPage = read("app/search/page.tsx")
    const builder = read("components/search/time-table-builder.tsx")

    expect(searchLayout).toContain("generateMetadata")
    expect(mapLayout).toContain("generateMetadata")
    expect(sitemap).toContain('"/chat"')
    expect(sitemap).toContain('"/map"')
    expect(searchPage).toContain("SearchTimeTableBuilder")
    expect(builder).toContain("/api/time-table/preview")
    expect(builder).toContain("AnalystView")
  })

  it("keeps public trust and compliance pathways visible", () => {
    const home = read("app/page.tsx")
    const statusPage = read("app/status/page.tsx")

    expect(home).toContain("Public proof")
    expect(statusPage).toContain("Governance and reliance")
    expect(statusPage).toContain('"/privacy"')
    expect(statusPage).toContain('"/terms"')
  })
})
