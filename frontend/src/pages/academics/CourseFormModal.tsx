import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import academicsService, { CourseMutationPayload } from '../../services/academicsService';
import { Course, Level, Program } from '../../types';
import { getFieldError, normalizeApiError, NormalizedApiError } from '../../utils/apiError';
import { changedFields } from '../../utils/partialUpdate';

interface CourseFormModalProps {
  course: Course | null;
  programs: Program[];
  levels: Level[];
  onClose: () => void;
  onSuccess: () => void;
}

interface CourseFormState {
  code: string;
  name: string;
  program: string;
  level: string;
  semester_type: Course['semester_type'];
  course_type: Course['course_type'];
  credits: string;
  coefficient: string;
  hours_lecture: string;
  hours_tutorial: string;
  hours_practical: string;
  description: string;
  is_active: boolean;
}

const createInitialState = (course: Course | null): CourseFormState => ({
  code: course?.code || '',
  name: course?.name || '',
  program: course ? String(course.program) : '',
  level: course?.level ? String(course.level) : '',
  semester_type: course?.semester_type || 'S1',
  course_type: course?.course_type || 'REQUIRED',
  credits: String(course?.credits ?? 3),
  coefficient: String(course?.coefficient ?? '1.0'),
  hours_lecture: String(course?.hours_lecture ?? 30),
  hours_tutorial: String(course?.hours_tutorial ?? 0),
  hours_practical: String(course?.hours_practical ?? 0),
  description: course?.description || '',
  is_active: course?.is_active ?? true,
});

const createMutationPayload = (formData: CourseFormState): CourseMutationPayload => ({
  code: formData.code.trim().toUpperCase(),
  name: formData.name.trim(),
  program: Number(formData.program),
  level: Number(formData.level),
  semester_type: formData.semester_type,
  course_type: formData.course_type,
  credits: Number(formData.credits),
  coefficient: Number(formData.coefficient),
  hours_lecture: Number(formData.hours_lecture),
  hours_tutorial: Number(formData.hours_tutorial),
  hours_practical: Number(formData.hours_practical),
  description: formData.description.trim(),
  is_active: formData.is_active,
});

