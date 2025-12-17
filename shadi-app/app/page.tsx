"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Redirect to dashboard if user is signed in
  useEffect(() => {
    if (status === "authenticated" && session && !error) {
      router.push("/dashboard");
    }
  }, [status, session, router, error]);

  const handleManageApiKeys = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      setShowSignInPrompt(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 via-purple-50 via-pink-50 to-rose-100 font-sans dark:from-indigo-950 dark:via-purple-900 dark:to-pink-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      <main className="relative z-10 flex min-h-screen w-full max-w-6xl flex-col items-center justify-between py-32 px-16 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 dark:bg-slate-800/90 dark:border-slate-700/50 sm:items-start">
        {/* Header with Logo and Sign In Link */}
        <div className="flex items-center justify-between w-full mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          {!session && (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="relative px-4 py-2 text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300 font-semibold transition-all duration-300 ease-in-out hover:scale-110 animate-fade-in-right group bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-700/50 hover:border-purple-400 dark:hover:border-purple-500"
            >
              <span className="relative z-10">Sign in</span>
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 transition-all duration-300 ease-in-out group-hover:w-full rounded-full"></span>
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          {error && (
            <div className="w-full rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
              <p className="font-semibold">Authentication Error</p>
              <p className="text-sm mt-1">
                {error === "OAuthSignin" && "Failed to connect to Google. Please check your network/proxy settings."}
                {error === "OAuthCallback" && "Error during OAuth callback. Please try again."}
                {error === "OAuthCreateAccount" && "Could not create OAuth account. Please try again."}
                {error === "EmailCreateAccount" && "Could not create email account. Please try again."}
                {error === "Callback" && "Error in callback handler. Please try again."}
                {error === "OAuthAccountNotLinked" && "Email already associated with another account."}
                {error === "EmailSignin" && "Check your email for the sign in link."}
                {error === "CredentialsSignin" && "Invalid credentials."}
                {error === "SessionRequired" && "Please sign in to access this page."}
                {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "EmailCreateAccount", "Callback", "OAuthAccountNotLinked", "EmailSignin", "CredentialsSignin", "SessionRequired"].includes(error) && `Error: ${error}`}
              </p>
            </div>
          )}
          {showSignInPrompt && !session && (
            <div className="w-full rounded-xl bg-amber-50 border-2 border-amber-300 p-5 shadow-md dark:bg-amber-900/30 dark:border-amber-600">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200 text-base">Authentication Required</p>
                  <p className="text-sm mt-2 text-amber-800 dark:text-amber-300">
                    You need to sign in to manage your API keys. Please use the "Sign in" link in the top right to authenticate with Google.
                  </p>
                </div>
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
                  aria-label="Close warning"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent animate-fade-in">
            {session ? `Welcome, ${session.user?.name || "User"}!` : "To get started, edit the page.tsx file."}
          </h1>
          <p className="max-w-md text-lg leading-8 text-slate-700 dark:text-slate-300">
            {session ? (
              <>
                You are signed in as <strong>{session.user?.email}</strong>
              </>
            ) : (
              <>
                Looking for a starting point or more instructions? Head over to{" "}
                <a
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-300 dark:hover:to-pink-300 transition-all underline decoration-2 underline-offset-2 decoration-purple-400"
                >
                  Templates
                </a>{" "}
                or the{" "}
                <a
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-300 dark:hover:to-pink-300 transition-all underline decoration-2 underline-offset-2 decoration-purple-400"
                >
                  Learning
                </a>{" "}
                center.
              </>
            )}
          </p>
          {session?.user?.image && (
            <div className="flex items-center gap-4">
              <Image
                src={session.user.image}
                alt="Profile picture"
                width={64}
                height={64}
                className="rounded-full"
                unoptimized
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row sm:justify-center sm:items-center w-full flex-wrap">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-6 text-white font-semibold shadow-lg shadow-purple-500/50 transition-all hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105 dark:from-purple-500 dark:via-pink-500 dark:to-rose-500 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-rose-600 sm:w-[180px]"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 px-6 text-white font-semibold shadow-lg shadow-red-500/50 transition-all hover:from-red-600 hover:via-rose-600 hover:to-pink-600 hover:shadow-xl hover:shadow-red-500/60 hover:scale-105 dark:from-red-600 dark:via-rose-600 dark:to-pink-600 dark:hover:from-red-700 dark:hover:via-rose-700 dark:hover:to-pink-700 sm:w-[180px]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleManageApiKeys}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-6 text-white font-semibold shadow-lg shadow-purple-500/50 transition-all hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105 dark:from-purple-500 dark:via-pink-500 dark:to-rose-500 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-rose-600 sm:w-[180px] sm:flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Manage API Keys
              </button>
              <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-6 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 dark:from-indigo-500 dark:via-blue-500 dark:to-cyan-500 dark:hover:from-indigo-600 dark:hover:via-blue-600 dark:hover:to-cyan-600 sm:w-[180px] sm:flex-shrink-0"
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={16}
                  height={16}
                />
                Deploy Now
              </a>
              <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50 px-6 font-semibold text-purple-700 transition-all hover:border-purple-400 hover:from-purple-50 hover:to-pink-50 hover:shadow-lg hover:shadow-purple-200 hover:scale-105 dark:border-purple-600 dark:from-slate-800 dark:to-purple-900/30 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 sm:w-[180px] sm:flex-shrink-0"
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Documentation
              </a>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
