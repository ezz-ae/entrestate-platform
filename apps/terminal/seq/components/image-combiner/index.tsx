"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useMobile } from "@/seq/hooks/use-mobile"
import { useImageUpload } from "./hooks/use-image-upload"
import { useImageGeneration } from "./hooks/use-image-generation"
import { useAspectRatio } from "./hooks/use-aspect-ratio"
import { HowItWorksModal } from "./how-it-works-modal"
import { usePersistentHistory } from "./hooks/use-persistent-history"
import { InputSection } from "./input-section"
import { OutputSection } from "./output-section"
import { ToastNotification } from "./toast-notification"
import { GenerationHistory } from "./generation-history"
import { GlobalDropZone } from "./global-drop-zone"
import { FullscreenViewer } from "./fullscreen-viewer"
import { useSearchParams } from "next/navigation"
import { cn } from "@/seq/lib/utils"
import type { BrandedOverlayData } from "./branded-overlay"

function EmptyFooterHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-4 text-center">
      <h3 className="text-lg font-medium text-foreground mb-1">No renders yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">Build a few visuals and they will appear here.</p>
    </div>
  )
}

export function ImageCombiner() {
  const isMobile = useMobile()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState("Dubai Marina skyline at sunset, warm lighting, clean branding space")
  const [useUrls, setUseUrls] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState("")
  const [mode, setMode] = useState<"simple" | "custom">("custom")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [dropZoneHover, setDropZoneHover] = useState<1 | 2 | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [showInfographic, setShowInfographic] = useState(true)

  const infographicData = useMemo<BrandedOverlayData>(
    () => ({
      projectName: "Institutional Portfolio",
      area: "Prime District 1, Dubai",
      price: "AED 1.2M+",
      yield: "8.2% Net",
      score: 88,
    }),
    [],
  )

  const [leftWidth, setLeftWidth] = useState(54)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null!)
  const initialLoadRef = useRef(false)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    isConvertingHeic,
    heicProgress,
    handleImageUpload,
    handleUrlChange,
    clearImage,
    showToast: uploadShowToast,
  } = useImageUpload()

  const { aspectRatio, setAspectRatio, availableAspectRatios, detectAspectRatio } = useAspectRatio()

  const {
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    clearHistory,
    deleteGeneration,
    isLoading: historyLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  } = usePersistentHistory(showToast)

  const {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage: runGeneration,
    cancelGeneration,
    loadGeneratedAsInput,
  } = useImageGeneration({
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    onToast: showToast,
    onImageUpload: handleImageUpload,
    onApiKeyMissing: () => setApiKeyMissing(true),
  })

  const selectedGeneration = persistedGenerations.find((g) => g.id === selectedGenerationId) || persistedGenerations[0]
  const isLoading = persistedGenerations.some((g) => g.status === "loading")
  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
      : null

  const hasImages = useUrls ? image1Url || image2Url : image1 || image2
  const currentMode = hasImages ? "image-editing" : "text-to-image"
  const canGenerate = prompt.trim().length > 0 && (currentMode === "text-to-image" || (useUrls ? image1Url : image1))

  useEffect(() => {
    if (selectedGeneration?.status === "complete" && selectedGeneration?.imageUrl) {
      setImageLoaded(false)
    }
  }, [selectedGenerationId, selectedGeneration?.imageUrl, setImageLoaded])

  useEffect(() => {
    uploadShowToast.current = showToast
  }, [uploadShowToast])

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/seq/check-api-key")
        const data = await response.json()
        if (!data.configured) {
          setApiKeyMissing(true)
        }
      } catch (error) {
        console.error("Error checking API key:", error)
      }
    }
    checkApiKey()
  }, [])

  useEffect(() => {
    if (initialLoadRef.current || !searchParams) return
    const promptParam = searchParams.get("prompt")
    const mediaParam = searchParams.get("media")

    if (promptParam) {
      setPrompt(promptParam)
    }

    if (mediaParam) {
      setUseUrls(true)
      handleUrlChange(mediaParam, 1)
    }

    if (promptParam || mediaParam) {
      initialLoadRef.current = true
    }
  }, [searchParams, handleUrlChange])

  const openFullscreen = useCallback(() => {
    if (generatedImage?.url) {
      setFullscreenImageUrl(generatedImage.url)
      setShowFullscreen(true)
      document.body.style.overflow = "hidden"
    }
  }, [generatedImage?.url])

  const openImageFullscreen = useCallback((imageUrl: string) => {
    setFullscreenImageUrl(imageUrl)
    setShowFullscreen(true)
    document.body.style.overflow = "hidden"
  }, [])

  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false)
    setFullscreenImageUrl("")
    document.body.style.overflow = "unset"
  }, [])

  const getImageBlob = useCallback(async (imageUrl: string): Promise<Blob> => {
    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",")
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png"
      const bstr = atob(parts[1])
      const n = bstr.length
      const u8arr = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i)
      }
      return new Blob([u8arr], { type: mime })
    }

    const response = await fetch(imageUrl)
    return response.blob()
  }, [])

  const renderBrandedImage = useCallback(async (imageUrl: string, data: BrandedOverlayData): Promise<Blob> => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("Failed to load image"))
      image.src = imageUrl
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get canvas context")
    }

    ctx.drawImage(img, 0, 0, width, height)

    const scale = Math.min(width, height) / 900
    const pad = Math.max(24, 40 * scale)
    const radius = Math.max(14, 22 * scale)

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      const corner = Math.min(r, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + corner, y)
      ctx.arcTo(x + w, y, x + w, y + h, corner)
      ctx.arcTo(x + w, y + h, x, y + h, corner)
      ctx.arcTo(x, y + h, x, y, corner)
      ctx.arcTo(x, y, x + w, y, corner)
      ctx.closePath()
    }

    const truncateText = (text: string, maxWidth: number) => {
      if (ctx.measureText(text).width <= maxWidth) return text
      let truncated = text
      while (truncated.length > 0 && ctx.measureText(`${truncated}...`).width > maxWidth) {
        truncated = truncated.slice(0, -1)
      }
      return `${truncated}...`
    }

    const bottomGradient = ctx.createLinearGradient(0, height * 0.5, 0, height)
    bottomGradient.addColorStop(0, "rgba(2, 6, 23, 0)")
    bottomGradient.addColorStop(1, "rgba(2, 6, 23, 0.65)")
    ctx.fillStyle = bottomGradient
    ctx.fillRect(0, height * 0.5, width, height * 0.5)

    const badgeWidth = Math.min(width * 0.48, 420 * scale)
    const badgeHeight = Math.max(52, 66 * scale)
    drawRoundedRect(pad, pad, badgeWidth, badgeHeight, radius)
    ctx.fillStyle = "rgba(2, 6, 23, 0.78)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 2
    ctx.stroke()

    const badgeIconSize = Math.max(26, 32 * scale)
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
    ctx.beginPath()
    ctx.arc(pad + badgeIconSize / 2 + 16 * scale, pad + badgeHeight / 2, badgeIconSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"
    ctx.stroke()

    ctx.fillStyle = "rgba(148, 163, 184, 0.9)"
    ctx.font = `600 ${Math.max(10, 12 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText("ENTRESTATE OS VERIFIED", pad + badgeIconSize + 28 * scale, pad + badgeHeight / 2 - 6 * scale)
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.font = `700 ${Math.max(16, 18 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText("Institutional Asset", pad + badgeIconSize + 28 * scale, pad + badgeHeight / 2 + 16 * scale)

    if (data.score) {
      const scoreRadius = Math.max(28, 34 * scale)
      const scoreX = width - pad - scoreRadius
      const scoreY = pad + scoreRadius
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)"
      ctx.beginPath()
      ctx.arc(scoreX, scoreY, scoreRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "rgba(16, 185, 129, 0.45)"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = "rgba(16, 185, 129, 0.9)"
      ctx.font = `700 ${Math.max(9, 11 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("SCORE", scoreX, scoreY - 6 * scale)
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
      ctx.font = `800 ${Math.max(18, 24 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
      ctx.fillText(String(data.score), scoreX, scoreY + 18 * scale)
      ctx.textAlign = "left"
    }

    const cardWidth = Math.min(width * 0.72, 640 * scale)
    const cardHeight = Math.max(160, 200 * scale)
    const cardX = pad
    const cardY = height - pad - cardHeight - 28 * scale

    drawRoundedRect(cardX, cardY, cardWidth, cardHeight, radius * 1.2)
    ctx.fillStyle = "rgba(2, 6, 23, 0.84)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
    ctx.stroke()

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.font = `800 ${Math.max(22, 32 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    const projectName = truncateText(data.projectName || "Dubai Waterfront Portfolio", cardWidth - 80 * scale)
    ctx.fillText(projectName, cardX + 28 * scale, cardY + 44 * scale)

    ctx.fillStyle = "rgba(148, 163, 184, 0.9)"
    ctx.font = `600 ${Math.max(12, 16 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    const area = truncateText(data.area || "Prime District 1", cardWidth - 80 * scale)
    ctx.fillText(area, cardX + 28 * scale, cardY + 72 * scale)

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cardX + 28 * scale, cardY + 96 * scale)
    ctx.lineTo(cardX + cardWidth - 28 * scale, cardY + 96 * scale)
    ctx.stroke()

    ctx.fillStyle = "rgba(245, 158, 11, 0.9)"
    ctx.font = `700 ${Math.max(10, 12 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText("ENTRY PRICE", cardX + 28 * scale, cardY + 122 * scale)

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.font = `800 ${Math.max(16, 22 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText(data.price || "AED 1.2M", cardX + 28 * scale, cardY + 150 * scale)

    const rightColumnX = cardX + cardWidth / 2 + 16 * scale
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)"
    ctx.font = `700 ${Math.max(10, 12 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText("TARGET YIELD", rightColumnX, cardY + 122 * scale)

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.font = `800 ${Math.max(16, 22 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText(data.yield || "8.2% Net", rightColumnX, cardY + 150 * scale)

    ctx.fillStyle = "rgba(148, 163, 184, 0.65)"
    ctx.font = `600 ${Math.max(9, 11 * scale)}px "Space Grotesk", "IBM Plex Sans", sans-serif`
    ctx.fillText("DLD L1 CANONICAL DATA", cardX + 10 * scale, height - pad / 2)
    const footerRight = "GENERATED VIA ENTRESTATE OS"
    const footerWidth = ctx.measureText(footerRight).width
    ctx.fillText(footerRight, width - pad - footerWidth, height - pad / 2)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to export branded image"))
      }, "image/png")
    })
  }, [])

  const getExportBlob = useCallback(async () => {
    if (!generatedImage) return null
    if (!showInfographic) {
      return getImageBlob(generatedImage.url)
    }
    try {
      return await renderBrandedImage(generatedImage.url, infographicData)
    } catch (error) {
      console.error("Failed to render branded export:", error)
      return getImageBlob(generatedImage.url)
    }
  }, [generatedImage, showInfographic, getImageBlob, renderBrandedImage, infographicData])

  const downloadImage = useCallback(async () => {
    if (!generatedImage) return
    try {
      const blob = await getExportBlob()
      if (!blob) return
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = showInfographic ? "entrestate-infographic.png" : `nano-banana-pro-${currentMode}-result.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
      window.open(generatedImage.url, "_blank")
    }
  }, [generatedImage, currentMode, getExportBlob, showInfographic])

  const openImageInNewTab = useCallback(async () => {
    if (!generatedImage?.url) return
    try {
      const blob = await getExportBlob()
      if (!blob) return
      const blobUrl = URL.createObjectURL(blob)
      const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer")
      if (newWindow) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
      }
    } catch (error) {
      console.error("Error opening image:", error)
      window.open(generatedImage.url, "_blank")
    }
  }, [generatedImage, getExportBlob])

  const copyImageToClipboard = useCallback(async () => {
    if (!generatedImage) return
    try {
      setToast({ message: showInfographic ? "Copying infographic..." : "Copying image...", type: "success" })
      window.focus()

      const pngBlob = await getExportBlob()
      if (!pngBlob) return
      const clipboardItem = new ClipboardItem({ "image/png": pngBlob })
      await navigator.clipboard.write([clipboardItem])

      setToast({ message: "Image copied to clipboard!", type: "success" })
      setTimeout(() => setToast(null), 2000)
    } catch (error) {
      console.error("Error copying image:", error)
      setToast({ message: "Failed to copy image", type: "error" })
      setTimeout(() => setToast(null), 2000)
    }
  }, [generatedImage, getExportBlob, showInfographic])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        if (canGenerate) {
          runGeneration()
        }
      }
    },
    [canGenerate, runGeneration],
  )

  const handleGlobalKeyboard = useCallback(
    (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT"

      if ((e.metaKey || e.ctrlKey) && e.key === "c" && generatedImage && !e.shiftKey) {
        if (!isTyping) {
          e.preventDefault()
          copyImageToClipboard()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && generatedImage) {
        if (!isTyping) {
          e.preventDefault()
          downloadImage()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "u" && generatedImage) {
        if (!isTyping) {
          e.preventDefault()
          loadGeneratedAsInput()
        }
      }
      if (e.key === "Escape" && showFullscreen) {
        closeFullscreen()
      }
      if (showFullscreen && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !isTyping) {
        e.preventDefault()
        const completedGenerations = persistedGenerations.filter((g) => g.status === "complete" && g.imageUrl)
        if (completedGenerations.length <= 1) return

        const currentIndex = completedGenerations.findIndex((g) => g.imageUrl === fullscreenImageUrl)
        if (currentIndex === -1) return

        if (e.key === "ArrowLeft") {
          const prevIndex = currentIndex === 0 ? completedGenerations.length - 1 : currentIndex - 1
          setFullscreenImageUrl(completedGenerations[prevIndex].imageUrl!)
          setSelectedGenerationId(completedGenerations[prevIndex].id)
        } else if (e.key === "ArrowRight") {
          const nextIndex = currentIndex === completedGenerations.length - 1 ? 0 : currentIndex + 1
          setFullscreenImageUrl(completedGenerations[nextIndex].imageUrl!)
          setSelectedGenerationId(completedGenerations[nextIndex].id)
        }
      }
    },
    [
      generatedImage,
      showFullscreen,
      copyImageToClipboard,
      downloadImage,
      loadGeneratedAsInput,
      closeFullscreen,
      persistedGenerations,
      fullscreenImageUrl,
      setSelectedGenerationId,
    ],
  )

  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      const activeElement = document.activeElement
      if (activeElement?.tagName !== "TEXTAREA" && activeElement?.tagName !== "INPUT") {
        const items = e.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.type.startsWith("image/")) {
              e.preventDefault()
              const file = item.getAsFile()
              if (file) {
                setUseUrls(false)
                if (!image1) {
                  await handleImageUpload(file, 1)
                  showToast("Image pasted successfully", "success")
                } else if (!image2) {
                  await handleImageUpload(file, 2)
                  showToast("Image pasted to second slot", "success")
                } else {
                  await handleImageUpload(file, 1)
                  showToast("Image replaced first slot", "success")
                }
              }
              return
            }
          }
        }

        const pastedText = e.clipboardData?.getData("text")
        if (!pastedText) return

        const urlPattern = /https?:\/\/[^\s]+/i
        const imagePattern = /\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i

        const match = pastedText.match(urlPattern)
        if (match) {
          const url = match[0]
          if (imagePattern.test(url) || url.includes("/media/") || url.includes("/images/")) {
            e.preventDefault()
            const targetSlot = !image1Url ? 1 : !image2Url ? 2 : 1
            setUseUrls(true)
            setTimeout(() => {
              handleUrlChange(url, targetSlot)
              showToast(`Image link pasted to ${targetSlot === 1 ? "first" : "second"} slot`, "success")
            }, 150)
          }
        }
      }
    },
    [image1, image2, image1Url, image2Url, handleImageUpload, handleUrlChange],
  )

  const handlePromptPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData("text")
      const urlPattern = /https?:\/\/[^\s]+/i
      const imagePattern = /\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i

      const match = pastedText.match(urlPattern)
      if (match) {
        const url = match[0]
        if (imagePattern.test(url) || url.includes("/media/") || url.includes("/images/")) {
          e.preventDefault()
          if (!useUrls) {
            setUseUrls(true)
          }
          if (!image1Url) {
            handleUrlChange(url, 1)
            showToast("Image link loaded into first slot", "success")
          } else if (!image2Url) {
            handleUrlChange(url, 2)
            showToast("Image link loaded into second slot", "success")
          } else {
            handleUrlChange(url, 1)
            showToast("Image link replaced first slot", "success")
          }
        }
      }
    },
    [useUrls, image1Url, image2Url, handleUrlChange],
  )

  const handleGlobalDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => prev + 1)
    const items = e.dataTransfer?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
          setIsDraggingOver(true)
          break
        }
      }
    }
  }, [])

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => {
      const newCount = prev - 1
      if (newCount <= 0) {
        setIsDraggingOver(false)
        return 0
      }
      return newCount
    })
  }, [])

  const handleGlobalDrop = useCallback(
    async (e: DragEvent | React.DragEvent, slot?: 1 | 2) => {
      e.preventDefault()
      setIsDraggingOver(false)
      setDragCounter(0)
      setDropZoneHover(null)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          setUseUrls(false)
          const targetSlot = slot || 1
          await handleImageUpload(file, targetSlot)
          showToast(`Image dropped to ${targetSlot === 1 ? "first" : "second"} slot`, "success")
        }
      }
    },
    [handleImageUpload],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyboard)
    document.addEventListener("paste", handleGlobalPaste)
    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("dragleave", handleGlobalDragLeave)
    document.addEventListener("dragenter", handleGlobalDragEnter)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyboard)
      document.removeEventListener("paste", handleGlobalPaste)
      document.removeEventListener("dragover", handleGlobalDragOver)
      document.removeEventListener("dragleave", handleGlobalDragLeave)
      document.removeEventListener("dragenter", handleGlobalDragEnter)
    }
  }, [handleGlobalKeyboard, handleGlobalPaste, handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDragEnter])

  const clearAll = useCallback(() => {
    setPrompt("")
    clearImage(1)
    clearImage(2)
    setTimeout(() => {
      promptTextareaRef.current?.focus()
    }, 0)
  }, [clearImage])

  const handleFullscreenNavigate = useCallback(
    (direction: "prev" | "next") => {
      const completedGenerations = persistedGenerations.filter((g) => g.status === "complete" && g.imageUrl)
      const currentIndex = completedGenerations.findIndex((g) => g.imageUrl === fullscreenImageUrl)
      if (currentIndex === -1) return

      let newIndex: number
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? completedGenerations.length - 1 : currentIndex - 1
      } else {
        newIndex = currentIndex === completedGenerations.length - 1 ? 0 : currentIndex + 1
      }

      setFullscreenImageUrl(completedGenerations[newIndex].imageUrl!)
      setSelectedGenerationId(completedGenerations[newIndex].id)
    },
    [persistedGenerations, fullscreenImageUrl, setSelectedGenerationId],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const offsetX = e.clientX - containerRect.left
      const percentage = (offsetX / containerRect.width) * 100
      const clampedPercentage = Math.max(35, Math.min(65, percentage))
      setLeftWidth(clampedPercentage)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleDoubleClick = useCallback(() => {
    setLeftWidth(50)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617] text-slate-50 relative overflow-hidden selection:bg-blue-500/30">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      {toast && <ToastNotification message={toast.message} type={toast.type as any} />}

      {isDraggingOver && (
        <GlobalDropZone dropZoneHover={dropZoneHover} onSetDropZoneHover={setDropZoneHover} onDrop={handleGlobalDrop} />
      )}

      <div
        ref={containerRef}
        className="relative z-10 flex-1 flex overflow-hidden"
        style={{ userSelect: isResizing ? "none" : "auto" }}
      >
        <div className="flex flex-col overflow-hidden w-full bg-slate-900/40 backdrop-blur-2xl border-r border-slate-800 relative transition-colors" style={{ width: `${leftWidth}%`, minWidth: "350px" }}>
          <div className="flex-shrink-0 h-20 px-6 flex items-center justify-between border-b border-slate-800/60 relative">
            <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setMode("simple")}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "simple" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "custom" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                Custom
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfographic(!showInfographic)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                  showInfographic 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]" 
                    : "bg-slate-950/40 text-slate-500 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", showInfographic ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
                Infographic Mode
              </button>
            </div>

            {apiKeyMissing && (
              <span className="absolute -top-1 -right-1 text-[8px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-bl-lg font-bold">
                API OFFLINE
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <InputSection
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              availableAspectRatios={availableAspectRatios}
              useUrls={useUrls}
              setUseUrls={setUseUrls}
              image1Preview={image1Preview}
              image2Preview={image2Preview}
              image1Url={image1Url}
              image2Url={image2Url}
              isConvertingHeic={isConvertingHeic}
              canGenerate={canGenerate as boolean}
              hasImages={hasImages as any}
              onGenerate={runGeneration}
              onClearAll={clearAll}
              onImageUpload={handleImageUpload}
              onUrlChange={handleUrlChange}
              onClearImage={clearImage}
              onKeyDown={handleKeyDown}
              onPromptPaste={handlePromptPaste}
              onImageFullscreen={openImageFullscreen}
              promptTextareaRef={promptTextareaRef}
              isAuthenticated={true}
              remaining={100}
              decrementOptimistic={() => { }}
              usageLoading={false}
              onShowAuthModal={() => { }}
              generations={persistedGenerations}
              selectedGenerationId={selectedGenerationId}
              onSelectGeneration={setSelectedGenerationId}
              onCancelGeneration={cancelGeneration}
              onDeleteGeneration={deleteGeneration}
              historyLoading={historyLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
          
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/15 active:bg-blue-500/30 transition-colors group z-20"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-800/80 group-hover:bg-blue-500/40" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span className="h-1 w-1 rounded-full bg-slate-500" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20" style={{ minWidth: "350px" }}>
          <div className="flex-shrink-0 h-20 px-8 flex items-center justify-between border-b border-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Intelligence Output</span>
            </div>
            {persistedGenerations.length > 0 && (
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                {persistedGenerations.filter((g) => g.status === "complete").length} Renders Cached
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 p-8 flex flex-col h-full overflow-hidden">
              <OutputSection
                selectedGeneration={selectedGeneration}
                generations={persistedGenerations}
                selectedGenerationId={selectedGenerationId}
                setSelectedGenerationId={setSelectedGenerationId}
                isConvertingHeic={isConvertingHeic}
                heicProgress={heicProgress}
                imageLoaded={imageLoaded}
                setImageLoaded={setImageLoaded}
                onCancelGeneration={cancelGeneration}
                onDeleteGeneration={deleteGeneration}
                onOpenFullscreen={openFullscreen}
                onLoadAsInput={loadGeneratedAsInput}
                onCopy={copyImageToClipboard}
                onDownload={downloadImage}
                onOpenInNewTab={openImageInNewTab}
                showInfographic={showInfographic}
                infographicData={infographicData}
              />
            </div>
          </div>
          
          {/* History Panel */}
          {persistedGenerations.length > 0 && (
            <div className="border-t border-slate-800/60 w-full bg-slate-900/20 backdrop-blur-xl px-8 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Render Pipeline</h3>
              </div>
              <GenerationHistory
                generations={persistedGenerations}
                selectedId={selectedGenerationId}
                onSelect={setSelectedGenerationId}
                onDelete={deleteGeneration}
                onClear={clearHistory}
                isLoading={historyLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
                onImageFullscreen={openImageFullscreen}
                onCancel={cancelGeneration}
              />
            </div>
          )}
        </div>
      </div>

      {showFullscreen && fullscreenImageUrl && (
        <FullscreenViewer
          imageUrl={fullscreenImageUrl}
          generations={persistedGenerations}
          onClose={closeFullscreen}
          onNavigate={handleFullscreenNavigate}
        />
      )}

      {showHowItWorks && <HowItWorksModal open={showHowItWorks} onOpenChange={setShowHowItWorks} />}
    </div>
  )
}
