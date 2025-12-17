import { Card } from "@/components/ui/card"
import { Sparkles, FileText, GitPullRequest, Tag, TrendingUp, Bell } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Summaries",
    description:
      "Get instant, comprehensive summaries of any repository with intelligent analysis of code structure, purpose, and key features.",
  },
  {
    icon: FileText,
    title: "Cool Facts Discovery",
    description:
      "Uncover interesting statistics, contributor insights, and unique aspects of repositories that matter to you.",
  },
  {
    icon: GitPullRequest,
    title: "Important PR Tracking",
    description:
      "Never miss critical pull requests. Track breaking changes, major features, and important updates automatically.",
  },
  {
    icon: Tag,
    title: "Version Monitoring",
    description:
      "Stay up-to-date with version releases, changelog highlights, and dependency updates across all tracked repositories.",
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    description:
      "Identify trending repositories, popular features, and emerging patterns in the open source ecosystem.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Receive intelligent alerts for activities that matter to you, filtered by your preferences and priorities.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">
            Everything You Need to Stay Informed
          </h2>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Powerful features designed to help developers and teams track, analyze, and understand open source
            repositories effortlessly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
