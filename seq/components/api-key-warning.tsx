import { AlertCircle } from "lucide-react"

export function ApiKeyWarning() {
  return (
    <div className="fixed bottom-6 right-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4 shadow-2xl max-w-sm z-50 backdrop-blur-sm">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold text-sm mb-1">Studio key required</h3>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            This studio needs a secure key before it can build visuals. Add the key in Settings → Keys or ask your
            admin to enable it.
          </p>
        </div>
      </div>
    </div>
  )
}
