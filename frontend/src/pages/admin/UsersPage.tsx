import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    KeyIcon,
    UserCircleIcon,
    FunnelIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import userService from '../../services/userService';
import { User } from '../../types';
import UserFormModal from './UserFormModal';
import ChangePasswordModal from './ChangePasswordModal';

const UsersPage: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getUsers({
                search: searchQuery,
                role: roleFilter || undefined
            });
            setUsers(data.results);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleChangePassword = (user: User) => {
        setSelectedUser(user);
        setShowPasswordModal(true);
    };

    const handleDelete = async (user: User) => {
        if (window.confirm(t('common.confirm.delete', `Voulez-vous vraiment supprimer l'utilisateur ${user.full_name} ?`))) {
            try {
                await userService.deleteUser(user.id);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const roles = ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'SECRETARY'];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('admin.users.title')}
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        {t('admin.users.subtitle')}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowUserModal(true);
                    }}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 stroke-2" />
                    <span className="font-bold">{t('admin.users.actions.new')}</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 bg-opacity-30">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow group">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-4 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all rtl:pl-4 rtl:pr-12 bg-white"
                            />
                        </div>
                        <div className="w-full md:w-64 relative">
                            <FunnelIcon className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-4" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all rtl:pl-4 rtl:pr-10 appearance-none bg-white font-medium"
                            >
                                <option value="">{t('admin.users.filters.all_roles')}</option>
                                {roles.map(role => (
                                    <option key={role} value={role}>{t(`admin.users.roles.${role}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent shadow-sm"></div>
                        <p className="mt-4 text-gray-500 font-medium animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 bg-opacity-50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest rtl:text-right">
                                        {t('admin.users.table.user')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest rtl:text-right">
                                        {t('admin.users.table.role')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest rtl:text-right">
                                        {t('admin.users.table.status')}
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest rtl:text-left">
                                        {t('admin.users.table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-indigo-50 hover:bg-opacity-30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 flex-shrink-0">
                                                    {user.profile_picture ? (
                                                        <img src={user.profile_picture} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                            <UserCircleIcon className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 rtl:ml-0 rtl:mr-4">
                                                    <div className="text-sm font-bold text-gray-900">{user.full_name}</div>
                                                    <div className="text-xs text-gray-500 font-medium">{user.username} • {user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold leading-5 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                                                        user.role === 'STUDENT' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {t(`admin.users.roles.${user.role}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {user.is_active ? (
                                                <span className="flex items-center text-green-600">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2 rtl:ml-2 rtl:mr-0 animate-pulse"></span>
                                                    {t('common.active')}
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-gray-400">
                                                    <span className="h-2 w-2 rounded-full bg-gray-300 mr-2 rtl:ml-2 rtl:mr-0"></span>
                                                    {t('common.inactive', 'Inactif')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    title={t('admin.users.modal.title_edit')}
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleChangePassword(user)}
                                                    className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                    title={t('admin.users.modal.title_password')}
                                                >
                                                    <KeyIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title={t('common.delete', 'Supprimer')}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                            {t('admin.users.empty', 'Aucun utilisateur trouvé')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showUserModal && (
                <UserFormModal
                    user={selectedUser}
                    onClose={() => setShowUserModal(false)}
                    onSuccess={() => {
                        setShowUserModal(false);
                        fetchUsers();
                    }}
                />
            )}

            {showPasswordModal && selectedUser && (
                <ChangePasswordModal
                    user={selectedUser}
                    onClose={() => setShowPasswordModal(false)}
                    onSuccess={() => {
                        setShowPasswordModal(false);
                        alert(t('admin.users.modal.password_success', 'Mot de passe modifié avec succès'));
                    }}
                />
            )}
        </div>
    );
};

export default UsersPage;
