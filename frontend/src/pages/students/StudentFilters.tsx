import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterChip, FilterToolbar } from '../../components/ui/FilterToolbar';
import { Level, Program, StudentListParams } from '../../types';

interface StudentFiltersProps {
  params: StudentListParams;
  programs: Program[];
  levels: Level[];
  onChange: <K extends keyof StudentListParams>(
    key: K,
    value: StudentListParams[K],
  ) => void;
  onClear: () => void;
}

const controlClass = 'min-h-11 w-full rounded-[var(--radius-control)] border border-ui-border bg-ui-surface px-3 text-sm font-semibold text-ui-foreground outline-none transition focus:border-ui-primary focus:ring-4 focus:ring-ui-ring/20';

const StudentFilters: React.FC<StudentFiltersProps> = ({
  params,
  programs,
  levels,
  onChange,
  onClear,
}) => {
  const { t } = useTranslation();
  const searchId = React.useId();
  const programId = React.useId();
  const levelId = React.useId();
  const statusId = React.useId();
  const yearId = React.useId();

  const selectedProgram = programs.find((program) => program.id === params.program);
  const selectedLevel = levels.find((level) => level.id === params.current_level);
  const chips: FilterChip[] = [];

  if (params.search) {
    chips.push({
      key: 'search',
      label: t('students.filters.chips.search', {
        value: params.search,
        defaultValue: 'Recherche : {{value}}',
      }),
      onRemove: () => onChange('search', ''),
    });
  }
  if (params.program !== null) {
    chips.push({
      key: 'program',
      label: t('students.filters.chips.program', {
        value: selectedProgram?.name || params.program,
        defaultValue: 'Programme : {{value}}',
      }),
      onRemove: () => onChange('program', null),
    });
  }
  if (params.current_level !== null) {
    chips.push({
      key: 'current_level',
      label: t('students.filters.chips.level', {
        value: selectedLevel?.display_name || selectedLevel?.name || params.current_level,
        defaultValue: 'Niveau : {{value}}',
      }),
      onRemove: () => onChange('current_level', null),
    });
  }
  if (params.status) {
    chips.push({
      key: 'status',
      label: t('students.filters.chips.status', {
        value: t(`students.filters.${params.status.toLowerCase()}`, params.status),
        defaultValue: 'Statut : {{value}}',
      }),
      onRemove: () => onChange('status', ''),
    });
  }
  if (!params.current_year_only) {
    chips.push({
      key: 'current_year_only',
      label: t('students.filters.all_years', 'Toutes les années'),
      onRemove: () => onChange('current_year_only', true),
    });
  }

  return (
    <FilterToolbar
      label={t('students.filters.label', 'Filtres étudiants')}
      chips={chips}
      onClear={onClear}
      clearLabel={t('students.filters.clear', 'Effacer les filtres')}
    >
      <div>
        <label htmlFor={searchId} className="mb-1.5 block text-sm font-bold text-ui-foreground">
          {t('students.filters.search', 'Recherche')}
        </label>
        <input
          id={searchId}
          type="search"
          value={params.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder={t('students.search_placeholder', 'Rechercher par nom, matricule, email...')}
          className={controlClass}
        />
      </div>

      <div>
        <label htmlFor={programId} className="mb-1.5 block text-sm font-bold text-ui-foreground">
          {t('students.filters.program', 'Programme')}
        </label>
        <select
          id={programId}
          value={params.program ?? ''}
          onChange={(event) => onChange('program', event.target.value ? Number(event.target.value) : null)}
          className={controlClass}
        >
          <option value="">{t('students.filters.all_programs', 'Tous les programmes')}</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>{program.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={levelId} className="mb-1.5 block text-sm font-bold text-ui-foreground">
          {t('students.filters.level', 'Niveau')}
        </label>
        <select
          id={levelId}
          value={params.current_level ?? ''}
          onChange={(event) => onChange('current_level', event.target.value ? Number(event.target.value) : null)}
          className={controlClass}
        >
          <option value="">{t('students.filters.all_levels', 'Tous les niveaux')}</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>{level.display_name || level.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={statusId} className="mb-1.5 block text-sm font-bold text-ui-foreground">
          {t('students.filters.status', 'Statut')}
        </label>
        <select
          id={statusId}
          value={params.status}
          onChange={(event) => onChange('status', event.target.value as StudentListParams['status'])}
          className={controlClass}
        >
          <option value="">{t('students.filters.all_status', 'Tous les statuts')}</option>
          <option value="ACTIVE">{t('students.filters.active', 'Actif')}</option>
          <option value="GRADUATED">{t('students.filters.graduated', 'Diplômé')}</option>
          <option value="SUSPENDED">{t('students.filters.suspended', 'Suspendu')}</option>
          <option value="DROPPED">{t('students.filters.dropped', 'Abandonné')}</option>
        </select>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-ui-foreground">
          {t('students.filters.scope', 'Période')}
        </span>
        <label
          htmlFor={yearId}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-ui-border bg-ui-surface px-3 text-sm font-semibold text-ui-foreground transition hover:bg-ui-surface-muted focus-within:ring-4 focus-within:ring-ui-ring/20"
        >
          <input
            id={yearId}
            type="checkbox"
            checked={params.current_year_only}
            onChange={(event) => onChange('current_year_only', event.target.checked)}
            className="h-5 w-5 rounded border-ui-border text-ui-primary focus:ring-ui-ring"
          />
          {t('students.filters.current_year_only', 'Année en cours uniquement')}
        </label>
      </div>
    </FilterToolbar>
  );
};

export default StudentFilters;
