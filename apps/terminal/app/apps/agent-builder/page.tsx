import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import AgentBuilderApp from "@/automation-builder/agent-builder-app"

export const metadata: Metadata = {
  title: "Agent Builder - Entrestate",
  description:
    "Configure, test, and publish real estate agents with live runs, rule gates, and operational controls.",
}

export default function AgentBuilderPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-24">
        <AgentBuilderApp />
      </div>
    </main>
  )
}
