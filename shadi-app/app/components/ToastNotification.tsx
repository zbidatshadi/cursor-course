'use client';

interface ToastNotificationProps {
  readonly toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  readonly onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50" style={{ animation: 'slide-in 0.3s ease-out' }}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : toast.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}
      >
        {toast.type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {toast.type === 'error' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {toast.type === 'info' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="font-medium">{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-current opacity-70 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

