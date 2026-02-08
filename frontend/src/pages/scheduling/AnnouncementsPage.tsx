import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Faculty, Program, PaginatedResponse } from '../../types';
import universityService from '../../services/universityService';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcement_type: string;
  announcement_type_display: string;
  target_audience: string;
  target_audience_display: string;
  faculty?: number;
  faculty_name?: string;
  program?: number;
  program_name?: string;
  is_published: boolean;
  is_pinned: boolean;
  publish_date: string;
  created_by_name: string;
  created_at: string;
}

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState('');
  const [filterAudience, setFilterAudience] = useState('');

  // Dropdown data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'GENERAL',
    target_audience: 'ALL',
    faculty: '',
    program: '',
    is_pinned: false,
    is_published: true
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/scheduling/announcements/', {
        params: {
          announcement_type: filterType || undefined,
          target_audience: filterAudience || undefined
        },
      });
      setAnnouncements(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterAudience]);

  const loadDropdownData = async () => {
    try {
      const [facultiesRes, programsRes] = await Promise.all([
        universityService.getFaculties({ limit: 100 }),
        universityService.getPrograms({ limit: 100 })
      ]);
      setFaculties(facultiesRes.results);
      setPrograms(programsRes.results);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    loadDropdownData();
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (selectedAnnouncement) {
      setFormData({
        title: selectedAnnouncement.title,
        content: selectedAnnouncement.content,
        announcement_type: selectedAnnouncement.announcement_type,
        target_audience: selectedAnnouncement.target_audience,
        faculty: selectedAnnouncement.faculty?.toString() || '',
        program: selectedAnnouncement.program?.toString() || '',
        is_pinned: selectedAnnouncement.is_pinned,
        is_published: selectedAnnouncement.is_published
      });
    } else {
      setFormData({
        title: '',
        content: '',
        announcement_type: 'GENERAL',
        target_audience: 'ALL',
        faculty: '',
        program: '',
        is_pinned: false,
        is_published: true
      });
    }
  }, [selectedAnnouncement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        announcement_type: formData.announcement_type,
        target_audience: formData.target_audience,
        faculty: formData.faculty ? parseInt(formData.faculty) : null,
        program: formData.program ? parseInt(formData.program) : null,
        is_pinned: formData.is_pinned,
        is_published: formData.is_published,
        publish_date: formData.is_published ? new Date().toISOString() : null
      };

      if (selectedAnnouncement) {
        await api.patch(`/scheduling/announcements/${selectedAnnouncement.id}/`, payload);
        alert('Annonce mise à jour');
      } else {
        await api.post('/scheduling/announcements/', payload);
        alert('Annonce créée');
      }

      setShowModal(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      alert(t('common.errors.error') + ': ' + (error.response?.data?.error || JSON.stringify(error.response?.data)));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer cet élément ?'))) {
      try {
        await api.delete(`/scheduling/announcements/${id}/`);
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert(t('common.errors.delete_error', 'Erreur lors de la suppression'));
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'bg-gray-100 text-gray-800',
      ACADEMIC: 'bg-blue-100 text-blue-800',
      FINANCIAL: 'bg-green-100 text-green-800',
      EXAM: 'bg-red-100 text-red-800',
      EVENT: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      GENERAL: '📢',
      ACADEMIC: '📚',
      FINANCIAL: '💰',
      EXAM: '📝',
      EVENT: '🎉',
    };
    return icons[type] || '📢';
  };

  return (
    <div dir={document.dir}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('announcements.title')}</h1>
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
          <button
            onClick={() => { setSelectedAnnouncement(null); setShowModal(true); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 rtl:bg-primary-600"
          >
            + {t('announcements.actions.new')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg rtl:text-right"
        >
          <option value="">{t('announcements.filters.all_types')}</option>
          <option value="GENERAL">{t('announcements.types.general')}</option>
          <option value="ACADEMIC">{t('announcements.types.academic')}</option>
          <option value="FINANCIAL">{t('announcements.types.financial')}</option>
          <option value="EXAM">{t('announcements.types.exam')}</option>
          <option value="EVENT">{t('announcements.types.event')}</option>
        </select>
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          className="px-4 py-2 border rounded-lg rtl:text-right"
        >
          <option value="">{t('announcements.filters.all_audiences')}</option>
          <option value="ALL">{t('announcements.audiences.all')}</option>
          <option value="STUDENTS">{t('announcements.audiences.students')}</option>
          <option value="TEACHERS">{t('announcements.audiences.teachers')}</option>
          <option value="STAFF">{t('announcements.audiences.staff')}</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {t('announcements.empty')}
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${announcement.is_pinned ? 'border-yellow-500' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(announcement.announcement_type)}</span>
                      <h2 className="text-xl font-semibold">{announcement.title}</h2>
                      {announcement.is_pinned && (
                        <span className="text-yellow-500" title="Épinglé">📌</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.announcement_type)}`}>
                        {t(`announcements.types.${announcement.announcement_type.toLowerCase()}`)}
                      </span>
                      <span>👥 {t(`announcements.audiences.${announcement.target_audience.toLowerCase()}`)}</span>
                      {announcement.faculty_name && <span>🏢 {announcement.faculty_name}</span>}
                      {announcement.program_name && <span>🎓 {announcement.program_name}</span>}
                      <span>📅 {new Date(announcement.created_at).toLocaleDateString('fr-FR')}</span>
                      <span>✍️ {announcement.created_by_name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    {announcement.is_published ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{t('announcements.badges.published')}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">{t('announcements.badges.draft')}</span>
                    )}
                    {(user?.role === 'ADMIN' || user?.role === 'SECRETARY' || user?.full_name === announcement.created_by_name) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedAnnouncement(announcement); setShowModal(true); }}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          {t('announcements.actions.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          {t('announcements.actions.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedAnnouncement ? t('announcements.modal.title_edit') : t('announcements.modal.title_new')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.title')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 rtl:text-right"
                  placeholder={t('announcements.modal.form.title')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.content')}</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 rtl:text-right"
                  placeholder={t('announcements.modal.form.content')}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.type')}</label>
                  <select
                    value={formData.announcement_type}
                    onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    <option value="GENERAL">{t('announcements.types.general')}</option>
                    <option value="ACADEMIC">{t('announcements.types.academic')}</option>
                    <option value="FINANCIAL">{t('announcements.types.financial')}</option>
                    <option value="EXAM">{t('announcements.types.exam')}</option>
                    <option value="EVENT">{t('announcements.types.event')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.audience')}</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    <option value="ALL">{t('announcements.audiences.all')}</option>
                    <option value="STUDENTS">{t('announcements.audiences.students')}</option>
                    <option value="TEACHERS">{t('announcements.audiences.teachers')}</option>
                    <option value="STAFF">{t('announcements.audiences.staff')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.faculty')}</label>
                  <select
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    <option value="">{t('common.all', 'Tout')}</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.modal.form.program')}</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg rtl:text-right"
                  >
                    <option value="">{t('common.all', 'Tout')}</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">📌 {t('announcements.modal.form.pin')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">🚀 {t('announcements.modal.form.publish')}</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  {t('announcements.modal.form.cancel')}
                </button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {selectedAnnouncement ? t('announcements.modal.form.update') : t('announcements.modal.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
