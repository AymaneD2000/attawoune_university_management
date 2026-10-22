import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  EmptyState,
  IconActionButton,
  ListLoading,
  PaginationBar,
  StatusPill,
} from '../../components/common/EntityDisplay';
import PageHeader from '../../components/common/PageHeader';
import academicsService from '../../services/academicsService';
import universityService from '../../services/universityService';
import { Course, Level, Program } from '../../types';
import { normalizeApiError } from '../../utils/apiError';
import CourseFormModal from './CourseFormModal';

type StatTone = 'blue' | 'green' | 'orange' | 'earth';

const statToneClasses: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-green-50 text-green-700 ring-green-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  earth: 'bg-orange-50 text-brand-earth ring-orange-100',
};

interface CourseStatProps {
  label: string;
  value: number;
  suffix?: string;
  tone: StatTone;
  icon: React.ReactNode;
}

const CourseStat: React.FC<CourseStatProps> = ({ label, value, suffix, tone, icon }) => (
  <div className="surface-panel flex items-center gap-4 p-4 sm:p-5">
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4 ${statToneClasses[tone]}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">
        {value.toLocaleString()}
        {suffix && <span className="ms-1 text-sm font-bold text-slate-400">{suffix}</span>}
      </p>
    </div>
  </div>
);

const courseTypeTones: Record<Course['course_type'], 'blue' | 'green' | 'orange'> = {
  REQUIRED: 'blue',
  ELECTIVE: 'green',
  PRACTICAL: 'orange',
};

