import React from 'react';
import { EmptyState as FeedbackEmptyState, PageSkeleton } from '../ui/Feedback';
import { Pagination } from '../ui/Pagination';

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'slate' | 'earth';

const toneClasses: Record<Tone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  green: 'border-green-200 bg-green-50 text-green-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  red: 'border-red-200 bg-red-50 text-red-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  earth: 'border-orange-200 bg-orange-50 text-brand-earth',
};

const avatarClasses: Record<'blue' | 'green' | 'orange', string> = {
  blue: 'from-blue-700 to-blue-500 ring-blue-100',
  green: 'from-green-700 to-green-500 ring-green-100',
  orange: 'from-orange-700 to-orange-500 ring-orange-100',
};

const actionClasses: Record<Tone, string> = {
  blue: 'text-blue-700 hover:bg-blue-50 hover:ring-blue-100',
  green: 'text-green-700 hover:bg-green-50 hover:ring-green-100',
  orange: 'text-orange-700 hover:bg-orange-50 hover:ring-orange-100',
  red: 'text-red-600 hover:bg-red-50 hover:ring-red-100',
  slate: 'text-slate-600 hover:bg-slate-100 hover:ring-slate-200',
  earth: 'text-brand-earth hover:bg-orange-50 hover:ring-orange-100',
};

interface EntityAvatarProps {
  name: string;
  src?: string | null;
  tone?: 'blue' | 'green' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

export const EntityAvatar: React.FC<EntityAvatarProps> = ({ name, src, tone = 'blue', size = 'md' }) => {
  const sizes = {
    sm: 'h-10 w-10 rounded-xl text-sm',
    md: 'h-12 w-12 rounded-2xl text-base',
    lg: 'h-16 w-16 rounded-2xl text-xl',
  };

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br font-black text-white shadow-md ring-4 ${avatarClasses[tone]} ${sizes[size]}`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        (name.trim().charAt(0) || 'U').toUpperCase()
      )}
    </div>
  );
};

interface StatusPillProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ children, tone = 'slate', dot = false }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

interface IconActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: Tone;
}

export const IconActionButton: React.FC<IconActionButtonProps> = ({ label, tone = 'slate', children, className = '', ...props }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:ring-4 disabled:cursor-not-allowed disabled:opacity-40 ${actionClasses[tone]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface ListLoadingProps {
  cards?: boolean;
}

export const ListLoading: React.FC<ListLoadingProps> = ({ cards = false }) => (
  <PageSkeleton rows={cards ? 6 : 5} />
);

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <FeedbackEmptyState title={title} description={description} action={action} />
);

interface PaginationBarProps {
  currentPage: number;
  currentCount: number;
  total: number;
  pageSize?: number;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  currentCount,
  total,
  pageSize = 20,
  onPrevious,
  onNext,
  nextDisabled,
}) => {
  return (
    <Pagination
      page={currentPage}
      pageSize={pageSize}
      currentCount={currentCount}
      total={total}
      onPrevious={onPrevious}
      onNext={onNext}
      nextDisabled={nextDisabled}
    />
  );
};
