import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import MainLayout from './MainLayout';

let mockPathname = '/dashboard';
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  Outlet: () => <p>Contenu de la route</p>,
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'Test',
      full_name: 'Admin Test',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
    i18n: { language: 'fr' },
  }),
}));

vi.mock('../common/LanguageSwitcher', () => ({
  default: () => <button type="button">Langue</button>,
}));

const renderLayout = () => render(<MainLayout />);

describe('MainLayout accessibility', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
    mockNavigate.mockClear();
  });

  it('provides a skip link targeting the keyboard-focusable main region', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Aller au contenu principal' }))
      .toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus to the main region after the pathname changes', async () => {
    const { rerender } = renderLayout();
    const destination = screen.getByRole('button', { name: 'Langue' });

    destination.focus();
    expect(destination).toHaveFocus();
    mockPathname = '/students';
    rerender(<MainLayout />);

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('opens the mobile drawer and moves focus to its close button', async () => {
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Ouvrir le menu' });

    expect(menuButton).toHaveAttribute('aria-controls', 'app-sidebar');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('complementary', { name: 'Navigation principale' }))
      .toHaveClass('app-sidebar-open');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());
  });

  it('restores focus to the mobile menu trigger after the close button dismisses the drawer', async () => {
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Ouvrir le menu' });

    fireEvent.click(menuButton);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(menuButton).toHaveFocus();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('restores focus after scrim and Escape dismissal', async () => {
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Ouvrir le menu' });

    fireEvent.click(menuButton);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));
    expect(menuButton).toHaveFocus();

    fireEvent.click(menuButton);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menuButton).toHaveFocus();
  });

  it('keeps route focus on main when a pathname change closes the drawer', async () => {
    const { rerender } = renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Ouvrir le menu' });

    fireEvent.click(menuButton);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());
    mockPathname = '/students';
    rerender(<MainLayout />);

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('shell locale accessibility labels', () => {
  const shellKeys = [
    'skip_to_content',
    'open_menu',
    'close_menu',
    'main_navigation',
    'expand',
    'collapse',
  ];
  const frenchCommon = frTranslations.common as Record<string, string>;
  const arabicCommon = arTranslations.common as Record<string, string>;

  it('defines the same shell accessibility keys in French and Arabic', () => {
    expect(shellKeys.filter((key) => !frenchCommon[key])).toEqual([]);
    expect(shellKeys.filter((key) => !arabicCommon[key])).toEqual([]);
  });

  it('uses Arabic text for every Arabic shell accessibility label', () => {
    shellKeys.forEach((key) => {
      expect(arabicCommon[key]).toMatch(/[\u0600-\u06ff]/);
    });
  });
});
