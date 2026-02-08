import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface DashboardData {
  role?: string;
  // Admin Keys
  students_count?: number;
  teachers_count?: number;
  programs_count?: number;
  departments_count?: number;
  recent_inscriptions?: Array<{
    id: number;
    name: string;
    program: string;
    date: string;
    avatar: string; // Initials
  }>;
  recent_payments?: Array<{
    id: number;
    reference: string;
    student_name: string;
    amount: number;
    status: string; // PENDING, COMPLETED, etc.
    date: string;
    avatar: string; // Icon
  }>;
  // Teacher Keys
  courses_count?: number;
  // Student Keys
  average?: string; // GPA
  credits_validated?: number;
  credits_total?: number;
  recent_grades?: Array<{
    course: string;
    type: string;
    score: number;
    date: string;
  }>;
  // Shared Keys
  schedule?: Array<{
    id: number;
    course: string;
    location: string;
    time: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
  }>;
  // Finance stats (Admin only usually, but let's keep compatibility)
  total_tuition_collected?: number;
  current_year?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, subtitle, loading }) => (
  <div className={`relative overflow-hidden rounded-2xl shadow-lg p-6 ${gradient} text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
      <div className="w-24 h-24 rounded-full bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 left-0 -mb-6 -ml-6 opacity-10">
      <div className="w-32 h-32 rounded-full bg-white/20"></div>
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
        {subtitle && (
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
            {subtitle}
          </span>
        )}
      </div>
      <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
      ) : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}
    </div>
  </div>
);

interface RecentItemProps {
  avatar: string;
  title: string;
  subtitle: string;
  rightText: string;
  rightSubtext?: string;
  status?: 'success' | 'warning' | 'info';
}

const RecentItem: React.FC<RecentItemProps> = ({ avatar, title, subtitle, rightText, rightSubtext, status = 'info' }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-shadow">
        {avatar}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-semibold ${status === 'success' ? 'text-emerald-600' :
        status === 'warning' ? 'text-amber-600' :
          'text-gray-900'
        }`}>{rightText}</p>
      {rightSubtext && <p className="text-xs text-gray-400">{rightSubtext}</p>}
    </div>
  </div>
);

