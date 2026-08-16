"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export function NewListingForm() {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", developer: "", area: "", bedrooms: "", priceAed: "", yieldPct: "", description: "" })

  function update<K extends keyof typeof form>(k: K, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        developer: form.developer.trim() || null,
        area: form.area.trim() || null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        priceAed: form.priceAed ? Number(form.priceAed.replace(/[^0-9.]/g, "")) : null,
        yieldPct: form.yieldPct ? Number(form.yieldPct) : null,
        description: form.description.trim() || null,
        source: "manual",
      }
      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Failed to create listing"); return }
      router.push(prefixLocalePath(`/me/listings/${json.listing.id}`, locale))
    } catch (err: any) {
      setError(err?.message ?? "Failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Listing name *</Label>
            <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Marina Heights — 2BR" />
          </div>
          <div>
            <Label htmlFor="developer">Developer</Label>
            <Input id="developer" value={form.developer} onChange={(e) => update("developer", e.target.value)} placeholder="Emaar" />
          </div>
          <div>
            <Label htmlFor="area">Area</Label>
            <Input id="area" value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="Dubai Marina" />
          </div>
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="priceAed">Price (AED)</Label>
            <Input id="priceAed" inputMode="numeric" value={form.priceAed} onChange={(e) => update("priceAed", e.target.value)} placeholder="2,500,000" />
          </div>
          <div>
            <Label htmlFor="yieldPct">Gross yield (%)</Label>
            <Input id="yieldPct" type="number" min="0" max="100" step="0.1" value={form.yieldPct} onChange={(e) => update("yieldPct", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-rose-600">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add listing"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push(prefixLocalePath("/me/listings", locale))}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
