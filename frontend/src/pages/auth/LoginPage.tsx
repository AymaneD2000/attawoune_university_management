import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { normalizeApiError } from '../../utils/apiError';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(normalizeApiError(
        err.response?.data,
        t('auth.login.invalid_credentials', 'Identifiants incorrects'),
      ).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={t('auth.login.eyebrow', 'Bienvenue')}
      title={t('auth.login.title', 'Connectez-vous')}
      subtitle={t('auth.login.subtitle', 'Accédez à votre espace universitaire sécurisé.')}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="brand-label">
            {t('auth.login.username_label', "Nom d'utilisateur")}
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="brand-input ps-11"
              placeholder={t('auth.login.username_placeholder', "Votre nom d'utilisateur")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="brand-label">
            {t('auth.login.password_label', 'Mot de passe')}
          </label>
          <div className="relative">
            <LockClosedIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="brand-input px-11"
              placeholder={t('auth.login.password_placeholder', 'Votre mot de passe')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute end-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
              aria-label={showPassword ? t('auth.login.hide_password', 'Masquer le mot de passe') : t('auth.login.show_password', 'Afficher le mot de passe')}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? t('auth.login.loading', 'Connexion...') : t('auth.login.submit', 'Se connecter')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('auth.login.no_account', 'Vous ne possédez pas encore de compte ?')}{' '}
          <Link to="/register" className="font-bold text-blue-700 hover:text-green-700">
            {t('auth.login.create_account', 'Créer un compte')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
