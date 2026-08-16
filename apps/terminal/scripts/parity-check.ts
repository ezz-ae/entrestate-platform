type Probe = {
  url: string
  matcher: RegExp
  expected: keyof Stats
}

type Stats = {
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  strongBuyCount: number
  buyCount: number
  holdCount: number
  waitCount: number
  avoidCount: number
}

const SITE = process.env.PARITY_SITE ?? "https://www.entrestate.com"

const PROBES: Probe[] = [
  { url: "/en", matcher: /([\d,]+)\s+scored projects/i, expected: "totalProjects" },
  { url: "/en/overview", matcher: /([\d,]+)\s+projects scored/i, expected: "totalProjects" },
  { url: "/en/properties", matcher: /showing\s+[\d,]+\s+of\s+([\d,]+)\s+projects/i, expected: "totalProjects" },
  { url: "/en/developers", matcher: /([\d,]+)\s+developers\./i, expected: "ratedDevelopers" },
  { url: "/en/areas", matcher: /([\d,]+)\s+area profiles/i, expected: "totalAreas" },
]

async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${SITE}/api/internal/platform-stats`)
  if (!response.ok) {
    throw new Error(`platform stats endpoint failed: ${response.status}`)
  }

  return (await response.json()) as Stats
}

async function fetchPageValue(probe: Probe) {
  const response = await fetch(`${SITE}${probe.url}`)
  if (!response.ok) return null
  const html = await response.text()
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")
  const match = text.match(probe.matcher)
  if (!match) return null
  return Number(match[1].replace(/,/g, ""))
}

async function main() {
  const stats = await fetchStats()
  let failures = 0

  for (const probe of PROBES) {
    const found = await fetchPageValue(probe)
    const expected = stats[probe.expected]

    if (found === null) {
      console.log(`WARN ${probe.url} did not match ${probe.matcher}`)
      continue
    }

    if (found !== expected) {
      failures += 1
      console.error(`DRIFT ${probe.url} found=${found} expected=${expected} key=${probe.expected}`)
      continue
    }

    console.log(`OK ${probe.url} ${probe.expected}=${found}`)
  }

  if (failures > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
