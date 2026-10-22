import React, { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import StatusPage from '../../../components/common/StatusPage';
import { Button } from '../../../components/ui/Button';
import { ErrorState, PageSkeleton, RestrictedState } from '../../../components/ui/Feedback';
import { useAuth } from '../../../context/AuthContext';
import { StudentProfileTab } from '../../../types';
import StudentFormModal from '../StudentFormModal';
import { useStudentQuery } from '../studentQueries';
import StudentProfileContent from './StudentProfileContent';

const PROFILE_TABS: readonly StudentProfileTab[] = [
  'info',
  'enrollments',
  'grades',
  'attendance',
  'bulletins',
  'finance',
  'idcard',
];

const MANAGER_ROLES = ['ADMIN', 'DEAN', 'SECRETARY'];

const parseStudentId = (value: string | undefined): number => {
  if (!value || !/^[1-9]\d*$/.test(value)) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 0;
};

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : undefined;
};

const StudentProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { studentId: studentIdParam } = useParams<{ studentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showEditForm, setShowEditForm] = useState(false);
  const studentId = parseStudentId(studentIdParam);
  const studentQuery = useStudentQuery(studentId);
  const requestedTab = searchParams.get('tab');
  const canManageStudent = MANAGER_ROLES.includes(user?.role || '');
  const canGenerateIdCard = MANAGER_ROLES.includes(user?.role || '');
  const allowedTabs = canGenerateIdCard
    ? PROFILE_TABS
    : PROFILE_TABS.filter((tab) => tab !== 'idcard');
  const activeTab: StudentProfileTab = allowedTabs.includes(requestedTab as StudentProfileTab)
    ? requestedTab as StudentProfileTab
    : 'info';

  useEffect(() => {
    if (requestedTab === activeTab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', activeTab);
    setSearchParams(next, { replace: true, state: location.state });
  }, [activeTab, location.state, requestedTab, searchParams, setSearchParams]);

  const changeTab = (tab: StudentProfileTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { state: location.state });
  };

  const handleBack = () => {
    const state = location.state as { from?: unknown } | null;
    navigate(typeof state?.from === 'string' ? state.from : '/students');
  };

  if (!studentId) {
    return (
      <StatusPage
        code="404"
        title={t('students.profile.not_found.title', 'Étudiant introuvable')}
        description={t(
          'students.profile.not_found.description',
          "Le dossier étudiant demandé n'existe pas ou son adresse est invalide.",
        )}
      />
    );
  }

  if (studentQuery.isLoading) {
    return (
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
        <PageSkeleton
          rows={5}
          loadingLabel={t('students.profile.loading', 'Chargement du dossier étudiant')}
        />
      </section>
    );
  }

  if (studentQuery.isError) {
    const status = getHttpStatus(studentQuery.error);
    if (status === 403) {
      return (
        <section className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
          <RestrictedState
            title={t('students.profile.restricted.title', 'Dossier restreint')}
            description={t(
              'students.profile.restricted.description',
              "Votre rôle ne permet pas d'afficher ce dossier étudiant.",
            )}
          />
        </section>
      );
    }

    if (status === 404) {
      return (
        <StatusPage
          code="404"
          title={t('students.profile.not_found.title', 'Étudiant introuvable')}
          description={t(
            'students.profile.not_found.description',
            "Le dossier étudiant demandé n'existe pas ou son adresse est invalide.",
          )}
        />
      );
    }

    return (
      <section className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
        <ErrorState
          title={t('students.profile.error.title', 'Impossible de charger le dossier étudiant')}
          description={t(
            'students.profile.error.description',
            'Vérifiez votre connexion puis réessayez.',
          )}
          onRetry={() => void studentQuery.refetch()}
        />
      </section>
    );
  }

  const student = studentQuery.data;
  if (!student) return null;

  const displayName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim()
    || student.user_full_name
    || student.student_id;

  return (
    <div className="min-w-0 space-y-6">
      <Button variant="ghost" onClick={handleBack} className="-ms-2">
        <ArrowLeftIcon className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        {t('students.profile.back', 'Retour aux étudiants')}
      </Button>

      <header className="relative overflow-hidden rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
        <div className="h-1.5 bg-gradient-to-r from-ui-primary via-ui-success to-ui-warning" />
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ui-primary text-2xl font-black text-ui-on-primary shadow-panel ring-4 ring-ui-primary/10">
              {student.photo ? (
                <img src={student.photo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                (displayName.charAt(0) || 'E').toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ui-success-strong">
                {t('students.profile.eyebrow', 'Dossier étudiant')}
              </p>
              <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-ui-foreground sm:text-3xl">
                {displayName}
              </h1>
              <p dir="ltr" className="mt-1 font-mono text-sm font-bold tabular-nums text-ui-muted">
                {student.student_id}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-ui-primary/20 bg-ui-primary/10 px-3 py-1 font-bold text-ui-primary-strong">
                  {student.program_name || t('common.not_available', 'Non disponible')}
                </span>
                <span className="rounded-full border border-ui-border bg-ui-surface-muted px-3 py-1 font-bold text-ui-foreground">
                  {student.level_display || t('common.not_available', 'Non disponible')}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  student.status === 'ACTIVE'
                    ? 'border-ui-success/30 bg-ui-success/10 text-ui-success-strong'
                    : 'border-ui-warning/30 bg-ui-warning/10 text-ui-earth'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {t(`students.filters.${student.status.toLowerCase()}`, student.status)}
                </span>
              </div>
            </div>
          </div>

          {(canManageStudent || canGenerateIdCard) && (
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              {canManageStudent && (
                <Button variant="secondary" onClick={() => setShowEditForm(true)}>
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                  {t('common.edit', 'Modifier')}
                </Button>
              )}
              {canGenerateIdCard && (
                <Button onClick={() => changeTab('idcard')}>
                  <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
                  {t('students.actions.id_card', "Carte d'étudiant")}
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <StudentProfileContent
        student={student}
        activeTab={activeTab}
        onTabChange={changeTab}
      />

      {showEditForm && (
        <StudentFormModal
          student={student}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            void studentQuery.refetch();
          }}
        />
      )}
    </div>
  );
};

export default StudentProfilePage;
