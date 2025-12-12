'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ToastNotification from '../components/ToastNotification';

function ProtectedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const key = searchParams.get('key');
    
    if (!key) {
      // No key provided, redirect to playground
      router.push('/playground');
      return;
    }

    setApiKey(key);
    validateApiKey(key);
  }, [searchParams, router]);

  const validateApiKey = async (key: string) => {
    try {
      setIsValidating(true);
      
      const response = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        showToast('Valid API key', 'success');
      } else {
        setIsValid(false);
        showToast('Invalid API key', 'error');
      }
    } catch (err) {
      console.error('Error validating API key:', err);
      setIsValid(false);
      showToast('Failed to validate API key', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-zinc-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600">Validating API key...</p>
          </div>
        </div>
      </div>
    );
  }

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
                  <span className="text-zinc-900">Pages</span>
                  <span className="mx-2">/</span>
                  <span className="text-zinc-900">Protected</span>
                </nav>
                <div className="flex items-center gap-3 mt-2">
                  <h1 className="text-4xl font-bold text-zinc-900">Protected Area</h1>
                </div>
              </div>
            </div>
          </div>

          {isValid ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900">Access Granted</h3>
                    <p className="text-sm text-zinc-600">Your API key is valid and you have access to this protected area.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-6">
                <h4 className="text-sm font-medium text-zinc-900 mb-4">API Key Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">API Key</label>
                    <p className="mt-1 text-sm font-mono text-zinc-900 bg-zinc-50 p-2 rounded border border-zinc-200">
                      {apiKey}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-200">
                <button
                  onClick={() => router.push('/playground')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Validate Another Key
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900">Access Denied</h3>
                    <p className="text-sm text-zinc-600">The API key you provided is invalid.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-200">
                <button
                  onClick={() => router.push('/playground')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Protected() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-zinc-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ProtectedContent />
    </Suspense>
  );
}

