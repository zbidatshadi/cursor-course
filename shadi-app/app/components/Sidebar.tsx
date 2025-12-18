'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setMobileMenuOpen(!mobileMenuOpen)
          }
        }}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6 text-zinc-900" />
        ) : (
          <Menu className="h-6 w-6 text-zinc-900" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMobileMenuOpen(false)
            }
          }}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0 z-30 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed lg:static`}>
      {/* Logo */}
      <div className="p-6 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900">Shadi App</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                pathname === '/dashboard'
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
              tabIndex={0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Overview</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors text-sm text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Research Assistant</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors text-sm text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Research Reports</span>
            </button>
          </li>
          <li>
            <Link
              href="/playground"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                pathname === '/playground' || pathname === '/protected'
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
              tabIndex={0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>API Playground</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors text-sm text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Invoices</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors text-sm text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Documentation</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
    </>
  );
}

