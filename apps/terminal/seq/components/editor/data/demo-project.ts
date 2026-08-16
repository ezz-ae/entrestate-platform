// Demo project data for loading sample content

import type { MediaItem, TimelineClip, StoryboardPanel } from "../types"

export const DEMO_MEDIA: MediaItem[] = [
  {
    id: "demo-video-1",
    url: "/covers/cover-01.svg",
    thumbnailUrl: "/covers/cover-02.svg",
    prompt: "A cinematic forest scene with morning mist",
    duration: 5,
    aspectRatio: "16:9",
    status: "ready",
    type: "video",
    resolution: { width: 1280, height: 720 },
  },
  {
    id: "demo-video-2",
    url: "/covers/cover-03.svg",
    thumbnailUrl: "/covers/cover-04.svg",
    prompt: "Ocean waves crashing on rocky shore",
    duration: 6,
    aspectRatio: "16:9",
    status: "ready",
    type: "video",
    resolution: { width: 1280, height: 720 },
  },
  {
    id: "demo-video-3",
    url: "/covers/cover-05.svg",
    thumbnailUrl: "/covers/cover-06.svg",
    prompt: "City skyline at golden hour sunset",
    duration: 4,
    aspectRatio: "16:9",
    status: "ready",
    type: "video",
    resolution: { width: 1280, height: 720 },
  },
]

export const DEMO_CLIPS: TimelineClip[] = [
  {
    id: "demo-clip-1",
    mediaId: "demo-video-1",
    trackId: "v1",
    start: 0,
    duration: 5,
    offset: 0,
    volume: 1,
    speed: 1,
  },
  {
    id: "demo-clip-2",
    mediaId: "demo-video-2",
    trackId: "v1",
    start: 5,
    duration: 6,
    offset: 0,
    volume: 1,
    speed: 1,
    transition: { type: "cross-dissolve", duration: 1 },
  },
  {
    id: "demo-clip-3",
    mediaId: "demo-video-3",
    trackId: "v1",
    start: 11,
    duration: 4,
    offset: 0,
    volume: 1,
    speed: 1,
  },
]

export const DEMO_STORYBOARD: StoryboardPanel[] = [
  {
    id: "demo-sb-1",
    prompt: "A cinematic forest scene with morning mist filtering through ancient trees",
    status: "idle",
    type: "scene",
    duration: 5,
    imageUrl: "/covers/cover-01.svg",
  },
  {
    id: "demo-sb-2",
    prompt: "Ocean waves crashing dramatically on rocky shore at sunrise",
    status: "idle",
    type: "scene",
    duration: 6,
    imageUrl: "/covers/cover-03.svg",
  },
  {
    id: "demo-sb-3",
    prompt: "City skyline transitioning from day to golden hour",
    status: "idle",
    type: "scene",
    duration: 4,
    imageUrl: "/covers/cover-05.svg",
  },
]

export const DEMO_MASTER_DESCRIPTION =
  "A cinematic nature documentary sequence showcasing the beauty of landscapes - from misty forests to dramatic ocean scenes, ending with an urban sunset."
