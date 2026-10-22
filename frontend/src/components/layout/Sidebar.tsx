import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

type NavigationIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  key: string;
  path: string;
  icon: NavigationIcon;
  roles?: string[];
}

interface NavGroup {
  key: string;
  icon: NavigationIcon;
  items: NavItem[];
  roles?: string[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: (restoreFocus?: boolean) => void;
}

type NavEntry = NavItem | NavGroup;

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['academics', 'planning', 'administration']);
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigation = useMemo<NavEntry[]>(() => [
    { key: 'dashboard', path: '/dashboard', icon: HomeIcon },
    {
      key: 'academics',
      icon: AcademicCapIcon,
      items: [
        { key: 'students', path: '/students', icon: UsersIcon, roles: ['ADMIN', 'DEAN', 'SECRETARY', 'ACCOUNTANT'] },
        { key: 'teachers', path: '/teachers', icon: UserGroupIcon, roles: ['ADMIN', 'DEAN', 'ACCOUNTANT', 'SECRETARY'] },
        { key: 'courses', path: '/academics/courses', icon: BookOpenIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
        { key: 'grades', path: '/academics/grades', icon: ClipboardDocumentCheckIcon, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'DEAN'] },
        { key: 'deliberation', path: '/academics/deliberation', icon: ScaleIcon, roles: ['ADMIN', 'DEAN'] },
      ],
    },
    {
      key: 'planning',
      icon: CalendarDaysIcon,
      roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'],
      items: [
        { key: 'scheduling', path: '/scheduling', icon: ClockIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
        { key: 'announcements', path: '/announcements', icon: MegaphoneIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
      ],
    },
    { key: 'finance', path: '/finance', icon: BanknotesIcon, roles: ['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'DEAN'] },
    {
      key: 'administration',
      icon: BuildingLibraryIcon,
      roles: ['ADMIN'],
      items: [
        { key: 'faculties', path: '/university/faculties', icon: BuildingOffice2Icon, roles: ['ADMIN'] },
        { key: 'departments', path: '/university/departments', icon: Squares2X2Icon, roles: ['ADMIN'] },
        { key: 'programs', path: '/university/programs', icon: AcademicCapIcon, roles: ['ADMIN', 'DEAN'] },
        { key: 'classrooms', path: '/university/classrooms', icon: MapPinIcon, roles: ['ADMIN', 'DEAN'] },
        { key: 'academic-years', path: '/university/academic-years', icon: CalendarDaysIcon, roles: ['ADMIN'] },
        { key: 'levels', path: '/university/levels', icon: ChartBarSquareIcon, roles: ['ADMIN'] },
        { key: 'audit-logs', path: '/admin/audit', icon: ShieldCheckIcon, roles: ['ADMIN'] },
      ],
    },
    { key: 'users', path: '/admin/users', icon: UserGroupIcon, roles: ['ADMIN'] },
  ], []);

  useEffect(() => {
    navigation.forEach((entry) => {
      if ('items' in entry && entry.items.some((item) => location.pathname.startsWith(item.path))) {
        setOpenGroups((current) => current.includes(entry.key) ? current : [...current, entry.key]);
      }
    });
    onMobileClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose(true);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen, onMobileClose]);

  useEffect(() => {
    if (mobileOpen) mobileCloseButtonRef.current?.focus({ preventScroll: true });
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sidebarRef.current) return;

      const focusable = Array.from(sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('aria-hidden') && !element.classList.contains('hidden'));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeElement || !sidebarRef.current.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', containFocus);
    return () => document.removeEventListener('keydown', containFocus);
  }, [mobileOpen]);

  const hasRole = (roles?: string[]) => !roles || (!!user && roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (groupKey: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((current) => current.includes(groupKey) ? current : [...current, groupKey]);
      return;
    }
    setOpenGroups((current) => current.includes(groupKey)
      ? current.filter((key) => key !== groupKey)
      : [...current, groupKey]);
  };

  const renderNavItem = (item: NavItem, nested = false) => {
    if (!hasRole(item.roles)) return null;

    const isActive = location.pathname === item.path
      || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    const Icon = item.icon;
    const label = t(`sidebar.${item.key}`, item.key);

    return (
      <Link
        key={item.path}
        to={item.path}
        title={collapsed ? label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative mx-2 flex min-h-11 items-center rounded-xl transition-all duration-200 ${nested && !collapsed ? 'ps-4' : ''} ${collapsed ? 'justify-center px-2' : 'px-3'} ${
          isActive
            ? 'bg-ui-surface text-ui-primary-strong shadow-md'
            : 'text-ui-on-primary/80 hover:bg-ui-on-primary/10 hover:text-ui-on-primary'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isActive ? 'bg-ui-surface-muted text-ui-primary' : 'text-ui-on-primary/75 group-hover:text-ui-on-primary'
        }`}>
          <Icon className="h-5 w-5" />
        </span>
        {!collapsed && <span className="ms-2.5 truncate text-sm font-semibold">{label}</span>}
        {isActive && !collapsed && <span className="ms-auto h-2 w-2 rounded-full bg-ui-success ring-4 ring-ui-success/15" />}

        {collapsed && (
          <span className="pointer-events-none absolute start-full top-1/2 z-[70] ms-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ui-primary-strong px-3 py-2 text-xs font-semibold text-ui-on-primary opacity-0 shadow-xl transition group-hover:opacity-100">
            {label}
          </span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    if (!hasRole(group.roles)) return null;

    const isOpen = openGroups.includes(group.key);
    const hasActiveItem = group.items.some((item) => location.pathname.startsWith(item.path));
    const Icon = group.icon;
    const label = t(`sidebar.${group.key}`, group.key);

    return (
      <div key={group.key} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          title={collapsed ? label : undefined}
          aria-label={label}
          aria-expanded={!collapsed && isOpen}
          aria-controls={`sidebar-group-${group.key}`}
          className={`mx-2 flex min-h-11 w-[calc(100%-1rem)] items-center rounded-xl px-3 text-start transition ${
            hasActiveItem ? 'text-ui-on-primary' : 'text-ui-on-primary/65 hover:bg-ui-on-primary/10 hover:text-ui-on-primary'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${hasActiveItem ? 'text-ui-warning' : ''}`} />
          {!collapsed && (
            <>
              <span className="ms-3 truncate text-xs font-bold uppercase tracking-[0.13em]">{label}</span>
              <ChevronDownIcon className={`ms-auto h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {!collapsed && isOpen && (
          <div id={`sidebar-group-${group.key}`} className="space-y-1 border-s border-ui-on-primary/10 ps-1">
            {group.items.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close_menu', 'Fermer le menu')}
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => onMobileClose(true)}
        className={`fixed inset-0 z-40 bg-ui-primary-strong/60 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside ref={sidebarRef} id="app-sidebar" aria-label={t('common.main_navigation', 'Navigation principale')} className={`app-sidebar fixed inset-y-0 start-0 z-50 flex h-screen w-[18rem] shrink-0 flex-col overflow-hidden bg-ui-primary-strong text-ui-on-primary shadow-floating transition-all duration-300 lg:sticky lg:top-0 lg:z-50 ${
        collapsed ? 'lg:w-24' : 'lg:w-[18rem]'
      } ${mobileOpen ? 'app-sidebar-open visible pointer-events-auto' : 'invisible pointer-events-none lg:visible lg:pointer-events-auto'}`}>
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-ui-warning via-ui-success to-ui-primary" />

        <div className="flex min-h-[5.25rem] items-center gap-3 border-b border-ui-on-primary/10 px-4">
          <img
            src={logo}
            alt="Université Privée Attawoune"
            className="h-12 w-12 shrink-0 rounded-2xl border-2 border-ui-on-primary/80 bg-ui-surface object-cover p-0.5 shadow-lg"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-ui-warning">Université Privée</p>
              <p className="truncate text-lg font-extrabold tracking-tight text-ui-on-primary">Attawoune</p>
            </div>
          )}

          <button
            ref={mobileCloseButtonRef}
            type="button"
            onClick={() => onMobileClose(true)}
            className="ms-auto inline-flex h-11 w-11 items-center justify-center rounded-xl text-ui-on-primary/80 hover:bg-ui-on-primary/10 hover:text-ui-on-primary lg:hidden"
            aria-label={t('common.close', 'Fermer')}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav aria-label={t('common.main_navigation', 'Navigation principale')} className="flex-1 space-y-2 overflow-y-auto px-1 py-4">
          {navigation.map((entry) => 'items' in entry ? renderNavGroup(entry) : renderNavItem(entry))}
        </nav>

        <div className="border-t border-ui-on-primary/10 p-3">
          <div className={`rounded-2xl bg-ui-on-primary/10 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ui-success text-sm font-extrabold text-ui-on-primary shadow-md ring-2 ring-ui-on-primary/15">
                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ui-on-primary">
                      {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
                    </p>
                    <p className="truncate text-xs font-medium text-ui-on-primary/65">
                      {t(`admin.users.roles.${user?.role}`, user?.role || '')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ui-on-primary/70 transition hover:bg-ui-warning/15 hover:text-ui-warning"
                    title={t('common.logout', 'Déconnexion')}
                    aria-label={t('common.logout', 'Déconnexion')}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-2 hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-ui-on-primary/65 transition hover:bg-ui-on-primary/10 hover:text-ui-on-primary lg:flex"
            aria-label={collapsed ? t('common.expand', 'Développer') : t('common.collapse', 'Réduire')}
          >
            {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4 rtl:rotate-180" /> : <ChevronDoubleLeftIcon className="h-4 w-4 rtl:rotate-180" />}
            {!collapsed && t('common.collapse', 'Réduire')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
