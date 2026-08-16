import { ArrowRight, CheckCheck, CircleDot, Link2, Lock } from "lucide-react"

type FlowStep = {
  title: string
  body: string
}

type ExecutionFlowDiagramProps = {
  locale?: string
  steps: FlowStep[]
}

const STEP_ICONS = [Link2, CircleDot, CheckCheck, Lock]

export function ExecutionFlowDiagram({ locale = "en", steps }: ExecutionFlowDiagramProps) {
  const isArabic = locale === "ar"

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? CircleDot
        return (
          <div key={step.title} className="relative rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {isArabic ? "خطوة" : "Step"} {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{step.body}</p>
            {index < steps.length - 1 ? (
              <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/10 bg-[#061019] p-2 lg:block">
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