const CourseFormModal: React.FC<CourseFormModalProps> = ({ course, programs, levels, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CourseFormState>(() => createInitialState(course));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const programLevels = useMemo(() => {
    const selectedProgram = programs.find((program) => program.id === Number(formData.program));
    if (!selectedProgram) return [];
    return levels.filter((level) => selectedProgram.levels.includes(level.id));
  }, [formData.program, levels, programs]);

  const totalHours = ['hours_lecture', 'hours_tutorial', 'hours_practical'].reduce(
    (total, field) => total + (Number(formData[field as keyof CourseFormState]) || 0),
    0,
  );

  const updateField = (name: keyof CourseFormState, value: string | boolean) => {
    setError(null);
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const field = name as keyof CourseFormState;

    if (type === 'checkbox') {
      updateField(field, (event.target as HTMLInputElement).checked);
      return;
    }

    if (field === 'program') {
      const selectedProgram = programs.find((program) => program.id === Number(value));
      const levelStillAvailable = selectedProgram?.levels.includes(Number(formData.level));
      setError(null);
      setFormData((current) => ({
        ...current,
        program: value,
        level: levelStillAvailable ? current.level : '',
      }));
      return;
    }

    updateField(field, value);
  };

  const fieldClassName = (field: keyof CourseFormState) => (
    `brand-input ${getFieldError(error, field) ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`
  );

  const renderFieldError = (field: keyof CourseFormState) => {
    const message = getFieldError(error, field);
    return message ? <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p> : null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = createMutationPayload(formData);

    try {
      if (course) {
        await academicsService.updateCourse(
          course.id,
          changedFields(payload, createMutationPayload(createInitialState(course))),
        );
      } else {
        await academicsService.createCourse(payload);
      }
      onSuccess();
    } catch (requestError) {
      const responseData = (requestError as { response?: { data?: unknown } }).response?.data;
      setError(normalizeApiError(responseData, t('courses.form.errors.save', 'Le cours n’a pas pu être enregistré.')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/30">
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-green-700 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -end-10 -top-16 h-40 w-40 rounded-full border-[24px] border-white/10" />
          <div className="absolute bottom-0 start-0 h-1 w-full bg-gradient-to-r from-green-400 via-orange-400 to-orange-600" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">
                  {t('courses.form.eyebrow', 'Catalogue académique')}
                </p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                  {course ? t('courses.form.title_edit', 'Modifier le cours') : t('courses.form.title_new', 'Nouveau cours')}
                </h2>
                <p className="mt-1 hidden text-sm text-blue-100 sm:block">
                  {t('courses.form.subtitle', 'Renseignez le parcours, la valeur académique et le volume horaire.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
              aria-label={t('common.close', 'Fermer')}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                {error.message}
              </div>
            )}

            <div className="space-y-6">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <BookOpenIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{t('courses.form.sections.identity', 'Identification du cours')}</h3>
                    <p className="text-xs text-slate-500">{t('courses.form.sections.identity_hint', 'Code unique et intitulé officiel')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="course-code" className="brand-label">{t('courses.form.labels.code', 'Code du cours')}</label>
                    <input
                      id="course-code"
                      name="code"
                      type="text"
                      required
                      maxLength={20}
                      value={formData.code}
                      onChange={handleChange}
                      className={fieldClassName('code')}
                      placeholder={t('courses.form.placeholders.code', 'Ex. INF101')}
                    />
                    {renderFieldError('code')}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="course-name" className="brand-label">{t('courses.form.labels.name', 'Nom du cours')}</label>
                    <input
                      id="course-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={fieldClassName('name')}
                      placeholder={t('courses.form.placeholders.name', 'Ex. Introduction à l’informatique')}
                    />
                    {renderFieldError('name')}
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <AcademicCapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{t('courses.form.sections.academic', 'Positionnement académique')}</h3>
                    <p className="text-xs text-slate-500">{t('courses.form.sections.academic_hint', 'Programme, niveau, semestre et nature du cours')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="course-program" className="brand-label">{t('courses.form.labels.program', 'Programme')}</label>
                    <select
                      id="course-program"
                      name="program"
                      required
                      value={formData.program}
                      onChange={handleChange}
                      className={fieldClassName('program')}
                    >
                      <option value="">{t('courses.form.placeholders.select_program', 'Sélectionner un programme')}</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.code} — {program.name}</option>
                      ))}
                    </select>
                    {renderFieldError('program')}
                  </div>
                  <div>
                    <label htmlFor="course-level" className="brand-label">{t('courses.form.labels.level', 'Niveau')}</label>
                    <select
                      id="course-level"
                      name="level"
                      required
                      disabled={!formData.program}
                      value={formData.level}
                      onChange={handleChange}
                      className={`${fieldClassName('level')} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                    >
                      <option value="">
                        {formData.program
                          ? t('courses.form.placeholders.select_level', 'Sélectionner un niveau')
                          : t('courses.form.placeholders.select_program_first', 'Sélectionnez d’abord un programme')}
                      </option>
                      {programLevels.map((level) => (
                        <option key={level.id} value={level.id}>{level.display_name}</option>
                      ))}
                    </select>
                    {renderFieldError('level')}
                  </div>
                  <div>
                    <label htmlFor="course-semester" className="brand-label">{t('courses.form.labels.semester', 'Semestre')}</label>
                    <select
                      id="course-semester"
                      name="semester_type"
                      required
                      value={formData.semester_type}
                      onChange={handleChange}
                      className={fieldClassName('semester_type')}
                    >
                      <option value="S1">{t('courses.semesters.s1', 'Semestre 1')}</option>
                      <option value="S2">{t('courses.semesters.s2', 'Semestre 2')}</option>
                    </select>
                    {renderFieldError('semester_type')}
                  </div>
                  <div>
                    <label htmlFor="course-type" className="brand-label">{t('courses.form.labels.type', 'Type de cours')}</label>
                    <select
                      id="course-type"
                      name="course_type"
                      required
                      value={formData.course_type}
                      onChange={handleChange}
                      className={fieldClassName('course_type')}
                    >
                      <option value="REQUIRED">{t('courses.filters.required', 'Obligatoire')}</option>
                      <option value="ELECTIVE">{t('courses.filters.elective', 'Optionnel')}</option>
                      <option value="PRACTICAL">{t('courses.filters.practical', 'Travaux pratiques')}</option>
                    </select>
                    {renderFieldError('course_type')}
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-brand-earth">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{t('courses.form.sections.value', 'Crédits et volume horaire')}</h3>
                      <p className="text-xs text-slate-500">{t('courses.form.sections.value_hint', 'Pondération et répartition pédagogique')}</p>
                    </div>
                  </div>
                  <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-brand-earth">
                    {totalHours}h {t('courses.form.total', 'au total')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <label htmlFor="course-credits" className="brand-label">{t('courses.form.labels.credits', 'Crédits')}</label>
                    <input id="course-credits" name="credits" type="number" required min="1" value={formData.credits} onChange={handleChange} className={fieldClassName('credits')} />
                    {renderFieldError('credits')}
                  </div>
                  <div>
                    <label htmlFor="course-coefficient" className="brand-label">{t('courses.form.labels.coefficient', 'Coefficient')}</label>
                    <input id="course-coefficient" name="coefficient" type="number" required step="0.1" min="0.1" value={formData.coefficient} onChange={handleChange} className={fieldClassName('coefficient')} />
                    {renderFieldError('coefficient')}
                  </div>
                  <div>
                    <label htmlFor="course-hours-lecture" className="brand-label">{t('courses.form.labels.hours_lecture', 'Heures CM')}</label>
                    <input id="course-hours-lecture" name="hours_lecture" type="number" required min="0" value={formData.hours_lecture} onChange={handleChange} className={fieldClassName('hours_lecture')} />
                    {renderFieldError('hours_lecture')}
                  </div>
                  <div>
                    <label htmlFor="course-hours-tutorial" className="brand-label">{t('courses.form.labels.hours_tutorial', 'Heures TD')}</label>
                    <input id="course-hours-tutorial" name="hours_tutorial" type="number" required min="0" value={formData.hours_tutorial} onChange={handleChange} className={fieldClassName('hours_tutorial')} />
                    {renderFieldError('hours_tutorial')}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="course-hours-practical" className="brand-label">{t('courses.form.labels.hours_practical', 'Heures TP')}</label>
                    <input id="course-hours-practical" name="hours_practical" type="number" required min="0" value={formData.hours_practical} onChange={handleChange} className={fieldClassName('hours_practical')} />
                    {renderFieldError('hours_practical')}
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <label htmlFor="course-description" className="brand-label">{t('courses.form.labels.description', 'Description')}</label>
                <textarea
                  id="course-description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={fieldClassName('description')}
                  placeholder={t('courses.form.placeholders.description', 'Objectifs, contenu ou informations complémentaires...')}
                />
                {renderFieldError('description')}

                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-800">{t('courses.form.labels.is_active', 'Cours actif')}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t('courses.form.active_hint', 'Le cours apparaît dans le catalogue et les sélections.')}</p>
                  </div>
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                </label>
              </section>
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button type="button" onClick={onClose} disabled={loading} className="brand-button-secondary">
              {t('common.cancel', 'Annuler')}
            </button>
            <button type="submit" disabled={loading} className="brand-button min-w-36">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t('common.saving', 'Enregistrement...')}
                </>
              ) : course ? t('courses.form.update', 'Mettre à jour') : t('courses.form.create', 'Créer le cours')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;
