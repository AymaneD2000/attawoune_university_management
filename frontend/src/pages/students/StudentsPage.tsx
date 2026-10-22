import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import { PaginationBar } from '../../components/common/EntityDisplay';
import { Button } from '../../components/ui/Button';
import { RestrictedState } from '../../components/ui/Feedback';
import { ResponsiveDataView } from '../../components/ui/ResponsiveDataView';
import { useToast } from '../../components/ui/ToastProvider';
import studentService from '../../services/studentService';
import universityService from '../../services/universityService';
import { AcademicYearCorrectionResponse, Level, Program, Student } from '../../types';
import AcademicYearCorrectionModal from './AcademicYearCorrectionModal';
import ExcelImportModal from './ExcelImportModal';
import ReinscriptionModal from './ReinscriptionModal';
import StudentFilters from './StudentFilters';
import StudentFormModal from './StudentFormModal';
import StudentListView from './StudentListView';
import StudentSummary from './StudentSummary';
import { useStudentSummaryQuery, useStudentsQuery } from './studentQueries';
import { useStudentListParams } from './useStudentListParams';
import { useStudentListScroll } from './useStudentListScroll';

const MANAGER_ROLES = ['ADMIN', 'DEAN', 'SECRETARY'];
const YEAR_CORRECTION_ROLES = ['ADMIN', 'SECRETARY'];

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : undefined;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { params, setParam, clearFilters } = useStudentListParams();
  const query = useStudentsQuery(params);
  const summaryQuery = useStudentSummaryQuery(params.current_year_only);
  const canManage = MANAGER_ROLES.includes(user?.role || '');
  const canCorrectYear = YEAR_CORRECTION_ROLES.includes(user?.role || '');
  const students = query.data?.results || [];
  const totalCount = query.data?.count || 0;
  const restricted = query.isError && getHttpStatus(query.error) === 403;

  useStudentListScroll(`${location.pathname}${location.search}`, query.isSuccess);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReinscriptionModal, setShowReinscriptionModal] = useState(false);
  const [showYearCorrection, setShowYearCorrection] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      universityService.getPrograms({ page_size: 100 }),
      universityService.getLevels({ page_size: 100 }),
    ]).then(([programData, levelData]) => {
      if (!active) return;
      setPrograms(programData.results || []);
      setLevels(levelData.results || []);
    }).catch(() => {
      if (active) {
        toast.error(t(
          'students.errors.options',
          'Impossible de charger les options de programme et de niveau.',
        ));
      }
    });

    return () => {
      active = false;
    };
  }, [t, toast]);

  useEffect(() => {
    setSelectedIds([]);
  }, [
    params.page,
    params.search,
    params.program,
    params.current_level,
    params.status,
    params.current_year_only,
    params.ordering,
  ]);

  const refreshStudents = useCallback(() => {
    setSelectedIds([]);
    void query.refetch();
    void summaryQuery.refetch();
  }, [query, summaryQuery]);

  const handleYearCorrectionCompleted = (result: AcademicYearCorrectionResponse) => {
    // The dialog stays open so the operator can review the result first.
    refreshStudents();
    if (result.blocked.length === 0) {
      toast.success(t(
        'students.year_correction.summary_complete',
        'Tous les étudiants sélectionnés ont été transférés.',
      ));
    } else {
      toast.info(t('students.year_correction.summary_partial', {
        count: result.blocked.length,
        defaultValue: '{{count}} étudiant(s) bloqué(s) pour revue manuelle.',
      }));
    }
  };

  const handleDownloadIdCard = async (student: Student) => {
    try {
      const blob = await studentService.downloadIdCard(student.id);
      downloadBlob(blob, `carte_etudiant_${student.student_id}.png`);
    } catch {
      toast.error(t(
        'students.errors.id_card',
        'Erreur lors du téléchargement de la carte étudiante.',
      ));
    }
  };

  const handleBulkDownload = async () => {
    if (!canManage || selectedIds.length === 0) return;

    try {
      const blob = await studentService.downloadBulkIdCards(selectedIds);
      downloadBlob(blob, 'cartes_etudiantes.zip');
    } catch {
      toast.error(t(
        'students.errors.bulk_id_cards',
        'Erreur lors du téléchargement groupé des cartes.',
      ));
    }
  };

  const handleExport = async () => {
    if (!canManage) return;

    try {
      const blob = await studentService.exportStudents(params);
      downloadBlob(blob, 'etudiants.xlsx');
    } catch {
      toast.error(t(
        'students.errors.export',
        "Erreur lors de l'exportation Excel.",
      ));
    }
  };

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setShowStudentForm(true);
  };

  const handleView = (studentId: number) => {
    navigate(`/students/${studentId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const toggleSelection = (id: number) => {
    if (!canManage) return;
    setSelectedIds((current) => current.includes(id)
      ? current.filter((studentId) => studentId !== id)
      : [...current, id]);
  };

  const toggleAll = (checked: boolean) => {
    if (!canManage) return;
    setSelectedIds(checked ? students.map((student) => student.id) : []);
  };

  const openCreate = () => {
    setStudentToEdit(null);
    setShowStudentForm(true);
  };

  const closeStudentForm = () => {
    setShowStudentForm(false);
    setStudentToEdit(null);
  };

  const createAction = canManage ? (
    <Button onClick={openCreate}>
      <PlusIcon className="h-5 w-5" aria-hidden="true" />
      {t('students.actions.add', 'Ajouter')}
    </Button>
  ) : undefined;

  const renderList = (view: 'mobile' | 'desktop') => (
    <StudentListView
      students={students}
      selectedIds={selectedIds}
      ordering={params.ordering}
      onSort={(ordering) => setParam('ordering', ordering)}
      onToggle={toggleSelection}
      onToggleAll={toggleAll}
      onView={handleView}
      onEdit={handleEdit}
      onDownloadCard={handleDownloadIdCard}
      canManage={canManage}
      view={view}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('sidebar.academics', 'Scolarité')}
        title={t('students.title', 'Gestion des Étudiants')}
        description={t('students.subtitle', {
          count: totalCount,
          defaultValue: '{{count}} étudiants au total',
        })}
        icon={<UsersIcon className="h-6 w-6" aria-hidden="true" />}
        actions={canManage ? (
          <>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <ArrowUpTrayIcon className="h-5 w-5" aria-hidden="true" />
              {t('students.actions.import', 'Importer')}
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
              {t('students.actions.export', 'Exporter')}
            </Button>
            <Button variant="secondary" onClick={() => setShowReinscriptionModal(true)}>
              <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              {t('students.actions.reinscription', 'Ré-inscription')}
            </Button>
            {createAction}
          </>
        ) : undefined}
      />

      <StudentSummary
        summary={summaryQuery.data}
        loading={summaryQuery.isLoading}
        error={summaryQuery.isError && !summaryQuery.data}
        onRetry={() => void summaryQuery.refetch()}
      />

      <StudentFilters
        params={params}
        programs={programs}
        levels={levels}
        onChange={setParam}
        onClear={clearFilters}
      />

      {canManage && selectedIds.length > 0 && (
        <section
          aria-label={t('students.selection.actions', 'Actions sur la sélection')}
          className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-ui-primary/25 bg-ui-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-bold text-ui-foreground">
            {t('students.selection.selected', {
              count: selectedIds.length,
              defaultValue: '{{count}} étudiant(s) sélectionné(s)',
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setSelectedIds([])}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button onClick={handleBulkDownload}>
              <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
              {t('students.actions.download_cards', 'Télécharger les cartes')}
            </Button>
            {canCorrectYear && (
              <Button variant="secondary" onClick={() => setShowYearCorrection(true)}>
                <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                {t('students.actions.correct_year', "Corriger l'année académique")}
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface shadow-panel">
        {restricted ? (
          <RestrictedState
            title={t('students.restricted.title', 'Accès restreint')}
            description={t(
              'students.restricted.description',
              "Votre rôle ne permet pas d'afficher cette liste.",
            )}
          />
        ) : (
          <>
            <ResponsiveDataView
              loading={query.isLoading}
              backgroundFetching={query.isFetching && !query.isLoading}
              error={query.isError}
              empty={!query.isLoading && !query.isError && students.length === 0}
              desktop={renderList('desktop')}
              mobile={renderList('mobile')}
              emptyTitle={t('students.empty.title', 'Aucun étudiant trouvé')}
              emptyDescription={t(
                'students.empty.subtitle',
                'Modifiez les filtres ou ajoutez un nouvel étudiant.',
              )}
              emptyAction={createAction}
              errorTitle={t('students.error.title', 'Impossible de charger les étudiants')}
              errorDescription={t(
                'students.error.description',
                'Vérifiez votre connexion puis réessayez.',
              )}
              loadingLabel={t('students.loading', 'Chargement des étudiants')}
              refreshLabel={t('students.refreshing', 'Actualisation des étudiants')}
              onRetry={() => void query.refetch()}
            />
            {!query.isLoading && !query.isError && students.length > 0 && (
              <PaginationBar
                currentPage={params.page}
                currentCount={students.length}
                total={totalCount}
                pageSize={20}
                onPrevious={() => setParam('page', Math.max(1, params.page - 1))}
                onNext={() => setParam('page', params.page + 1)}
                nextDisabled={!query.data?.next}
              />
            )}
          </>
        )}
      </section>

      {showStudentForm && (
        <StudentFormModal
          student={studentToEdit}
          onClose={closeStudentForm}
          onSuccess={closeStudentForm}
        />
      )}

      {showReinscriptionModal && (
        <ReinscriptionModal
          open={showReinscriptionModal}
          onClose={() => setShowReinscriptionModal(false)}
          onSuccess={() => {
            setShowReinscriptionModal(false);
            refreshStudents();
            toast.success(t('students.reinscription.success', 'Étudiant inscrit pour l\'année en cours.'));
          }}
        />
      )}

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onRefresh={refreshStudents}
      />

      {showYearCorrection && (
        <AcademicYearCorrectionModal
          open
          studentIds={selectedIds}
          onClose={() => setShowYearCorrection(false)}
          onCompleted={handleYearCorrectionCompleted}
        />
      )}
    </div>
  );
};

export default StudentsPage;
