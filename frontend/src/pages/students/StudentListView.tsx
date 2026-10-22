import React from 'react';
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../../components/ui/Button';
import { Student, StudentListParams } from '../../types';

interface StudentListViewProps {
  students: Student[];
  selectedIds: number[];
  ordering: StudentListParams['ordering'];
  onSort: (ordering: StudentListParams['ordering']) => void;
  onToggle: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  onView: (id: number) => void;
  onEdit: (student: Student) => void;
  onDownloadCard: (student: Student) => void;
  canManage: boolean;
  view?: 'mobile' | 'desktop' | 'both';
}

type SortableField = 'student_id' | 'enrollment_date';

const statusClasses: Record<Student['status'], string> = {
  ACTIVE: 'border-ui-success/30 bg-ui-success/10 text-ui-success-strong',
  GRADUATED: 'border-ui-info/30 bg-ui-info/10 text-ui-primary-strong',
  SUSPENDED: 'border-ui-warning/40 bg-ui-warning/15 text-ui-foreground',
  DROPPED: 'border-ui-danger/30 bg-ui-danger/10 text-ui-danger',
};

const statusDotClasses: Record<Student['status'], string> = {
  ACTIVE: 'bg-ui-success-strong',
  GRADUATED: 'bg-ui-info',
  SUSPENDED: 'bg-ui-warning',
  DROPPED: 'bg-ui-danger',
};

const StudentAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ui-primary font-black text-ui-on-primary shadow-panel ring-4 ring-ui-primary/10">
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" />
    ) : (
      (name.trim().charAt(0) || 'U').toUpperCase()
    )}
  </div>
);

