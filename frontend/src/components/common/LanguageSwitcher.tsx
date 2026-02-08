import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <div className="flex bg-gray-100 rounded-lg p-1 mx-2">
            <button
                onClick={() => changeLanguage('fr')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${i18n.language === 'fr'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                FR
            </button>
            <button
                onClick={() => changeLanguage('ar')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${i18n.language === 'ar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                عربي
            </button>
        </div>
    );
};

export default LanguageSwitcher;
