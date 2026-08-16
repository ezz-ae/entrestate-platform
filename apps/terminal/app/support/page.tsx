import Link from "next/link"
import { Mail, PhoneCall, ArrowRight, FileText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type SupportChannel = {
  title: string
  description: string
  icon: typeof Mail
  action: string
  href?: string
}

function getSupportChannels(locale: AppLocale): SupportChannel[] {
  if (locale === "ar") {
    return [
      {
        title: "فريق العمليات",
        description: "للأسئلة اليومية حول اللوحات، البيانات، الصلاحيات، وتدفق العمل داخل المنصة.",
        icon: Mail,
        action: "support@entrestate.com",
        href: "mailto:support@entrestate.com",
      },
      {
        title: "مسار الأولوية",
        description: "للفرق النشطة والحسابات المؤسسية التي تحتاج توجيهاً سريعاً عبر فريق Entrestate.",
        icon: PhoneCall,
        action: "افتح مكتب التواصل المؤسسي",
        href: "/contact",
      },
      {
        title: "مركز الوثائق",
        description: "منهجية السوق، أدلة التشغيل، وبنية المنصة في مكان واحد.",
        icon: FileText,
        action: "تصفح الوثائق",
        href: "/docs/documentation",
      },
    ]
  }

  return [
    {
      title: "Email support",
      description: "Reach our operations team for dashboard, data, or advisor workflow questions.",
      icon: Mail,
      action: "support@entrestate.com",
      href: "mailto:support@entrestate.com",
    },
    {
      title: "Priority routing",
      description: "Enterprise accounts and active teams get routed through the contact desk for faster handling.",
      icon: PhoneCall,
      action: "Open enterprise contact desk",
      href: "/contact",
    },
    {
      title: "Documentation",
      description: "Read market methodology notes and workflow guides.",
      icon: FileText,
      action: "Browse docs",
      href: "/docs/documentation",
    },
  ]
}

export default async function SupportPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const supportChannels = getSupportChannels(locale)

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
              {isArabic ? "الدعم" : "Support"}
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {isArabic ? "كل ما تحتاجه لتتحرك داخل المنصة بثقة" : "Talk to the Entrestate team"}
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {isArabic
                ? "إذا كنت تدير فريقًا، تراجع بيانات السوق يوميًا، أو تحتاج متابعة تشغيلية سريعة، ستصل هنا إلى الشخص المناسب مباشرة."
                : "We respond with operational guidance, not generic helpdesk scripts."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {supportChannels.map((channel) => (
              <div key={channel.title} className="p-6 bg-card border border-border rounded-lg">
                <channel.icon className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground mt-4">{channel.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{channel.description}</p>
                {channel.href ? (
                  <Link
                    href={channel.href.startsWith("/") ? prefixLocalePath(channel.href, locale) : channel.href}
                    className="mt-4 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                  >
                    {channel.action}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-foreground mt-4">{channel.action}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={prefixLocalePath("/contact", locale)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {isArabic ? "افتح نموذج التواصل" : "Contact form"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={prefixLocalePath("/status", locale)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:border-accent/40 hover:text-foreground transition-colors"
            >
              {isArabic ? "تابع حالة المنصة" : "System status"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