const StudentStatus: React.FC<{ status: Student['status']; label: string }> = ({
  status,
  label,
}) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[status]}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClasses[status]}`} aria-hidden="true" />
    {label}
  </span>
);

const getFullName = (student: Student) =>
  [student.first_name, student.last_name].filter(Boolean).join(' ').trim()
  || student.user_full_name
  || student.student_id;

const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  selectedIds,
  ordering,
  onSort,
  onToggle,
  onToggleAll,
  onView,
  onEdit,
  onDownloadCard,
  canManage,
  view = 'both',
}) => {
  const { t, i18n } = useTranslation();

  const getStatus = (status: Student['status']) => {
    return {
      label: t(`students.filters.${status.toLowerCase()}`, status),
    };
  };

  const sortDetails = (field: SortableField) => {
    const ascending = ordering === field;
    const descending = ordering === `-${field}`;
    return {
      ariaSort: ascending ? 'ascending' as const : descending ? 'descending' as const : 'none' as const,
      next: ascending ? `-${field}` as StudentListParams['ordering'] : field,
      Icon: ascending ? ChevronUpIcon : descending ? ChevronDownIcon : ChevronUpDownIcon,
    };
  };

  const actions = (student: Student) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton label={t('common.view', 'Voir le dossier')} onClick={() => onView(student.id)}>
        <EyeIcon className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      {canManage && (
        <>
          <IconButton label={t('common.edit', 'Modifier')} onClick={() => onEdit(student)}>
            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            label={t('students.actions.id_card', "Carte d'étudiant")}
            onClick={() => onDownloadCard(student)}
          >
            <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </>
      )}
    </div>
  );

  const renderSortHeader = (field: SortableField, label: string) => {
    const { Icon, next } = sortDetails(field);
    return (
      <button
        type="button"
        onClick={() => onSort(next)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1 text-start text-xs font-black uppercase tracking-wider text-ui-muted transition hover:text-ui-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
      >
        {label}
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  };

  const mobile = (
    <div data-testid="student-mobile-list" className="divide-y divide-ui-border">
      {students.map((student) => {
        const name = getFullName(student);
        const status = getStatus(student.status);
        return (
          <article key={student.id} className="p-4">
            <div className="flex items-start gap-3">
              {canManage && (
                <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg focus-within:ring-4 focus-within:ring-ui-ring/20">
                  <input
                    type="checkbox"
                    aria-label={t('students.selection.select_student', {
                      name,
                      defaultValue: 'Sélectionner {{name}}',
                    })}
                    checked={selectedIds.includes(student.id)}
                    onChange={() => onToggle(student.id)}
                    className="h-5 w-5 rounded border-ui-border text-ui-primary focus:ring-ui-ring"
                  />
                </label>
              )}
              <StudentAvatar name={name} src={student.photo} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-ui-foreground">{name}</h3>
                    <p className="mt-0.5 text-xs font-bold tabular-nums text-ui-primary">
                      {student.student_id}
                    </p>
                  </div>
                  <StudentStatus status={student.status} label={status.label} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-ui-surface-muted p-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-ui-muted">
                      {t('students.table.program', 'Programme')}
                    </dt>
                    <dd className="mt-1 truncate font-bold text-ui-foreground">
                      {student.program_name || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ui-muted">
                      {t('students.table.level', 'Niveau')}
                    </dt>
                    <dd className="mt-1 truncate font-bold text-ui-foreground">
                      {student.level_display || '—'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">{actions(student)}</div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  const desktop = (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {canManage && (
              <th className="sticky top-0 z-[var(--z-sticky)] w-16 border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start">
                <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg focus-within:ring-4 focus-within:ring-ui-ring/20">
                  <input
                    type="checkbox"
                    aria-label={t('students.selection.select_all', 'Sélectionner tous les étudiants')}
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onChange={(event) => onToggleAll(event.target.checked)}
                    className="h-5 w-5 rounded border-ui-border text-ui-primary focus:ring-ui-ring"
                  />
                </label>
              </th>
            )}
            <th className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start text-xs font-black uppercase tracking-wider text-ui-muted">
              {t('students.table.student', 'Étudiant')}
            </th>
            <th
              aria-sort={sortDetails('student_id').ariaSort}
              className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start"
            >
              {renderSortHeader('student_id', t('students.table.matricule', 'Matricule'))}
            </th>
            <th className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start text-xs font-black uppercase tracking-wider text-ui-muted">
              {t('students.table.academic', 'Parcours académique')}
            </th>
            <th
              aria-sort={sortDetails('enrollment_date').ariaSort}
              className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start"
            >
              {renderSortHeader('enrollment_date', t('students.table.enrollment', 'Inscription'))}
            </th>
            <th className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-start text-xs font-black uppercase tracking-wider text-ui-muted">
              {t('students.table.status', 'Statut')}
            </th>
            <th className="sticky top-0 z-[var(--z-sticky)] border-b border-ui-border bg-ui-surface-muted px-4 py-2 text-end text-xs font-black uppercase tracking-wider text-ui-muted">
              {t('students.table.actions', 'Actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ui-border">
          {students.map((student) => {
            const name = getFullName(student);
            const status = getStatus(student.status);
            return (
              <tr key={student.id} className="transition hover:bg-ui-surface-muted/60">
                {canManage && (
                  <td className="border-b border-ui-border px-4 py-3">
                    <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg focus-within:ring-4 focus-within:ring-ui-ring/20">
                      <input
                        type="checkbox"
                        aria-label={t('students.selection.select_student', {
                          name,
                          defaultValue: 'Sélectionner {{name}}',
                        })}
                        checked={selectedIds.includes(student.id)}
                        onChange={() => onToggle(student.id)}
                        className="h-5 w-5 rounded border-ui-border text-ui-primary focus:ring-ui-ring"
                      />
                    </label>
                  </td>
                )}
                <td className="border-b border-ui-border px-4 py-3">
                  <div className="flex min-w-[210px] items-center gap-3">
                    <StudentAvatar name={name} src={student.photo} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-ui-foreground">{name}</p>
                      {student.user_email && (
                        <p className="mt-1 truncate text-xs text-ui-muted">{student.user_email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="border-b border-ui-border px-4 py-3 text-sm font-bold tabular-nums text-ui-primary">
                  {student.student_id}
                </td>
                <td className="border-b border-ui-border px-4 py-3">
                  <p className="max-w-[240px] truncate text-sm font-bold text-ui-foreground">
                    {student.program_name || '—'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-ui-muted">
                    {student.level_display || '—'}
                  </p>
                </td>
                <td className="border-b border-ui-border px-4 py-3 text-sm font-semibold tabular-nums text-ui-muted">
                  {student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString(i18n.language)
                    : '—'}
                </td>
                <td className="border-b border-ui-border px-4 py-3">
                  <StudentStatus status={student.status} label={status.label} />
                </td>
                <td className="border-b border-ui-border px-4 py-3">{actions(student)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (view === 'mobile') return mobile;
  if (view === 'desktop') return desktop;
  return <>{mobile}{desktop}</>;
};

export default StudentListView;
