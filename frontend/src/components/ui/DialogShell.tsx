import React from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { IconButton } from './Button';

type DialogSize = 'md' | 'lg' | 'xl';

const widths: Record<DialogSize, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const enableTransitions = process.env.NODE_ENV !== 'test';

export interface DialogShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  busy?: boolean;
}

export const DialogShell: React.FC<DialogShellProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
  busy = false,
}) => {
  const { t } = useTranslation();

  if (!enableTransitions && !open) return null;

  return (
    <Dialog
      open={open}
      static={!enableTransitions}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-[70]"
    >
      <DialogBackdrop
        transition={enableTransitions}
        className="fixed inset-0 bg-ui-primary-strong/60 backdrop-blur-sm transition-opacity data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <DialogPanel
          transition={enableTransitions}
          className={`flex max-h-[calc(100dvh-1rem)] w-full ${widths[size]} flex-col overflow-hidden rounded-[var(--radius-panel)] bg-ui-surface shadow-floating transition data-[closed]:translate-y-3 data-[closed]:opacity-0 sm:max-h-[90dvh]`}
        >
          <header className="shrink-0 border-b border-ui-border bg-ui-primary-strong px-5 py-4 text-ui-on-primary sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-extrabold">{title}</DialogTitle>
                {description && (
                  <DialogDescription className="mt-1 text-sm text-ui-on-primary/80">
                    {description}
                  </DialogDescription>
                )}
              </div>
              <IconButton
                label={t('common.close')}
                variant="ghost"
                disabled={busy}
                onClick={onClose}
                className="text-ui-on-primary hover:bg-ui-on-primary/10 hover:text-ui-on-primary"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </IconButton>
            </div>
          </header>
          <div
            data-testid="dialog-scroll-body"
            className="min-h-0 flex-1 overflow-y-auto bg-ui-canvas p-4 sm:p-6"
          >
            {children}
          </div>
          {footer && (
            <footer className="shrink-0 border-t border-ui-border bg-ui-surface px-4 py-3 sm:px-6">
              {footer}
            </footer>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
