import { ArrowDown, Braces, Database, Layers3, Workflow } from "lucide-react"

type ArchitectureDiagramProps = {
  locale?: string
}

export function ArchitectureDiagram({ locale = "en" }: ArchitectureDiagramProps) {
  const isArabic = locale === "ar"
  const layers = [
    {
      icon: Layers3,
      title: isArabic ? "واجهتك الحالية" : "Your existing frontend",
      detail: isArabic ? "أنت تملك العلامة والتجربة" : "You keep the brand and experience",
      className: "border-sky-400/40 bg-sky-400/10 text-sky-100 border-dashed",
    },
    {
      icon: Braces,
      title: isArabic ? "حد الـ API" : "API boundary",
      detail: isArabic ? "/api/intel · /api/tx" : "/api/intel · /api/tx",
      className: "border-white/15 bg-white/5 text-slate-100",
    },
    {
      icon: Workflow,
      title: isArabic ? "طبقة الاستخبارات والتنفيذ" : "Intelligence + execution layer",
      detail: isArabic ? "التقييم · الأدلة · غرف الصفقات · الطوابير" : "Scoring · evidence · deal rooms · queues",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    },
    {
      icon: Database,
      title: isArabic ? "العمود العقاري الموثق" : "Verified property spine",
      detail: isArabic ? "الحقيقة المشتركة للمخزون والسعر والمصدر" : "Shared truth for inventory, price, and source lineage",
      className: "border-slate-700 bg-slate-950/70 text-white",
    },
  ]

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#071623] p-6">
      <div className="flex flex-col gap-4">
        {layers.map((layer, index) => {
          const Icon = layer.icon
          return (
            <div key={layer.title}>
              <div className={`rounded-3xl border px-4 py-4 ${layer.className}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{layer.title}</p>
                    <p className="mt-1 text-xs leading-6 opacity-80">{layer.detail}</p>
                  </div>
                  <Icon className="mt-1 h-4 w-4 shrink-0 opacity-80" />
                </div>
              </div>
              {index < layers.length - 1 ? (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-4 w-4 text-slate-500" />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <span>{isArabic ? "أنت" : "You"}</span>
        <span>{isArabic ? "Entrestate" : "Entrestate"}</span>
      </div>
    </div>
  )
}
