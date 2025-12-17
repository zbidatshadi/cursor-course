"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <GithubIcon className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold text-foreground">Shadi</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="#docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Docs
          </Link>
          {session && (
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <>
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || "Profile"}
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => signIn("google", { callbackUrl: "/" })}
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
