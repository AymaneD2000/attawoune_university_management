import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import userService from '../../services/userService';
import { User } from '../../types';

interface ChangePasswordModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await userService.changePassword(user.id, formData);
            onSuccess();
        } catch (err: any) {
            console.error('Error changing password:', err);
            setError(err.response?.data || { detail: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b bg-indigo-50">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <KeyIcon className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            {t('admin.users.modal.title_password')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 italic">
                        {t('admin.users.modal.change_password')} : <span className="font-bold">{user.full_name}</span>
                    </div>

                    {error && error.detail && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                            {error.detail}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.old_password')}</label>
                            <input
                                type="password"
                                name="old_password"
                                required
                                value={formData.old_password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${error?.old_password ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {error?.old_password && <p className="mt-1 text-xs text-red-500">{error.old_password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.new_password')}</label>
                            <input
                                type="password"
                                name="new_password"
                                required
                                value={formData.new_password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${error?.new_password ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {error?.new_password && <p className="mt-1 text-xs text-red-500">{error.new_password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.new_password_confirm')}</label>
                            <input
                                type="password"
                                name="new_password_confirm"
                                required
                                value={formData.new_password_confirm}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-8 border-t pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {t('admin.users.modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? t('common.loading') : t('admin.users.modal.change_password')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
