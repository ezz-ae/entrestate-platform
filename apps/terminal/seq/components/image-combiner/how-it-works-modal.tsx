"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/seq/components/ui/dialog"

interface HowItWorksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HowItWorksModal({ open, onOpenChange }: HowItWorksModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">How it works</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-2">
          <div className="bg-accent/10 border border-accent rounded-lg p-4">
            <h3 className="text-lg font-semibold text-accent mb-2">Setup required</h3>
            <p className="leading-relaxed mb-3">
              This studio needs a secure key before it can build visuals.
            </p>
            <p className="leading-relaxed">Ask your admin to add the studio key in Settings → Keys.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">About the image engine</h3>
            <p className="leading-relaxed">
              The image engine delivers quality, speed, and creative control for both new visuals and guided edits.
              All outputs are processed through a secure gateway for reliable performance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Build from a brief</h3>
            <p className="leading-relaxed">
              Describe the visual in the brief box and click Build. The studio will create client-ready images from
              your notes in seconds.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Image editing</h3>
            <p className="leading-relaxed mb-2">
              Upload one or two images and describe the changes you want to make. The studio will edit your
              images based on your notes.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Upload images by clicking the upload areas or drag and drop</li>
              <li>Paste image links directly for quick editing</li>
              <li>Combine multiple images with studio composition</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aspect Ratios</h3>
            <p className="leading-relaxed">
              Choose from multiple aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4) to fit your needs. When uploading images,
              the app automatically detects the best aspect ratio.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Session history</h3>
            <p className="leading-relaxed mb-2">All outputs are saved locally in your browser. You can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View and switch between previous creations</li>
              <li>Delete unwanted results</li>
              <li>Load a previous image as input for further editing</li>
              <li>Download or copy images to clipboard</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Keyboard Shortcuts</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">⌘/Ctrl + Enter</kbd> -
                Build image
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">⌘/Ctrl + C</kbd> - Copy
                image to clipboard
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">⌘/Ctrl + D</kbd> - Download
                image
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">⌘/Ctrl + U</kbd> - Load
                previous image as input
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Esc</kbd> - Close
                fullscreen viewer
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
