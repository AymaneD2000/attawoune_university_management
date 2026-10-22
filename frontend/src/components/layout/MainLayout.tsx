import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import RouteFocusManager from './RouteFocusManager';
import Sidebar from './Sidebar';

const routeLabels: Record<string, string> = {
  dashboard: 'dashboard',
  students: 'students',
  teachers: 'teachers',
  courses: 'courses',
  grades: 'grades',
  deliberation: 'deliberation',
  scheduling: 'scheduling',
  announcements: 'announcements',
  finance: 'finance',
  faculties: 'faculties',
  departments: 'departments',
  programs: 'programs',
  classrooms: 'classrooms',
  'academic-years': 'academic-years',
  levels: 'levels',
  users: 'users',
  audit: 'audit-logs',
};

const MainLayout: React.FC = () => {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const page = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const currentSegment = segments[segments.length - 1] || 'dashboard';
    const key = routeLabels[currentSegment] || currentSegment;
    return {
      title: t(`sidebar.${key}`, key),
      section: segments.length > 1 ? t('common.workspace', 'Espace de gestion') : t('sidebar.dashboard', 'Tableau de bord'),
    };
  }, [location.pathname, t]);

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const handleMobileNavigationClose = useCallback((restoreFocus = false) => {
    setMobileNavigationOpen(false);
    if (restoreFocus) mobileMenuButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex min-h-screen bg-ui-canvas text-ui-foreground">
      <a className="skip-link" href="#main-content">
        {t('common.skip_to_content', 'Aller au contenu principal')}
      </a>
      <RouteFocusManager targetId="main-content" />

      <Sidebar
        mobileOpen={mobileNavigationOpen}
        onMobileClose={handleMobileNavigationClose}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ui-border/80 bg-ui-surface/95 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-ui-primary via-ui-success to-ui-warning" />
          <div className="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                onClick={() => setMobileNavigationOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ui-border bg-ui-surface text-ui-muted shadow-sm transition hover:border-ui-primary/35 hover:bg-ui-surface-muted hover:text-ui-primary lg:hidden"
                aria-label={t('common.open_menu', 'Ouvrir le menu')}
                aria-controls="app-sidebar"
                aria-expanded={mobileNavigationOpen}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-ui-success-strong">
                  {page.section}
                </p>
                <h1 className="truncate text-lg font-extrabold tracking-tight text-ui-foreground sm:text-xl">
                  {page.title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden min-h-11 items-center gap-2 rounded-xl border border-ui-border bg-ui-surface-muted px-3 py-2 text-sm font-semibold text-ui-muted md:flex">
                <CalendarDaysIcon className="h-4 w-4 text-ui-warning" />
                <span className="capitalize">{formattedDate}</span>
              </div>

              <LanguageSwitcher compact />

              <div className="hidden items-center gap-3 border-s border-ui-border ps-3 sm:flex">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ui-primary text-sm font-extrabold text-ui-on-primary shadow-md ring-2 ring-ui-success/20">
                  {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className="hidden min-w-0 xl:block">
                  <p className="max-w-40 truncate text-sm font-bold text-ui-foreground">
                    {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
                  </p>
                  <p className="text-xs font-semibold text-ui-muted">
                    {t(`admin.users.roles.${user?.role}`, user?.role || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="app-main app-canvas min-w-0 flex-1">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
