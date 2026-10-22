import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon, ChartBarSquareIcon, ClipboardDocumentCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Course, Semester, Student, AcademicYear, Level } from '../../types';
import { gradesService } from '../../services/gradesService';
import ImportGradesModal from './ImportGradesModal';
import StudentGradesViewModal from './StudentGradesViewModal';
import PageHeader from '../../components/common/PageHeader';

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

// Curriculum semesters S1-S6 = course Level order (L1/L2/L3) x academic-year
// semester (S1/S2). The grade still persists to the underlying year Semester.
const CURRICULUM_SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const;
type CurriculumSemester = typeof CURRICULUM_SEMESTERS[number];
const SEM_MAP: Record<CurriculumSemester, { order: number; yearType: 'S1' | 'S2' }> = {
  S1: { order: 1, yearType: 'S1' }, S2: { order: 1, yearType: 'S2' },
  S3: { order: 2, yearType: 'S1' }, S4: { order: 2, yearType: 'S2' },
  S5: { order: 3, yearType: 'S1' }, S6: { order: 3, yearType: 'S2' },
};
// Resolve a curriculum semester code (S1-S6) to the real academic-year Semester id.
const yearSemId = (code: string, semesters: Semester[]): number | '' => {
  const m = SEM_MAP[code as CurriculumSemester];
  if (!m) return '';
  const s = semesters.find(x => x.semester_type === m.yearType);
  return s ? s.id : '';
};

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
  const { t } = useTranslation();
  const { user } = useAuth();

  // Data state
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [individualGrades, setIndividualGrades] = useState<IndividualGrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [, setCurrentAcademicYear] = useState<AcademicYear | null>(null);

  // UI state
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'final' | 'evaluation'>('final');

  // Filter state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedEvalType, setSelectedEvalType] = useState<EvaluationType>('MIDTERM');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId] = useState<number | null>(null);

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
      const semId = yearSemId(selectedSemester, semesters);
      if (!selectedCourse || !semId) {
        setExamsForFilter([]);
        return;
      }
      try {
        const params: any = { course: selectedCourse, semester: semId, page_size: 50 };
        if (selectedEvalType) params.exam_type = selectedEvalType;
        const res = await api.get('/academics/exams/', { params });
        setExamsForFilter(res.data.results || res.data);
      } catch (err) {
        console.error('Error fetching exams for filter:', err);
      }
    };
    fetchExams();
  }, [selectedCourse, selectedSemester, selectedEvalType, semesters]);
  const [gradeInputs, setGradeInputs] = useState<GradeInput[]>([]);

  // Bulletin & Modals state
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [bulletinData, setBulletinData] = useState<BulletinData | null>(null);
  const [bulletinPdfUrl, setBulletinPdfUrl] = useState<string | null>(null);
  const [, setGeneratingBulletin] = useState(false);

  useEffect(() => () => {
    if (bulletinPdfUrl) window.URL.revokeObjectURL(bulletinPdfUrl);
  }, [bulletinPdfUrl]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const currentStudent = user?.role === 'STUDENT'
    ? allStudents.find((student) => student.user === user.id) || allStudents[0] || null
    : null;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Fetch current academic year first
        const yearRes = await api.get('/university/academic-years/', { params: { is_current: true } });
        const currentYear = yearRes.data.results?.[0] || yearRes.data?.[0];
        setCurrentAcademicYear(currentYear || null);

        // 2. Fetch other data, filtering semesters by current year if available
        const [coursesRes, semestersRes, studentsRes, levelsRes] = await Promise.all([
          api.get('/academics/courses/', { params: { page_size: 1000 } }),
          api.get('/university/semesters/', {
            params: {
              page_size: 50,
              academic_year: currentYear?.id // Filter by current academic year
            }
          }),
          api.get('/students/', { params: { page_size: 500, status: 'ACTIVE' } }),
          api.get('/university/levels/', { params: { page_size: 50 } })
        ]);
        setCourses(coursesRes.data.results || coursesRes.data);
        setSemesters(semestersRes.data.results || semestersRes.data);
        setAllStudents(studentsRes.data.results || studentsRes.data);
        setLevels(levelsRes.data.results || levelsRes.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchGrades = useCallback(async () => {
    const semId = yearSemId(selectedSemester, semesters);
    if (!selectedCourse || !semId) {
      setGrades([]);
      setIndividualGrades([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'final') {
        const params: any = { course: selectedCourse, semester: semId, page_size: 200 };
        if (selectedStudentId) params.student = selectedStudentId;

        const response = await api.get('/academics/course-grades/', { params });
        setGrades(response.data.results || response.data);
      } else {
        const examParams: any = { course: selectedCourse, semester: semId, page_size: 100 };
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
  }, [selectedCourse, selectedSemester, semesters, viewMode, selectedStudentId, selectedEvalType, filterExamId, courses, t]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const openGradeModal = async () => {
    const semId = yearSemId(selectedSemester, semesters);
    if (!selectedCourse || !semId) {
      setError(t('grades.empty', 'Veuillez sélectionner un cours et un semestre'));
      return;
    }

    setLoading(true);
    try {
      const course = courses.find(c => c.id === parseInt(selectedCourse));
      if (!course) return;

      const examsRes = await api.get('/academics/exams/', {
        params: { course: selectedCourse, semester: semId, page_size: 50 }
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
          semester: yearSemId(selectedSemester, semesters),
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
        semester_id: yearSemId(selectedSemester, semesters)
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
    const semId = yearSemId(selectedSemester, semesters);
    if (!semId) return;
    setGeneratingBulletin(true);
    try {
      // 1. Check if report card already exists
      let reportCardId;
      try {
        const checkRes = await api.get('/academics/report-cards/', {
          params: { student: studentId, semester: semId }
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
          semester: semId
        });
        reportCardId = createRes.data.id;
      }

      // 3. Calculate GPA to ensure fresh data
      await api.post(`/academics/report-cards/${reportCardId}/calculate_gpa/`);

      // 4. Fetch the detail and the official PDF used by the on-screen preview.
      const [detailRes, pdfRes] = await Promise.all([
        api.get(`/academics/report-cards/${reportCardId}/`),
        api.get(`/academics/report-cards/${reportCardId}/download_pdf/`, { responseType: 'blob' }),
      ]);

      setBulletinData(detailRes.data);
      setBulletinPdfUrl(window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' })));
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
      let url = bulletinPdfUrl;
      let temporaryUrl = false;
      if (!url) {
        const res = await api.get(`/academics/report-cards/${bulletinData.id}/download_pdf/`, { responseType: 'blob' });
        url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        temporaryUrl = true;
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bulletin_${bulletinData.student_matricule}.pdf`;
      link.click();
      if (temporaryUrl) {
        const urlToRevoke = url;
        window.setTimeout(() => window.URL.revokeObjectURL(urlToRevoke), 0);
      }
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  const closeBulletin = () => {
    setShowBulletinModal(false);
    setBulletinPdfUrl(null);
  };

  const getMention = (score: number) => {
    if (score >= 16) return { label: t('grades.mentions.excellent'), color: 'text-green-700 bg-green-100' };
    if (score >= 14) return { label: t('grades.mentions.very_good'), color: 'text-green-600 bg-green-50' };
    if (score >= 12) return { label: t('grades.mentions.good'), color: 'text-blue-600 bg-blue-100' };
    if (score >= 10) return { label: t('grades.mentions.fair'), color: 'text-yellow-600 bg-yellow-100' };
    return { label: t('grades.mentions.fail'), color: 'text-red-600 bg-red-100' };
  };

  const renderTeacherView = () => {
    const levelOrderById: Record<number, number> = {};
    levels.forEach(l => { levelOrderById[l.id] = l.order; });
    const semMeta = SEM_MAP[selectedSemester as CurriculumSemester];
    const filteredCourses = semMeta
      ? courses.filter(c => c.semester_type === semMeta.yearType && levelOrderById[c.level] === semMeta.order)
      : courses;

    return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.semester', 'Semestre')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedSemester} onChange={(e) => { setSelectedSemester(e.target.value); setSelectedCourse(''); }}>
              <option value="">{t('grades.placeholders.select_semester')}</option>
              {CURRICULUM_SEMESTERS.map(code => <option key={code} value={code}>{`${t('grades.labels.semester', 'Semestre')} ${code.slice(1)}`}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('grades.labels.course', 'Cours')}</label>
            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={!selectedSemester}>
              <option value="">{t('grades.placeholders.select_course')}</option>
              {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
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
                <th className="px-6 py-3 text-center tracking-wider">{t('common.actions', 'Actions')}</th>
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
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const student = allStudents.find((item) => item.id === g.student);
                          if (student) {
                            setHistoryStudent(student);
                            setShowHistoryModal(true);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        <ChartBarSquareIcon className="h-4 w-4" />
                        {t('grades.buttons.progression', 'Progression')}
                      </button>
                      {viewMode === 'final' && <button onClick={() => generateBulletin(g.student)} className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-black text-green-700 transition hover:border-green-300 hover:bg-green-100">{t('grades.buttons.generate')}</button>}
                    </div>
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
  };

  const renderStudentView = () => (
    <div className="space-y-6">
      <select className="px-3 py-2 border rounded-lg" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
        <option value="">{t('grades.placeholders.select_semester')}</option>
        {CURRICULUM_SEMESTERS.map(code => <option key={code} value={code}>{`${t('grades.labels.semester', 'Semestre')} ${code.slice(1)}`}</option>)}
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
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('grades.header_eyebrow', 'Suivi académique')}
        title={user?.role === 'STUDENT' ? t('grades.student.title', 'Mes Notes') : t('grades.title', 'Gestion des Notes')}
        description={t('grades.subtitle', 'Suivez les résultats, les évaluations et la progression des étudiants.')}
        icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
        actions={currentStudent && (
          <button
            type="button"
            onClick={() => {
              setHistoryStudent(currentStudent);
              setShowHistoryModal(true);
            }}
            className="brand-button"
          >
            <ChartBarSquareIcon className="h-5 w-5" />
            {t('grades.buttons.my_progression', 'Voir ma progression')}
          </button>
        )}
      />

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[92dvh]">
            <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                  {t('grades.bulletin.preview', 'Aperçu officiel du bulletin')}
                </p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-950 sm:text-xl">
                  {bulletinData.student_name}
                </h2>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {bulletinData.student_matricule} · {bulletinData.academic_year}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={downloadBulletinPDF} className="brand-button min-h-10">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {t('grades.buttons.download_pdf', 'Télécharger PDF')}
                </button>
                <button
                  type="button"
                  onClick={closeBulletin}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={t('common.close', 'Fermer')}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 bg-slate-200 p-1 sm:p-3">
              {bulletinPdfUrl ? (
                <iframe
                  title={t('grades.bulletin.preview', 'Aperçu officiel du bulletin')}
                  src={`${bulletinPdfUrl}#toolbar=0&navpanes=0`}
                  className="h-full w-full rounded-lg bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-white">
                  <span className="h-9 w-9 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
                </div>
              )}
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
