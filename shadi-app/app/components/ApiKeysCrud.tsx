'use client';

import { useState, useEffect, useRef } from 'react';

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
  readonly apiKeys: ApiKey[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRefresh: () => Promise<void>;
  readonly onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ApiKeysCrud({ apiKeys, loading, error, onRefresh, onShowToast }: ApiKeysCrudProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isModalOpen && dialogRef.current) {
      // Small delay to ensure dialog is rendered before showing
      setTimeout(() => {
        if (dialogRef.current) {
          dialogRef.current.showModal();
        }
      }, 0);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      if (dialogRef.current) {
        dialogRef.current.close();
      }
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

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
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to delete API key (${response.status})`;
        throw new Error(errorMessage);
      }

      // Immediately refresh the list to update the UI
      await onRefresh();
      
      // Show deletion message (red/error style) after refresh completes
      onShowToast('API key deleted successfully', 'error');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete API key';
      console.error('Error deleting API key:', err);
      onShowToast(`Failed to delete: ${errorMessage}`, 'error');
    }
  };

  const updateApiKey = async (keyId: string) => {
    let keyToUpdate = formData.key;
    const currentPrefix = editingKey!.type === 'dev' ? 'shadi-dev-' : 'shadi-prod-';
    const newPrefix = formData.type === 'dev' ? 'shadi-dev-' : 'shadi-prod-';
    
    if (editingKey!.type !== formData.type && formData.key.startsWith(currentPrefix)) {
      keyToUpdate = formData.key.replace(currentPrefix, newPrefix);
    }
    
    const response = await fetch(`/api/keys/${keyId}`, {
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
  };

  const createApiKey = async () => {
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
        await updateApiKey(editingKey.id);
      } else {
        await createApiKey();
      }

      await onRefresh();
      const successMessage = editingKey ? 'API key updated successfully' : 'API key created successfully';
      // Close modal
      setIsModalOpen(false);
      setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
      setEditingKey(null);
      onShowToast(successMessage, 'success');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      console.error('Failed to copy to clipboard:', err);
      onShowToast(errorMessage, 'error');
    }
  };

  const generateRandomKey = () => {
    const generated = generateRandomKeyValue();
    setFormData(prev => ({ ...prev, key: generated }));
  };

  const maskKey = (key: string) => {
    const regex = /^(shadi-[a-z]+-)/;
    const prefixMatch = regex.exec(key);
    if (prefixMatch) {
      return prefixMatch[1] + '*'.repeat(32);
    }
    return 'shadi-' + '*'.repeat(32);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-2">API Keys</h3>
        <p className="text-xs sm:text-sm text-zinc-600">
          The key is used to authenticate your requests to the{' '}
          <span className="font-semibold text-zinc-900">Research API</span>. To learn more, see the{' '}
          <button type="button" onClick={() => {}} className="font-semibold text-zinc-900 hover:underline">documentation page</button>.
        </p>
      </div>
      
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={handleCreate}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg text-xs sm:text-sm font-medium w-full sm:w-auto"
        >
          + Create New Key
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 sm:py-12 text-zinc-500">
          <p className="text-sm sm:text-base">Loading API keys...</p>
        </div>
      )}
      {!loading && apiKeys.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-zinc-500">
          <p className="mb-4 text-sm sm:text-base">No API keys yet. Create your first one to get started.</p>
          <button
            onClick={handleCreate}
            className="px-4 sm:px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm sm:text-base font-medium"
          >
            Create API Key
          </button>
        </div>
      )}
      {!loading && apiKeys.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    TYPE
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
                      <span className="text-sm text-zinc-900 uppercase">{apiKey.type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-sm font-mono text-zinc-900 break-all">
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-zinc-900 mb-1">{apiKey.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-zinc-500 uppercase">Type:</span>
                      <span className="text-xs font-medium text-zinc-900 uppercase">{apiKey.type}</span>
                    </div>
                    <div className="bg-zinc-50 rounded p-2 border border-zinc-200">
                      <code className="text-xs font-mono text-zinc-900 break-all">
                        {showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200">
                  <button
                    onClick={() => toggleShowKey(apiKey.id)}
                    className="p-2 text-zinc-900 hover:text-zinc-700 transition-colors"
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
                    className="p-2 text-zinc-900 hover:text-zinc-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(apiKey)}
                    className="p-2 text-zinc-900 hover:text-zinc-700 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(apiKey.id)}
                    className="p-2 text-zinc-900 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <dialog
          ref={dialogRef}
          className="fixed top-0 left-0 right-0 bottom-0 z-[9999] w-full h-full max-w-none max-h-none p-4 border-none bg-transparent backdrop:bg-black/20 backdrop:backdrop-blur-[1px] m-0 flex items-center justify-center"
          aria-modal="true"
          aria-labelledby="modal-title"
          onCancel={(e) => {
            e.preventDefault();
            setIsModalOpen(false);
            setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
            setEditingKey(null);
          }}
        >
        {/* Modal content - centered */}
        <div 
          className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] max-h-[90vh] overflow-y-auto border-2 border-zinc-200 ring-4 ring-blue-500/20 mx-auto"
        >
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">
              {editingKey ? 'Edit API Key' : 'Create a new API key'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mb-4 sm:mb-6">
              {editingKey ? 'Update the API key details below.' : 'Enter a name and limit for the new API key.'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="key-name-input" className="block text-sm font-medium text-zinc-900 mb-2">
                  Key Name
                </label>
                <input
                  id="key-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 bg-white"
                  placeholder="Key Name"
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="key-type-select" className="block text-sm font-medium text-zinc-900 mb-2">
                  Type
                </label>
                <select
                  id="key-type-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 bg-white"
                  disabled={isSubmitting}
                >
                  <option value="dev">dev</option>
                  <option value="prod">prod</option>
                </select>
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
                        disabled={isSubmitting}
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
                          setFormData({ ...formData, limit: Number.parseInt(e.target.value, 10) || 1000 })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 bg-white"
                        placeholder="1000"
                        min="1"
                        disabled={isSubmitting}
                      />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-6">
                    If the combined usage of all your keys exceeds your plan's limit, all requests will be rejected.
                  </p>
                </>
              )}

              {editingKey && (
                <div className="mb-6">
                  <label htmlFor="api-key-edit-input" className="block text-sm font-medium text-zinc-900 mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="api-key-edit-input"
                      type="text"
                      value={formData.key}
                      onChange={(e) =>
                        setFormData({ ...formData, key: e.target.value })
                      }
                        className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-zinc-900 bg-white"
                        placeholder="Enter or generate API key"
                        required
                        disabled={isSubmitting}
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
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(false);
                    setFormData({ name: '', type: 'dev', key: '', limitMonthlyUsage: false, limit: 1000 });
                    setEditingKey(null);
                    // Ensure dialog is closed
                    if (dialogRef.current) {
                      dialogRef.current.close();
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-zinc-300 rounded-lg text-zinc-900 hover:bg-zinc-50 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(() => {
                    if (isSubmitting) return 'Saving...';
                    if (editingKey) return 'Update';
                    return 'Create';
                  })()}
                </button>
              </div>
            </form>
        </div>
      </dialog>
      )}
    </div>
  );
}

