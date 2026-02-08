import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Schedule,
  TimeSlot,
  Course,
  Teacher,
  Classroom,
  Semester,
  Program,
  PaginatedResponse
} from '../../types';
import universityService from '../../services/universityService';
import teacherService from '../../services/teacherService';
import academicsService from '../../services/academicsService';
import schedulingService from '../../services/schedulingService';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

// Helper to get teacher display name (handles both API response formats)
const getTeacherName = (teacher: Teacher & { user_name?: string }) => {
  return teacher.user_full_name || teacher.user_name || 'N/A';
};

const SchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [showModal, setShowModal] = useState(false);

  // Data for dropdowns
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Filter state
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedProgram, setSelectedProgram] = useState<number | ''>('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');

  // Form state
  const [formData, setFormData] = useState({
    course: '',
    teacher: '',
    semester: '',
    classroom: '',
    day: 0,
    start_time: '08:00',
    end_time: '10:00',
    is_active: true
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedTeacher) params.teacher = selectedTeacher;
      if (selectedProgram) params.course__program = selectedProgram;

      const data = await schedulingService.getSchedules(params);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, selectedTeacher, selectedProgram]);

  const loadDropdownData = async () => {
    try {
      const [coursesRes, teachersRes, classroomsRes, semestersRes, programsRes] = await Promise.all([
        academicsService.getCourses({ is_active: true, limit: 100 }),
        teacherService.getTeachers({ is_active: true, limit: 100 }),
        universityService.getClassrooms({ limit: 100 }),
        universityService.getSemesters({ limit: 100 }),
        universityService.getPrograms({ is_active: true, limit: 100 })
      ]);

      setCourses(coursesRes.results);
      setTeachers(teachersRes.results);
      setClassrooms(classroomsRes.results);
      setSemesters(semestersRes.results);
      setPrograms(programsRes.results);

      // Set default current semester if available
      const current = semestersRes.results.find(s => s.is_current);
      if (current) {
        setSelectedSemester(current.id);
        setFormData(prev => ({ ...prev, semester: current.id.toString() }));
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const getSchedulesForSlot = (dayIndex: number, time: string) => {
    return schedules.filter(
      (s) => s.time_slot?.day === dayIndex && s.time_slot?.start_time?.startsWith(time)
    );
  };

  const getCourseColor = (courseCode: string) => {
    const colors = [
      'bg-blue-100 border-blue-500 text-blue-800',
      'bg-green-100 border-green-500 text-green-800',
      'bg-purple-100 border-purple-500 text-purple-800',
      'bg-yellow-100 border-yellow-500 text-yellow-800',
      'bg-pink-100 border-pink-500 text-pink-800',
      'bg-indigo-100 border-indigo-500 text-indigo-800',
    ];
    if (!courseCode) return colors[0];
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Ensure TimeSlot exists or create it
      // For now, let's assume we need to handle TimeSlot on the backend or 
      // have a dedicated endpoint to find/create it.
      // Since we don't have that yet, let's try to find an existing one or 
      // create it via the API if the backend allowed it.
      // Actually, looking at the backend, ScheduleCreateSerializer expects time_slot ID.

      // Let's first check if a matching TimeSlot exists
      const timeSlots = await schedulingService.getTimeSlots();
      let timeSlot = timeSlots.find(ts =>
        ts.day === formData.day &&
        ts.start_time.startsWith(formData.start_time) &&
        ts.end_time.startsWith(formData.end_time)
      );

      if (!timeSlot) {
        // Create new TimeSlot
        // This might fail if the user doesn't have permissions or if the endpoint doesn't exist
        try {
          const tsResponse = await api.post('/scheduling/time-slots/', {
            day: formData.day,
            start_time: formData.start_time,
            end_time: formData.end_time
          });
          timeSlot = tsResponse.data;
        } catch (err: any) {
          alert('Error creating time slot: ' + (err.response?.data?.error || 'Unknown error'));
          return;
        }
      }

      // 2. Create Schedule
      await schedulingService.createSchedule({
        course: parseInt(formData.course),
        teacher: parseInt(formData.teacher),
        semester: parseInt(formData.semester),
        classroom: parseInt(formData.classroom),
        time_slot: timeSlot?.id,
        is_active: formData.is_active
      });

      setShowModal(false);
      fetchSchedules();
      alert('Emploi du temps ajouté avec succès');
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      const errorMsg = error.response?.data?.error ||
        (error.response?.data?.conflicts ? t('common.errors.conflicts', 'Conflits détectés') : t('common.errors.unknown', 'Erreur inconnue'));

      let detailMsg = '';
      if (error.response?.data?.conflicts) {
        const conflicts = error.response.data.conflicts;
        detailMsg = '\n' + conflicts.map((c: any) =>
          `- ${c.message} (${c.conflicting_course || t('scheduling.empty.no_course')})`
        ).join('\n');
      }

      alert(`${t('common.errors.create_error')} ${errorMsg}${detailMsg}`);
    }
  };

  const renderWeekView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                Heure
              </th>
              {DAYS.map((day) => (
                <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {t(`scheduling.week_days.${day}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {TIME_SLOTS.map((time) => (
              <tr key={time} className="h-24">
                <td className="px-4 py-2 text-sm text-gray-500 font-medium align-top">
                  {time}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const slotSchedules = getSchedulesForSlot(dayIndex, time);
                  return (
                    <td key={dayIndex} className="px-2 py-2 align-top h-full">
                      <div className="flex flex-col gap-2 min-h-[80px]">
                        {slotSchedules.length > 0 ? (
                          slotSchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`p-2 rounded border-l-4 ${getCourseColor(schedule.course_code)} cursor-pointer hover:shadow-md transition-shadow text-xs`}
                            >
                              <div className="font-bold">{schedule.course_code}</div>
                              <div className="truncate" title={schedule.course_name}>{schedule.course_name}</div>
                              <div className="mt-1 flex items-center gap-1 opacity-75">
                                <span>📍</span>
                                <span className="truncate">{schedule.classroom_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 font-semibold">
                                <span>👨‍🏫</span>
                                <span className="truncate">{schedule.teacher_name || 'N/A'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          /* Empty state / placeholder */
                          null
                        )}

                        {/* Always show add button if admin, at the bottom of cell */}
                        {user?.role === 'ADMIN' && (
                          <div className={`
                                ${slotSchedules.length > 0 ? 'opacity-0 hover:opacity-100' : 'h-full flex items-center justify-center opacity-0 hover:opacity-100'} 
                                transition-opacity bg-gray-50 rounded border border-dashed border-gray-200 min-h-[30px]
                            `}>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  day: dayIndex,
                                  start_time: time,
                                  end_time: `${parseInt(time.split(':')[0]) + 2}:00`
                                }));
                                setShowModal(true);
                              }}
                              className="w-full h-full text-xs text-gray-400 py-1"
                              title={t('scheduling.actions.add_slot')}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="divide-y divide-gray-200">
        {DAYS.map((day, dayIndex) => {
          const daySchedules = schedules.filter((s) => s.time_slot?.day === dayIndex);
          return (
            <div key={day} className="p-4">
              <h3 className="font-semibold text-lg mb-3">{t(`scheduling.week_days.${day}`)}</h3>
              {daySchedules.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('scheduling.empty.no_course')}</p>
              ) : (
                <div className="space-y-2">
                  {daySchedules
                    .sort((a, b) => (a.time_slot?.start_time || '').localeCompare(b.time_slot?.start_time || ''))
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-3 rounded border-l-4 ${getCourseColor(schedule.course_code)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {schedule.course_code} - {schedule.course_name}
                            </p>
                            <p className="text-sm opacity-75">
                              {schedule.time_slot?.start_time} - {schedule.time_slot?.end_time}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="opacity-75">📍 {schedule.classroom_name || 'N/A'}</p>
                            <p className="font-bold">👨‍🏫 {schedule.teacher_name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div dir={document.dir}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('scheduling.title')}</h1>
        <div className="flex space-x-3 gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'week' ? 'bg-white shadow' : ''}`}
            >
              {t('scheduling.views.week')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              {t('scheduling.views.list')}
            </button>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 rtl:mr-3"
            >
              + {t('common.actions.add', 'Ajouter')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.filters.semester')}</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2 border rounded-lg rtl:text-right"
            >
              <option value="">{t('scheduling.filters.select_semester')}</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.semester_type === 'S1' ? t('common.year_sem.s1', 'Semestre 1') : t('common.year_sem.s2', 'Semestre 2')} - {s.academic_year_name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.filters.program')}</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2 border rounded-lg rtl:text-right"
            >
              <option value="">{t('scheduling.filters.all_programs')}</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.filters.teacher')}</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2 border rounded-lg rtl:text-right"
            >
              <option value="">{t('scheduling.filters.all_teachers')}</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{getTeacherName(t as any)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setSelectedTeacher('');
                setSelectedProgram('');
                // Reset to current semester if available, else keep generic or reset to first
                const current = semesters.find(s => s.is_current);
                if (current) setSelectedSemester(current.id);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center gap-2"
              title={t('scheduling.filters.reset')}
            >
              <span>↺</span> {t('scheduling.filters.reset')}
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              {t('scheduling.actions.export_pdf')}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {schedules.length === 0 && !loading && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 rtl:mr-3 rtl:ml-0">
                    <p className="text-sm text-blue-700">
                      {t('scheduling.empty.no_course_found')}
                      {(selectedTeacher || selectedProgram) && (
                        <span className="font-bold ml-1 cursor-pointer underline" onClick={() => {
                          setSelectedTeacher('');
                          setSelectedProgram('');
                        }}>
                          {t('scheduling.filters.reset')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {viewMode === 'week' ? renderWeekView() : renderListView()}
        </>
      )}

      {/* Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('scheduling.modal.title')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.filters.semester')}</label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                >
                  <option value="">{t('scheduling.filters.select_semester')}</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.semester_type === 'S1' ? t('common.year_sem.s1', 'Semestre 1') : t('common.year_sem.s2', 'Semestre 2')} - {s.academic_year_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.modal.course')}</label>
                <select
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                >
                  <option value="">{t('scheduling.filters.start_typing', 'Sélectionner un cours')}</option>
                  {courses
                    .filter(c => !selectedProgram || c.program === selectedProgram)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.filters.teacher')}</label>
                <select
                  required
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                >
                  <option value="">{t('scheduling.filters.select_teacher', 'Sélectionner un enseignant')}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{getTeacherName(t as any)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.modal.day')}</label>
                  <select
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    {DAYS.map((day, i) => (
                      <option key={day} value={i}>{t(`scheduling.week_days.${day}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.modal.classroom')}</label>
                  <select
                    required
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    <option value="">{t('scheduling.modal.select_classroom', 'Sélectionner une salle')}</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.building})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.modal.start_time')}</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('scheduling.modal.end_time')}</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">{t('scheduling.modal.active')}</label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                  {t('scheduling.modal.cancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {t('scheduling.modal.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
