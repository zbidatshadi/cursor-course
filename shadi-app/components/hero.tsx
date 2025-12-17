"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"

export function Hero() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleStartAnalyzing = () => {
    if (session) {
      // User is signed in, go to dashboard
      router.push("/dashboard")
    } else {
      // User is not signed in, sign in first (will redirect back to home)
      signIn("google", { callbackUrl: "/" })
    }
  }

  return (
    <section className="relative pt-32 pb-20 px-4">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm text-accent">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Repository Intelligence</span>
          </div>

          <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight text-balance text-foreground md:text-7xl">
            Unlock Deep Insights from Any GitHub Repository
          </h1>

          <p className="mb-10 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed md:text-xl">
            Get instant AI-powered summaries, discover cool facts, track important pull requests, and monitor version
            updates across all your favorite open source projects.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="gap-2 text-base" 
              onClick={handleStartAnalyzing}
            >
              Start Analyzing Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base bg-transparent" asChild>
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>

          <div className="mt-16 w-full max-w-5xl">
            <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-secondary">
                <img src="/github-repository-analysis-dashboard-with-ai-insig.jpg" alt="Dashboard Preview" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
