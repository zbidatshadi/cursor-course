import Link from "next/link"
import { GithubIcon, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t-2 border-[oklch(0.75_0.15_95)]/20 bg-gradient-to-b from-[oklch(0.99_0.01_95)] to-white py-8 sm:py-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)]">
                <GithubIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-[oklch(0.6_0.16_95)] to-[oklch(0.5_0.17_95)] bg-clip-text text-transparent">Shadi</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              AI-powered GitHub repository insights for developers and teams.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  API
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t-2 border-[oklch(0.75_0.15_95)]/20 pt-6 sm:pt-8 md:flex-row">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">© 2025 Shadi. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-[oklch(0.75_0.15_95)] transition-colors" aria-label="Twitter">
              <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-[oklch(0.75_0.15_95)] transition-colors" aria-label="GitHub">
              <GithubIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-[oklch(0.75_0.15_95)] transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
