import type { Metadata } from "next"
import { LandingPage } from "@/seq/components/landing-page/components/landing-page"

export const metadata: Metadata = {
  title: "Media Creator - Entrestate",
  description:
    "Turn project media into cinematic storyboards, launch sequences, and marketing assets in minutes.",
}

export default function Home() {
  return <LandingPage />
}
