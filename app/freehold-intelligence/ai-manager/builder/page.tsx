'use client'

/**
 * WEB STUDIO → PAGE BUILDER — the front pages as movable blocks.
 *
 * The same drag-to-reorder grammar the landing-page editor established
 * (native HTML5 DnD on a grip handle, arrow buttons kept for touch and
 * accessibility), pointed at the public site's own pages: home, about,
 * services, contact. Real sections can be reordered and hidden — never
 * deleted, they live in the code — and generic blocks (heading, text,
 * stats, CTA, FAQ) can be inserted anywhere between them. One palette per
 * page recolors the branded surfaces.
 *
 * Draft first, publish second: nothing here touches the public site until
 * Publish, and Unpublish always returns the page to the coded design.
 * The server sanitizes every save against the registries, so the editor is
 * a convenience, not a gatekeeper.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2, GripVertical, Eye, EyeOff, Trash2, Plus, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, Globe, Rocket, Undo2, LayoutPanelTop,
} from 'lucide-react'
import { useT } from '@/lib/i18n/provider'

interface SectionDef { key: string; label: string; hint: string }
interface BlockField { key: string; label: string; kind: 'text' | 'textarea' | 'select'; options?: string[]; placeholder?: string }
interface BlockDef { label: string; hint: string; fields: BlockField[] }
interface Item { id: string; kind: 'section' | 'block'; type: string; hidden?: boolean; data?: Record<string, string> }
interface Layout { items: Item[]; palette: string; typeface: string }
interface PageState { page: string; draft: Layout; live: boolean }
interface Palette { key: string; label: string; dark: string; cream: string; accent: string; accentSoft: string }
interface Typeface { key: string; label: string; stack: string }

// Each typeface chip previews in the face it selects — the same next/font
// variables the public page uses (loaded on <body> by the shared root layout).
const TYPEFACE_PREVIEW: Record<string, string> = {
  classic: 'var(--font-serif), Georgia, serif',
  editorial: 'var(--font-lp-editorial), Georgia, serif',
  architect: 'var(--font-lp-architect), system-ui, sans-serif',
}

const PAGE_LABEL: Record<string, string> = {
  home: 'Home', about: 'About', services: 'Services', contact: 'Contact',
}
const pageHref = (p: string) => (p === 'home' ? '/' : `/${p}`)

let nextId = 1

export default function PageBuilderPage() {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageState[]>([])
  const [sections, setSections] = useState<Record<string, SectionDef[]>>({})
  const [blocks, setBlocks] = useState<Record<string, BlockDef>>({})
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [typefaces, setTypefaces] = useState<Typeface[]>([])
  const [active, setActive] = useState('home')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    fetch('/api/freehold/front-layout', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setPages(Array.isArray(d?.pages) ? d.pages : [])
        setSections(d?.sections ?? {})
        setBlocks(d?.blocks ?? {})
        setPalettes(Array.isArray(d?.palettes) ? d.palettes : [])
        setTypefaces(Array.isArray(d?.typefaces) ? d.typefaces : [])
      })
      .catch(() => setError(t('paim.fpb.loadFailed')))
      .finally(() => setLoading(false))
  }, [t])

  const state = useMemo(() => pages.find((p) => p.page === active), [pages, active])
  const sectionDefs = useMemo(
    () => new Map((sections[active] ?? []).map((s) => [s.key, s])),
    [sections, active],
  )

  const mutate = useCallback((fn: (l: Layout) => Layout) => {
    setPages((prev) => prev.map((p) => (p.page === active ? { ...p, draft: fn(p.draft) } : p)))
  }, [active])

  const move = (from: number, to: number) => {
    mutate((l) => {
      if (to < 0 || to >= l.items.length) return l
      const items = [...l.items]
      const [it] = items.splice(from, 1)
      items.splice(to, 0, it)
      return { ...l, items }
    })
  }

  async function saveDraft() {
    if (!state) return
    setSaving(true); setError(''); setFlash('')
    try {
      const res = await fetch('/api/freehold/front-layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: active, layout: state.draft }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || t('paim.fpb.saveFailed')); return }
      // Take back what the server kept — the sanitizer's word is final.
      setPages((prev) => prev.map((p) => (p.page === active ? { ...p, draft: d.draft ?? p.draft } : p)))
      setFlash(t('paim.fpb.saved'))
      setTimeout(() => setFlash(''), 2500)
    } catch { setError(t('paim.fpb.saveFailed')) } finally { setSaving(false) }
  }

  async function act(action: 'publish' | 'unpublish') {
    if (!state) return
    setBusy(action); setError('')
    try {
      // Publish ships the DRAFT — save it first so what you see is what goes live.
      if (action === 'publish') {
        const save = await fetch('/api/freehold/front-layout', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: active, layout: state.draft }),
        })
        if (!save.ok) { setError(t('paim.fpb.saveFailed')); return }
      }
      const res = await fetch('/api/freehold/front-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: active, action }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || t('paim.fpb.saveFailed')); return }
      setPages((prev) => prev.map((p) => (p.page === active ? { ...p, draft: d.draft ?? p.draft, live: Boolean(d.live) } : p)))
      setFlash(action === 'publish' ? t('paim.fpb.publishedFlash') : t('paim.fpb.unpublishedFlash'))
      setTimeout(() => setFlash(''), 2500)
    } catch { setError(t('paim.fpb.saveFailed')) } finally { setBusy('') }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-white"><LayoutPanelTop className="h-5 w-5 text-gold" /> {t('paim.fpb.title')}</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">{t('paim.fpb.sub')}</p>
      </div>

      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-400/[0.06] px-4 py-2.5 text-[13px] text-rose-200">{error}</p>}

      {/* Page tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((p) => (
          <button
            key={p.page}
            type="button"
            onClick={() => { setActive(p.page); setExpanded(''); setAdding(false) }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${p.page === active ? 'bg-gold text-ink' : 'border border-line bg-surface-2 text-slate-400 hover:text-white'}`}
          >
            {PAGE_LABEL[p.page] ?? p.page}
            <span className={`ml-2 inline-block h-1.5 w-1.5 rounded-full ${p.live ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </button>
        ))}
      </div>

      {state && (
        <>
          {/* Status + actions */}
          <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-line bg-surface-2 p-4">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${state.live ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.05] text-slate-400'}`}>
              {state.live ? t('paim.fpb.live') : t('paim.fpb.builtin')}
            </span>
            <a href={pageHref(active)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-gold underline">
              <Globe className="h-3.5 w-3.5" /> {t('paim.fpb.view')}
            </a>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void saveDraft()} disabled={saving}
                className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-slate-200 transition hover:text-white disabled:opacity-50">
                {saving ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : flash || t('paim.fpb.saveDraft')}
              </button>
              <button type="button" onClick={() => void act('publish')} disabled={busy !== ''}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold-bright disabled:opacity-50">
                {busy === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                {t('paim.fpb.publish')}
              </button>
              {state.live && (
                <button type="button" onClick={() => void act('unpublish')} disabled={busy !== ''}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-white disabled:opacity-50">
                  {busy === 'unpublish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                  {t('paim.fpb.unpublish')}
                </button>
              )}
            </div>
          </div>

          {/* Palette */}
          <div className="rounded-[20px] border border-line bg-surface-2 p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{t('paim.fpb.palette')}</p>
            <div className="flex flex-wrap gap-2.5">
              {palettes.map((pal) => (
                <button
                  key={pal.key}
                  type="button"
                  onClick={() => mutate((l) => ({ ...l, palette: pal.key }))}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] transition ${state.draft.palette === pal.key ? 'border-gold/60 bg-gold/[0.08] text-white' : 'border-line bg-surface text-slate-400 hover:text-white'}`}
                >
                  <span className="flex overflow-hidden rounded-md border border-white/10">
                    <span className="h-5 w-5" style={{ backgroundColor: pal.dark }} />
                    <span className="h-5 w-5" style={{ backgroundColor: pal.accent }} />
                    <span className="h-5 w-5" style={{ backgroundColor: pal.cream }} />
                  </span>
                  {pal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Heading typeface — the twin of the palette. "Default" clears the
              override so the page keeps its shipped fonts. */}
          <div className="rounded-[20px] border border-line bg-surface-2 p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{t('paim.fpb.typeface')}</p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => mutate((l) => ({ ...l, typeface: '' }))}
                className={`rounded-xl border px-3 py-2 text-[13px] transition ${!state.draft.typeface ? 'border-gold/60 bg-gold/[0.08] text-white' : 'border-line bg-surface text-slate-400 hover:text-white'}`}
              >
                {t('paim.fpb.typefaceDefault')}
              </button>
              {typefaces.map((tf) => (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => mutate((l) => ({ ...l, typeface: tf.key }))}
                  style={{ fontFamily: TYPEFACE_PREVIEW[tf.key] }}
                  className={`rounded-xl border px-3 py-2 text-[15px] transition ${state.draft.typeface === tf.key ? 'border-gold/60 bg-gold/[0.08] text-white' : 'border-line bg-surface text-slate-300 hover:text-white'}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {state.draft.items.map((item, i) => {
              const def = item.kind === 'section' ? sectionDefs.get(item.type) : undefined
              const bdef = item.kind === 'block' ? blocks[item.type] : undefined
              const label = def?.label ?? bdef?.label ?? item.type
              const hint = def?.hint ?? bdef?.hint ?? ''
              const open = expanded === item.id && item.kind === 'block'
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) move(dragIndex, i); setDragIndex(null) }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`rounded-2xl border bg-surface-2 transition ${dragIndex === i ? 'border-gold/50 opacity-60' : 'border-line'} ${item.hidden ? 'opacity-55' : ''}`}
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-3">
                    <span className="cursor-grab text-slate-600 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-white">{label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${item.kind === 'section' ? 'bg-white/[0.05] text-slate-400' : 'bg-gold/10 text-gold'}`}>
                          {item.kind === 'section' ? t('paim.fpb.sectionTag') : t('paim.fpb.blockTag')}
                        </span>
                        {item.hidden && <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-300">{t('paim.fpb.hiddenTag')}</span>}
                      </div>
                      {hint && <p className="mt-0.5 truncate text-[11px] text-slate-500">{hint}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => move(i, i - 1)} className="rounded-md p-1.5 text-slate-500 hover:text-white" aria-label={t('paim.fpb.up')}><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => move(i, i + 1)} className="rounded-md p-1.5 text-slate-500 hover:text-white" aria-label={t('paim.fpb.down')}><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button
                        type="button"
                        onClick={() => mutate((l) => ({ ...l, items: l.items.map((it) => (it.id === item.id ? { ...it, hidden: !it.hidden } : it)) }))}
                        className="rounded-md p-1.5 text-slate-500 hover:text-white"
                        aria-label={item.hidden ? t('paim.fpb.show') : t('paim.fpb.hide')}
                      >
                        {item.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      {item.kind === 'block' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? '' : item.id)}
                            className="rounded-md p-1.5 text-slate-500 hover:text-white"
                            aria-label={t('paim.fpb.editFields')}
                          >
                            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => mutate((l) => ({ ...l, items: l.items.filter((it) => it.id !== item.id) }))}
                            className="rounded-md p-1.5 text-slate-500 hover:text-rose-300"
                            aria-label={t('paim.fpb.remove')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {open && bdef && (
                    <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2">
                      {bdef.fields.map((f) => {
                        const value = item.data?.[f.key] ?? ''
                        const set = (v: string) => mutate((l) => ({
                          ...l,
                          items: l.items.map((it) => (it.id === item.id ? { ...it, data: { ...(it.data ?? {}), [f.key]: v } } : it)),
                        }))
                        return (
                          <div key={f.key} className={f.kind === 'textarea' ? 'sm:col-span-2' : ''}>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{f.label}</label>
                            {f.kind === 'textarea' ? (
                              <textarea rows={3} value={value} onChange={(e) => set(e.target.value)} placeholder={f.placeholder}
                                className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-white outline-none placeholder:text-slate-600 focus:border-gold/40" />
                            ) : f.kind === 'select' ? (
                              <select value={value || (f.options?.[0] ?? '')} onChange={(e) => set(e.target.value)}
                                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-gold/40">
                                {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input value={value} onChange={(e) => set(e.target.value)} placeholder={f.placeholder}
                                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-gold/40" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add block */}
          <div className="rounded-[20px] border border-dashed border-line p-4">
            {adding ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(blocks).map(([type, b]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const id = `nb_${Date.now().toString(36)}_${nextId++}`
                      mutate((l) => ({ ...l, items: [...l.items, { id, kind: 'block', type, data: {} }] }))
                      setAdding(false); setExpanded(id)
                    }}
                    className="rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-left transition hover:border-gold/40"
                  >
                    <span className="block text-[13px] font-semibold text-white">{b.label}</span>
                    <span className="block text-[11px] text-slate-500">{b.hint}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setAdding(false)} className="self-center px-3 text-[12px] text-slate-500 hover:text-white">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 text-[13px] font-semibold text-gold">
                <Plus className="h-4 w-4" /> {t('paim.fpb.addBlock')}
              </button>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-slate-600">{t('paim.fpb.emptyHint')}</p>
        </>
      )}
    </div>
  )
}
