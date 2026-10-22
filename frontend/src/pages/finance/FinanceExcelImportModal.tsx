import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  title: string;
  requiredColumns: string;
  importFn: (file: File) => Promise<any>;
  downloadTemplateFn: () => Promise<any>;
  templateFileName: string;
}

const FinanceExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen, onClose, onRefresh, title, requiredColumns,
  importFn, downloadTemplateFn, templateFileName
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success_count: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier Excel.'); return; }
    setLoading(true); setError(null); setResults(null);
    try {
      const resp = await importFn(file);
      setResults(resp);
      if (resp.success_count > 0) onRefresh();
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const errorMessage = typeof apiError === 'string' ? apiError : apiError?.message || 'Une erreur est survenue.';
      setError(errorMessage);
      if (err.response?.data?.errors) setResults({ success_count: 0, errors: err.response.data.errors });
    } finally { setLoading(false); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplateFn();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', templateFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error('Failed to download template', err); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex">
              <ArrowDownTrayIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Colonnes requises : <strong>{requiredColumns}</strong>.
                </p>
                <button onClick={handleDownloadTemplate} className="mt-2 text-sm font-semibold text-blue-700 hover:text-blue-600 underline">
                  Télécharger le template
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fichier Excel (.xlsx)</label>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
              <div className="space-y-1 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="finance-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                    <span>Choisir un fichier</span>
                    <input id="finance-file-upload" type="file" accept=".xlsx" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500">XLSX jusqu'à 10MB</p>
              </div>
            </div>
            {file && <p className="mt-2 text-sm text-gray-900 font-medium">Fichier: <span className="text-indigo-600">{file.name}</span></p>}
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm font-medium">{error}</div>}
          {results && (
            <div className={`p-4 rounded-md ${results.errors.length > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
              <h4 className={`text-sm font-bold ${results.errors.length > 0 ? 'text-orange-800' : 'text-green-800'}`}>Résultats</h4>
              <p className={`text-sm ${results.errors.length > 0 ? 'text-orange-700' : 'text-green-700'} mt-1`}>Succès: {results.success_count} enregistrement(s).</p>
              {results.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-orange-800">Erreurs ({results.errors.length}):</p>
                  <ul className="list-disc list-inside text-xs text-orange-700 mt-1">
                    {results.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md">Fermer</button>
          <button onClick={handleImport} disabled={!file || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50 flex items-center">
            {loading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>Importation...</>) : "Lancer l'importation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceExcelImportModal;
