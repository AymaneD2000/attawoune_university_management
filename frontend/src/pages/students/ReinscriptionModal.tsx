import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { DialogShell } from '../../components/ui/DialogShell';
import studentService from '../../services/studentService';
import universityService from '../../services/universityService';
import { Level, ReinscriptionCandidate } from '../../types';
import { normalizeApiError, NormalizedApiError } from '../../utils/apiError';
import { studentQueryKeys } from './studentQueries';

interface ReinscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReinscriptionModal: React.FC<ReinscriptionModalProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [selected, setSelected] = useState<ReinscriptionCandidate | null>(null);
  const [levelId, setLevelId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset the flow each time the modal is opened.
  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
      setCreatedDate('');
      setSelected(null);
      setLevelId('');
      setError(null);
    }
  }, [open]);

  const candidatesQuery = useQuery({
    queryKey: ['students', 'reinscription-candidates', debouncedSearch, createdDate],
    queryFn: ({ signal }) =>
      studentService.getReinscriptionCandidates(
        debouncedSearch || undefined,
        createdDate || undefined,
        signal,
      ),
    enabled: open,
    staleTime: 30_000,
  });

  const levelsQuery = useQuery({
    queryKey: ['university', 'levels'],
    queryFn: async () => (await universityService.getLevels({ page_size: 100 })).results || [],
    enabled: open && selected !== null,
    staleTime: 5 * 60_000,
  });

  const candidates: ReinscriptionCandidate[] = candidatesQuery.data || [];
  const levels: Level[] = levelsQuery.data || [];

  const handleSelect = (candidate: ReinscriptionCandidate) => {
    setSelected(candidate);
    setLevelId('');
    setError(null);
  };

  const handleRegister = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await studentService.reinscribeStudent({
        student: selected.id,
        level: levelId ? Number(levelId) : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
      onSuccess();
    } catch (err: unknown) {
      setError(normalizeApiError(
        (err as { response?: { data?: unknown } }).response?.data,
        t('students.reinscription.error_default', 'Erreur lors de la ré-inscription.'),
      ));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell
      open={open}
      size="lg"
      busy={busy}
      title={t('students.reinscription.title', 'Ré-inscription (année précédente)')}
      description={t(
        'students.reinscription.description',
        "Choisissez un étudiant de l'année précédente pour l'inscrire dans l'année académique en cours. C'est le seul passage de données d'une année à l'autre.",
      )}
      onClose={onClose}
      footer={
        selected ? (
          <>
            <Button
              variant="secondary"
              onClick={() => { setSelected(null); setLevelId(''); setError(null); }}
              disabled={busy}
            >
              {t('students.reinscription.change_selection', 'Changer')}
            </Button>
            <Button onClick={() => void handleRegister()} disabled={busy}>
              <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              {t('students.reinscription.confirm', "Inscrire dans l'année en cours")}
            </Button>
          </>
        ) : undefined
      }
    >
      {selected ? (
        <div className="space-y-5">
          {/* Selected candidate */}
          <div className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface-muted p-4">
            <p className="text-lg font-black text-ui-foreground">{selected.name}</p>
            <p className="text-sm font-medium text-ui-muted" dir="ltr">
              {selected.student_id} · {selected.program}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ui-muted">
                  {t('students.reinscription.last_year', 'Dernière année')}
                </dt>
                <dd className="font-bold">{selected.last_year || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ui-muted">
                  {t('students.reinscription.last_level', 'Dernier niveau')}
                </dt>
                <dd className="font-bold">{selected.last_level || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Level for the active year */}
          <div>
            <label htmlFor="reinscription-level" className="mb-1.5 block text-sm font-bold text-ui-foreground">
              {t('students.reinscription.level_label', "Niveau pour l'année en cours")}
            </label>
            <select
              id="reinscription-level"
              value={levelId === '' ? 'default' : String(levelId)}
              onChange={(event) => setLevelId(event.target.value === 'default' ? '' : Number(event.target.value))}
              className="block w-full rounded-[var(--radius-control)] border border-ui-border bg-ui-surface px-3.5 py-2.5 text-sm font-medium"
            >
              <option value="default">
                {t('students.reinscription.level_default', "Même niveau que l'année précédente")}
              </option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.display_name || level.name}</option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-ui-muted">
              {t(
                'students.reinscription.level_hint',
                "L'inscription crée automatiquement le relevé financier de l'année en cours avec les frais du programme.",
              )}
            </p>
          </div>

          {error && (
            <p
              className="rounded-[var(--radius-control)] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              role="alert"
            >
              {error.message}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ui-muted" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('students.reinscription.search_placeholder', "Rechercher un étudiant de l'année précédente (nom ou matricule)...")}
              className="w-full rounded-[var(--radius-control)] border border-ui-border bg-ui-surface py-2.5 ps-11 pe-4 text-sm"
            />
          </div>

          <div>
            <label htmlFor="reinscription-created-date" className="mb-1.5 block text-sm font-bold text-ui-foreground">
              {t('students.reinscription.created_date_label', "Date d'ajout")}
            </label>
            <input
              id="reinscription-created-date"
              type="date"
              value={createdDate}
              onChange={(event) => setCreatedDate(event.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-ui-border bg-ui-surface px-3.5 py-2.5 text-sm font-medium"
            />
            <p className="mt-2 text-xs leading-5 text-ui-muted">
              {t('students.reinscription.created_date_hint', 'Correspond à la date de création du compte (« Créé le »). Laisser vide pour afficher tous les candidats éligibles.')}
            </p>
          </div>

          {candidatesQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-ui-muted">
              {t('students.reinscription.loading', 'Recherche...')}
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-ui-muted">
              {t('students.reinscription.empty', "Aucun étudiant de l'année précédente n'est éligible à la ré-inscription.")}
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-ui-border overflow-y-auto rounded-[var(--radius-panel)] border border-ui-border">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(candidate)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start transition hover:bg-ui-surface-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ui-foreground">{candidate.name}</p>
                      <p className="truncate text-xs text-ui-muted" dir="ltr">
                        {candidate.student_id} · {candidate.program}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-ui-muted">
                      {candidate.last_year
                        ? `${candidate.last_year} (${candidate.last_level || '?'})`
                        : t('students.reinscription.unknown_year', 'Année inconnue')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DialogShell>
  );
};

export default ReinscriptionModal;
