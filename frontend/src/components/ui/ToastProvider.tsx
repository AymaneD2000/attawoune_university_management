import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type ToastTone = 'success' | 'error' | 'info';

interface ToastNotice {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success: 'border-ui-success/30 bg-ui-surface text-ui-foreground',
  error: 'border-ui-danger/30 bg-ui-surface text-ui-foreground',
  info: 'border-ui-info/30 bg-ui-surface text-ui-foreground',
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const [notices, setNotices] = useState<ToastNotice[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const publish = useCallback(
    (tone: ToastTone, message: string) => {
      const id = Date.now() + Math.random();
      setNotices((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => publish('success', message),
      error: (message) => publish('error', message),
      info: (message) => publish('info', message),
    }),
    [publish],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[var(--z-toast)] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {notices.map((notice) => (
          <div
            key={notice.id}
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 shadow-floating ${toneClasses[notice.tone]}`}
          >
            <span className="text-sm font-semibold">{notice.message}</span>
            <button
              type="button"
              aria-label={t('common.close', 'Fermer')}
              onClick={() => dismiss(notice.id)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-ui-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return value;
};
