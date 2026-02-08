import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Course, Semester, Student } from '../../types';
import { gradesService } from '../../services/gradesService';
import ImportGradesModal from './ImportGradesModal';
import StudentGradesViewModal from './StudentGradesViewModal';

interface CourseGrade {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  course: number;
  course_name: string;
  course_code: string;
  semester: number;
  semester_name?: string;
  final_score: string;
  grade_letter: string;
  is_validated: boolean;
}

interface IndividualGrade {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  exam: number;
  exam_type: string;
  exam_type_display: string;
  course_name: string;
  course_code: string;
  score: string;
  max_score: string;
  is_absent: boolean;
  remarks: string;
  graded_at: string;
}

interface BulletinCourse {
  course_name: string;
  course_code: string;
  credits: number;
  coefficient: number;
  final_score: string;
  grade_letter: string;
  evaluations: {
    name: string;
    score: string;
    max_score: string;
    weight: string;
  }[];
  class_avg: number;
  class_max: number;
  class_min: number;
  rank: number | string;
  total_students: number;
}

interface BulletinData {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  student_program: string;
  program_code: string;
  student_level: string;
  semester: number;
  semester_name: string;
  academic_year: string;
  gpa: string;
  total_credits: number;
  credits_earned: number;
  rank: number;
  courses: BulletinCourse[];
  generated_at: string;
  generated_by_name: string;
  is_published: boolean;
}

interface GradeInput {
  student: Student;
  score: string;
  is_absent: boolean;
  remarks: string;
  existingGradeId?: number;
}

type EvaluationType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL' | 'PROJECT' | 'ORAL' | 'RESIT';

const EVALUATION_TYPES_LIST: EvaluationType[] = [
  'MIDTERM', 'FINAL', 'QUIZ', 'PRACTICAL', 'PROJECT', 'ORAL', 'RESIT'
];

interface Exam {
  id: number;
  course: number;
  semester: number;
  exam_type: EvaluationType;
  title?: string;
  date?: string;
  max_score: number;
}

const GradesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Data state
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [individualGrades, setIndividualGrades] = useState<IndividualGrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'final' | 'evaluation'>('final');

  // Filter state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedEvalType, setSelectedEvalType] = useState<EvaluationType>('MIDTERM');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Grade entry state
  const [showGradeModal, setShowGradeModal] = useState(false); // Exam state for grade entry
  const [existingExams, setExistingExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [maxScore, setMaxScore] = useState('20');

  // Filter state for exams
  const [examsForFilter, setExamsForFilter] = useState<Exam[]>([]);
  const [filterExamId, setFilterExamId] = useState<string>('');

  // Fetch exams for filter dropdown
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedCourse || !selectedSemester) {
        setExamsForFilter([]);
        return;
      }
      try {
        const params: any = { course: selectedCourse, semester: selectedSemester, page_size: 50 };
        if (selectedEvalType) params.exam_type = selectedEvalType;
        const res = await api.get('/academics/exams/', { params });
        setExamsForFilter(res.data.results || res.data);
      } catch (err) {
        console.error('Error fetching exams for filter:', err);
      }
    };
    fetchExams();
  }, [selectedCourse, selectedSemester, selectedEvalType]);
  const [gradeInputs, setGradeInputs] = useState<GradeInput[]>([]);

  // Bulletin & Modals state
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [bulletinData, setBulletinData] = useState<BulletinData | null>(null);
  const [generatingBulletin, setGeneratingBulletin] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  const formatSemesterName = (sem: Semester) => {
    const typeLabel = sem.semester_type === 'S1' ? t('common.s1', 'Semestre 1') : t('common.s2', 'Semestre 2');
    return `${typeLabel} (${sem.academic_year_name || sem.academic_year})`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [coursesRes, semestersRes, studentsRes] = await Promise.all([
          api.get('/academics/courses/', { params: { page_size: 100 } }),
          api.get('/university/semesters/', { params: { page_size: 50 } }),
          api.get('/students/', { params: { page_size: 500, status: 'ACTIVE' } })
        ]);
        setCourses(coursesRes.data.results || coursesRes.data);
        setSemesters(semestersRes.data.results || semestersRes.data);
        setAllStudents(studentsRes.data.results || studentsRes.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchGrades = useCallback(async () => {
    if (!selectedCourse || !selectedSemester) {
      setGrades([]);
      setIndividualGrades([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'final') {
        const params: any = { course: selectedCourse, semester: selectedSemester, page_size: 200 };
        if (selectedStudentId) params.student = selectedStudentId;

        const response = await api.get('/academics/course-grades/', { params });
        setGrades(response.data.results || response.data);
      } else {
        const examParams: any = { course: selectedCourse, semester: selectedSemester, page_size: 100 };
        if (selectedEvalType) examParams.exam_type = selectedEvalType;

        // Use examsForFilter if available to avoid double fetch, but best to rely on fresh fetch or current logic
        const examsRes = await api.get('/academics/exams/', { params: examParams });
        let exams: Exam[] = examsRes.data.results || examsRes.data;

        // Filter by selected exam if set
        if (filterExamId) {
          exams = exams.filter(e => e.id.toString() === filterExamId);
        }

        if (exams.length > 0) {
          const gradesPromises = exams.map((exam: Exam) =>
            api.get('/academics/grades/', { params: { exam: exam.id, page_size: 200, student: selectedStudentId || undefined } })
          );
          const gradesResponses = await Promise.all(gradesPromises);

          const allGrades: IndividualGrade[] = [];
          gradesResponses.forEach((res, idx) => {
            const currentExam = exams[idx];
            const examGrades = (res.data.results || res.data).map((g: any) => ({
              ...g,
              exam_type: currentExam.exam_type,
              exam_type_display: t(`grades.eval_types.${currentExam.exam_type.toLowerCase()}`, currentExam.exam_type),
              course_name: currentExam.title ? `${currentExam.title} (${currentExam.exam_type})` : (courses.find(c => c.id === currentExam.course)?.name || 'N/A'),
              course_code: courses.find(c => c.id === currentExam.course)?.code || 'N/A',
              max_score: currentExam.max_score.toString(), // Ensure max_score is passed
            }));
            allGrades.push(...examGrades);
          });
          setIndividualGrades(allGrades);
        } else {
          setIndividualGrades([]);
        }
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(t('grades.error_loading', 'Erreur lors du chargement des notes'));
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedSemester, viewMode, selectedStudentId, selectedEvalType, filterExamId, courses, t]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const openGradeModal = async () => {
    if (!selectedCourse || !selectedSemester) {
      setError(t('grades.empty', 'Veuillez sélectionner un cours et un semestre'));
      return;
    }

    setLoading(true);
    try {
      const course = courses.find(c => c.id === parseInt(selectedCourse));
      if (!course) return;

      const examsRes = await api.get('/academics/exams/', {
        params: { course: selectedCourse, semester: selectedSemester, page_size: 50 }
      });
      setExistingExams(examsRes.data.results || examsRes.data);

      const studentsRes = await api.get('/students/', {
        params: { program: course.program, current_level: course.level || undefined, status: 'ACTIVE', page_size: 200 }
      });
      const studentsList = studentsRes.data.results || studentsRes.data;

      setGradeInputs(studentsList.map((s: Student) => ({
        student: s, score: '', is_absent: false, remarks: '', existingGradeId: undefined
      })));

      setSelectedExamId(null);
      setExamTitle('');
      setMaxScore('20');
      setShowGradeModal(true);
    } catch (err) {
      console.error('Error opening grade modal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (examId: number | null) => {
    setSelectedExamId(examId);
    if (examId) {
      try {
        const gradesRes = await api.get('/academics/grades/', { params: { exam: examId, page_size: 200 } });
        const existingGrades = gradesRes.data.results || gradesRes.data;
        const exam = existingExams.find(e => e.id === examId);

        setGradeInputs(prev => prev.map(input => {
          const existing = existingGrades.find((g: any) => g.student === input.student.id);
          return existing ? {
            ...input,
            score: existing.score?.toString() || '',
            is_absent: existing.is_absent,
            remarks: existing.remarks || '',
            existingGradeId: existing.id
          } : { ...input, score: '', is_absent: false, remarks: '', existingGradeId: undefined };
        }));

        if (exam) {
          setSelectedEvalType(exam.exam_type);
          setMaxScore(exam.max_score.toString());
        }
      } catch (err) {
        console.error('Error fetching exam grades:', err);
      }
    }
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      let examId = selectedExamId;
      if (!examId) {
        const examRes = await api.post('/academics/exams/', {
          course: parseInt(selectedCourse),
          semester: parseInt(selectedSemester),
          exam_type: selectedEvalType,
          title: examTitle || `${t(`grades.eval_types.${selectedEvalType.toLowerCase()}`)} - ${new Date().toLocaleDateString()}`,
          max_score: parseFloat(maxScore),
          date: new Date().toISOString().split('T')[0],
          start_time: '08:00:00',
          end_time: '10:00:00'
        });
        examId = examRes.data.id;
      }

      const promises = gradeInputs
        .filter(input => input.score !== '' || input.is_absent)
        .map(input => {
          const payload = {
            student: input.student.id,
            exam: examId,
            score: input.is_absent ? 0 : parseFloat(input.score),
            is_absent: input.is_absent,
            remarks: input.remarks
          };
          return input.existingGradeId
            ? api.patch(`/academics/grades/${input.existingGradeId}/`, payload)
            : api.post('/academics/grades/', payload);
        });

      await Promise.all(promises);
      setSuccess(t('common.success', 'Succès'));
      setShowGradeModal(false);
      fetchGrades();
    } catch (err) {
      setError(t('common.error_occurred', 'Erreur lors de l\'enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const calculateFinalGrades = async () => {
    setLoading(true);
    try {
      await api.post('/academics/course-grades/calculate_final_grades/', {
        course_id: selectedCourse,
        semester_id: selectedSemester
      });
      setSuccess(t('grades.calculate_success', 'Calcul effectué'));
      fetchGrades();
    } catch (err) {
      setError(t('grades.error_calculating', 'Erreur lors du calcul'));
    } finally {
      setLoading(false);
    }
  };

  const generateBulletin = async (studentId: number) => {
    if (!selectedSemester) return;
    setGeneratingBulletin(true);
    try {
      // 1. Check if report card already exists
      let reportCardId;
      try {
        const checkRes = await api.get('/academics/report-cards/', {
          params: { student: studentId, semester: selectedSemester }
        });
        if (checkRes.data.results && checkRes.data.results.length > 0) {
          reportCardId = checkRes.data.results[0].id;
        } else if (Array.isArray(checkRes.data) && checkRes.data.length > 0) {
          reportCardId = checkRes.data[0].id;
        }
      } catch (e) {
        console.warn('Could not check existing report card', e);
      }

      // 2. If not found, create new one
      if (!reportCardId) {
        const createRes = await api.post('/academics/report-cards/', {
          student: studentId,
          semester: parseInt(selectedSemester)
        });
        reportCardId = createRes.data.id;
      }

      // 3. Calculate GPA to ensure fresh data
      await api.post(`/academics/report-cards/${reportCardId}/calculate_gpa/`);

      // 4. Fetch the full detailed report card (with courses and stats)
      const detailRes = await api.get(`/academics/report-cards/${reportCardId}/`);

      setBulletinData(detailRes.data);
      setShowBulletinModal(true);
    } catch (err) {
      console.error('Bulletin error:', err);
      setError(t('grades.errors.bulletin_failed', 'Erreur lors de la génération du bulletin'));
    } finally {
      setGeneratingBulletin(false);
    }
  };

  const downloadBulletinPDF = async () => {
    if (!bulletinData) return;
    try {
      const res = await api.get(`/academics/report-cards/${bulletinData.id}/download_pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bulletin_${bulletinData.student_matricule}.pdf`;
      link.click();
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  const getMention = (score: number) => {
    if (score >= 16) return { label: t('grades.mentions.excellent'), color: 'text-green-700 bg-green-100' };
    if (score >= 14) return { label: t('grades.mentions.very_good'), color: 'text-green-600 bg-green-50' };
    if (score >= 12) return { label: t('grades.mentions.good'), color: 'text-blue-600 bg-blue-100' };
    if (score >= 10) return { label: t('grades.mentions.fair'), color: 'text-yellow-600 bg-yellow-100' };
    return { label: t('grades.mentions.fail'), color: 'text-red-600 bg-red-100' };
  };

  const renderTeacherView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.course', 'Cours')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">{t('grades.placeholders.select_course')}</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.semester', 'Semestre')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="">{t('grades.placeholders.select_semester')}</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{formatSemesterName(s)}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.eval_type', 'Type')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedEvalType} onChange={(e) => { setSelectedEvalType(e.target.value as EvaluationType); setFilterExamId(''); }}>
              <option value="">{t('common.all', 'Tous')}</option>
              {EVALUATION_TYPES_LIST.map(type => <option key={type} value={type}>{t(`grades.eval_types.${type.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.exam', 'Examen (Optionnel)')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={filterExamId} onChange={(e) => setFilterExamId(e.target.value)} disabled={!selectedCourse || !selectedSemester}>
              <option value="">{t('grades.placeholders.all_exams', 'Tous les examens')}</option>
              {examsForFilter.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title || `${e.exam_type} - ${e.date || ''}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.search_student', 'Recherche')}</label>
            <input
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder={t('grades.placeholders.student_search')}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('final')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'final' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-600'}`}>{t('grades.buttons.final_grades')}</button>
            <button onClick={() => setViewMode('evaluation')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'evaluation' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-600'}`}>{t('grades.buttons.by_evaluation')}</button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => {
                if (filterExamId) {
                  setShowImportModal(true);
                  setSelectedExamId(parseInt(filterExamId));
                } else {
                  setError(t('grades.errors.select_exam_for_import', 'Veuillez sélectionner un examen spécifique pour l\'importation'));
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              disabled={!filterExamId}
            >
              📥 {t('grades.buttons.import_excel')}
            </button>
            <button
              onClick={async () => {
                if (!filterExamId) {
                  setError(t('grades.errors.select_exam_for_export', 'Veuillez sélectionner un examen spécifique pour l\'exportation'));
                  return;
                }
                try {
                  const blob = await gradesService.exportGrades(parseInt(filterExamId));
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'export_notes.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode?.removeChild(link);
                } catch (err) {
                  console.error(err);
                  setError(t('common.error', 'Erreur lors de l\'export'));
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!filterExamId}
            >
              📤 {t('grades.buttons.export_excel')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{viewMode === 'final' ? t('grades.title_final') : t('grades.title_evaluation')}</h3>
          <div className="flex gap-2">
            <button onClick={openGradeModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">{t('grades.buttons.enter_grades')}</button>
            {viewMode === 'final' && <button onClick={calculateFinalGrades} className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">{t('grades.buttons.calculate_final')}</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-3 text-left tracking-wider">{t('grades.table.matricule')}</th>
                <th className="px-6 py-3 text-left tracking-wider">{t('grades.table.name')}</th>
                {viewMode === 'evaluation' && <th className="px-6 py-3 text-left tracking-wider">{t('grades.table.exam', 'Examen')}</th>}
                <th className="px-6 py-3 text-center tracking-wider">{t('grades.table.score')}</th>
                <th className="px-6 py-3 text-center tracking-wider">{t('grades.table.mention')}</th>
                <th className="px-6 py-3 text-center tracking-wider">{t('grades.table.bulletin')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(viewMode === 'final' ? grades : individualGrades).map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50 text-sm transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-600">{g.student_matricule}</td>
                  <td
                    className="px-6 py-4 font-medium text-gray-900 hover:text-indigo-600 cursor-pointer"
                    onClick={() => {
                      const student = allStudents.find(s => s.id === g.student);
                      if (student) {
                        setHistoryStudent(student);
                        setShowHistoryModal(true);
                      }
                    }}
                  >
                    {g.student_name}
                  </td>
                  {viewMode === 'evaluation' && (
                    <td className="px-6 py-4 text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{g.exam_type_display}</span>
                      {g.course_name && <span className="ml-2 text-xs text-gray-500 block">{g.course_name}</span>}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center font-bold text-gray-800">
                    {viewMode === 'final' ? `${parseFloat(g.final_score).toFixed(2)}/20` : (g.is_absent ? <span className="text-red-500">ABS</span> : `${parseFloat(g.score).toFixed(2)}/${g.max_score || 20}`)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const s = viewMode === 'final' ? parseFloat(g.final_score) : parseFloat(g.score);
                      const max = viewMode === 'final' ? 20 : parseFloat(g.max_score || '20');
                      const normalized = (s / max) * 20;
                      const m = getMention(normalized);
                      return <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.color}`}>{m.label}</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {viewMode === 'final' && <button onClick={() => generateBulletin(g.student)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50">{t('grades.buttons.generate')}</button>}
                  </td>
                </tr>
              ))}
              {(viewMode === 'final' ? grades : individualGrades).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('common.no_data', 'Aucune note disponible')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStudentView = () => (
    <div className="space-y-6">
      <select className="px-3 py-2 border rounded-lg" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
        <option value="">{t('grades.placeholders.select_semester')}</option>
        {semesters.map(s => <option key={s.id} value={s.id}>{formatSemesterName(s)}</option>)}
      </select>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="px-6 py-3 text-left">{t('grades.table.course')}</th>
              <th className="px-6 py-3 text-center">{t('grades.table.score')}</th>
              <th className="px-6 py-3 text-center">{t('grades.table.mention')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {grades.map(g => (
              <tr key={g.id}>
                <td className="px-6 py-4">{g.course_name}</td>
                <td className="px-6 py-4 text-center font-bold">{parseFloat(g.final_score).toFixed(2)}/20</td>
                <td className="px-6 py-4 text-center">{getMention(parseFloat(g.final_score)).label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {user?.role === 'STUDENT' ? t('grades.student.title', 'Mes Notes') : t('grades.title', 'Gestion des Notes')}
        </h1>
      </div>

      {user?.role === 'STUDENT' ? renderStudentView() : renderTeacherView()}

      {/* Grade Entry Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
              <h3 className="text-xl font-bold">{t('grades.buttons.enter_grades')}</h3>
              <button onClick={() => setShowGradeModal(false)} className="text-2xl font-bold">&times;</button>
            </div>

            {/* Modal Input Fields with Labels */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('grades.labels.existing_exam', 'Examen Existant')}</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedExamId || ''} onChange={(e) => handleExamSelect(e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">-- {t('grades.placeholders.new_exam', 'Créer un nouvel examen')} --</option>
                    {existingExams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_type} - {ex.title}</option>)}
                  </select>
                </div>

                {!selectedExamId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('grades.labels.exam_title', 'Titre / Description')}</label>
                    <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder={t('grades.placeholders.exam_title')} value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('grades.labels.max_score', 'Note Maximale')}</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 uppercase text-xs">
                    <th className="px-4 py-2 text-left">{t('grades.table.student')}</th>
                    <th className="px-4 py-2 text-center">{t('grades.table.score', 'Note')}{selectedExamId ? ` (/${maxScore})` : ''}</th>
                    <th className="px-4 py-2 text-center">{t('grades.table.absent')}</th>
                    <th className="px-4 py-2 text-left">{t('grades.table.remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gradeInputs.map((input, idx) => (
                    <tr key={input.student.id}>
                      <td className="px-4 py-3">
                        <div className="font-bold">{input.student.user_full_name}</div>
                        <div className="text-xs text-gray-500">{input.student.student_id}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" step="0.5" className="w-20 px-2 py-1 border rounded text-center focus:ring-indigo-500" value={input.score} onChange={(e) => {
                          const updated = [...gradeInputs];
                          updated[idx].score = e.target.value;
                          setGradeInputs(updated);
                        }} disabled={input.is_absent} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={input.is_absent} onChange={(e) => {
                          const updated = [...gradeInputs];
                          updated[idx].is_absent = e.target.checked;
                          setGradeInputs(updated);
                        }} />
                      </td>
                      <td className="px-4 py-3">
                        <input className="w-full px-2 py-1 border rounded focus:ring-indigo-500" value={input.remarks} onChange={(e) => {
                          const updated = [...gradeInputs];
                          updated[idx].remarks = e.target.value;
                          setGradeInputs(updated);
                        }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowGradeModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">{t('common.cancel')}</button>
              <button onClick={saveGrades} disabled={saving} className="px-8 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulletin Modal */}
      {showBulletinModal && bulletinData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] flex flex-col relative my-8">
            {/* Close Button */}
            <button
              onClick={() => setShowBulletinModal(false)}
              className="absolute -right-12 top-0 text-white text-3xl hover:text-gray-200 transition-colors"
              title={t('common.close')}
            >
              &times;
            </button>

            {/* A4 Content Container */}
            <div className="p-[15mm] flex-1 flex flex-col font-sans text-gray-800">

              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    UM
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-indigo-900 uppercase tracking-widest leading-tight">University<br />Management</h1>
                    <p className="text-xs text-sim font-medium text-gray-500 mt-1 uppercase tracking-wide">Excellence & Innovation</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wide mb-1">{t('grades.bulletin.title', 'Bulletin de Notes')}</h2>
                  <div className="inline-block px-3 py-1 bg-indigo-50 rounded text-indigo-700 font-medium text-sm">
                    {bulletinData.semester_name} • {bulletinData.academic_year}
                  </div>
                </div>
              </div>

              {/* Student Info Grid */}
              <div className="bg-gray-50 p-6 rounded-sm border-l-4 border-indigo-600 mb-8 grid grid-cols-2 gap-8 shadow-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{t('grades.table.student')}</p>
                  <p className="text-lg font-bold text-gray-900">{bulletinData.student_name}</p>
                  <p className="text-xs text-gray-600 font-mono mt-0.5">ID: {bulletinData.student_matricule}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{t('students.table.program')}</p>
                  <p className="text-base font-semibold text-gray-800">{bulletinData.student_program}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{t('students.table.level')}: {bulletinData.student_level}</p>
                </div>
              </div>

              {/* Grades Table */}
              <div className="mb-8 flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-indigo-900 text-white text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-3 text-left w-1/4 rounded-tl-sm">{t('grades.table.course')}</th>
                      <th className="py-3 px-1 text-center w-12">Coeff</th>
                      <th className="py-3 px-1 text-center w-12">Credits</th>
                      <th className="py-3 px-3 text-left">{t('grades.table.evaluations', 'Évaluations')}</th>
                      <th className="py-3 px-3 text-center w-24">{t('grades.history.avg', 'Moyenne')}</th>
                      <th className="py-3 px-2 text-center w-24">Stats</th>
                      <th className="py-3 px-2 text-center w-16 rounded-tr-sm">{t('grades.table.mention')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {bulletinData.courses.map((course, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-gray-800 leading-tight mb-0.5">{course.course_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{course.course_code}</div>
                        </td>
                        <td className="py-3 px-1 text-center align-top text-gray-500">{course.coefficient}</td>
                        <td className="py-3 px-1 text-center align-top text-gray-500">{course.credits}</td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {course.evaluations.map((ev, i) => (
                              <span key={i} className="inline-flex items-center text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                                <span className="font-semibold mr-1">{ev.name}:</span>
                                {parseFloat(ev.score).toFixed(1)} <span className="text-gray-300 mx-0.5">/</span> {parseFloat(ev.max_score).toFixed(0)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center align-top">
                          <div className="font-bold text-gray-900 text-sm">
                            {parseFloat(course.final_score).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-400">/ 20</div>
                        </td>
                        <td className="py-3 px-2 text-center align-top text-[10px]">
                          <div className="text-gray-500 mb-0.5">Av: {course.class_avg}</div>
                          <div className="font-bold text-indigo-600 bg-indigo-50 inline-block px-1.5 rounded-sm">R: {course.rank}/{course.total_students}</div>
                        </td>
                        <td className="py-3 px-2 text-center align-top">
                          <span className={`inline-block w-6 h-6 leading-6 rounded-full text-[10px] font-bold ${parseFloat(course.final_score) >= 10
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-50 text-red-600'
                            }`}>
                            {course.grade_letter}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="mt-8 bg-gray-50 border-t-2 border-indigo-900 p-6 rounded-sm">
                <div className="grid grid-cols-4 gap-6 text-center divide-x divide-gray-200">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('grades.history.avg')}</p>
                    <p className="text-3xl font-bold text-indigo-900">{bulletinData.gpa}<span className="text-sm text-gray-400 font-normal">/20</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Credits</p>
                    <p className="text-2xl font-bold text-gray-800">{bulletinData.credits_earned} <span className="text-sm text-gray-400 font-normal">/ {bulletinData.total_credits}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Rank</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-indigo-600">#{bulletinData.rank}</span>
                      {bulletinData.rank === 1 && <span className="text-xl">🏆</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Decision</p>
                    <p className={`text-xl font-bold uppercase tracking-wide ${parseFloat(bulletinData.gpa) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(bulletinData.gpa) >= 10 ? 'ADMIS' : 'AJOURNÉ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-16 grid grid-cols-2 gap-20">
                <div className="border-t border-gray-300 pt-4 text-center">
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-8">L'Étudiant(e)</p>
                </div>
                <div className="border-t border-gray-300 pt-4 text-center">
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-8">Le Doyen / L'Administration</p>
                  <div className="text-[10px] text-gray-400 text-right mt-2 flex justify-end items-center gap-1">
                    Generated via UMS • {new Date(bulletinData.generated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-gray-900/95 text-white flex justify-between items-center backdrop-blur shadow-2xl sticky bottom-0 z-10">
              <div className="text-sm opacity-75 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Professional Preview Mode
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowBulletinModal(false)} className="px-6 py-2 border border-gray-600 rounded hover:bg-gray-800 transition text-sm">
                  {t('common.close')}
                </button>
                <button onClick={downloadBulletinPDF} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded shadow-lg font-bold flex items-center gap-2 text-sm transition-transform active:scale-95">
                  <span>🖨️</span> {t('grades.buttons.download_pdf', 'Télécharger PDF')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modals */}
      <ImportGradesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        examId={selectedExamId || 0}
        onSuccess={fetchGrades}
      />
      {historyStudent && (
        <StudentGradesViewModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          student={historyStudent}
        />
      )}
    </div>
  );
};

export default GradesPage;
