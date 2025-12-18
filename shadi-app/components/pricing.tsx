"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { signIn } from "next-auth/react"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for individuals exploring open source",
    features: [
      "5 repositories tracked",
      "Basic AI summaries",
      "Cool facts discovery",
      "Weekly updates",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "For developers who need more insights",
    features: [
      "50 repositories tracked",
      "Advanced AI summaries",
      "Priority PR tracking",
      "Real-time notifications",
      "Version monitoring",
      "Trend analysis",
      "Priority support",
      "Export reports",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For teams managing multiple projects",
    features: [
      "Unlimited repositories",
      "Custom AI models",
      "Advanced analytics",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Custom workflows",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-[oklch(1_0_0)] to-[oklch(0.98_0.02_95)]">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 sm:mb-12 md:mb-16 text-center px-2">
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Simple, Transparent{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Pricing</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] opacity-50 -z-0" />
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, planIndex) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border-2 p-6 sm:p-8 transition-all hover:shadow-xl ${
                plan.highlighted 
                  ? "border-[oklch(0.75_0.15_95)] bg-gradient-to-br from-white to-[oklch(0.98_0.02_95)] shadow-2xl shadow-[oklch(0.75_0.15_95)]/20 md:scale-105" 
                  : "border-[oklch(0.75_0.15_95)]/20 bg-white/80 backdrop-blur-sm hover:border-[oklch(0.75_0.15_95)]/40"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-white shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <h3 className="mb-2 text-xl sm:text-2xl font-bold text-card-foreground">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-4 sm:mb-6">
                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[oklch(0.6_0.16_95)] to-[oklch(0.5_0.17_95)] bg-clip-text text-transparent">{plan.price}</span>
                <span className="text-sm sm:text-base text-muted-foreground">/month</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-gradient-to-br from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] p-0.5">
                      <Check className="h-4 w-4 shrink-0 text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${
                  plan.highlighted 
                    ? "bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white border-0 shadow-lg shadow-[oklch(0.75_0.15_95)]/30"
                    : "bg-white border-2 border-[oklch(0.75_0.15_95)]/30 hover:border-[oklch(0.75_0.15_95)] hover:bg-[oklch(0.98_0.02_95)]"
                }`}
                variant={plan.highlighted ? "default" : "outline"}
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
