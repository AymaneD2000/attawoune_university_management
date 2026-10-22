import React, { useEffect } from 'react';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  useEffect(() => {
    document.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'fr';
  }, [isArabic]);

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isArabic ? 'fr' : 'ar')}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-green-800 ${
        compact ? 'h-11 min-w-11 px-3 text-xs' : 'min-h-11 px-4 text-sm'
      }`}
      aria-label={isArabic ? 'Passer au français' : 'التبديل إلى العربية'}
    >
      <LanguageIcon className="h-5 w-5 text-green-600" />
      <span className={compact ? 'hidden md:inline' : ''}>{isArabic ? 'FR' : 'عربي'}</span>
    </button>
  );
};

export default LanguageSwitcher;
