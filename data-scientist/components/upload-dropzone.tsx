"use client"

import React from "react"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/data-scientist/components/ui/card"
import { Button } from "@/data-scientist/components/ui/button"
import { cn } from "@/data-scientist/lib/utils"
import { saveDatasetToLocalStorage } from "@/data-scientist/lib/local-storage"

const MAX_SIZE_MB = 20
const MAX_ROWS = 50000

export function UploadDropzone() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      // Validate file
      if (!file.name.endsWith(".csv")) {
        throw new Error("Please upload a CSV file")
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`File size exceeds ${MAX_SIZE_MB}MB limit`)
      }

      // Upload file
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/data-scientist/dataset/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload file")
      }

      const data = await response.json()
      
      // Save to localStorage for persistence
      if (data.storedDataset) {
        saveDatasetToLocalStorage(data.storedDataset)
      }
      
      router.push(`/workspace/data-scientist/explore?datasetId=${data.datasetId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }, [router])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-all duration-200 bg-card/50 backdrop-blur-sm",
        isDragging && "border-primary bg-primary/10 scale-[1.02]",
        error && "border-destructive",
        !isDragging && !error && "border-border/50 hover:border-primary/30"
      )}
    >
      <CardContent className="p-0">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="flex flex-col items-center justify-center gap-4 p-12"
        >
          {isUploading ? (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-muted-foreground">Processing your file...</p>
            </>
          ) : (
            <>
              <div className={cn(
                "rounded-full p-4 transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted",
                error && "bg-destructive/10"
              )}>
                {error ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : isDragging ? (
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-medium">
                  {isDragging ? "Drop your CSV file here" : "Upload your CSV file"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex flex-col items-center gap-2">
                <label>
                  <Button variant="outline" asChild disabled={isUploading} className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 bg-transparent">
                    <span className="cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </span>
                  </Button>
                </label>

                <p className="text-xs text-muted-foreground">
                  Max {MAX_SIZE_MB}MB, up to {MAX_ROWS.toLocaleString()} rows
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