const courseTypeTone = (type: Course['course_type']) => courseTypeTones[type];

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageCourses = ['ADMIN', 'SECRETARY'].includes(user?.role || '');

  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const response = await academicsService.getCourses({
        page: currentPage,
        search: debouncedSearch || undefined,
        program: programFilter || undefined,
        course_type: courseTypeFilter || undefined,
        level: levelFilter || undefined,
        semester_type: semesterFilter || undefined,
      });
      setCourses(response.results);
      setTotalCount(response.count);
    } catch (error) {
      const responseData = (error as { response?: { data?: unknown } }).response?.data;
      setPageError(normalizeApiError(responseData, t('courses.errors.load', 'Impossible de charger les cours.')).message);
    } finally {
      setLoading(false);
    }
  }, [courseTypeFilter, currentPage, debouncedSearch, levelFilter, programFilter, semesterFilter, t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [programsResponse, levelsResponse] = await Promise.all([
          universityService.getPrograms({ page_size: 1000, ordering: 'code' }),
          universityService.getLevels({ page_size: 1000, ordering: 'order' }),
        ]);
        setPrograms(programsResponse.results);
        setLevels(levelsResponse.results);
      } catch (error) {
        console.error('Error loading course filters:', error);
      }
    };

    loadReferenceData();
  }, []);

  const visibleStats = useMemo(() => courses.reduce(
    (stats, course) => ({
      active: stats.active + (course.is_active ? 1 : 0),
      credits: stats.credits + Number(course.credits || 0),
      hours: stats.hours + Number(
        course.total_hours
        ?? course.hours_lecture + course.hours_tutorial + course.hours_practical,
      ),
    }),
    { active: 0, credits: 0, hours: 0 },
  ), [courses]);

  const activeFilterCount = [
    searchTerm.trim(),
    programFilter,
    courseTypeFilter,
    levelFilter,
    semesterFilter,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setProgramFilter('');
    setCourseTypeFilter('');
    setLevelFilter('');
    setSemesterFilter('');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDelete = async (course: Course) => {
    const confirmed = window.confirm(
      t('courses.delete_confirm', 'Supprimer définitivement le cours {{code}} — {{name}} ?', {
        code: course.code,
        name: course.name,
      }),
    );
    if (!confirmed) return;

    setDeletingCourseId(course.id);
    setPageError('');
    try {
      await academicsService.deleteCourse(course.id);
      if (courses.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        await fetchCourses();
      }
    } catch (error) {
      const responseData = (error as { response?: { data?: unknown } }).response?.data;
      setPageError(normalizeApiError(responseData, t('courses.errors.delete', 'Impossible de supprimer ce cours.')).message);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const renderActions = (course: Course) => canManageCourses && (
    <div className="flex items-center justify-end gap-1">
      <IconActionButton
        label={t('courses.actions.edit', 'Modifier')}
        tone="blue"
        onClick={() => openEditModal(course)}
      >
        <PencilSquareIcon className="h-5 w-5" />
      </IconActionButton>
      <IconActionButton
        label={t('courses.actions.delete', 'Supprimer')}
        tone="red"
        disabled={deletingCourseId === course.id}
        onClick={() => handleDelete(course)}
      >
        {deletingCourseId === course.id ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
        ) : (
          <TrashIcon className="h-5 w-5" />
        )}
      </IconActionButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('sidebar.academics', 'Académique')}
        title={t('courses.title', 'Gestion des Cours')}
        description={t('courses.subtitle', 'Organisez les matières, crédits, volumes horaires et parcours académiques.')}
        icon={<BookOpenIcon className="h-6 w-6" />}
        actions={canManageCourses && (
          <button type="button" onClick={openCreateModal} className="brand-button">
            <PlusIcon className="h-5 w-5" />
            {t('courses.actions.new_course', 'Nouveau Cours')}
          </button>
        )}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <CourseStat
          label={t('courses.stats.total', 'Cours correspondant')}
          value={totalCount}
          tone="blue"
          icon={<BookOpenIcon className="h-5 w-5" />}
        />
        <CourseStat
          label={t('courses.stats.visible_active', 'Actifs sur cette page')}
          value={visibleStats.active}
          tone="green"
          icon={<AcademicCapIcon className="h-5 w-5" />}
        />
        <CourseStat
          label={t('courses.stats.visible_credits', 'Crédits sur cette page')}
          value={visibleStats.credits}
          tone="orange"
          icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
        />
        <CourseStat
          label={t('courses.stats.visible_hours', 'Heures sur cette page')}
          value={visibleStats.hours}
          suffix="h"
          tone="earth"
          icon={<ClockIcon className="h-5 w-5" />}
        />
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className="brand-input ps-12"
              placeholder={t('courses.search_placeholder', 'Rechercher par code, nom ou description...')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:shrink-0">
            <select
              value={programFilter}
              onChange={(event) => {
                setProgramFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="brand-input min-w-0 xl:w-56"
              aria-label={t('courses.filters.program', 'Programme')}
            >
              <option value="">{t('courses.filters.all_programs', 'Tous les programmes')}</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>{program.code} — {program.name}</option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="brand-input min-w-0 xl:w-44"
              aria-label={t('courses.filters.level', 'Niveau')}
            >
              <option value="">{t('courses.filters.all_levels', 'Tous les niveaux')}</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.display_name}</option>
              ))}
            </select>
            <select
              value={semesterFilter}
              onChange={(event) => {
                setSemesterFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="brand-input min-w-0 xl:w-44"
              aria-label={t('courses.filters.semester', 'Semestre')}
            >
              <option value="">{t('courses.filters.all_semesters', 'Tous les semestres')}</option>
              <option value="S1">{t('courses.semesters.s1', 'Semestre 1')}</option>
              <option value="S2">{t('courses.semesters.s2', 'Semestre 2')}</option>
            </select>
            <select
              value={courseTypeFilter}
              onChange={(event) => {
                setCourseTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="brand-input min-w-0 xl:w-48"
              aria-label={t('courses.filters.type', 'Type de cours')}
            >
              <option value="">{t('courses.filters.all_types', 'Tous les types')}</option>
              <option value="REQUIRED">{t('courses.filters.required', 'Obligatoire')}</option>
              <option value="ELECTIVE">{t('courses.filters.elective', 'Optionnel')}</option>
              <option value="PRACTICAL">{t('courses.filters.practical', 'Travaux pratiques')}</option>
            </select>
          </div>
        </div>
        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-600" />
              {t('courses.filters.active_count', '{{count}} filtre(s) actif(s)', { count: activeFilterCount })}
            </div>
            <button type="button" onClick={resetFilters} className="text-sm font-black text-blue-700 hover:text-green-700">
              {t('courses.filters.reset', 'Réinitialiser les filtres')}
            </button>
          </div>
        )}
      </section>

      {pageError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{pageError}</span>
          <button type="button" onClick={fetchCourses} className="font-black underline underline-offset-4">
            {t('common.retry', 'Réessayer')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="surface-panel overflow-hidden"><ListLoading cards /></div>
      ) : courses.length === 0 ? (
        <div className="surface-panel">
          <EmptyState
            title={t('courses.empty', 'Aucun cours trouvé')}
            description={t('courses.empty_description', 'Modifiez les filtres ou ajoutez une nouvelle matière au catalogue.')}
            action={activeFilterCount > 0 ? (
              <button type="button" onClick={resetFilters} className="brand-button-secondary">
                {t('courses.filters.reset', 'Réinitialiser les filtres')}
              </button>
            ) : canManageCourses ? (
              <button type="button" onClick={openCreateModal} className="brand-button">
                <PlusIcon className="h-5 w-5" />
                {t('courses.actions.new_course', 'Nouveau Cours')}
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <section className="surface-panel overflow-hidden">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:hidden">
            {courses.map((course) => (
              <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-black tracking-wide text-blue-700">
                      {course.code}
                    </span>
                    <h3 className="mt-2 text-lg font-black leading-snug text-slate-950">{course.name}</h3>
                    {course.description && <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{course.description}</p>}
                  </div>
                  <StatusPill tone={course.is_active ? 'green' : 'red'} dot>
                    {course.is_active ? t('common.active', 'Actif') : t('common.inactive', 'Inactif')}
                  </StatusPill>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
                  <p className="truncate text-sm font-black text-slate-800">{course.program_name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill tone="slate">{course.level_display}</StatusPill>
                    <StatusPill tone="earth">{course.semester_type_display}</StatusPill>
                    <StatusPill tone={courseTypeTone(course.course_type)}>{course.course_type_display}</StatusPill>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 py-3 rtl:divide-x-reverse">
                  <div className="px-2 text-center">
                    <p className="text-lg font-black text-blue-700">{course.credits}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('courses.table.credits', 'Crédits')}</p>
                  </div>
                  <div className="px-2 text-center">
                    <p className="text-lg font-black text-green-700">{course.coefficient}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('courses.table.coef', 'Coef.')}</p>
                  </div>
                  <div className="px-2 text-center">
                    <p className="text-lg font-black text-brand-earth">{course.total_hours}h</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('courses.table.hours', 'Heures')}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <span>CM {course.hours_lecture}h</span>
                  <span>TD {course.hours_tutorial}h</span>
                  <span>TP {course.hours_practical}h</span>
                </div>
                {canManageCourses && <div className="mt-4 border-t border-slate-100 pt-3">{renderActions(course)}</div>}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.course', 'Cours')}</th>
                  <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.academic_context', 'Parcours académique')}</th>
                  <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.type_status', 'Type & statut')}</th>
                  <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.value', 'Crédits / Coef.')}</th>
                  <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.workload', 'Charge horaire')}</th>
                  {canManageCourses && <th className="px-5 py-4 text-end text-xs font-black uppercase tracking-wider text-slate-500">{t('courses.table.actions', 'Actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="max-w-sm px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                          <BookOpenIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-black tracking-wide text-blue-700">{course.code}</span>
                          <p className="mt-0.5 font-black leading-5 text-slate-950">{course.name}</p>
                          {course.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{course.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="max-w-[220px] truncate text-sm font-bold text-slate-800">{course.program_name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusPill tone="slate">{course.level_display}</StatusPill>
                        <StatusPill tone="earth">{course.semester_type_display}</StatusPill>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col items-start gap-2">
                        <StatusPill tone={courseTypeTone(course.course_type)}>{course.course_type_display}</StatusPill>
                        <StatusPill tone={course.is_active ? 'green' : 'red'} dot>
                          {course.is_active ? t('common.active', 'Actif') : t('common.inactive', 'Inactif')}
                        </StatusPill>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center align-top">
                      <p className="text-lg font-black text-blue-700">{course.credits} <span className="text-xs text-slate-400">ECTS</span></p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{t('courses.table.coef', 'Coef.')} {course.coefficient}</p>
                    </td>
                    <td className="min-w-[190px] px-5 py-4 align-top">
                      <div className="flex items-center gap-2 text-sm font-black text-brand-earth">
                        <ClockIcon className="h-4 w-4" />
                        {course.total_hours}h {t('courses.table.total', 'au total')}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        CM {course.hours_lecture}h · TD {course.hours_tutorial}h · TP {course.hours_practical}h
                      </p>
                    </td>
                    {canManageCourses && <td className="px-5 py-4 align-top">{renderActions(course)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={currentPage}
            currentCount={courses.length}
            total={totalCount}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => page + 1)}
          />
        </section>
      )}

      {showModal && (
        <CourseFormModal
          course={selectedCourse}
          programs={programs}
          levels={levels}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
};

export default CoursesPage;
