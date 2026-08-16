import { ImageCombiner } from "@/seq/components/image-combiner"
import type { Metadata } from "next"
import { AppShell } from "@/seq/components/app-shell"

export const metadata: Metadata = {
  title: "Image Studio - Media Creator",
  description:
    "Create listing visuals from project briefs, edit assets, and export clean formats for marketing packs.",
}

export default function Home() {
  return (
    <AppShell>
      <ImageCombiner />
    </AppShell>
  )
}
