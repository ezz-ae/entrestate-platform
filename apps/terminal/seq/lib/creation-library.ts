import { DEMO_STORYBOARD } from "@/seq/lib/demo-data"

export type PromptTarget = "storyboard" | "image-playground" | "timeline"

export interface PromptTemplate {
  id: string
  title: string
  description: string
  target: PromptTarget
  href: string
  badge: string
  promptTemplate: string
}

export interface ProjectOption {
  id: string
  name: string
  location: string
  cover: string
  media: string[]
}

const demoMedia = DEMO_STORYBOARD.panels.map((panel) => panel.imageUrl)
const coverFallbacks = [
  "/covers/cover-01.svg",
  "/covers/cover-02.svg",
  "/covers/cover-03.svg",
  "/covers/cover-04.svg",
  "/covers/cover-05.svg",
  "/covers/cover-06.svg",
]

export const PROJECT_LIBRARY: ProjectOption[] = [
  {
    id: "downtown-reserve",
    name: "Downtown Reserve",
    location: "Downtown Dubai",
    cover: demoMedia[0] || coverFallbacks[0],
    media: demoMedia.slice(0, 4),
  },
  {
    id: "harbor-collection",
    name: "Harbor Collection",
    location: "Dubai Marina",
    cover: demoMedia[1] || coverFallbacks[1],
    media: demoMedia.slice(1, 5),
  },
  {
    id: "dunes-residences",
    name: "Dunes Residences",
    location: "Palm Jumeirah",
    cover: demoMedia[2] || coverFallbacks[2],
    media: demoMedia.slice(2, 6),
  },
  {
    id: "creekline-towers",
    name: "Creekline Towers",
    location: "Dubai Creek Harbour",
    cover: demoMedia[3] || coverFallbacks[3],
    media: demoMedia.slice(3, 7),
  },
  {
    id: "marina-gardens",
    name: "Marina Gardens",
    location: "Dubai Marina",
    cover: demoMedia[4] || coverFallbacks[4],
    media: demoMedia.slice(4, 8),
  },
  {
    id: "bluewater-signature",
    name: "Bluewater Signature",
    location: "Bluewaters Island",
    cover: demoMedia[5] || coverFallbacks[5],
    media: demoMedia.slice(5, 9),
  },
]

export const PROMPT_LIBRARY: PromptTemplate[] = [
  {
    id: "project-marketing-video",
    title: "Create a project marketing video",
    description: "Cinematic 45-60s montage for a full-funnel launch.",
    target: "storyboard",
    href: "/storyboard",
    badge: "Storyboard",
    promptTemplate:
      "Create a cinematic marketing video for {project} in {location}. Use a luxury tone, wide exterior, lobby reveal, amenity highlights, lifestyle shots, and a sunset finale.",
  },
  {
    id: "vertical-social-teaser",
    title: "Create a vertical social teaser",
    description: "15s 9:16 teaser built for reels and short ads.",
    target: "storyboard",
    href: "/storyboard",
    badge: "Storyboard",
    promptTemplate:
      "Create a 15-second vertical teaser for {project} in {location}. Focus on energy, quick cuts, bold motion, and lifestyle details.",
  },
  {
    id: "amenity-walkthrough",
    title: "Create an amenity walkthrough",
    description: "Sequence the pool, gym, lobby, and lounges.",
    target: "storyboard",
    href: "/storyboard",
    badge: "Storyboard",
    promptTemplate:
      "Create an amenity walkthrough for {project} in {location}. Show pool, gym, lobby, co-working, and sky lounge in a smooth narrative flow.",
  },
  {
    id: "investor-story",
    title: "Create an investor-focused narrative",
    description: "Premium tone, stability, and long-term value.",
    target: "storyboard",
    href: "/storyboard",
    badge: "Storyboard",
    promptTemplate:
      "Create an investor-focused video for {project} in {location}. Emphasize long-term stability, rental demand, and premium positioning.",
  },
  {
    id: "developer-portfolio",
    title: "Create a developer portfolio reel",
    description: "Showcase execution history and design language.",
    target: "storyboard",
    href: "/storyboard",
    badge: "Storyboard",
    promptTemplate:
      "Create a developer portfolio reel featuring {project} in {location}. Emphasize craftsmanship, design language, and delivery confidence.",
  },
  {
    id: "hero-renders",
    title: "Create hero renders",
    description: "High-end stills for landing pages and ads.",
    target: "image-playground",
    href: "/image-playground",
    badge: "Image Studio",
    promptTemplate:
      "Create 4 hero renders for {project} in {location}. Photorealistic, golden hour lighting, clear skyline, and luxury materials.",
  },
  {
    id: "lifestyle-stills",
    title: "Create lifestyle stills",
    description: "Human moments that sell the experience.",
    target: "image-playground",
    href: "/image-playground",
    badge: "Image Studio",
    promptTemplate:
      "Create lifestyle stills for {project} in {location}. Focus on residents, amenities, and a refined daily routine.",
  },
  {
    id: "interior-detail-shots",
    title: "Create interior detail shots",
    description: "Close-ups of materials, finishes, and light.",
    target: "image-playground",
    href: "/image-playground",
    badge: "Image Studio",
    promptTemplate:
      "Create interior detail shots for {project} in {location}. Emphasize textures, natural light, and luxury finishes.",
  },
  {
    id: "timeline-proof-of-delivery",
    title: "Build a delivery timeline",
    description: "Edit a timeline sequence for handover milestones.",
    target: "timeline",
    href: "/timeline",
    badge: "Timeline Editor",
    promptTemplate:
      "Build a delivery timeline for {project} in {location}. Sequence milestones from launch to handover with a confident, premium tone.",
  },
]
