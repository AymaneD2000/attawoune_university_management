import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import userService from '../../services/userService';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getFieldError, normalizeApiError, NormalizedApiError } from '../../utils/apiError';
import { changedFields, hasChangedFields } from '../../utils/partialUpdate';

interface UserFormModalProps {
    user?: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

const createUserFormData = (user?: User | null) => ({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    password_confirm: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'STUDENT',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || 'M',
    date_of_birth: user?.date_of_birth || '',
    is_active: user?.is_active ?? true,
});

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<NormalizedApiError | null>(null);

    const [formData, setFormData] = useState(() => createUserFormData(user));

    useEffect(() => {
        setFormData(createUserFormData(user));
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData({ ...formData, [name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload: any = {
                ...formData,
                username: formData.username.trim(),
                email: formData.email.trim()
            };

            if (user) {
                const initialPayload: any = {
                    ...createUserFormData(user),
                    username: user.username.trim(),
                    email: (user.email || '').trim(),
                };
                const updateData: any = changedFields(payload, initialPayload);
                delete updateData.username;

                if (!isAdmin) {
                    delete updateData.role;
                    delete updateData.is_active;
                }
                if (!updateData.password) {
                    delete updateData.password;
                    delete updateData.password_confirm;
                }
                if ('date_of_birth' in updateData && !updateData.date_of_birth) {
                    updateData.date_of_birth = null;
                }

                if (hasChangedFields(updateData)) {
                    await userService.updateUser(user.id, updateData as any);
                }
            } else {
                // Create
                if (!payload.email) delete payload.email;
                if (!payload.date_of_birth) delete payload.date_of_birth;
                if (!payload.phone) delete payload.phone;
                if (!payload.address) delete payload.address;
                await userService.createUser(payload);
            }
            onSuccess();
        } catch (err: any) {
            console.error('Error saving user:', err);
            setError(normalizeApiError(err.response?.data));
        } finally {
            setLoading(false);
        }
    };

    const roles = ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'SECRETARY'];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {user ? t('admin.users.modal.title_edit') : t('admin.users.modal.title_new')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                            {error.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            {!user && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.username')}</label>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${getFieldError(error, 'username') ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {getFieldError(error, 'username') && <p className="mt-1 text-xs text-red-500">{getFieldError(error, 'username')}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    disabled={!!user && !isAdmin}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${(user && !isAdmin) ? 'bg-gray-50 bg-opacity-50 cursor-not-allowed' : ''} ${getFieldError(error, 'email') ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {getFieldError(error, 'email') && <p className="mt-1 text-xs text-red-500">{getFieldError(error, 'email')}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.first_name')}</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        required
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.last_name')}</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        required
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.role')}</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={!isAdmin}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${!isAdmin ? 'bg-gray-50 bg-opacity-50 cursor-not-allowed text-gray-500' : ''}`}
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{t(`admin.users.roles.${role}`)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Passwords / Additional Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('admin.users.modal.password')} {user && <span className="text-gray-400 font-normal text-xs ml-1">(Laissez vide pour conserver)</span>}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!user}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${getFieldError(error, 'password') ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {getFieldError(error, 'password') && <p className="mt-1 text-xs text-red-500">{getFieldError(error, 'password')}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.password_confirm')}</label>
                                <input
                                    type="password"
                                    name="password_confirm"
                                    required={!user}
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {user && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.phone')}</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3 mt-8">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange as any}
                                            disabled={!isAdmin}
                                            className={`h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        <label htmlFor="is_active" className={`text-sm font-medium ${!isAdmin ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {t('admin.users.modal.is_active')}
                                        </label>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.gender')}</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value="M">{t('admin.users.gender.M')}</option>
                                        <option value="F">{t('admin.users.gender.F')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.date_of_birth')}</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.modal.address')}</label>
                        <textarea
                            name="address"
                            rows={2}
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
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
                            {loading ? t('common.loading') : user ? t('admin.users.modal.update') : t('admin.users.modal.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
