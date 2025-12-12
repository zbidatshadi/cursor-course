'use client';

import { useState } from 'react';

interface ApiKey {
  id: string;
  name: string;
  type: string;
  key: string;
  usage: number;
  created_at: string;
  limit?: number | null;
}

interface ApiKeysCrudProps {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ApiKeysCrud({ apiKeys, loading, error, onRefresh, onShowToast }: ApiKeysCrudProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    setEditingKey(null);
    setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
    setIsModalOpen(true);
  };

  const handleEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({ 
      name: apiKey.name, 
      type: apiKey.type, 
      key: apiKey.key,
      limitMonthlyUsage: false,
      limit: apiKey.limit || 1000
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to delete API key (${response.status})`;
        throw new Error(errorMessage);
      }

      await onRefresh();
      onShowToast('API key deleted successfully', 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete API key';
      console.error('Error deleting API key:', err);
      onShowToast(`Failed to delete: ${errorMessage}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    if (!formData.name.trim()) {
      alert('Please fill in the key name');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingKey) {
        let keyToUpdate = formData.key;
        const currentPrefix = editingKey.type === 'dev' ? 'shadi-dev-' : 'shadi-prod-';
        const newPrefix = formData.type === 'dev' ? 'shadi-dev-' : 'shadi-prod-';
        
        if (editingKey.type !== formData.type && formData.key.startsWith(currentPrefix)) {
          keyToUpdate = formData.key.replace(currentPrefix, newPrefix);
        }
        
        const response = await fetch(`/api/keys/${editingKey.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            key: keyToUpdate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to update API key (${response.status})`;
          throw new Error(errorMessage);
        }
      } else {
        const generatedKey = generateRandomKeyValue();
        const response = await fetch('/api/keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            key: generatedKey,
            limit: formData.limitMonthlyUsage ? formData.limit : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to create API key (${response.status})`;
          throw new Error(errorMessage);
        }
      }

      await onRefresh();
      setIsModalOpen(false);
      setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
      setEditingKey(null);
      onShowToast(editingKey ? 'API key updated successfully' : 'API key created successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error saving API key:', err);
      onShowToast(`Failed to save: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomKeyValue = () => {
    const prefix = formData.type === 'dev' ? 'shadi-dev-' : 'shadi-prod-';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 24; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + key;
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onShowToast('API key copied to clipboard!', 'success');
    } catch (err) {
      onShowToast('Failed to copy to clipboard', 'error');
    }
  };

  const generateRandomKey = () => {
    const generated = generateRandomKeyValue();
    setFormData(prev => ({ ...prev, key: generated }));
  };

  const maskKey = (key: string) => {
    const prefixMatch = key.match(/^(shadi-[a-z]+-)/);
    if (prefixMatch) {
      return prefixMatch[1] + '*'.repeat(32);
    }
    return 'shadi-' + '*'.repeat(32);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-zinc-900 mb-2">API Keys</h3>
        <p className="text-sm text-zinc-600">
          The key is used to authenticate your requests to the{' '}
          <span className="font-semibold text-zinc-900">Research API</span>. To learn more, see the{' '}
          <a href="#" className="font-semibold text-zinc-900 hover:underline">documentation page</a>.
        </p>
      </div>
      
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm font-medium"
        >
          + Create New Key
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-500">
          <p>Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="mb-4">No API keys yet. Create your first one to get started.</p>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  NAME
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  USAGE
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  KEY
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  OPTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm text-zinc-900">{apiKey.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-zinc-900">{apiKey.usage}</span>
                  </td>
                  <td className="py-4 px-4">
                    <code className="text-sm font-mono text-zinc-900">
                      {showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-start gap-4">
                      <button
                        onClick={() => toggleShowKey(apiKey.id)}
                        className="text-zinc-900 hover:text-zinc-700 transition-colors"
                        title={showKey[apiKey.id] ? 'Hide key' : 'Show key'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          {showKey[apiKey.id] ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-zinc-900 hover:text-zinc-700 transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(apiKey)}
                        className="text-zinc-900 hover:text-zinc-700 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(apiKey.id)}
                        className="text-zinc-900 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-slide-in">
            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              {editingKey ? 'Edit API Key' : 'Create a new API key'}
            </h2>
            <p className="text-sm text-zinc-600 mb-6">
              {editingKey ? 'Update the API key details below.' : 'Enter a name and limit for the new API key.'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-900 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Key Name"
                  required
                />
              </div>

              {!editingKey && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="limitMonthlyUsage"
                        checked={formData.limitMonthlyUsage}
                        onChange={(e) =>
                          setFormData({ ...formData, limitMonthlyUsage: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="limitMonthlyUsage" className="text-sm font-medium text-zinc-900">
                        Limit monthly usage<span className="text-red-500">*</span>
                      </label>
                    </div>
                    {formData.limitMonthlyUsage && (
                      <input
                        type="number"
                        value={formData.limit}
                        onChange={(e) =>
                          setFormData({ ...formData, limit: parseInt(e.target.value) || 1000 })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000"
                        min="1"
                      />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-6">
                    If the combined usage of all your keys exceeds your plan's limit, all requests will be rejected.
                  </p>
                </>
              )}

              {editingKey && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-900 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="dev">dev</option>
                      <option value="prod">prod</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-900 mb-2">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.key}
                        onChange={(e) =>
                          setFormData({ ...formData, key: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Enter or generate API key"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomKey}
                        className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors text-sm font-medium"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
                    setEditingKey(null);
                  }}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-zinc-900 hover:bg-zinc-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingKey ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

