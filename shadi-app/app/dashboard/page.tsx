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

  // Helper function to parse error response
  const parseErrorResponse = async (response: Response) => {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    return errorData;
  };

  // Helper function to build error message
  const buildErrorMessage = (errorData: any, status: number) => {
    const errorMessage = errorData.error || `Failed to fetch API keys (${status})`;
    let errorDetails = errorData.details ? ` ${errorData.details}` : '';
    const errorHint = errorData.hint ? ` Hint: ${errorData.hint}` : '';
    
    if (errorData.possibleCauses && Array.isArray(errorData.possibleCauses)) {
      errorDetails += '\n\nPossible causes:\n' + errorData.possibleCauses.join('\n');
    }
    
    if (errorData.solution) {
      errorDetails += `\n\nSolution: ${errorData.solution}`;
    }
    
    return errorMessage + errorDetails + errorHint;
  };

  // Helper function to make API request
  const makeApiRequest = async () => {
    try {
      return await fetch('/api/keys', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to the server. Please check if the development server is running.');
    }
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeApiRequest();
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        const errorMessage = buildErrorMessage(errorData, response.status);
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-zinc-50 lg:ml-0 pt-16 lg:pt-0">
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <nav className="text-xs sm:text-sm text-zinc-500 mb-2">
                <Link href="/" className="hover:text-zinc-700">Pages</Link>
                <span className="mx-2">/</span>
                <span className="text-zinc-900">Overview</span>
              </nav>
                <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900">Overview</h1>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>

        {/* Current Plan Section */}
        <div className="mb-6 sm:mb-8 rounded-xl p-6 sm:p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white relative overflow-hidden shadow-lg">
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{currentPlan.name}</h2>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm text-white/90">API Usage</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mb-2">
                <span className="text-xs sm:text-sm text-white/80">Monthly plan</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-white rounded-full h-2 sm:h-2.5 transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs sm:text-sm text-white/90">
                {currentPlan.credits}/{currentPlan.limit} Credits
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-white/90">Pay as you go</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto">
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
