import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError(t('auth.register.password_mismatch', 'Les mots de passe ne correspondent pas.'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/accounts/register/', formData);
      navigate('/login', {
        state: { message: t('auth.register.success', 'Compte créé avec succès. Vous pouvez maintenant vous connecter.') },
      });
    } catch (err: any) {
      setError(normalizeApiError(err.response?.data).message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'first_name', label: t('auth.register.first_name', 'Prénom'), type: 'text', autoComplete: 'given-name' },
    { name: 'last_name', label: t('auth.register.last_name', 'Nom'), type: 'text', autoComplete: 'family-name' },
    { name: 'username', label: t('auth.register.username', "Nom d'utilisateur"), type: 'text', autoComplete: 'username' },
    { name: 'email', label: t('auth.register.email', 'Adresse email'), type: 'email', autoComplete: 'email' },
    { name: 'phone', label: t('auth.register.phone', 'Téléphone'), type: 'tel', autoComplete: 'tel', required: false },
    { name: 'password', label: t('auth.register.password', 'Mot de passe'), type: 'password', autoComplete: 'new-password' },
    { name: 'password_confirm', label: t('auth.register.password_confirm', 'Confirmer le mot de passe'), type: 'password', autoComplete: 'new-password' },
  ];

  return (
    <AuthLayout
      wide
      eyebrow={t('auth.register.eyebrow', 'Nouvelle inscription')}
      title={t('auth.register.title', 'Créer votre compte')}
      subtitle={t('auth.register.subtitle', 'Renseignez vos informations pour rejoindre la plateforme Attawoune.')}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={field.name} className={index >= 2 && index <= 4 ? 'sm:col-span-2' : ''}>
              <label htmlFor={field.name} className="brand-label">{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.required !== false}
                className="brand-input"
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? t('auth.register.loading', 'Création...') : t('auth.register.submit', 'Créer le compte')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('auth.register.has_account', 'Vous avez déjà un compte ?')}{' '}
          <Link to="/login" className="font-bold text-blue-700 hover:text-green-700">
            {t('auth.register.login', 'Se connecter')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
