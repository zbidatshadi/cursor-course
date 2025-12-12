'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Playground() {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Navigate to protected page with API key as query parameter
      router.push(`/protected?key=${encodeURIComponent(apiKey)}`);
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-zinc-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <nav className="text-sm text-zinc-500 mb-2">
                  <span className="text-zinc-900">Pages</span>
                  <span className="mx-2">/</span>
                  <span className="text-zinc-900">API Playground</span>
                </nav>
                <div className="flex items-center gap-3 mt-2">
                  <h1 className="text-4xl font-bold text-zinc-900">API Playground</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Validate API Key</h3>
              <p className="text-sm text-zinc-600">
                Enter your API key below to validate it and access the protected area.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-900 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Enter your API key (e.g., shadi-dev-...)"
                  required
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Your API key will be validated when you submit the form.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

