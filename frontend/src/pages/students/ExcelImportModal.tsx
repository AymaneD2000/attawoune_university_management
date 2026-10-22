import React, { useState } from 'react';
import { DocumentArrowUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { DialogShell } from '../../components/ui/DialogShell';
import studentService from '../../services/studentService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success_count: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError(t('students.import_dialog.missing_file'));
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const resp = await studentService.importStudents(file);
      setResults(resp);
      if (resp.success_count > 0) {
        onRefresh();
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const errorMessage = typeof apiError === 'string'
        ? apiError
        : apiError?.message || err.response?.data?.message || t('students.import_dialog.generic_error');
      setError(errorMessage);

      if (err.response?.data?.errors) {
        setResults({ success_count: 0, errors: err.response.data.errors });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_etudiants.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download template', err);
    }
  };

  return (
    <DialogShell
      open={isOpen}
      title={t('students.import_dialog.title')}
      description={t('students.import_dialog.description')}
      onClose={onClose}
      size="md"
      busy={loading}
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('students.import_dialog.close')}
          </Button>
          <Button onClick={handleImport} disabled={!file} loading={loading}>
            {t('students.import_dialog.start')}
          </Button>
        </div>
      )}
    >
      <div className="space-y-4">
          <div className="rounded-[var(--radius-control)] border border-ui-primary/20 bg-ui-primary/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ArrowDownTrayIcon className="h-5 w-5 text-ui-primary" aria-hidden="true" />
              </div>
              <div className="ms-3">
                <p className="text-sm text-ui-primary-strong">
                  {t('students.import_dialog.instruction')}
                </p>
                <Button
                  variant="ghost"
                  onClick={handleDownloadTemplate}
                  className="mt-2 min-h-11 px-3 text-ui-primary-strong hover:text-ui-primary"
                >
                  {t('students.import_dialog.download_template')}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="file-upload" className="mb-2 block text-sm font-bold text-ui-foreground">
              {t('students.import_dialog.file_label')}
            </label>
            <div className="mt-1 flex justify-center rounded-[var(--radius-control)] border-2 border-dashed border-ui-border bg-ui-surface-muted px-6 pb-6 pt-5 transition-colors hover:border-ui-primary">
              <div className="space-y-1 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-ui-muted" aria-hidden="true" />
                <div className="flex items-center justify-center text-sm text-ui-muted">
                  <label htmlFor="file-upload" className="inline-flex min-h-11 cursor-pointer items-center rounded-[var(--radius-control)] bg-ui-surface px-3 font-bold text-ui-primary-strong transition hover:bg-ui-primary/10 hover:text-ui-primary focus-within:outline-none focus-within:ring-4 focus-within:ring-ui-ring/20">
                    <span>{t('students.import_dialog.choose_file')}</span>
                    <input id="file-upload" name="file-upload" type="file" accept=".xlsx" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="ps-1">{t('students.import_dialog.drag_hint')}</p>
                </div>
                <p className="text-xs text-ui-muted">{t('students.import_dialog.file_limit')}</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm font-medium text-ui-foreground">
                {t('students.import_dialog.selected_file', { name: file.name })}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-[var(--radius-control)] border border-ui-danger/30 bg-ui-danger/10 p-3 text-sm font-medium text-ui-danger" role="alert">
              {error}
            </div>
          )}

          {results && (
            <div className={`rounded-[var(--radius-control)] border p-4 ${results.errors.length > 0 ? 'border-ui-warning/30 bg-ui-warning/10' : 'border-ui-success/30 bg-ui-success/10'}`}>
              <h4 className={`text-sm font-bold ${results.errors.length > 0 ? 'text-ui-warning' : 'text-ui-success-strong'}`}>
                {t('students.import_dialog.results_title')}
              </h4>
              <p className={`mt-1 text-sm ${results.errors.length > 0 ? 'text-ui-earth' : 'text-ui-success-strong'}`}>
                {t('students.import_dialog.success_count', { count: results.success_count })}
              </p>
              {results.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-ui-warning">{t('students.import_dialog.errors_count', { count: results.errors.length })}</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-ui-earth">
                    {results.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </div>
    </DialogShell>
  );
};

export default ExcelImportModal;
