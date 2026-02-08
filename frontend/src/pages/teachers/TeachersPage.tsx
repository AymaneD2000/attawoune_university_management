import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Teacher, PaginatedResponse } from '../../types';
import TeacherFormModal from './TeacherFormModal';

interface TeacherCourse {
  id: number;
  course_name: string;
  course_code: string;
  program_name: string | null;
  is_primary: boolean;
  hours_assigned: number;
}

interface TeacherSchedule {
  id: number;
  course_name: string;
  course_code: string;
  classroom: string;
  start_time: string;
  end_time: string;
}

const TeachersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'courses' | 'schedule'>('info');
  const [teacherCourses, setTeacherCourses] = useState<Record<string, TeacherCourse[]>>({});
  const [teacherSchedule, setTeacherSchedule] = useState<Record<string, TeacherSchedule[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [rankFilter, setRankFilter] = useState('');

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Teacher>>('/teachers/teachers/', {
        params: {
          page: currentPage,
          search: searchTerm,
          rank: rankFilter || undefined
        },
      });
      setTeachers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, rankFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const fetchTeacherDetails = async (teacher: Teacher) => {
    setDetailLoading(true);
    try {
      // Fetch courses
      const coursesRes = await api.get(`/teachers/teachers/${teacher.id}/courses/`);
      setTeacherCourses(coursesRes.data.by_semester || {});

      // Fetch schedule
      const scheduleRes = await api.get(`/teachers/teachers/${teacher.id}/schedules/`);
      setTeacherSchedule(scheduleRes.data.schedule_by_day || {});
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setActiveTab('info');
    setShowModal(true);
    fetchTeacherDetails(teacher);
  };

  const getRankBadge = (rank: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      ASSISTANT: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      LECTURER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      SENIOR_LECTURER: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      ASSOCIATE_PROFESSOR: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      PROFESSOR: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    };
    return colors[rank] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  const getRankIcon = (rank: string) => {
    const icons: Record<string, string> = {
      ASSISTANT: '👨‍🏫',
      LECTURER: '📚',
      SENIOR_LECTURER: '🎓',
      ASSOCIATE_PROFESSOR: '📖',
      PROFESSOR: '🏆',
    };
    return icons[rank] || '👤';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('teachers.title', 'Gestion des Enseignants')}</h1>
            <p className="text-teal-100 mt-1">{t('teachers.subtitle', 'Gérer le corps professoral et leurs affectations')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-teal-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-teal-50 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5 rtl:mirror" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('teachers.actions.new_teacher', 'Nouvel Enseignant')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('teachers.search_placeholder', 'Rechercher un enseignant...')}
                className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">{t('teachers.filters.all_ranks', 'Tous les grades')}</option>
            <option value="ASSISTANT">{t('teachers.filters.assistant', 'Assistant')}</option>
            <option value="LECTURER">{t('teachers.filters.lecturer', 'Maître assistant')}</option>
            <option value="SENIOR_LECTURER">{t('teachers.filters.senior_lecturer', 'Maître de conférences')}</option>
            <option value="ASSOCIATE_PROFESSOR">{t('teachers.filters.associate_professor', 'Professeur associé')}</option>
            <option value="PROFESSOR">{t('teachers.filters.professor', 'Professeur')}</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement des enseignants...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-4 text-gray-500">{t('teachers.empty', 'Aucun enseignant trouvé')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => {
            const rankStyle = getRankBadge(teacher.rank);
            return (
              <div
                key={teacher.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleViewTeacher(teacher)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-105 transition-transform">
                    {teacher.user_full_name?.charAt(0) || 'E'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{teacher.user_full_name}</h3>
                    <p className="text-sm text-gray-500 truncate">{teacher.user_email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                        <span>{getRankIcon(teacher.rank)}</span>
                        {teacher.rank_display}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-700">{teacher.employee_id}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {teacher.is_active ? t('teachers.details.active', 'Actif') : t('teachers.details.inactive', 'Inactif')}
                  </span>
                </div>
                {teacher.department_name && (
                  <div className="mt-2 text-sm text-gray-500">
                    📍 {teacher.department_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {t('common.showing', { current: teachers.length, total: totalCount, defaultValue: `Affichage de ${teachers.length} sur ${totalCount} enseignants` })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.prev', 'Précédent')}
          </button>
          <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={teachers.length < 20}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {t('common.next', 'Suivant')}
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Teacher Detail Modal */}
      {showModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {selectedTeacher.user_full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedTeacher.user_full_name}</h2>
                    <p className="text-teal-100">{selectedTeacher.employee_id}</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                      {selectedTeacher.rank_display}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); setSelectedTeacher(null); }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Edit Button */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTeacher(selectedTeacher);
                }}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('teachers.actions.edit', 'Modifier')}
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {(['info', 'courses', 'schedule'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab === 'info' && t('teachers.tabs.info', '📋 Informations')}
                    {tab === 'courses' && t('teachers.tabs.courses', '📚 Cours')}
                    {tab === 'schedule' && t('teachers.tabs.schedule', '📅 Emploi du temps')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'info' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.email', 'Email')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.user_email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.department', 'Département')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.department_name || 'Non assigné'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.specialization', 'Spécialisation')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.specialization || 'Non spécifiée'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.contract_type', 'Type de contrat')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.contract_type_display || 'Non spécifié'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.hire_date', "Date d'embauche")}</p>
                        <p className="font-medium text-gray-900">
                          {selectedTeacher.hire_date
                            ? new Date(selectedTeacher.hire_date).toLocaleDateString(i18n.language)
                            : 'Non spécifiée'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.status', 'Statut')}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedTeacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedTeacher.is_active ? t('teachers.details.active', 'Actif') : t('teachers.details.inactive', 'Inactif')}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'courses' && (
                    <div className="space-y-4">
                      {Object.keys(teacherCourses).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun cours assigné
                        </div>
                      ) : (
                        Object.entries(teacherCourses).map(([semester, courses]) => (
                          <div key={semester}>
                            <h4 className="font-semibold text-gray-700 mb-2">{semester}</h4>
                            <div className="space-y-2">
                              {courses.map((course: TeacherCourse) => (
                                <div key={course.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">{course.course_name}</p>
                                    <p className="text-sm text-gray-500">{course.course_code}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs ${course.is_primary ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'}`}>
                                      {course.is_primary ? 'Principal' : 'Secondaire'}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">{course.hours_assigned}h</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      {Object.keys(teacherSchedule).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun emploi du temps disponible
                        </div>
                      ) : (
                        Object.entries(teacherSchedule).map(([day, schedules]) => (
                          <div key={day}>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                              {day}
                            </h4>
                            <div className="space-y-2">
                              {schedules.map((schedule: TeacherSchedule) => (
                                <div key={schedule.id} className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-gray-900">{schedule.course_name}</p>
                                      <p className="text-sm text-gray-500">{schedule.course_code}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-teal-700">
                                        {schedule.start_time} - {schedule.end_time}
                                      </p>
                                      <p className="text-sm text-gray-500">📍 {schedule.classroom}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Teacher Modal */}
      {(showCreateModal || editingTeacher) && (
        <TeacherFormModal
          teacher={editingTeacher}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTeacher(null);
          }}
          onSuccess={() => {
            fetchTeachers();
            setShowCreateModal(false);
            setEditingTeacher(null);
          }}
        />
      )}
    </div>
  );
};

export default TeachersPage;