interface ScheduleItemProps {
  time: string;
  title: string;
  location: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ time, title, location, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-400 text-blue-700',
    green: 'bg-emerald-50 border-emerald-400 text-emerald-700',
    purple: 'bg-purple-50 border-purple-400 text-purple-700',
    orange: 'bg-orange-50 border-orange-400 text-orange-700',
  };

  return (
    <div className={`p-4 rounded-xl border-l-4 rtl:border-r-4 rtl:border-l-0 ${colorClasses[color]} transition-transform hover:translate-x-1 rtl:hover:-translate-x-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm opacity-80">{location}</p>
        </div>
        <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/60 shadow-sm">{time}</span>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/university/dashboard/');
      let dashboardData = res.data;

      if (user?.role === 'ADMIN' || user?.role === 'SECRETARY') {
        const financeRes = await api.get('/finance/dashboard/').catch(() => ({ data: {} }));
        dashboardData = { ...dashboardData, ...financeRes.data };
      }

      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getWelcomeMessageKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'dashboard.welcome.morning';
    if (hour < 18) return 'dashboard.welcome.afternoon';
    return 'dashboard.welcome.evening';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M FCFA`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K FCFA`;
    }
    return `${amount} FCFA`;
  };

  const renderAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('dashboard.stats.students_enrolled', 'Étudiants inscrits')}
          value={data.students_count || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          subtitle={t('students.filters.active', 'Actifs')}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.teachers', 'Enseignants')}
          value={data.teachers_count || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.programs', 'Filières / Programmes')}
          value={data.programs_count || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          subtitle={`${data.departments_count || 0} ${t('sidebar.departments', 'départements')}`}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.revenue', 'Revenus collectés')}
          value={formatCurrency(data.total_tuition_collected || 0)}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle={data.current_year}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('dashboard.sections.recent_inscriptions', 'Inscriptions récentes')}</h3>
          </div>
          <div className="space-y-3">
            {data.recent_inscriptions?.length ? data.recent_inscriptions.map(student => (
              <RecentItem
                key={student.id}
                avatar={student.avatar}
                title={student.name}
                subtitle={student.program}
                rightText={new Date(student.date).toLocaleDateString(i18n.language)}
                status="info"
              />
            )) : <p className="text-gray-500 text-center py-4">{t('dashboard.sections.no_inscriptions', 'Aucune inscription récente')}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('dashboard.sections.recent_payments', 'Paiements récents')}</h3>
          </div>
          <div className="space-y-3">
            {data.recent_payments?.length ? data.recent_payments.map(payment => (
              <RecentItem
                key={payment.id}
                avatar={payment.avatar}
                title={`#${payment.reference.split('-').pop()}`}
                subtitle={payment.student_name}
                rightText={`${payment.amount.toLocaleString()} FCFA`}
                rightSubtext={payment.status}
                status={payment.status === 'COMPLETED' ? 'success' : 'warning'}
              />
            )) : <p className="text-gray-500 text-center py-4">{t('dashboard.sections.no_payments', 'Aucun paiement récent')}</p>}
          </div>
        </div>
      </div>
    </>
  );

  const renderTeacherDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('dashboard.stats.my_courses', 'Mes cours')}
          value={data.courses_count || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          loading={loading}
        />
        <StatCard
          title={t('students.title', 'Étudiants')}
          value={data.students_count || "-"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.pending_grades', 'Notes en attente')}
          value={"-"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          gradient="bg-gradient-to-br from-orange-500 to-red-600"
          subtitle="À corriger"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">{t('dashboard.sections.todays_schedule', "Emploi du temps d'aujourd'hui")}</h3>
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="space-y-4">
          {data.schedule?.length ? data.schedule.map(item => (
            <ScheduleItem
              key={item.id}
              time={item.time}
              title={item.course}
              location={item.location}
              color={item.color as any}
            />
          )) : <p className="text-gray-500 text-center py-4">{t('dashboard.sections.no_schedule', "Aucun cours aujourd'hui")}</p>}
        </div>
      </div>
    </>
  );

  const renderStudentDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('dashboard.stats.gpa', 'Moyenne générale')}
          value={data.average || "N/A"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-700"
          subtitle={t('dashboard.sections.recent_grades', 'Semestre actuel')}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.courses_enrolled', 'Cours inscrits')}
          value={data.courses_count || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          loading={loading}
        />
        <StatCard
          title={t('dashboard.stats.credits_validated', 'Crédits validés')}
          value={`${data.credits_validated || 0}/${data.credits_total || 60}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          subtitle={`${data.credits_total ? Math.round(((data.credits_validated || 0) / data.credits_total) * 100) : 0}% complété`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('dashboard.sections.todays_schedule', "Emploi du temps d'aujourd'hui")}</h3>
          </div>
          <div className="space-y-4">
            {data.schedule?.length ? data.schedule.map(item => (
              <ScheduleItem
                key={item.id}
                time={item.time}
                title={item.course}
                location={item.location}
                color={item.color as any}
              />
            )) : <p className="text-gray-500 text-center py-4">{t('dashboard.sections.no_schedule', "Aucun cours aujourd'hui")}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('dashboard.sections.recent_grades', 'Dernières notes')}</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {t('dashboard.sections.view_all', 'Voir tout')} →
            </button>
          </div>
          <div className="space-y-3">
            {data.recent_grades?.length ? data.recent_grades.map((grade, idx) => (
              <RecentItem
                key={idx}
                avatar="📊"
                title={grade.course}
                subtitle={grade.type}
                rightText={`${grade.score}/20`}
                status={grade.score >= 10 ? 'success' : 'warning'}
              />
            )) : <p className="text-gray-500 text-center py-4">{t('dashboard.sections.no_grades', 'Aucune note récente')}</p>}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold rtl:text-right">
                {t(getWelcomeMessageKey())}, {user?.first_name}!
              </h1>
              <p className="text-white/80 mt-1 rtl:text-right">
                {t('dashboard.subtitle', { date: new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {user?.role === 'ADMIN' && renderAdminDashboard()}
      {user?.role === 'SECRETARY' && renderAdminDashboard()}
      {user?.role === 'TEACHER' && renderTeacherDashboard()}
      {user?.role === 'STUDENT' && renderStudentDashboard()}
      {!['ADMIN', 'SECRETARY', 'TEACHER', 'STUDENT'].includes(user?.role || '') && renderAdminDashboard()}
    </div>
  );
};

export default DashboardPage;
