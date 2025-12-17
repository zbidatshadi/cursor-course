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
    <section className="py-24 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-12 text-center shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2rem_2rem]" />

          <div className="relative">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl text-balance">
              Ready to Transform Your GitHub Workflow?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Join thousands of developers who trust Shadi GitHub Analyzer to keep them informed about the open source
              projects that matter most.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                size="lg" 
                className="gap-2" 
                onClick={handleStartTrial}
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
