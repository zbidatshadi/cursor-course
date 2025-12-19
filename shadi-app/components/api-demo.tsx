"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, FileText, Copy, Check } from "lucide-react"

const DEFAULT_API_KEY = "shadi-prod-nJkyh8QWEHOyEbk2Q5VNaobm"
const DEFAULT_URL = "https://cursor-course-omega-eight.vercel.app/api/github-summarizer"
const DEFAULT_GITHUB_URL = "https://github.com/langchain-ai/langgraph"

export function ApiDemo() {
  const [method, setMethod] = useState("POST")
  const [url, setUrl] = useState(DEFAULT_URL)
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [githubUrl, setGithubUrl] = useState(DEFAULT_GITHUB_URL)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ githubUrl }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(JSON.stringify(data, null, 2))
        setResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: data,
        })
      } else {
        setResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: data,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send request"
      setError(errorMessage)
      setResponse({
        status: "Error",
        statusText: errorMessage,
        body: { error: errorMessage },
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const requestBody = JSON.stringify({ githubUrl }, null, 2)
  const responseBody = response ? JSON.stringify(response.body, null, 2) : null

  return (
    <section id="api-demo" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-[oklch(0.98_0.02_95)] to-[oklch(1_0_0)]">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 sm:mb-12 md:mb-16 text-center px-2">
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Try Our{" "}
            <span className="relative inline-block">
              <span className="relative z-10">API</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-[oklch(0.85_0.12_95)] to-[oklch(0.8_0.14_95)] opacity-50 -z-0" />
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto mb-6">
            Test our GitHub summarizer API with a live example. Edit the request and see the response in real-time.
          </p>
          <Button
            variant="outline"
            className="gap-2 bg-white/80 backdrop-blur-sm border-2 border-[oklch(0.75_0.15_95)]/30 hover:border-[oklch(0.75_0.15_95)] hover:bg-white"
            asChild
          >
            <a href="#docs" target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
              View Documentation
            </a>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Section */}
          <Card className="p-4 sm:p-6 border-2 border-[oklch(0.75_0.15_95)]/20 bg-white/80 backdrop-blur-sm">
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Request</h3>
              
              {/* URL Bar */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Method & URL
                </label>
                <div className="flex gap-2">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.15_95)]"
                  >
                    <option value="POST">POST</option>
                  </select>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.15_95)]"
                  />
                </div>
              </div>

              {/* Authorization */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Authorization (x-api-key)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.15_95)]"
                  placeholder="Enter your API key"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Body (JSON)
                </label>
                <div className="mb-2">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.15_95)]"
                    placeholder="GitHub URL (e.g., https://github.com/owner/repo)"
                  />
                </div>
                <div className="relative">
                  <pre className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700 overflow-x-auto max-h-32 overflow-y-auto">
                    {requestBody}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(requestBody)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-white/80 hover:bg-white border border-zinc-200 transition-colors"
                    title="Copy request body"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={loading || !apiKey || !githubUrl}
                className="w-full gap-2 bg-gradient-to-r from-[oklch(0.75_0.15_95)] to-[oklch(0.7_0.16_95)] hover:from-[oklch(0.7_0.16_95)] hover:to-[oklch(0.65_0.17_95)] text-white border-0 shadow-lg"
              >
                <Play className="h-4 w-4" />
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </Card>

          {/* Response Section */}
          <Card className="p-4 sm:p-6 border-2 border-[oklch(0.75_0.15_95)]/20 bg-white/80 backdrop-blur-sm">
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Response</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[oklch(0.75_0.15_95)]"></div>
                </div>
              )}

              {!loading && !response && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Response will appear here after sending a request</p>
                </div>
              )}

              {!loading && response && (
                <>
                  {/* Status */}
                  <div className="mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700">Status:</span>
                      <span className={`font-semibold ${
                        response.status === 200 ? "text-green-600" : "text-red-600"
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Response Body */}
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                      Body (JSON)
                    </label>
                    <pre className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700 overflow-x-auto max-h-96 overflow-y-auto">
                      {responseBody}
                    </pre>
                    {responseBody && (
                      <button
                        onClick={() => copyToClipboard(responseBody)}
                        className="absolute top-8 right-2 p-1.5 rounded bg-white/80 hover:bg-white border border-zinc-200 transition-colors"
                        title="Copy response body"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-zinc-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

