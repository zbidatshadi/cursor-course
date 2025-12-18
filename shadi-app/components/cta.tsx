"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"

export function CallToAction() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleStartTrial = () => {
    if (session) {
      // User is signed in, go to dashboard
      router.push("/dashboard")
    } else {
      // User is not signed in, sign in first (will redirect back to home)
      signIn("google", { callbackUrl: "/" })
    }
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-[oklch(0.98_0.02_95)] via-[oklch(0.97_0.03_95)] to-[oklch(0.99_0.01_95)]">
      <div className="container mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[oklch(0.75_0.15_95)]/30 bg-gradient-to-br from-white via-[oklch(0.99_0.01_95)] to-[oklch(0.98_0.02_95)] p-6 sm:p-8 md:p-12 text-center shadow-2xl shadow-[oklch(0.75_0.15_95)]/10">
          {/* Animated gradient orbs - hidden on mobile */}
          <div className="hidden sm:block absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[oklch(0.85_0.12_95)]/20 rounded-full blur-3xl" />
          <div className="hidden sm:block absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-[oklch(0.8_0.14_95)]/20 rounded-full blur-3xl" />
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.75_0.15_95)_0.03_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.75_0.15_95)_0.03_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] sm:bg-[size:2rem_2rem] opacity-30" />

          <div className="relative z-10">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance px-2">
              Ready to Transform Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10">GitHub Workflow?</span>
                <span className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-2 sm:h-3 bg-gradient-to-r from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] opacity-50 -z-0" />
              </span>
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto px-2">
              Join thousands of developers who trust Shadi GitHub Analyzer to keep them informed about the open source
              projects that matter most.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center w-full sm:w-auto px-2 sm:px-0">
              <Button 
                size="lg" 
                className="gap-2 w-full sm:w-auto text-sm sm:text-base bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white border-0 shadow-lg shadow-[oklch(0.75_0.15_95)]/30" 
                onClick={handleStartTrial}
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-[oklch(0.75_0.15_95)]/30 hover:bg-white hover:border-[oklch(0.75_0.15_95)] text-foreground"
                asChild
              >
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
