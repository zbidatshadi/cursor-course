"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

function NavLink({ href, children, isActive, onClick }: Readonly<{ href: string; children: React.ReactNode; isActive?: boolean; onClick?: () => void }>) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="relative block text-sm font-medium text-foreground transition-colors hover:text-[oklch(0.6_0.16_95)] group py-2 md:py-0"
    >
      {children}
      <span 
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] transition-all duration-300 ${
          isActive 
            ? 'opacity-100 scale-x-100' 
            : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
        }`}
      />
    </Link>
  )
}

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[oklch(0.75_0.15_95)]/20 bg-white/90 backdrop-blur-xl shadow-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
            <svg className="h-5 w-5 text-white transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24" aria-label="GitHub">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.6_0.16_95)] to-[oklch(0.5_0.17_95)] bg-clip-text text-transparent group-hover:from-[oklch(0.7_0.16_95)] group-hover:to-[oklch(0.6_0.16_95)] transition-all duration-300">Shadi</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#docs">Docs</NavLink>
          {session && (
            <NavLink href="/dashboard" isActive={pathname === '/dashboard'}>Dashboard</NavLink>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {status === "loading" && (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          )}
          {status !== "loading" && session && (
            <>
              {session.user?.image && (
                <div className="relative group">
                  <Image
                    src={session.user.image}
                    alt={session.user?.name || "Profile"}
                    width={32}
                    height={32}
                    className="rounded-full transition-all duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-[oklch(0.75_0.15_95)] cursor-pointer"
                    unoptimized
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="relative overflow-hidden group transition-all duration-300 hover:bg-[oklch(0.95_0.05_95)] text-foreground hover:text-foreground"
              >
                <span className="relative z-10">Sign Out</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Button>
            </>
          )}
          {status !== "loading" && !session && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="relative overflow-hidden group transition-all duration-300 hover:bg-[oklch(0.95_0.05_95)] text-foreground hover:text-foreground"
              >
                <span className="relative z-10">Sign In</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Button>
              <Button
                size="sm"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white border-0 shadow-md shadow-[oklch(0.75_0.15_95)]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[oklch(0.75_0.15_95)]/40"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-[oklch(0.95_0.05_95)] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[oklch(0.75_0.15_95)]/20 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <NavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</NavLink>
            <NavLink href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</NavLink>
            <NavLink href="#docs" onClick={() => setMobileMenuOpen(false)}>Docs</NavLink>
            {session && (
              <NavLink href="/dashboard" isActive={pathname === '/dashboard'} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
            )}
            
            <div className="pt-4 border-t border-[oklch(0.75_0.15_95)]/20 space-y-3">
              {status !== "loading" && session ? (
                <>
                  {session.user?.image && (
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "Profile"}
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized
                      />
                      <span className="text-sm font-medium text-foreground truncate">{session.user?.name}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: "/" })
                    }}
                    className="w-full justify-start relative overflow-hidden group transition-all duration-300 hover:bg-[oklch(0.95_0.05_95)] text-foreground"
                  >
                    <span className="relative z-10">Sign Out</span>
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signIn("google", { callbackUrl: "/" })
                    }}
                    className="w-full justify-start relative overflow-hidden group transition-all duration-300 hover:bg-[oklch(0.95_0.05_95)] text-foreground"
                  >
                    <span className="relative z-10">Sign In</span>
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signIn("google", { callbackUrl: "/" })
                    }}
                    className="w-full bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white border-0 shadow-md shadow-[oklch(0.75_0.15_95)]/30 transition-all duration-300"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
