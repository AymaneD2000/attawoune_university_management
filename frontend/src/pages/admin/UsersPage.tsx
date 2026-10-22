import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  FunnelIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  EmptyState,
  EntityAvatar,
  IconActionButton,
  ListLoading,
  PaginationBar,
  StatusPill,
} from '../../components/common/EntityDisplay';
import PageHeader from '../../components/common/PageHeader';
import userService from '../../services/userService';
import { User } from '../../types';
import ChangePasswordModal from './ChangePasswordModal';
import UserFormModal from './UserFormModal';

const PAGE_SIZE = 20;

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isDean = currentUser?.role === 'DEAN';
  const canSeeFilters = isAdmin || isDean;
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roles = ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'SECRETARY'];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        search: searchQuery,
        role: roleFilter || undefined,
        page: currentPage,
      });
      setUsers(data.results || []);
      setTotalUsers(data.count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getUserName = (user: User) =>
    user.full_name
      || [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
      || user.username;

  const getRoleTone = (role: User['role']): 'blue' | 'green' | 'orange' | 'earth' | 'slate' => ({
    ADMIN: 'blue',
    DEAN: 'earth',
    TEACHER: 'green',
    STUDENT: 'blue',
    ACCOUNTANT: 'orange',
    SECRETARY: 'slate',
  }[role] as 'blue' | 'green' | 'orange' | 'earth' | 'slate');

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(t('common.confirm.delete', `Voulez-vous vraiment supprimer l'utilisateur ${getUserName(user)} ?`))) return;

    try {
      await userService.deleteUser(user.id);
      await fetchUsers();
      setSuccessMessage(t('admin.users.messages.delete_success', 'Utilisateur supprimé avec succès'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const userActions = (user: User) => (
    <div className="flex items-center gap-1">
      <IconActionButton label={t('admin.users.modal.title_edit', 'Modifier')} tone="blue" onClick={() => handleEdit(user)}>
        <PencilSquareIcon className="h-5 w-5" />
      </IconActionButton>
      <IconActionButton label={t('admin.users.modal.title_password', 'Mot de passe')} tone="orange" onClick={() => handleChangePassword(user)}>
        <KeyIcon className="h-5 w-5" />
      </IconActionButton>
      {isAdmin && user.id !== currentUser?.id && (
        <IconActionButton label={t('common.delete', 'Supprimer')} tone="red" onClick={() => handleDelete(user)}>
          <TrashIcon className="h-5 w-5" />
        </IconActionButton>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={t('sidebar.administration', 'Administration')}
        title={t('admin.users.title', 'Gestion des utilisateurs')}
        description={t('admin.users.subtitle', 'Gérer les comptes, rôles et accès à la plateforme.')}
        icon={<UsersIcon className="h-6 w-6" />}
        actions={isAdmin && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowUserModal(true);
            }}
            className="brand-button"
          >
            <PlusIcon className="h-5 w-5" />
            {t('admin.users.actions.new', 'Nouvel utilisateur')}
          </button>
        )}
      />

      {canSeeFilters && (
        <div className="surface-panel p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={t('common.search', 'Rechercher...')}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="brand-input ps-12"
              />
            </div>
            <div className="relative w-full md:w-72">
              <FunnelIcon className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="brand-input ps-11"
              >
                <option value="">{t('admin.users.filters.all_roles', 'Tous les rôles')}</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{t(`admin.users.roles.${role}`, role)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <section className="surface-panel overflow-hidden">
        {loading ? (
          <ListLoading />
        ) : users.length === 0 ? (
          <EmptyState
            title={t('admin.users.empty', 'Aucun utilisateur trouvé')}
            description={t('admin.users.empty_description', 'Modifiez les filtres ou créez un nouveau compte utilisateur.')}
            action={isAdmin && (
              <button type="button" onClick={() => setShowUserModal(true)} className="brand-button">
                <PlusIcon className="h-5 w-5" />
                {t('admin.users.actions.new', 'Nouvel utilisateur')}
              </button>
            )}
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => {
                const name = getUserName(user);
                return (
                  <article key={user.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <EntityAvatar name={name} src={user.profile_picture} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-950">{name}</h3>
                            <p className="mt-0.5 truncate text-xs font-bold text-blue-700">@{user.username}</p>
                          </div>
                          <StatusPill tone={user.is_active ? 'green' : 'slate'} dot>
                            {user.is_active ? t('common.active', 'Actif') : t('common.inactive', 'Inactif')}
                          </StatusPill>
                        </div>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <EnvelopeIcon className="h-4 w-4 shrink-0 text-blue-600" />
                            <span className="truncate font-semibold">{user.email || t('common.not_provided', 'Non renseigné')}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <StatusPill tone={getRoleTone(user.role)}>{t(`admin.users.roles.${user.role}`, user.role)}</StatusPill>
                            <span className="text-xs font-semibold text-slate-400">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString(i18n.language) : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">{userActions(user)}</div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table>
                <thead>
                  <tr>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.user', 'Utilisateur')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.contact', 'Contact')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.role', 'Rôle')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.status', 'Statut')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.created', 'Créé le')}</th>
                    <th className="px-5 py-4 text-end text-xs font-black uppercase tracking-wider text-slate-500">{t('admin.users.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const name = getUserName(user);
                    return (
                      <tr key={user.id}>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[220px] items-center gap-3">
                            <EntityAvatar name={name} src={user.profile_picture} />
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">{name}</p>
                              <p className="mt-0.5 truncate text-xs font-bold text-blue-700">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[230px] truncate text-sm font-semibold text-slate-700">{user.email || '—'}</p>
                          <p className="mt-1 text-xs text-slate-400">{user.phone || t('common.not_provided', 'Téléphone non renseigné')}</p>
                        </td>
                        <td className="px-5 py-4"><StatusPill tone={getRoleTone(user.role)}>{t(`admin.users.roles.${user.role}`, user.role)}</StatusPill></td>
                        <td className="px-5 py-4">
                          <StatusPill tone={user.is_active ? 'green' : 'slate'} dot>
                            {user.is_active ? t('common.active', 'Actif') : t('common.inactive', 'Inactif')}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <CalendarDaysIcon className="h-4 w-4 text-orange-600" />
                            {user.created_at ? new Date(user.created_at).toLocaleDateString(i18n.language) : '—'}
                          </div>
                        </td>
                        <td className="px-5 py-4"><div className="flex justify-end">{userActions(user)}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              currentCount={users.length}
              total={totalUsers}
              pageSize={PAGE_SIZE}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => page + 1)}
            />
          </>
        )}
      </section>

      {showUserModal && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onSuccess={() => {
            setShowUserModal(false);
            fetchUsers();
            setSuccessMessage(
              selectedUser
                ? t('admin.users.messages.update_success', 'Utilisateur mis à jour avec succès')
                : t('admin.users.messages.create_success', 'Utilisateur créé avec succès'),
            );
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSuccessMessage(t('admin.users.modal.password_success', 'Mot de passe modifié avec succès'));
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-5 end-5 z-50 animate-fade-up">
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 text-green-800 shadow-floating">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
            <span className="text-sm font-bold">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
