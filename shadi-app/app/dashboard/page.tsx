'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import ToastNotification from '../components/ToastNotification';
import ApiKeysCrud from '../components/ApiKeysCrud';

interface ApiKey {
  id: string;
  name: string;
  type: string;
  key: string;
  usage: number;
  created_at: string;
  limit?: number | null;
}

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [currentPlan] = useState({ name: 'Researcher', credits: 0, limit: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch API keys from Supabase
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      try {
        response = await fetch('/api/keys', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchError) {
        // Network error - fetch itself failed
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to the server. Please check if the development server is running.');
      }
      
      // Log response for debugging
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        const errorMessage = errorData.error || `Failed to fetch API keys (${response.status})`;
        let errorDetails = errorData.details ? ` ${errorData.details}` : '';
        const errorHint = errorData.hint ? ` Hint: ${errorData.hint}` : '';
        
        // Add possible causes if available
        if (errorData.possibleCauses && Array.isArray(errorData.possibleCauses)) {
          errorDetails += '\n\nPossible causes:\n' + errorData.possibleCauses.join('\n');
        }
        
        // Add solution if available
        if (errorData.solution) {
          errorDetails += `\n\nSolution: ${errorData.solution}`;
        }
        
        console.error('API Error:', errorMessage, errorDetails, errorHint);
        throw new Error(errorMessage + errorDetails + errorHint);
      }
      const data = await response.json();
      setApiKeys(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const usagePercentage = (currentPlan.credits / currentPlan.limit) * 100;

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-zinc-50">
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <nav className="text-sm text-zinc-500 mb-2">
                  <Link href="/" className="hover:text-zinc-700">Pages</Link>
                  <span className="mx-2">/</span>
                  <span className="text-zinc-900">Overview</span>
                </nav>
                <div className="flex items-center gap-3 mt-2">
                  <h1 className="text-4xl font-bold text-zinc-900">Overview</h1>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href="#" className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-100 rounded-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-100 rounded-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

        {/* Promotional Banner */}
        <div className="mb-8 rounded-xl p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 shadow-sm">
          <p className="text-sm text-zinc-700">
            Ready to learn more about our API? Join our upcoming{' '}
            <span className="font-semibold">101 virtual event</span> on December 10th.
          </p>
        </div>

        {/* Current Plan Section */}
        <div className="mb-8 rounded-xl p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white relative overflow-hidden shadow-lg">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          </div>
          <div className="relative z-10">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full text-white/90">
                CURRENT PLAN
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-6">{currentPlan.name}</h2>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-white/90">API Usage</span>
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mb-2">
                <span className="text-sm text-white/80">Monthly plan</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-white rounded-full h-2.5 transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-white/90">
                {currentPlan.credits}/{currentPlan.limit} Credits
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">Pay as you go</span>
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Manage Plan
              </button>
            </div>
          </div>
        </div>

        <ApiKeysCrud 
          apiKeys={apiKeys}
          loading={loading}
          error={error}
          onRefresh={fetchApiKeys}
          onShowToast={showToast}
        />
        </div>
      </div>
    </div>
  );
}
