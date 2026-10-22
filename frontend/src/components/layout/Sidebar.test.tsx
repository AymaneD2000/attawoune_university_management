import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

let mockPathname = '/dashboard';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => vi.fn(),
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
  }),
}));

describe('Sidebar direction-aware positioning', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
    document.documentElement.dir = 'ltr';
  });

  it('uses the semantic sidebar class instead of conflicting RTL transform utilities', () => {
    document.documentElement.dir = 'rtl';

    const { container } = render(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('app-sidebar');
    expect(sidebar).toHaveClass('start-0');
    expect(sidebar).not.toHaveClass('left-0');
    expect(sidebar).not.toHaveClass('right-0');
    expect(sidebar).not.toHaveClass('rtl:translate-x-full');
    expect(sidebar).not.toHaveClass('-translate-x-full');
  });

  it('hides a closed mobile drawer while restoring visibility at the desktop breakpoint', () => {
    const { container } = render(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    expect(container.querySelector('aside')).toHaveClass(
      'invisible',
      'pointer-events-none',
      'lg:visible',
      'lg:pointer-events-auto',
    );
  });

  it('adds the open state class for the mobile drawer', () => {
    const { container } = render(
      <Sidebar mobileOpen onMobileClose={vi.fn()} />,
    );

    expect(container.querySelector('aside')).toHaveClass('app-sidebar-open');
    expect(screen.getByLabelText('Fermer le menu')).toBeInTheDocument();
  });

  it('closes an open mobile drawer when Escape is pressed', () => {
    const onMobileClose = vi.fn();
    render(<Sidebar mobileOpen onMobileClose={onMobileClose} />);
    onMobileClose.mockClear();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it('contains Tab focus inside an open mobile drawer', () => {
    render(
      <>
        <Sidebar mobileOpen onMobileClose={vi.fn()} />
        <button type="button">Outside drawer</button>
      </>,
    );

    const close = screen.getByRole('button', { name: 'Fermer' });
    const logout = screen.getByRole('button', { name: 'Déconnexion' });
    logout.focus();
    fireEvent.keyDown(logout, { key: 'Tab' });

    expect(close).toHaveFocus();
  });

  it('marks the path-matched navigation link as the current page', () => {
    mockPathname = '/students/42';

    render(<Sidebar mobileOpen={false} onMobileClose={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'students' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('reports groups as collapsed when the desktop sidebar is collapsed', () => {
    render(<Sidebar mobileOpen={false} onMobileClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Réduire' }));

    expect(screen.getByRole('button', { name: 'academics' }))
      .toHaveAttribute('aria-expanded', 'false');
  });
});
