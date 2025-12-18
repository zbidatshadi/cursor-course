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
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.98_0.02_95)] via-[oklch(0.97_0.03_95)] to-[oklch(1_0_0)]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[oklch(0.85_0.12_95)]/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[oklch(0.8_0.14_95)]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.75_0.15_95)_0.03_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.75_0.15_95)_0.03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[oklch(0.75_0.15_95)]/30 bg-gradient-to-r from-[oklch(0.85_0.12_95)]/20 to-[oklch(0.8_0.14_95)]/20 px-4 py-2 text-sm font-medium text-[oklch(0.6_0.16_95)] shadow-lg">
            <Sparkles className="h-4 w-4 text-[oklch(0.75_0.15_95)]" />
            <span>AI-Powered Repository Intelligence</span>
          </div>

          <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight text-balance text-foreground md:text-7xl">
            Unlock Deep Insights from Any{" "}
            <span className="relative inline-block">
              <span className="relative z-10">GitHub Repository</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] opacity-60 -z-0" />
            </span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed md:text-xl">
            Get instant AI-powered summaries, discover cool facts, track important pull requests, and monitor version
            updates across all your favorite open source projects.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="gap-2 text-base bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white shadow-lg shadow-[oklch(0.75_0.15_95)]/30 border-0" 
              onClick={handleStartAnalyzing}
            >
              Start Analyzing Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base bg-white/80 backdrop-blur-sm border-2 border-[oklch(0.75_0.15_95)]/30 hover:bg-white hover:border-[oklch(0.75_0.15_95)] text-foreground" asChild>
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>

          <div className="mt-16 w-full max-w-5xl">
            <div className="relative rounded-2xl border-2 border-[oklch(0.75_0.15_95)]/20 bg-white/60 backdrop-blur-sm p-3 shadow-2xl shadow-[oklch(0.75_0.15_95)]/10">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-[oklch(0.96_0.02_95)] to-[oklch(0.94_0.03_95)]">
                <img src="/github-repository-analysis-dashboard-with-ai-insig.jpg" alt="Dashboard Preview" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
