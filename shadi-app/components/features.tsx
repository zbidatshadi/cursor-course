import { Card } from "@/components/ui/card"
import { Sparkles, FileText, GitPullRequest, Tag, TrendingUp, Bell } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Summaries",
    description:
      "Get instant, comprehensive summaries of any repository with intelligent analysis of code structure, purpose, and key features.",
    gradientColor: 'from-[oklch(0.85_0.12_95)]/20 to-[oklch(0.8_0.14_95)]/10',
    iconColor: 'text-[oklch(0.75_0.15_95)]',
  },
  {
    icon: FileText,
    title: "Cool Facts Discovery",
    description:
      "Uncover interesting statistics, contributor insights, and unique aspects of repositories that matter to you.",
    gradientColor: 'from-[oklch(0.8_0.14_95)]/20 to-[oklch(0.75_0.15_95)]/10',
    iconColor: 'text-[oklch(0.7_0.16_95)]',
  },
  {
    icon: GitPullRequest,
    title: "Important PR Tracking",
    description:
      "Never miss critical pull requests. Track breaking changes, major features, and important updates automatically.",
    gradientColor: 'from-[oklch(0.75_0.15_95)]/20 to-[oklch(0.7_0.16_95)]/10',
    iconColor: 'text-[oklch(0.65_0.17_95)]',
  },
  {
    icon: Tag,
    title: "Version Monitoring",
    description:
      "Stay up-to-date with version releases, changelog highlights, and dependency updates across all tracked repositories.",
    gradientColor: 'from-[oklch(0.85_0.12_95)]/20 to-[oklch(0.8_0.14_95)]/10',
    iconColor: 'text-[oklch(0.75_0.15_95)]',
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    description:
      "Identify trending repositories, popular features, and emerging patterns in the open source ecosystem.",
    gradientColor: 'from-[oklch(0.8_0.14_95)]/20 to-[oklch(0.75_0.15_95)]/10',
    iconColor: 'text-[oklch(0.7_0.16_95)]',
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Receive intelligent alerts for activities that matter to you, filtered by your preferences and priorities.",
    gradientColor: 'from-[oklch(0.75_0.15_95)]/20 to-[oklch(0.7_0.16_95)]/10',
    iconColor: 'text-[oklch(0.65_0.17_95)]',
  },
]

export function Features() {
  return (
    <section id="features" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-[oklch(0.98_0.02_95)] to-[oklch(1_0_0)]">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 sm:mb-12 md:mb-16 text-center px-2">
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Everything You Need to Stay{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Informed</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] opacity-50 -z-0" />
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Powerful features designed to help developers and teams track, analyze, and understand open source
            repositories effortlessly.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-2 border-[oklch(0.75_0.15_95)]/20 bg-white/80 backdrop-blur-sm p-6 transition-all hover:border-[oklch(0.75_0.15_95)]/40 hover:shadow-xl hover:shadow-[oklch(0.75_0.15_95)]/20 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradientColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradientColor} ${feature.iconColor} transition-all group-hover:scale-110 group-hover:shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
