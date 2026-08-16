export const DEMO_STORYBOARD = {
  masterImageUrl: "/covers/cover-01.svg",
  masterDescription:
    "Premium waterfront launch story: arrival, lobby, amenities, skyline, sunset finale.",
  panelCount: 9,
  panels: [
    {
      imageUrl: "/covers/cover-01.svg",
      prompt: "Aerial reveal of the waterfront tower, marina, and skyline at sunrise",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-02.svg",
      prompt: "Drive-up arrival with branded entry and warm morning light",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-03.svg",
      prompt: "Double-height lobby, reception desk, marble textures, soft daylight",
      duration: 5 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-04.svg",
      prompt: "Amenity deck with pool, cabanas, and skyline backdrop",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-05.svg",
      prompt: "Sky lounge with panoramic view and golden hour glow",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-06.svg",
      prompt: "Fitness center with city view, modern equipment, clean lines",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-01.svg",
      prompt: "Family living room scene with natural light and premium finishes",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-02.svg",
      prompt: "Bedroom suite with wide windows, calm palette, refined textiles",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "/covers/cover-03.svg",
      prompt: "Closing skyline night shot with tower glow and reflections",
      duration: 5 as const,
      aspectRatio: "16:9" as const,
    },
  ],
}

export const DEMO_TRANSITION_STORYBOARD = {
  transitionImageUrl: "/covers/cover-04.svg",
  description:
    "Two transitions: move from arrival to lobby, then shift from amenities to a night skyline close.",
  panelCount: 5,
  panels: [
    {
      imageUrl: "/covers/cover-02.svg",
      label: "Transition 1 - First Frame",
      description: "Arrival view with branded entry and warm light",
    },
    {
      imageUrl: "/covers/cover-03.svg",
      label: "Transition 1 - Last Frame",
      description: "Lobby interior with reception desk and marble textures",
    },
    {
      imageUrl: "/covers/cover-04.svg",
      label: "Transition 2 - First Frame",
      description: "Amenity deck in daylight with pool and cabanas",
    },
    {
      imageUrl: "/covers/cover-05.svg",
      label: "Visual Reference",
      description: "Day-to-night shift overlay for timing guidance",
    },
    {
      imageUrl: "/covers/cover-06.svg",
      label: "Transition 2 - Last Frame",
      description: "Skyline at night with tower lighting",
    },
  ],
}

export const DEMO_FINAL_SEQUENCE = {
  masterDescription:
    "Premium waterfront launch story: arrival, lobby, amenities, skyline, sunset finale.",
  videoConfig: {
    aspectRatio: "16:9" as const,
    useFastModel: true,
  },
  panels: [
    {
      imageUrl: "/covers/cover-01.svg",
      prompt: "Aerial reveal of the waterfront tower, marina, and skyline at sunrise",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-02.svg",
      linkedImageUrl: "/covers/cover-03.svg",
      prompt: "Smooth push from arrival into the double-height lobby",
      duration: 5 as const,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-03.svg",
      prompt: "Lobby interior with reception desk, marble textures, and soft daylight",
      duration: 5 as const,
      linkedImageUrl: undefined,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-04.svg",
      prompt: "Resort-style pool deck, cabanas, and skyline backdrop",
      duration: 5 as const,
      linkedImageUrl: undefined,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-05.svg",
      linkedImageUrl: "/covers/cover-06.svg",
      prompt: "Sunset shift from amenities to the sky lounge",
      duration: 5 as const,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-06.svg",
      prompt: "Sky lounge with panoramic city view and golden hour glow",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "",
    },
    {
      imageUrl: "/covers/cover-01.svg",
      prompt: "Closing skyline night shot with tower glow and reflections",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "",
    },
  ],
}
