import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface NavItem {
  key: string;
  path: string;
  icon: string;
  roles?: string[];
}

interface NavGroup {
  key: string;
  icon: string;
  items: NavItem[];
  roles?: string[];
}

type NavEntry = NavItem | NavGroup;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  // Default open groups (using keys now)
  const [openGroups, setOpenGroups] = useState<string[]>(['academics', 'administration', 'planning']);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigation = useMemo<NavEntry[]>(() => [
    { key: 'dashboard', path: '/dashboard', icon: '📊' },
    {
      key: 'academics',
      icon: '🎓',
      items: [
        { key: 'students', path: '/students', icon: '👨‍🎓', roles: ['ADMIN', 'DEAN', 'SECRETARY'] },
        { key: 'teachers', path: '/teachers', icon: '👨‍🏫', roles: ['ADMIN', 'DEAN'] },
        { key: 'courses', path: '/academics/courses', icon: '📚' },
        { key: 'grades', path: '/academics/grades', icon: '📝', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { key: 'deliberation', path: '/academics/deliberation', icon: '⚖️', roles: ['ADMIN', 'DEAN'] },
      ]
    },
    {
      key: 'planning',
      icon: '📅',
      items: [
        { key: 'scheduling', path: '/scheduling', icon: '🗓️' },
        { key: 'announcements', path: '/announcements', icon: '📢' },
      ]
    },
    { key: 'finance', path: '/finance', icon: '💰', roles: ['ADMIN', 'ACCOUNTANT'] },
    {
      key: 'administration',
      icon: '🏛️',
      roles: ['ADMIN'],
      items: [
        { key: 'users', path: '/admin/users', icon: '👤', roles: ['ADMIN'] },
        { key: 'faculties', path: '/university/faculties', icon: '🏢', roles: ['ADMIN'] },
        { key: 'departments', path: '/university/departments', icon: '🏬', roles: ['ADMIN'] },
        { key: 'programs', path: '/university/programs', icon: '🎓', roles: ['ADMIN', 'DEAN'] },
        { key: 'classrooms', path: '/university/classrooms', icon: '🚪', roles: ['ADMIN', 'DEAN'] },
        { key: 'academic-years', path: '/university/academic-years', icon: '📅', roles: ['ADMIN'] },
        { key: 'levels', path: '/university/levels', icon: '⭐', roles: ['ADMIN'] },
      ]
    }
  ], []);

  // Auto-open group based on current path
  useEffect(() => {
    navigation.forEach(entry => {
      if ('items' in entry) {
        const hasActiveItem = entry.items.some(item => location.pathname.startsWith(item.path));
        if (hasActiveItem && !openGroups.includes(entry.key)) {
          setOpenGroups(prev => [...prev, entry.key]);
        }
      }
    });
  }, [location.pathname, openGroups, navigation]);

  const toggleGroup = (groupKey: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups([groupKey]);
      return;
    }
    setOpenGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasRole = (roles?: string[]) => {
    if (!roles) return true;
    if (!user) return false;
    return roles.includes(user.role);
  };

  const renderNavItem = (item: NavItem) => {
    if (!hasRole(item.roles)) return null;

    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    const label = t(`sidebar.${item.key}`, item.key);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 group relative ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
      >
        <span className={`text-xl ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="ms-3 font-medium text-sm truncate">{label}</span>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full rtl:right-full rtl:left-auto top-1/2 -translate-y-1/2 ms-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
            {label}
          </div>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    if (!hasRole(group.roles)) return null;

    const isOpen = openGroups.includes(group.key);
    const hasActiveItem = group.items.some(item => location.pathname.startsWith(item.path));
    const label = t(`sidebar.${group.key}`, group.key);

    return (
      <div key={group.key} className="mb-2">
        <button
          onClick={() => toggleGroup(group.key)}
          className={`w-full flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-colors ${hasActiveItem ? 'text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? label : undefined}
        >
          <div className="flex items-center">
            <span className="text-xl">{group.icon}</span>
            {!collapsed && <span className="ms-3 font-semibold text-sm uppercase tracking-wider">{label}</span>}
          </div>
          {!collapsed && (
            <svg
              className={`w-4 h-4 transition-transform duration-200 rtl:rotate-180 ${isOpen ? 'rotate-180 rtl:rotate-0' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Dropdown Content */}
        {!collapsed && isOpen && (
          <div className="mt-1 space-y-1 ps-2">
            {group.items.map(item => renderNavItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-gray-900 text-white ${collapsed ? 'w-20' : 'w-72'} h-screen flex flex-col transition-all duration-300 shadow-xl z-50 sticky top-0`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">A</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Attawoune
            </h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          <svg className="w-5 h-5 rtl:mirror" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {navigation.map((entry) => {
          if ('items' in entry) {
            return renderNavGroup(entry as NavGroup);
          }
          return renderNavItem(entry as NavItem);
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-4 py-2 border-t border-gray-800">
        {!collapsed ? (
          <LanguageSwitcher />
        ) : (
          <div className="text-xs text-center text-gray-500">
            {/* Minimal indicator when collapsed */}
            🌐
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-800 p-4 shrink-0 bg-gray-900">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shadow-lg">
            {user?.first_name?.[0]}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              title={t('common.logout', 'Déconnexion')}
            >
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
