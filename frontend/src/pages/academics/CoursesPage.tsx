import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Course, PaginatedResponse, Program, Level } from '../../types';
import universityService from '../../services/universityService';
import CourseFormModal from './CourseFormModal';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Course>>('/academics/courses/', {
        params: { page: currentPage, search: searchTerm },
      });
      setCourses(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchCourses();
    const loadData = async () => {
      try {
        const [programsRes, levelsRes] = await Promise.all([
          universityService.getPrograms(),
          universityService.getLevels()
        ]);
        setPrograms(programsRes.results);
        setLevels(levelsRes.results);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [fetchCourses]);

  const getCourseTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      REQUIRED: 'bg-blue-100 text-blue-800',
      ELECTIVE: 'bg-green-100 text-green-800',
      PRACTICAL: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('courses.title', 'Gestion des Cours')}</h1>
        <button
          onClick={() => { setSelectedCourse(null); setShowModal(true); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <span>+</span> {t('courses.actions.new_course', 'Nouveau Cours')}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('courses.stats.total', 'Total des cours')}</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('courses.stats.required', 'Cours obligatoires')}</p>
          <p className="text-2xl font-bold text-blue-600">{courses.filter(c => c.course_type === 'REQUIRED').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('courses.stats.elective', 'Cours optionnels')}</p>
          <p className="text-2xl font-bold text-green-600">{courses.filter(c => c.course_type === 'ELECTIVE').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('courses.stats.practical', 'Travaux pratiques')}</p>
          <p className="text-2xl font-bold text-purple-600">{courses.filter(c => c.course_type === 'PRACTICAL').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4">
          <div className="relative flex-1 md:flex-none md:w-64">
            <input
              type="text"
              placeholder={t('courses.search_placeholder', 'Rechercher un cours...')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="px-4 py-2 border rounded-lg">
            <option value="">{t('courses.filters.all_programs', 'Tous les programmes')}</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className="px-4 py-2 border rounded-lg">
            <option value="">{t('courses.filters.all_types', 'Tous les types')}</option>
            <option value="REQUIRED">{t('courses.filters.required', 'Obligatoire')}</option>
            <option value="ELECTIVE">{t('courses.filters.elective', 'Optionnel')}</option>
            <option value="PRACTICAL">{t('courses.filters.practical', 'TP')}</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.code', 'Code')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.name', 'Nom du cours')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.program', 'Programme')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.level', 'Niveau')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.sem', 'Sem.')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.type', 'Type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.credits', 'Crédits')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.hours', 'Heures')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.coef', 'Coef.')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('courses.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      {t('courses.empty', 'Aucun cours trouvé')}
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-medium">{course.code}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{course.name}</p>
                        {course.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{course.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{course.program_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{course.level_display}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{course.semester_type_display}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTypeBadge(course.course_type)}`}>
                          {t(`courses.filters.${course.course_type.toLowerCase()}`, course.course_type_display)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{course.credits}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p>CM: {course.hours_lecture}h</p>
                          <p>TD: {course.hours_tutorial}h</p>
                          <p>TP: {course.hours_practical}h</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{course.coefficient}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedCourse(course); setShowModal(true); }}
                          className="text-primary-600 hover:text-primary-800 mr-3"
                        >
                          {t('courses.actions.edit', 'Modifier')}
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          {t('courses.actions.delete', 'Supprimer')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {t('common.showing', { current: courses.length, total: totalCount, defaultValue: `${totalCount} cours au total` })}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {t('common.prev', 'Précédent')}
            </button>
            <span className="px-3 py-1">{t('common.page', { page: currentPage, defaultValue: `Page ${currentPage}` })}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={courses.length < 20}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {t('common.next', 'Suivant')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
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
