import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface AuditLog {
    id: number;
    user_name: string;
    user_email?: string;
    user_username?: string;
    user_first_name?: string;
    user_last_name?: string;
    action: string;
    model_name: string;
    object_id: string;
    object_repr: string;
    details: any;
    ip_address: string;
    timestamp: string;
}

const AuditLogPage: React.FC = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [modelFilter, setModelFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                page: page,
                search: search,
                ordering: '-timestamp'
            };
            if (modelFilter) params.model_name = modelFilter;
            if (actionFilter) params.action = actionFilter;

            const response = await api.get('/audit/logs/', { params });
            setLogs(response.data.results);
            setTotalPages(Math.ceil(response.data.count / 20)); // Assuming page size 20
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, modelFilter, actionFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);



    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on search
        fetchLogs();
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">{t('audit.title', 'Logs d\'Audit')}</h1>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search', 'Rechercher')}</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('audit.search_placeholder', 'Utilisateur, ID, Info...')}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.model', 'Modèle')}</label>
                        <input
                            type="text"
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                            placeholder="Ex: Student, Grade"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('audit.action', 'Action')}</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">{t('common.all', 'Toutes')}</option>
                            <option value="CREATE">CREATE</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                            <option value="LOGIN">LOGIN</option>
                            <option value="LOGOUT">LOGOUT</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            {t('common.filter', 'Filtrer')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.timestamp', 'Date/Heure')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.user', 'Utilisateur')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.action', 'Action')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.target', 'Cible')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.info', 'Info')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">{t('common.loading', 'Chargement...')}</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">{t('common.no_results', 'Aucun résultat trouvé')}</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.user_username ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {log.user_first_name} {log.user_last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {log.user_username} • {log.user_email}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900">
                                                    {log.user_name || 'Système'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                                log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                                                log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="font-medium text-gray-700">{log.model_name}</span>
                                            <span className="text-gray-400 mx-1">#</span>
                                            <span>{log.object_id}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={log.object_repr}>
                                            {log.object_repr}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                {t('common.details', 'Détails')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Suivant
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">Précédent</span>
                                    ←
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">Suivant</span>
                                    →
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedLog(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Détails du Log #{selectedLog.id}
                                </h3>
                                <div className="mt-4 text-sm text-gray-600">
                                    <div className="mb-4">
                                        <p><strong>Utilisateur:</strong> {selectedLog.user_username ? (
                                            <span>{selectedLog.user_first_name} {selectedLog.user_last_name} ({selectedLog.user_username} - {selectedLog.user_email})</span>
                                        ) : selectedLog.user_name || 'Système'}</p>
                                    </div>
                                    <p><strong>Action:</strong> {selectedLog.action}</p>
                                    <p><strong>Cible:</strong> {selectedLog.model_name} #{selectedLog.object_id}</p>
                                    <p><strong>Représentation:</strong> {selectedLog.object_repr}</p>
                                    <p><strong>IP:</strong> {selectedLog.ip_address}</p>
                                    <p><strong>Date:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>

                                    <div className="mt-4">
                                        <strong>Détails techniques (JSON):</strong>
                                        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setSelectedLog(null)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
