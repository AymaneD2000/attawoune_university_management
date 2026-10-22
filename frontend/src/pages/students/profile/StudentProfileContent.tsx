import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton, RestrictedState } from '../../../components/ui/Feedback';
import { useAuth } from '../../../context/AuthContext';
import studentService from '../../../services/studentService';
import {
  Student,
  StudentFinancialStatement,
  StudentProfileTab,
  StudentReportCard,
} from '../../../types';
import {
  useStudentAttendanceQuery,
  useStudentBulletinsQuery,
  useStudentEnrollmentsQuery,
  useStudentFinanceQuery,
  useStudentGradesQuery,
  useStudentIdCardQuery,
} from '../studentQueries';

interface StudentProfileContentProps {
  student: Student;
  activeTab: StudentProfileTab;
  onTabChange: (tab: StudentProfileTab) => void;
}

const TABS: readonly StudentProfileTab[] = [
  'info',
  'enrollments',
  'grades',
  'attendance',
  'bulletins',
  'finance',
  'idcard',
];

const ID_CARD_ROLES = ['ADMIN', 'DEAN', 'SECRETARY'];

const queryErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  return typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : undefined;
};

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : undefined;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const StudentProfileContent: React.FC<StudentProfileContentProps> = ({
  student,
  activeTab,
  onTabChange,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const canGenerateIdCard = ID_CARD_ROLES.includes(user?.role || '');
  const visibleTabs = canGenerateIdCard ? TABS : TABS.filter((tab) => tab !== 'idcard');
  const tabRefs = useRef<Partial<Record<StudentProfileTab, HTMLButtonElement | null>>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const enrollmentsQuery = useStudentEnrollmentsQuery(student.id, activeTab === 'enrollments');
  const gradesQuery = useStudentGradesQuery(student.id, activeTab === 'grades');
  const attendanceQuery = useStudentAttendanceQuery(student.id, activeTab === 'attendance');
  const bulletinsQuery = useStudentBulletinsQuery(student.id, activeTab === 'bulletins');
  const financeQuery = useStudentFinanceQuery(student.id, activeTab === 'finance');
  const idCardQuery = useStudentIdCardQuery(
    student.id,
    canGenerateIdCard && activeTab === 'idcard',
  );
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!idCardQuery.data) return undefined;
    const url = window.URL.createObjectURL(idCardQuery.data);
    setIdCardUrl(url);
    return () => {
      window.URL.revokeObjectURL(url);
    };
  }, [idCardQuery.data]);

  const tabLabels: Record<StudentProfileTab, string> = {
    info: t('students.details.tabs.info', 'Informations'),
    enrollments: t('students.details.tabs.enrollments', 'Inscriptions'),
    grades: t('students.details.tabs.grades', 'Notes'),
    attendance: t('students.details.tabs.attendance', 'Présence'),
    bulletins: t('students.details.tabs.bulletins', 'Bulletins'),
    finance: t('students.details.tabs.finance', 'Finances'),
    idcard: t('students.details.tabs.idcard', "Carte d'étudiant"),
  };

  const selectTab = (tab: StudentProfileTab, focus = false) => {
    onTabChange(tab);
    if (focus) tabRefs.current[tab]?.focus();
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: StudentProfileTab,
  ) => {
    const currentIndex = visibleTabs.indexOf(currentTab);
    const rtl = i18n.language.startsWith('ar');
    let nextIndex: number | null = null;

    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = visibleTabs.length - 1;
    if (event.key === 'ArrowRight') nextIndex = currentIndex + (rtl ? -1 : 1);
    if (event.key === 'ArrowLeft') nextIndex = currentIndex + (rtl ? 1 : -1);
    if (nextIndex === null) return;

    event.preventDefault();
    const wrapped = (nextIndex + visibleTabs.length) % visibleTabs.length;
    selectTab(visibleTabs[wrapped], true);
  };

  const toggleYear = (key: string) => {
    setExpandedYears((current) => ({ ...current, [key]: current[key] === false }));
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
      <div
        role="tablist"
        aria-label={t('students.details.profile', 'Dossier étudiant')}
        className={`grid grid-cols-2 border-b border-ui-border bg-ui-surface-muted sm:grid-cols-4 ${
          canGenerateIdCard ? 'xl:grid-cols-7' : 'xl:grid-cols-6'
        }`}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            ref={(element) => { tabRefs.current[tab] = element; }}
            id={`student-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`student-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => selectTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, tab)}
            className={`min-h-11 border-b-2 px-2 py-3 text-sm font-bold transition duration-[var(--motion-fast)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ui-ring/20 ${
              activeTab === tab
                ? 'border-ui-primary bg-ui-surface text-ui-primary-strong'
                : 'border-transparent text-ui-muted hover:bg-ui-surface hover:text-ui-foreground'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {visibleTabs.map((tab) => (
        <div
          key={tab}
          id={`student-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`student-tab-${tab}`}
          tabIndex={activeTab === tab ? 0 : -1}
          hidden={activeTab !== tab}
          className="min-w-0 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ui-ring/20 sm:p-6"
        >
          {activeTab === tab && (
            <>
        {activeTab === 'info' && <InfoPanel student={student} />}

        {activeTab === 'enrollments' && (
          <QueryPanel
            loading={enrollmentsQuery.isLoading}
            error={enrollmentsQuery.isError}
            errorValue={enrollmentsQuery.error}
            errorTitle={t('students.details.enrollments.error', 'Impossible de charger les inscriptions')}
            onRetry={() => void enrollmentsQuery.refetch()}
          >
            {(enrollmentsQuery.data?.results || []).length === 0 ? (
              <EmptyState
                title={t('students.details.enrollments.empty', 'Aucune inscription trouvée')}
                description={t(
                  'students.details.enrollments.empty_description',
                  "Aucune inscription académique n'est enregistrée pour cet étudiant.",
                )}
              />
            ) : (
              <div className="space-y-3">
                {(enrollmentsQuery.data?.results || []).map((enrollment) => (
                  <article key={enrollment.id} className="rounded-2xl border border-ui-border bg-ui-surface-muted p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-ui-foreground">{enrollment.program_name}</h3>
                        <p className="mt-1 text-sm text-ui-muted">{enrollment.academic_year_name}</p>
                        <p className="mt-1 text-sm font-semibold text-ui-primary-strong">
                          {enrollment.level_display}
                        </p>
                      </div>
                      <span className="self-start rounded-full border border-ui-primary/20 bg-ui-primary/10 px-3 py-1 text-xs font-bold text-ui-primary-strong">
                        {enrollment.status_display || enrollment.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </QueryPanel>
        )}

        {activeTab === 'grades' && (
          <QueryPanel
            loading={gradesQuery.isLoading}
            error={gradesQuery.isError}
            errorValue={gradesQuery.error}
            errorTitle={t('students.details.grades.error', 'Impossible de charger les notes')}
            onRetry={() => void gradesQuery.refetch()}
          >
            <GradesPanel
              grades={gradesQuery.data?.exam_grades?.results || []}
              expandedYears={expandedYears}
              onToggle={toggleYear}
            />
          </QueryPanel>
        )}

        {activeTab === 'attendance' && (
          <QueryPanel
            loading={attendanceQuery.isLoading}
            error={attendanceQuery.isError}
            errorValue={attendanceQuery.error}
            errorTitle={t('students.details.attendance.error', 'Impossible de charger la présence')}
            onRetry={() => void attendanceQuery.refetch()}
          >
            {attendanceQuery.data ? (
              <AttendancePanel statistics={attendanceQuery.data.statistics} />
            ) : (
              <EmptyState
                title={t('students.details.attendance.empty', 'Aucune donnée de présence')}
                description={t(
                  'students.details.attendance.empty_description',
                  "Les statistiques de présence ne sont pas encore disponibles.",
                )}
              />
            )}
          </QueryPanel>
        )}

        {activeTab === 'bulletins' && (
          <QueryPanel
            loading={bulletinsQuery.isLoading}
            error={bulletinsQuery.isError}
            errorValue={bulletinsQuery.error}
            errorTitle={t('students.details.bulletins.error', 'Impossible de charger les bulletins')}
            onRetry={() => void bulletinsQuery.refetch()}
          >
            <BulletinsPanel
              reportCards={bulletinsQuery.data?.results || []}
              expandedYears={expandedYears}
              onToggle={toggleYear}
              onRetry={() => void bulletinsQuery.refetch()}
            />
          </QueryPanel>
        )}

        {activeTab === 'finance' && (
          <QueryPanel
            loading={financeQuery.isLoading}
            error={financeQuery.isError}
            errorValue={financeQuery.error}
            errorTitle={t('students.details.finance.error', 'Impossible de charger les finances')}
            onRetry={() => void financeQuery.refetch()}
          >
            {financeQuery.data ? (
              <FinancePanel statement={financeQuery.data} studentId={student.id} />
            ) : (
              <EmptyState
                title={t('students.details.finance.empty', 'Aucune donnée financière')}
                description={t(
                  'students.details.finance.empty_description',
                  "Aucun relevé financier n'est disponible pour cet étudiant.",
                )}
              />
            )}
          </QueryPanel>
        )}

        {activeTab === 'idcard' && (
          <QueryPanel
            loading={idCardQuery.isLoading}
            error={idCardQuery.isError}
            errorValue={idCardQuery.error}
            errorTitle={queryErrorCode(idCardQuery.error) === 'ECONNABORTED'
              ? t(
                'students.details.idcard.timeout',
                'La génération prend trop de temps. Réessayez dans quelques secondes.',
              )
              : t(
                'students.details.idcard.error',
                'Impossible de générer la carte. Vérifiez le backend puis réessayez.',
              )}
            onRetry={() => void idCardQuery.refetch()}
          >
            {idCardUrl ? (
              <div className="flex flex-col items-center gap-5">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-ui-success-strong">
                    {t('students.details.idcard.official', 'Document universitaire officiel')}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-ui-foreground">
                    {t('students.details.idcard.title', "Carte d'Étudiant")}
                  </h3>
                  <p className="mt-1 text-sm text-ui-muted">
                    {t(
                      'students.details.idcard.format',
                      'Format professionnel prêt à imprimer en 300 DPI',
                    )}
                  </p>
                </div>
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ui-border bg-ui-surface-muted p-2 shadow-panel sm:p-3">
                  <img
                    src={idCardUrl}
                    alt={t('students.details.idcard.image_alt', "Carte d'étudiant")}
                    className="h-auto w-full rounded-xl"
                  />
                </div>
                <a
                  href={idCardUrl}
                  download={`carte_etudiant_${student.student_id}.png`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ui-primary px-4 py-2.5 text-sm font-bold text-ui-on-primary shadow-panel transition duration-[var(--motion-fast)] hover:bg-ui-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                  {t('students.details.idcard.download', 'Télécharger la carte')}
                </a>
              </div>
            ) : null}
          </QueryPanel>
        )}
            </>
          )}
        </div>
      ))}
    </section>
  );
};

const QueryPanel: React.FC<{
  loading: boolean;
  error: boolean;
  errorValue?: unknown;
  errorTitle: string;
  onRetry: () => void;
  children: React.ReactNode;
}> = ({ loading, error, errorValue, errorTitle, onRetry, children }) => {
  const { t } = useTranslation();
  if (loading) {
    return <PageSkeleton rows={3} loadingLabel={t('common.loading', 'Chargement')} />;
  }
  if (error) {
    if (getHttpStatus(errorValue) === 403) {
      return (
        <RestrictedState
          title={t('students.profile.restricted.title', 'Accès restreint')}
          description={t(
            'students.profile.restricted.description',
            'Votre rôle ne permet pas d’accéder à cette section du dossier étudiant.',
          )}
        />
      );
    }
    return (
      <ErrorState
        title={errorTitle}
        description={t(
          'students.details.tab_error_description',
          'Cette section est indisponible. Le reste du dossier demeure accessible.',
        )}
        onRetry={onRetry}
      />
    );
  }
  return <>{children}</>;
};

const InfoPanel: React.FC<{ student: Student }> = ({ student }) => {
  const { t, i18n } = useTranslation();
  const personal = [
    [t('students.details.info.last_name', 'Nom'), student.last_name],
    [t('students.details.info.first_name', 'Prénom'), student.first_name],
    [
      t('students.details.info.date_of_birth', 'Date de naissance'),
      student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString(i18n.language) : '',
    ],
    [t('students.details.info.email', 'Email'), student.user_email],
    [t('students.details.info.phone', 'Téléphone'), student.user_phone],
  ];
  const academic = [
    [t('students.details.info.program', 'Programme'), student.program_name],
    [t('students.details.info.level', 'Niveau'), student.level_display],
    [t('students.details.info.status', 'Statut'), student.status],
    [
      t('students.details.info.enrollment_date', "Date d'inscription"),
      student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString(i18n.language) : '',
    ],
  ];

  return (
    <div className="space-y-7">
      <InfoSection
        title={t('students.details.info.personal_info', 'Informations Personnelles')}
        items={personal}
      />
      <InfoSection
        title={t('students.details.info.academic_info', 'Informations Académiques')}
        items={academic}
      />
    </div>
  );
};

const InfoSection: React.FC<{ title: string; items: Array<Array<string | undefined>> }> = ({
  title,
  items,
}) => (
  <section>
    <h2 className="border-b border-ui-border pb-2 text-lg font-extrabold text-ui-foreground">
      {title}
    </h2>
    <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-ui-border bg-ui-surface-muted p-4">
          <dt className="text-sm font-semibold text-ui-muted">{label}</dt>
          <dd className="mt-1 break-words font-bold text-ui-foreground">{value || 'N/A'}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const GradesPanel: React.FC<{
  grades: any[];
  expandedYears: Record<string, boolean>;
  onToggle: (key: string) => void;
}> = ({ grades, expandedYears, onToggle }) => {
  const { t, i18n } = useTranslation();
  const grouped = useMemo(() => {
    const value: Record<string, Record<string, any[]>> = {};
    grades.forEach((grade) => {
      const year = grade.academic_year_name || t('students.details.grades.undefined', 'Non défini');
      const semester = grade.semester_name || t('students.details.grades.undefined', 'Non défini');
      value[year] ||= {};
      value[year][semester] ||= [];
      value[year][semester].push(grade);
    });
    return value;
  }, [grades, t]);

  if (grades.length === 0) {
    return (
      <EmptyState
        title={t('students.details.grades.empty', "Aucune note d'examen trouvée")}
        description={t(
          'students.details.grades.empty_description',
          "Les notes publiées apparaîtront ici lorsqu'elles seront disponibles.",
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([year, semesters]) => {
        const key = `grade-${year}`;
        const expanded = expandedYears[key] !== false;
        return (
          <section key={year} className="overflow-hidden rounded-2xl border border-ui-border">
            <button
              type="button"
              onClick={() => onToggle(key)}
              aria-expanded={expanded}
              className="flex min-h-11 w-full items-center justify-between gap-3 bg-ui-surface-muted p-4 text-start transition hover:bg-ui-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ui-ring/20"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ui-primary text-ui-on-primary">
                  <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-extrabold text-ui-foreground">{year}</span>
              </span>
              <ChevronDownIcon className={`h-5 w-5 text-ui-muted transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {expanded && (
              <div className="space-y-5 p-4">
                {Object.entries(semesters).map(([semester, semesterGrades]) => (
                  <section key={semester}>
                    <h3 className="mb-2 font-bold text-ui-primary-strong">{semester}</h3>
                    <div className="overflow-x-auto rounded-xl border border-ui-border">
                      <table className="w-full min-w-[38rem] text-start">
                        <thead className="bg-ui-surface-muted text-xs uppercase text-ui-muted">
                          <tr>
                            <th className="px-4 py-3 text-start">{t('students.details.grades.course', 'Cours')}</th>
                            <th className="px-4 py-3 text-start">{t('students.details.grades.type', 'Type')}</th>
                            <th className="px-4 py-3 text-center">{t('students.details.grades.grade', 'Note')}</th>
                            <th className="px-4 py-3 text-start">{t('students.details.grades.date', 'Date')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ui-border bg-ui-surface">
                          {semesterGrades.map((grade, index) => (
                            <tr key={grade.id || index}>
                              <td className="px-4 py-3">
                                <p className="font-bold text-ui-foreground">{grade.course_name}</p>
                                <p className="text-xs text-ui-muted">{grade.course_code}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-ui-muted">{grade.exam_type_display}</td>
                              <td className="px-4 py-3 text-center font-mono text-lg font-black tabular-nums text-ui-foreground">
                                {grade.is_absent ? 'ABS' : `${grade.score}/20`}
                              </td>
                              <td className="px-4 py-3 text-sm text-ui-muted">
                                {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString(i18n.language) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const AttendancePanel: React.FC<{
  statistics: {
    total_sessions: number;
    present: number;
    absent: number;
    late: number;
    attendance_rate: number;
  };
}> = ({ statistics }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label={t('students.details.attendance.total', 'Total Sessions')} value={statistics.total_sessions || 0} tone="neutral" />
        <StatBox label={t('students.details.attendance.present', 'Présent')} value={statistics.present || 0} tone="success" />
        <StatBox label={t('students.details.attendance.absent', 'Absent')} value={statistics.absent || 0} tone="danger" />
        <StatBox label={t('students.details.attendance.late', 'En retard')} value={statistics.late || 0} tone="warning" />
      </dl>
      <div className="rounded-2xl bg-ui-primary p-6 text-ui-on-primary">
        <p className="font-semibold text-ui-on-primary/80">
          {t('students.details.attendance.rate', 'Taux de présence')}
        </p>
        <p className="mt-1 font-mono text-4xl font-black tabular-nums">
          {statistics.attendance_rate || 0}%
        </p>
      </div>
    </div>
  );
};

const BulletinsPanel: React.FC<{
  reportCards: StudentReportCard[];
  expandedYears: Record<string, boolean>;
  onToggle: (key: string) => void;
  onRetry: () => void;
}> = ({ reportCards, expandedYears, onToggle, onRetry }) => {
  const { t, i18n } = useTranslation();
  const grouped = useMemo(() => {
    const value: Record<string, StudentReportCard[]> = {};
    reportCards.forEach((card) => {
      const year = card.academic_year_name || card.academic_year || t('students.details.grades.undefined', 'Non défini');
      value[year] ||= [];
      value[year].push(card);
    });
    return value;
  }, [reportCards, t]);

  if (reportCards.length === 0) {
    return (
      <EmptyState
        title={t('students.details.bulletins.empty', 'Aucun bulletin disponible')}
        description={t(
          'students.details.bulletins.empty_description',
          'Les bulletins publiés apparaîtront ici.',
        )}
        action={<Button variant="secondary" onClick={onRetry}>{t('students.details.bulletins.refresh', 'Actualiser')}</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([year, cards]) => {
        const key = `bulletin-${year}`;
        const expanded = expandedYears[key] !== false;
        return (
          <section key={year} className="overflow-hidden rounded-2xl border border-ui-border">
            <button
              type="button"
              onClick={() => onToggle(key)}
              aria-expanded={expanded}
              className="flex min-h-11 w-full items-center justify-between gap-3 bg-ui-surface-muted p-4 text-start transition hover:bg-ui-success/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ui-ring/20"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ui-success-strong text-ui-on-primary">
                  <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-extrabold text-ui-foreground">{year}</span>
                  <span className="block text-sm text-ui-muted">
                    {t('students.details.bulletins.count', {
                      count: cards.length,
                      defaultValue: '{{count}} bulletin',
                    })}
                  </span>
                </span>
              </span>
              <ChevronDownIcon className={`h-5 w-5 text-ui-muted transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {expanded && (
              <div className="space-y-3 p-4">
                {cards.map((card) => (
                  <article key={card.id} className="flex flex-col gap-4 rounded-2xl border border-ui-border bg-ui-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-ui-foreground">{card.semester_name}</h3>
                        {card.is_published && (
                          <span className="rounded-full border border-ui-success/30 bg-ui-success/10 px-2.5 py-1 text-xs font-bold text-ui-success-strong">
                            {t('students.details.bulletins.published', 'Publié')}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-ui-muted">
                        {t('students.details.bulletins.average', 'Moyenne')}: <strong className="font-mono tabular-nums text-ui-foreground">{card.gpa || '-'}/20</strong>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ui-muted">
                        {card.total_credits != null && (
                          <p>
                            {t('students.details.bulletins.credits', 'Crédits')}: <strong className="font-mono tabular-nums text-ui-foreground">{card.credits_earned ?? 0}/{card.total_credits}</strong>
                          </p>
                        )}
                        {card.rank != null && (
                          <p>
                            {t('students.details.bulletins.rank', 'Rang')}: <strong className="font-mono tabular-nums text-ui-foreground">{card.rank}</strong>
                          </p>
                        )}
                      </div>
                      {card.generated_at && (
                        <p className="mt-2 text-xs text-ui-muted">
                          {t('students.details.bulletins.generated_at', 'Généré le')}: {new Intl.DateTimeFormat(i18n.language).format(new Date(card.generated_at))}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        void studentService.downloadReportCard(card.id)
                          .then((blob) => downloadBlob(blob, `bulletin_${card.id}.pdf`));
                      }}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                      {t('students.details.bulletins.download', 'Télécharger PDF')}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const FinancePanel: React.FC<{ statement: StudentFinancialStatement; studentId: number }> = ({
  statement,
  studentId,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox label={t('students.details.finance.total_due', 'Total Dû')} value={statement.total_due} tone="neutral" />
        <StatBox label={t('students.details.finance.total_paid', 'Total Payé')} value={statement.total_paid} tone="success" />
        <StatBox
          label={t('students.details.finance.remaining', 'Reste à Payer')}
          value={statement.balance}
          tone={parseFloat(statement.balance || '0') > 0 ? 'danger' : 'success'}
        />
      </dl>
      <section className="rounded-2xl border border-ui-border bg-ui-surface-muted p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold text-ui-foreground">
            {t('students.details.finance.history', 'Historique des transactions')}
          </h2>
          <Button
            variant="secondary"
            onClick={() => {
              void studentService.downloadFinancialStatement(studentId)
                .then((blob) => downloadBlob(blob, `releve_financier_${studentId}.pdf`));
            }}
          >
            <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
            {t('students.details.finance.download_statement', 'Télécharger Relevé')}
          </Button>
        </div>
        {statement.transactions?.length ? (
          <div className="mt-4 space-y-3">
            {statement.transactions.map((transaction, index) => (
              <article key={transaction.id || index} className="flex flex-col gap-2 rounded-xl border border-ui-border bg-ui-surface p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-ui-foreground">
                    {transaction.payment_method || transaction.description || '-'}
                  </p>
                  <p className="text-xs text-ui-muted">
                    {transaction.date || transaction.payment_date
                      ? new Date(transaction.date || transaction.payment_date || '').toLocaleDateString(i18n.language)
                      : '-'}
                  </p>
                </div>
                <span className="font-mono font-black tabular-nums text-ui-foreground">
                  {transaction.amount || '0'} FCFA
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm font-semibold text-ui-muted">
            {t('students.details.finance.empty_transactions', 'Aucune transaction')}
          </p>
        )}
      </section>
    </div>
  );
};

const StatBox: React.FC<{
  label: string;
  value: string | number;
  tone: 'neutral' | 'success' | 'danger' | 'warning';
}> = ({ label, value, tone }) => {
  const toneClasses = {
    neutral: 'border-ui-border bg-ui-surface-muted text-ui-foreground',
    success: 'border-ui-success/30 bg-ui-success/10 text-ui-success-strong',
    danger: 'border-ui-danger/30 bg-ui-danger/10 text-ui-danger',
    warning: 'border-ui-warning/30 bg-ui-warning/10 text-ui-earth',
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <dt className="text-sm font-semibold opacity-80">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</dd>
    </div>
  );
};

export default StudentProfileContent;
