import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { DialogShell } from '../../components/ui/DialogShell';
import studentService from '../../services/studentService';
import universityService from '../../services/universityService';
import { AcademicYear, AcademicYearCorrectionResponse } from '../../types';
import { normalizeApiError, NormalizedApiError } from '../../utils/apiError';

interface AcademicYearCorrectionModalProps {
  open: boolean;
  studentIds: number[];
  onClose: () => void;
  onCompleted: (result: AcademicYearCorrectionResponse) => void;
}

const todayIso = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const AcademicYearCorrectionModal: React.FC<AcademicYearCorrectionModalProps> = ({
  open,
  studentIds,
  onClose,
  onCompleted,
}) => {
  const { t } = useTranslation();

  const yearsQuery = useQuery({
    queryKey: ['university', 'academic-years'],
    queryFn: async () => (await universityService.getAcademicYears({ page_size: 100 })).results || [],
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const years: AcademicYear[] = yearsQuery.data || [];

  const [sourceYearId, setSourceYearId] = useState<number | ''>('');
  const [targetYearId, setTargetYearId] = useState<number | ''>('');
  const [enrollmentDate, setEnrollmentDate] = useState(todayIso);
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState<NormalizedApiError | null>(null);
  const [result, setResult] = useState<AcademicYearCorrectionResponse | null>(null);

  // Reset the flow each time the dialog is opened.
  useEffect(() => {
    if (open) {
      setSourceYearId('');
      setTargetYearId('');
      setEnrollmentDate(todayIso());
      setBusy(false);
      setValidationError('');
      setApiError(null);
      setResult(null);
    }
  }, [open]);

  // Default the target year to the active academic year once the list loads.
  useEffect(() => {
    if (open && targetYearId === '' && years.length > 0) {
      setTargetYearId(years.find((year) => year.is_current)?.id ?? years[0].id);
    }
  }, [open, years, targetYearId]);

  const confirmDisabled =
    sourceYearId === '' ||
    targetYearId === '' ||
    sourceYearId === targetYearId ||
    enrollmentDate.trim() === '' ||
    busy;

  const handleSubmit = async () => {
    if (sourceYearId === '') {
      setValidationError(t('students.year_correction.select_source', "Sélectionnez l'année source."));
      return;
    }
    if (targetYearId === '') {
      setValidationError(t('students.year_correction.select_target', "Sélectionnez l'année cible."));
      return;
    }
    if (sourceYearId === targetYearId) {
      setValidationError(t(
        'students.year_correction.years_differ',
        "L'année cible doit être différente de l'année source.",
      ));
      return;
    }
    if (enrollmentDate.trim() === '') {
      setValidationError(t('students.year_correction.select_date', 'Renseignez la date d\'inscription corrigée.'));
      return;
    }

    setBusy(true);
    setValidationError('');
    setApiError(null);
    try {
      const response = await studentService.correctAcademicYear({
        student_ids: studentIds,
        source_academic_year: sourceYearId,
        target_academic_year: targetYearId,
        enrollment_date: enrollmentDate,
      });
      setResult(response);
      onCompleted(response);
    } catch (error: unknown) {
      setApiError(normalizeApiError(
        (error as { response?: { data?: unknown } }).response?.data,
        t('students.year_correction.error_default', "Erreur lors de la correction de l'année académique."),
      ));
    } finally {
      setBusy(false);
    }
  };

  const selectClass = 'block w-full rounded-[var(--radius-control)] border border-ui-border bg-ui-surface px-3.5 py-2.5 text-sm font-medium';

  const renderYears = (placeholder: boolean) => (
    <>
      {placeholder && (
        <option value="">
          {t('students.year_correction.select_year', 'Sélectionner une année')}
        </option>
      )}
      {years.map((year) => (
        <option key={year.id} value={year.id}>{year.name}</option>
      ))}
    </>
  );

  return (
    <DialogShell
      open={open}
      size="lg"
      busy={busy}
      title={t('students.year_correction.title', "Corriger l'année académique")}
      description={t(
        'students.year_correction.description',
        'Transfère des étudiants nouvellement créés vers la bonne année académique.',
      )}
      onClose={onClose}
      footer={
        result ? (
          <Button onClick={onClose}>
            {t('students.year_correction.complete', 'Terminer')}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={confirmDisabled} loading={busy}>
              {t('students.year_correction.confirm', "Corriger l'année académique")}
            </Button>
          </>
        )
      }
    >
      {yearsQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-ui-muted">
          {t('students.year_correction.loading_years', 'Chargement des années académiques...')}
        </p>
      ) : result ? (
        <div className="space-y-5">
          {result.blocked.length === 0 ? (
            <p className="rounded-[var(--radius-control)] border border-green-300 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
              {t('students.year_correction.summary_complete', 'Tous les étudiants sélectionnés ont été transférés.')}
            </p>
          ) : (
            <p className="rounded-[var(--radius-control)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              {t('students.year_correction.summary_partial', {
                count: result.blocked.length,
                defaultValue: '{{count}} étudiant(s) bloqué(s) pour revue manuelle.',
              })}
            </p>
          )}

          {result.transferred.length > 0 && (
            <section aria-label={t('students.year_correction.transferred', 'Étudiants transférés')}>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-ui-muted">
                {t('students.year_correction.transferred', 'Étudiants transférés')}
              </h3>
              <ul className="divide-y divide-ui-border rounded-[var(--radius-panel)] border border-ui-border">
                {result.transferred.map((item) => (
                  <li
                    key={item.student}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-ui-foreground">{item.name}</span>
                    <span className="text-ui-muted" dir="ltr">
                      {item.old_student_id} → {item.new_student_id}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.blocked.length > 0 && (
            <section aria-label={t('students.year_correction.blocked', 'Étudiants bloqués')}>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-ui-muted">
                {t('students.year_correction.blocked', 'Étudiants bloqués')}
              </h3>
              <ul className="divide-y divide-ui-border rounded-[var(--radius-panel)] border border-ui-border">
                {result.blocked.map((item) => (
                  <li key={item.student} className="px-4 py-3 text-sm">
                    <p className="font-bold text-ui-foreground" dir="ltr">
                      {item.student_id ?? String(item.student)}
                    </p>
                    <p className="text-ui-muted">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm font-bold text-ui-foreground">
            {t('students.year_correction.selected_count', {
              count: studentIds.length,
              defaultValue: '{{count}} étudiant(s) sélectionné(s)',
            })}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="year-correction-source" className="mb-1.5 block text-sm font-bold text-ui-foreground">
                {t('students.year_correction.source_year', 'Année source')}
              </label>
              <select
                id="year-correction-source"
                value={String(sourceYearId)}
                onChange={(event) => setSourceYearId(event.target.value === '' ? '' : Number(event.target.value))}
                disabled={busy}
                className={selectClass}
              >
                {renderYears(true)}
              </select>
            </div>
            <div>
              <label htmlFor="year-correction-target" className="mb-1.5 block text-sm font-bold text-ui-foreground">
                {t('students.year_correction.target_year', 'Année cible')}
              </label>
              <select
                id="year-correction-target"
                value={String(targetYearId)}
                onChange={(event) => setTargetYearId(event.target.value === '' ? '' : Number(event.target.value))}
                disabled={busy}
                className={selectClass}
              >
                {renderYears(false)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="year-correction-date" className="mb-1.5 block text-sm font-bold text-ui-foreground">
              {t('students.year_correction.corrected_date', "Date d'inscription corrigée")}
            </label>
            <input
              id="year-correction-date"
              type="date"
              value={enrollmentDate}
              onChange={(event) => setEnrollmentDate(event.target.value)}
              disabled={busy}
              className={selectClass}
            />
          </div>

          <p className="rounded-[var(--radius-control)] border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            {t('students.year_correction.warning', "Cette opération régénère les matricules et le solde financier de l'année source. Les étudiants avec des paiements, des notes, des présences, des dettes ou des délibérations dans l'année source seront bloqués pour revue manuelle.")}
          </p>

          {(validationError || apiError) && (
            <p
              className="rounded-[var(--radius-control)] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              role="alert"
            >
              {apiError ? apiError.message : validationError}
            </p>
          )}
        </div>
      )}
    </DialogShell>
  );
};

export default AcademicYearCorrectionModal;
