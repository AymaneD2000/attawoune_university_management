import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  EnvelopeIcon,
  EyeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  EntityAvatar,
  IconActionButton,
  ListLoading,
  PaginationBar,
  StatusPill,
} from '../../components/common/EntityDisplay';
import PageHeader from '../../components/common/PageHeader';
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

const getTeacherFullName = (teacher: Teacher): string => {
  const composedName = [teacher.first_name, teacher.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return teacher.user_full_name || teacher.user_name || composedName || teacher.employee_id;
};

const getTeacherInitial = (teacher: Teacher): string =>
  getTeacherFullName(teacher).charAt(0).toUpperCase() || 'E';

const TeachersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const canManageUsers = ['ADMIN', 'DEAN', 'SECRETARY'].includes(currentUser?.role || '');
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
      const [teacherRes, coursesRes, scheduleRes] = await Promise.all([
        api.get<Teacher>(`/teachers/teachers/${teacher.id}/`),
        api.get(`/teachers/teachers/${teacher.id}/courses/`).catch(() => null),
        api.get(`/teachers/teachers/${teacher.id}/schedules/`).catch(() => null),
      ]);

      setSelectedTeacher(teacherRes.data);
      setTeacherCourses(coursesRes?.data?.by_semester || {});
      setTeacherSchedule(scheduleRes?.data?.schedule_by_day || {});
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

  const getRankTone = (rank: string): 'slate' | 'blue' | 'green' | 'earth' | 'orange' => ({
    ASSISTANT: 'slate',
    LECTURER: 'blue',
    SENIOR_LECTURER: 'green',
    ASSOCIATE_PROFESSOR: 'earth',
    PROFESSOR: 'orange',
  }[rank] as 'slate' | 'blue' | 'green' | 'earth' | 'orange') || 'slate';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('sidebar.academics', 'Corps académique')}
        title={t('teachers.title', 'Gestion des Enseignants')}
        description={t('teachers.subtitle', 'Gérer le corps professoral et leurs affectations')}
        icon={<AcademicCapIcon className="h-6 w-6" />}
        actions={canManageUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="brand-button"
          >
            <PlusIcon className="h-5 w-5" />
            {t('teachers.actions.new_teacher', 'Nouvel Enseignant')}
          </button>
        )}
      />

      {/* Filters */}
      <div className="surface-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={t('teachers.search_placeholder', 'Rechercher un enseignant...')}
                className="brand-input ps-12"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
          </div>
          <select
            value={rankFilter}
            onChange={(event) => {
              setRankFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="brand-input w-full sm:w-72"
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
        <div className="surface-panel overflow-hidden"><ListLoading cards /></div>
      ) : teachers.length === 0 ? (
        <div className="surface-panel p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-4 text-lg font-black text-slate-900">{t('teachers.empty', 'Aucun enseignant trouvé')}</p>
          <p className="mt-2 text-sm text-slate-500">{t('teachers.empty_description', 'Modifiez les filtres ou créez un nouveau profil enseignant.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => {
            const fullName = getTeacherFullName(teacher);
            return (
              <article
                key={teacher.id}
                className="surface-panel group flex min-h-[280px] flex-col overflow-hidden p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <EntityAvatar name={fullName} src={teacher.user_profile_picture} tone="green" size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-slate-950">{fullName}</h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                          <IdentificationIcon className="h-4 w-4" />
                          {teacher.employee_id}
                        </div>
                      </div>
                      <StatusPill tone={teacher.is_active ? 'green' : 'red'} dot>
                        {teacher.is_active ? t('teachers.details.active', 'Actif') : t('teachers.details.inactive', 'Inactif')}
                      </StatusPill>
                    </div>
                    <div className="mt-3"><StatusPill tone={getRankTone(teacher.rank)}>{teacher.rank_display}</StatusPill></div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <EnvelopeIcon className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="truncate font-semibold">{teacher.user_email || teacher.user_phone || t('teachers.details.not_specified', 'Non spécifié')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <MapPinIcon className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="truncate font-semibold">{teacher.department_name || t('teachers.details.not_specified', 'Département non spécifié')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
                    <span className="text-xs font-semibold text-slate-400">{t('teachers.form.labels.contract_type', 'Contrat')}</span>
                    <span className="truncate text-xs font-black text-brand-earth">{teacher.contract_type_display || teacher.contract_type}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => handleViewTeacher(teacher)} className="text-sm font-black text-blue-700 transition hover:text-green-700">
                    {t('common.view_details', 'Voir le profil')}
                  </button>
                  <div className="flex items-center gap-1">
                    <IconActionButton label={t('common.view', 'Voir')} tone="blue" onClick={() => handleViewTeacher(teacher)}>
                      <EyeIcon className="h-5 w-5" />
                    </IconActionButton>
                    {canManageUsers && (
                      <IconActionButton label={t('teachers.actions.edit', 'Modifier')} tone="slate" onClick={() => setEditingTeacher(teacher)}>
                        <PencilSquareIcon className="h-5 w-5" />
                      </IconActionButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && teachers.length > 0 && (
        <div className="surface-panel overflow-hidden">
          <PaginationBar
            currentPage={currentPage}
            currentCount={teachers.length}
            total={totalCount}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => page + 1)}
          />
        </div>
      )}

      {/* Teacher Detail Modal */}
      {showModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {selectedTeacher.user_profile_picture ? (
                      <img
                        src={selectedTeacher.user_profile_picture}
                        alt={getTeacherFullName(selectedTeacher)}
                        className="w-full h-full object-cover"
                      />
                    ) : getTeacherInitial(selectedTeacher)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{getTeacherFullName(selectedTeacher)}</h2>
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
              {canManageUsers && (
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
              )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.last_name', 'Nom')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.last_name || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.first_name', 'Prénom')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.first_name || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.email', 'Email')}</p>
                        <p className="font-medium text-gray-900 break-words">{selectedTeacher.user_email || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.phone', 'Téléphone')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.user_phone || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.date_of_birth', 'Date de naissance')}</p>
                        <p className="font-medium text-gray-900">
                          {selectedTeacher.user_date_of_birth
                            ? new Date(selectedTeacher.user_date_of_birth).toLocaleDateString(i18n.language)
                            : t('teachers.details.not_specified', 'Non spécifiée')}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.gender', 'Sexe')}</p>
                        <p className="font-medium text-gray-900">
                          {selectedTeacher.user_gender === 'F'
                            ? t('teachers.form.options.female', 'Femme')
                            : selectedTeacher.user_gender === 'M'
                              ? t('teachers.form.options.male', 'Homme')
                              : t('teachers.details.not_specified', 'Non spécifié')}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.department', 'Département')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.department_name || t('teachers.details.not_assigned', 'Non assigné')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.faculty', 'Faculté')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.faculty_name || t('teachers.details.not_assigned', 'Non assignée')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.specialization', 'Spécialisation')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.specialization || t('teachers.details.not_specified', 'Non spécifiée')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.contract_type', 'Type de contrat')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.contract_type_display || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.details.hire_date', "Date d'embauche")}</p>
                        <p className="font-medium text-gray-900">
                          {selectedTeacher.hire_date
                            ? new Date(selectedTeacher.hire_date).toLocaleDateString(i18n.language)
                            : t('teachers.details.not_specified', 'Non spécifiée')}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.office', 'Bureau')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.office_location || t('teachers.details.not_specified', 'Non spécifié')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                        <p className="text-sm text-gray-500">{t('teachers.form.labels.address', 'Adresse')}</p>
                        <p className="font-medium text-gray-900">{selectedTeacher.user_address || t('teachers.details.not_specified', 'Non spécifiée')}</p>
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
                          {t('teachers.details.empty_courses', 'Aucun cours assigné')}
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
                                      {course.is_primary ? t('teachers.details.primary', 'Principal') : t('teachers.details.secondary', 'Secondaire')}
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
                          {t('teachers.details.empty_schedule', 'Aucun emploi du temps disponible')}
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
