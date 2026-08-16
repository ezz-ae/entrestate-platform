import { Check, Shield, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function TierSettingsPage() {
  const tiers = [
    {
      name: "Solo Analyst",
      price: "$299",
      description: "For individual researchers and independent consultants.",
      features: ["L1 Data Access", "Unlimited Market Search", "Standard TableSpec Export", "Email Support"],
      current: true,
      icon: Zap,
    },
    {
      name: "Realtor Pro",
      price: "$499",
      description: "For high-performing agents and boutique agencies.",
      features: [
        "Everything in Solo",
        "Infographic Render Mode",
        "Multi-Branded Artifacts",
        "Priority Reasoning Support",
      ],
      current: false,
      icon: Shield,
    },
    {
      name: "Entrestate OS",
      price: "$2,500",
      description: "Institutional infrastructure for funds and developers.",
      features: [
        "Everything in Pro",
        "Full API Substrate",
        "Automation Studio (Scheduled)",
        "White-label Branding",
        "Dedicated Success Manager",
      ],
      current: false,
      icon: Crown,
      enterprise: true,
    },
  ]

  return (
    <div className="container max-w-6xl py-12 px-6">
      <div className="flex flex-col gap-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50">Subscription & Infrastructure</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Manage your intelligence tier and institutional access level.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`relative overflow-hidden bg-slate-900/40 border-slate-800 backdrop-blur-xl ${
              tier.enterprise ? 'border-blue-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]' : ''
            }`}
          >
            {tier.current && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl border-l border-b border-emerald-500/20">
                Active Plan
              </div>
            )}
            
            <CardHeader className="pb-8">
              <div className="h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700">
                <tier.icon className={`h-6 w-6 ${tier.enterprise ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-100">{tier.name}</CardTitle>
              <CardDescription className="text-slate-400 mt-2 min-h-[40px] leading-relaxed">
                {tier.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-50">{tier.price}</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 group">
                    <div className="mt-1 h-4 w-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Check className="h-2.5 w-2.5 text-blue-400" />
                    </div>
                    <span className="text-sm text-slate-300 transition-colors group-hover:text-slate-100 leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pt-8">
              <Button 
                variant={tier.current ? "secondary" : "default"} 
                className={`w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                  tier.current 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                }`}
              >
                {tier.current ? "Current Settings" : tier.enterprise ? "Contact Sales" : "Upgrade Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-3xl bg-slate-900/20 border border-slate-800/60 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-100 italic">Custom Enterprise Substrate</h3>
            <p className="text-slate-400 max-w-xl leading-relaxed">
              Need a private instance with custom model fine-tuning and on-premise data residency? 
              Our infrastructure team can provision a dedicated Entrestate Cluster for your fund.
            </p>
          </div>
          <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            Request Architect Call
          </Button>
        </div>
      </div>
    </div>
  )
}
