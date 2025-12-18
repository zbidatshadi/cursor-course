"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

function NavLink({ href, children, isActive }: Readonly<{ href: string; children: React.ReactNode; isActive?: boolean }>) {
  return (
    <Link 
      href={href} 
      className="relative text-sm font-medium text-foreground transition-colors hover:text-[oklch(0.6_0.16_95)] group"
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[oklch(0.75_0.15_95)]/20 bg-white/90 backdrop-blur-xl shadow-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
            <GithubIcon className="h-5 w-5 text-white transition-transform group-hover:rotate-12" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.6_0.16_95)] to-[oklch(0.5_0.17_95)] bg-clip-text text-transparent group-hover:from-[oklch(0.7_0.16_95)] group-hover:to-[oklch(0.6_0.16_95)] transition-all duration-300">Shadi</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#docs">Docs</NavLink>
          {session && (
            <NavLink href="/dashboard" isActive={pathname === '/dashboard'}>Dashboard</NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
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
      </nav>
    </header>
  )
}
