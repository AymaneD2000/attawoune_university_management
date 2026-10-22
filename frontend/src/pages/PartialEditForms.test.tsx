import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import TeacherFormModal from './teachers/TeacherFormModal';
import UserFormModal from './admin/UserFormModal';
import teacherService from '../services/teacherService';
import userService from '../services/userService';
import { Teacher, User } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const labels: Record<string, string> = {
        'admin.users.modal.update': 'Mettre à jour',
        'common.loading': 'Chargement...',
      };
      return labels[key] || fallback || key;
    },
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}));

vi.mock('../services/universityService', () => ({
  __esModule: true,
  default: {
    getDepartments: async () => ({ results: [] }),
  },
}));

vi.mock('../services/teacherService', () => ({
  __esModule: true,
  default: {
    updateTeacher: vi.fn(),
    createTeacher: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  __esModule: true,
  default: {
    updateUser: vi.fn(),
    createUser: vi.fn(),
  },
}));

const teacher: Teacher = {
  id: 10,
  user: 20,
  first_name: 'Awa',
  last_name: 'Keïta',
  user_email: 'awa@example.com',
  user_phone: '70000000',
  user_address: 'Bamako',
  user_date_of_birth: '1985-01-01',
  user_gender: 'F',
  employee_id: 'ENS-010',
  department: 2,
  department_name: 'Sciences',
  rank: 'ASSISTANT',
  rank_display: 'Assistant',
  contract_type: 'PERMANENT',
  contract_type_display: 'Permanent',
  hire_date: '2020-09-01',
  specialization: 'Mathématiques',
  office_location: 'B12',
  is_active: true,
};

const user: User = {
  id: 30,
  username: 'fatou',
  email: 'fatou@example.com',
  first_name: 'Fatou',
  last_name: 'Koné',
  full_name: 'Fatou Koné',
  role: 'SECRETARY',
  phone: '71000000',
  address: 'Sotuba',
  profile_picture: null,
  date_of_birth: '1990-03-05',
  gender: 'F',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('partial edit forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (teacherService.updateTeacher as Mock).mockResolvedValue(teacher);
    (userService.updateUser as Mock).mockResolvedValue(user);
  });

  it('updates only the teacher attribute changed on the first step', async () => {
    const { container } = render(
      <TeacherFormModal
        teacher={teacher}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    await act(async () => Promise.resolve());

    const firstName = container.querySelector('input[name="first_name"]') as HTMLInputElement;
    fireEvent.change(firstName, { target: { value: 'Aïssata' } });
    const saveButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Enregistrer les modifications'),
    );
    expect(saveButton).toBeDefined();
    fireEvent.click(saveButton!);

    await act(async () => Promise.resolve());
    expect(teacherService.updateTeacher).toHaveBeenCalledWith(10, {
      first_name: 'Aïssata',
    });
  });

  it('does not resend untouched user fields such as gender and role', async () => {
    const { container } = render(
      <UserFormModal user={user} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    const phone = container.querySelector('input[name="phone"]') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '76000000' } });
    fireEvent.submit(container.querySelector('form')!);

    await act(async () => Promise.resolve());
    expect(userService.updateUser).toHaveBeenCalledWith(30, {
      phone: '76000000',
    });
  });
});
