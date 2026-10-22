import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarSquareIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { gradesService, Grade, StudentGradeHistory } from '../../services/gradesService';
import { Student } from '../../types';
import { EntityAvatar, StatusPill } from '../../components/common/EntityDisplay';
import { normalizeApiError } from '../../utils/apiError';

interface StudentGradesViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

const percentageOf = (grade: Grade): number => {
  const supplied = Number(grade.percentage);
  if (Number.isFinite(supplied)) return Math.max(0, Math.min(100, supplied));
  const maxScore = Number(grade.max_score || 20);
  return maxScore > 0 ? Math.max(0, Math.min(100, Number(grade.score || 0) / maxScore * 100)) : 0;
};

const scoreOutOf20 = (grade: Grade): number => percentageOf(grade) / 5;

interface ProgressionChartProps {
  grades: Grade[];
  average: number;
}

const ProgressionChart: React.FC<ProgressionChartProps> = ({ grades, average }) => {
  const { t, i18n } = useTranslation();
  const width = 920;
  const height = 310;
  const padding = { top: 28, right: 28, bottom: 62, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = grades.map((grade) => grade.is_absent ? 0 : scoreOutOf20(grade));
  const points = values.map((value, index) => ({
    x: grades.length <= 1 ? padding.left + plotWidth / 2 : padding.left + index / (grades.length - 1) * plotWidth,
    y: padding.top + (20 - value) / 20 * plotHeight,
    value,
    grade: grades[index],
  }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
    : '';
  const yForScore = (score: number) => padding.top + (20 - score) / 20 * plotHeight;
  const labelEvery = Math.max(1, Math.ceil(grades.length / 8));

  if (grades.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400">
        {t('grades.progress.no_chart_data', 'Aucune évaluation pour ces filtres.')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[760px] w-full" role="img" aria-label={t('grades.progress.chart_title', 'Progression des notes')}>
        <defs>
          <linearGradient id="gradeProgressArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4C91" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1A4C91" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 5, 10, 15, 20].map((score) => (
          <g key={score}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yForScore(score)}
              y2={yForScore(score)}
              stroke={score === 10 ? '#E59741' : '#e2e8f0'}
              strokeDasharray={score === 10 ? '7 6' : undefined}
            />
            <text x={padding.left - 12} y={yForScore(score) + 4} textAnchor="end" fill="#64748b" fontSize="12" fontWeight="700">{score}</text>
          </g>
        ))}

        {average > 0 && (
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yForScore(average)}
            y2={yForScore(average)}
            stroke="#1BAB53"
            strokeDasharray="4 5"
            strokeWidth="2"
          />
        )}

        {areaPath && <path d={areaPath} fill="url(#gradeProgressArea)" />}
        {linePath && <path d={linePath} fill="none" stroke="#1A4C91" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}

        {points.map((point, index) => {
          const date = new Date(`${point.grade.exam_date || point.grade.graded_at}`);
          const showLabel = index % labelEvery === 0 || index === points.length - 1;
          return (
            <g key={point.grade.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill={point.grade.is_absent ? '#94a3b8' : point.value >= 10 ? '#1BAB53' : '#DC2626'}
                stroke="white"
                strokeWidth="3"
              >
                <title>{`${point.grade.course_code} · ${point.grade.exam_type_display}: ${point.grade.is_absent ? t('grades.table.absent', 'Absent') : `${point.value.toFixed(2)}/20`}`}</title>
              </circle>
              {showLabel && (
                <text x={point.x} y={height - 34} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700">
                  {Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short' }).format(date)}
                </text>
              )}
            </g>
          );
        })}
        <text x={width - padding.right} y={yForScore(10) - 8} textAnchor="end" fill="#9a5b17" fontSize="11" fontWeight="700">
          {t('grades.progress.pass_mark', 'Seuil de validation · 10/20')}
        </text>
      </svg>
    </div>
  );
};

const StudentGradesViewModal: React.FC<StudentGradesViewModalProps> = ({ isOpen, onClose, student }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<StudentGradeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await gradesService.getStudentHistory(student.id);
      setHistory(data);
    } catch (requestError) {
      const responseData = (requestError as { response?: { data?: unknown } }).response?.data;
      setError(normalizeApiError(responseData, t('grades.progress.load_error', 'Impossible de charger la progression de cet étudiant.')).message);
    } finally {
      setLoading(false);
    }
  }, [student.id, t]);

  useEffect(() => {
    if (isOpen) {
      setCourseFilter('');
      setTypeFilter('');
      fetchHistory();
    }
  }, [fetchHistory, isOpen]);

  const orderedGrades = useMemo(() => [...(history?.grades || [])].sort((left, right) => {
    const leftDate = new Date(left.exam_date || left.graded_at).getTime();
    const rightDate = new Date(right.exam_date || right.graded_at).getTime();
    return leftDate - rightDate;
  }), [history?.grades]);

  const courses = useMemo(() => Array.from(new Map(
    orderedGrades.map((grade) => [grade.course_code, { code: grade.course_code, name: grade.course_name }]),
  ).values()), [orderedGrades]);

  const evaluationTypes = useMemo(() => Array.from(new Map(
    orderedGrades.map((grade) => [grade.exam_type, { type: grade.exam_type, label: grade.exam_type_display }]),
  ).values()), [orderedGrades]);

  const filteredGrades = useMemo(() => orderedGrades.filter((grade) => (
    (!courseFilter || grade.course_code === courseFilter)
    && (!typeFilter || grade.exam_type === typeFilter)
  )), [courseFilter, orderedGrades, typeFilter]);

  const filteredAverage = useMemo(() => {
    const values = filteredGrades.filter((grade) => !grade.is_absent).map(scoreOutOf20);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [filteredGrades]);

  if (!isOpen) return null;

  const trend = Number(history?.stats.trend_delta || 0);
  const stats = history?.stats;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/30">
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-green-700 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -end-10 -top-20 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <div className="absolute bottom-0 start-0 h-1 w-full bg-gradient-to-r from-green-400 via-orange-400 to-orange-600" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <EntityAvatar name={student.user_full_name} src={student.photo} tone="green" size="lg" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">{t('grades.progress.eyebrow', 'Progression académique')}</p>
                <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{student.user_full_name}</h2>
                <p className="mt-1 truncate text-sm text-blue-100">{student.student_id} · {student.program_name} · {student.level_display}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white" aria-label={t('common.close', 'Fermer')}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : error ? (
            <div className="surface-panel flex flex-col items-center px-6 py-16 text-center">
              <p className="max-w-md text-sm font-semibold text-red-600">{error}</p>
              <button type="button" onClick={fetchHistory} className="brand-button-secondary mt-5">{t('common.retry', 'Réessayer')}</button>
            </div>
          ) : history ? (
            <div className="space-y-6">
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: t('grades.progress.average', 'Moyenne normalisée'), value: `${Number(stats?.avg_score || 0).toFixed(2)}/20`, tone: 'text-blue-700', icon: <AcademicCapIcon className="h-5 w-5" /> },
                  { label: t('grades.progress.pass_rate', 'Taux de réussite'), value: `${Number(stats?.pass_rate || 0).toFixed(1)}%`, tone: 'text-green-700', icon: <ClipboardDocumentCheckIcon className="h-5 w-5" /> },
                  { label: t('grades.progress.evaluations', 'Évaluations'), value: String(stats?.total_exams || 0), tone: 'text-brand-earth', icon: <ChartBarSquareIcon className="h-5 w-5" /> },
                  { label: t('grades.progress.trend', 'Tendance récente'), value: `${trend > 0 ? '+' : ''}${trend.toFixed(2)}`, tone: trend >= 0 ? 'text-green-700' : 'text-red-600', icon: trend >= 0 ? <ArrowTrendingUpIcon className="h-5 w-5" /> : <ArrowTrendingDownIcon className="h-5 w-5" /> },
                ].map((item) => (
                  <article key={item.label} className="surface-panel p-4 sm:p-5">
                    <div className={`flex items-center gap-2 ${item.tone}`}>{item.icon}<span className="text-xs font-black uppercase tracking-wide">{item.label}</span></div>
                    <p className={`mt-3 text-2xl font-black ${item.tone}`}>{item.value}</p>
                  </article>
                ))}
              </section>

              <section className="surface-panel overflow-hidden">
                <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="brand-kicker">{t('grades.progress.timeline', 'Chronologie')}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{t('grades.progress.chart_title', 'Progression des examens et tests')}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t('grades.progress.chart_hint', 'Toutes les notes sont ramenées sur 20 pour permettre une comparaison juste.')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="brand-input min-w-0 sm:w-52">
                      <option value="">{t('grades.progress.all_courses', 'Tous les cours')}</option>
                      {courses.map((course) => <option key={course.code} value={course.code}>{course.code} — {course.name}</option>)}
                    </select>
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="brand-input min-w-0 sm:w-48">
                      <option value="">{t('grades.progress.all_types', 'Tous les types')}</option>
                      {evaluationTypes.map((type) => <option key={type.type} value={type.type}>{type.label}</option>)}
                    </select>
                  </div>
                </header>
                <div className="p-4 sm:p-6">
                  <ProgressionChart grades={filteredGrades} average={filteredAverage} />
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />{t('grades.progress.passed', 'Validé')}</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />{t('grades.progress.not_passed', 'Sous la moyenne')}</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />{t('grades.progress.absent', 'Absent')}</span>
                    <span className="ms-auto text-slate-400">{filteredGrades.length} {t('grades.progress.results', 'résultat(s)')}</span>
                  </div>
                </div>
              </section>

              {(history.type_breakdown || []).length > 0 && (
                <section className="surface-panel p-5">
                  <h3 className="text-base font-black text-slate-950">{t('grades.progress.by_type', 'Performance par type d’évaluation')}</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {history.type_breakdown.map((item) => (
                      <div key={item.type} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <StatusPill tone={item.average_score >= 10 ? 'green' : 'orange'}>{item.label}</StatusPill>
                          <span className="text-xs font-bold text-slate-400">{item.count}×</span>
                        </div>
                        <p className="mt-3 text-2xl font-black text-slate-950">{Number(item.average_score).toFixed(2)}<span className="text-sm text-slate-400">/20</span></p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full ${item.average_score >= 10 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, item.average_score / 20 * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="surface-panel overflow-hidden">
                <header className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-black text-slate-950">{t('grades.progress.details', 'Détail des évaluations')}</h3>
                </header>
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {[...filteredGrades].reverse().map((grade) => (
                    <article key={grade.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-black text-slate-900">{grade.course_name}</p><p className="mt-1 text-xs font-bold text-blue-700">{grade.course_code} · {grade.exam_type_display}</p></div>
                        <p className={`text-lg font-black ${grade.is_absent ? 'text-slate-500' : scoreOutOf20(grade) >= 10 ? 'text-green-700' : 'text-red-600'}`}>{grade.is_absent ? 'ABS' : `${scoreOutOf20(grade).toFixed(2)}/20`}</p>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(grade.exam_date || grade.graded_at))}</p>
                      {grade.remarks && <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">{grade.remarks}</p>}
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead><tr>
                      <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-500">{t('grades.labels.course', 'Cours')}</th>
                      <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-500">{t('grades.labels.eval_type', 'Type')}</th>
                      <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">{t('grades.table.score', 'Note')}</th>
                      <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-500">{t('common.date', 'Date')}</th>
                      <th className="px-5 py-3 text-start text-xs font-black uppercase tracking-wide text-slate-500">{t('grades.table.remarks', 'Remarques')}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...filteredGrades].reverse().map((grade) => (
                        <tr key={grade.id}>
                          <td className="px-5 py-4"><p className="font-black text-slate-900">{grade.course_name}</p><p className="text-xs font-bold text-blue-700">{grade.course_code}</p></td>
                          <td className="px-5 py-4"><StatusPill tone="blue">{grade.exam_type_display}</StatusPill></td>
                          <td className="px-5 py-4 text-center"><span className={`text-base font-black ${grade.is_absent ? 'text-slate-500' : scoreOutOf20(grade) >= 10 ? 'text-green-700' : 'text-red-600'}`}>{grade.is_absent ? 'ABS' : `${scoreOutOf20(grade).toFixed(2)}/20`}</span><p className="text-xs text-slate-400">{grade.score}/{grade.max_score}</p></td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">{new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(grade.exam_date || grade.graded_at))}</td>
                          <td className="max-w-xs px-5 py-4 text-sm text-slate-500">{grade.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudentGradesViewModal;
