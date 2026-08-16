import Editor from "@/seq/components/editor/app"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Timeline Editor - Media Creator",
  description: "Arrange project clips, add pacing, and assemble a polished marketing timeline.",
}

// The demo parameter is handled inside TimelineEditor via useSearchParams
export default function TimelinePage() {
  return <Editor />
}
