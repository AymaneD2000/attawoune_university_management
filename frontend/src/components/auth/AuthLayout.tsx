import React from 'react';
import {
  AcademicCapIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.jpg';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ eyebrow, title, subtitle, children, wide = false }) => {
  const { t } = useTranslation();

  const capabilities = [
    { icon: AcademicCapIcon, label: t('auth.brand.academics', 'Gestion académique') },
    { icon: CalendarDaysIcon, label: t('auth.brand.planning', 'Planning centralisé') },
    { icon: BanknotesIcon, label: t('auth.brand.finance', 'Suivi financier') },
  ];

  return (
    <div className="min-h-screen bg-brand-canvas lg:grid lg:grid-cols-[minmax(390px,46%)_1fr]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-blue-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[50px] border-orange-400/15" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-green-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-brand-radial opacity-80" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Université Privée Attawoune"
              className="h-20 w-20 rounded-3xl border-4 border-white/90 bg-white object-cover p-1 shadow-floating"
            />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-green-300">Université Privée</p>
              <p className="mt-1 text-3xl font-black tracking-tight">Attawoune</p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-50 backdrop-blur-sm">
              <ShieldCheckIcon className="h-4 w-4 text-orange-300" />
              {t('auth.brand.secure_space', 'Espace institutionnel sécurisé')}
            </span>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              {t('auth.brand.headline', "Piloter l'université avec clarté et confiance.")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-blue-100/75 xl:text-lg">
              {t('auth.brand.description', 'Une plateforme unifiée pour la scolarité, les enseignants, les programmes, les notes et les finances.')}
            </p>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {capabilities.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-green-300" />
                <p className="mt-3 text-sm font-bold leading-5 text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-blue-100/60">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400 ring-4 ring-green-400/15" />
          {t('auth.brand.motto', 'Une communauté, un avenir, une plateforme.')}
        </div>
      </aside>

      <main className="app-canvas relative flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-10 xl:px-16">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <section className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img
                src={logo}
                alt="Université Privée Attawoune"
                className="h-14 w-14 rounded-2xl border-2 border-white bg-white object-cover shadow-panel"
              />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-700">Université Privée</p>
                <p className="text-xl font-black text-blue-900">Attawoune</p>
              </div>
            </div>

            <div className="surface-panel overflow-hidden p-6 sm:p-8 xl:p-10">
              <div className="mb-8">
                <p className="brand-kicker">{eyebrow}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </section>
        </div>

        <p className="text-center text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} Université Privée Attawoune
        </p>
      </main>
    </div>
  );
};

export default AuthLayout;
