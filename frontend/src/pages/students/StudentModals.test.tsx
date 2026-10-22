import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentFormModal from './StudentFormModal';
import { Student } from '../../types';
import studentService from '../../services/studentService';
import userService from '../../services/userService';
import universityService from '../../services/universityService';
import { studentQueryKeys } from './studentQueries';

const getAnimationsDescriptor = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'getAnimations',
);
let consoleError: MockInstance;

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => [],
  });
});

afterAll(() => {
  if (getAnimationsDescriptor) {
    Object.defineProperty(Element.prototype, 'getAnimations', getAnimationsDescriptor);
  } else {
    Reflect.deleteProperty(Element.prototype, 'getAnimations');
  }
});

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  const unexpectedErrors = consoleError.mock.calls.filter(
    ([message]) => message !== 'Error saving student:',
  );
  expect(unexpectedErrors).toEqual([]);
  consoleError.mockRestore();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const labels: Record<string, string> = {
        'common.close': 'Fermer',
      };
      return labels[key] || fallback || key;
    },
  }),
}));

vi.mock('../../services/universityService', () => ({
  __esModule: true,
  default: {
    getPrograms: vi.fn(() => new Promise(() => {})),
    getLevels: vi.fn(() => new Promise(() => {})),
  },
}));

vi.mock('../../services/userService', () => ({
  __esModule: true,
  default: {
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock('../../services/studentService', () => ({
  __esModule: true,
  default: {
    createStudent: vi.fn(),
    getStudent: vi.fn(),
    updateStudent: vi.fn(),
  },
}));

const student: Student = {
  id: 1,
  user: 2,
  user_full_name: 'Mariam Diallo',
  first_name: 'Mariam',
  last_name: 'Diallo',
  date_of_birth: '2005-01-01',
  user_email: 'mariam@example.com',
  user_phone: '70000000',
  student_id: 'ATT-001',
  program: 3,
  program_name: 'Études islamiques',
  current_level: 1,
  level_display: 'Licence 1',
  enrollment_date: '2025-09-01',
  status: 'ACTIVE',
  guardian_name: '',
  guardian_phone: '',
  emergency_contact: '',
  photo: null,
};

const user = {
  id: 2,
  first_name: 'Mariam',
  last_name: 'Diallo',
  email: 'mariam@example.com',
  username: 'mariam',
  phone: '70000000',
  address: '',
  date_of_birth: '2005-01-01',
  gender: 'M',
};

const renderStudentForm = (
  props: Partial<React.ComponentProps<typeof StudentFormModal>> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi
    .spyOn(queryClient, 'invalidateQueries')
    .mockResolvedValue(undefined);
  const onClose = props.onClose || vi.fn();
  const onSuccess = props.onSuccess || vi.fn();

  const view = render(
    <QueryClientProvider client={queryClient}>
      <StudentFormModal
        onClose={onClose}
        onSuccess={onSuccess}
        {...props}
      />
    </QueryClientProvider>,
  );

  return {
    ...view,
    invalidateQueries,
    onClose,
    onSuccess,
    queryClient,
  };
};

const waitForEditValues = async () => {
  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: /^Prénom$/ })).toHaveValue('Mariam');
  });
};

describe('Student form modal UI foundation migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (universityService.getPrograms as Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    (universityService.getLevels as Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    (userService.getUser as Mock).mockResolvedValue(user);
    (userService.createUser as Mock).mockResolvedValue({ id: 2 });
    (userService.updateUser as Mock).mockResolvedValue({});
    (studentService.createStudent as Mock).mockResolvedValue(student);
    (studentService.getStudent as Mock).mockResolvedValue(student);
    (studentService.updateStudent as Mock).mockResolvedValue(student);
  });

  it('uses the shared dialog semantics and keeps sticky actions outside the only scroll body', async () => {
    renderStudentForm();
    await act(async () => {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    });

    const dialog = screen.getByRole('dialog', { name: 'Nouvel Étudiant' });
    expect(dialog).toHaveAccessibleDescription('Nouvelle inscription');

    const scrollBody = screen.getByTestId('dialog-scroll-body');
    const nextButton = screen.getByRole('button', { name: 'Suivant' });
    expect(scrollBody).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(scrollBody.contains(nextButton)).toBe(false);
    expect(nextButton).toHaveClass('min-h-11');
    expect(screen.getByRole('group', { name: 'Informations Utilisateur' })).toBeInTheDocument();
  });

  it.each(['close button', 'Escape', 'backdrop'] as const)(
    'protects dirty data from %s dismissal until discard is confirmed',
    async (dismissalPath) => {
      const { container, onClose, unmount } = renderStudentForm();
      fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
        target: { value: 'Mariam' },
      });

      if (dismissalPath === 'close button') {
        fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
      } else if (dismissalPath === 'Escape') {
        await userEvent.keyboard('{Escape}');
      } else {
        const backdrop = Array.from(container.ownerDocument.querySelectorAll('div')).find(
          (element) => element.className.includes('bg-ui-primary-strong/60'),
        );
        expect(backdrop).toBeDefined();
        await userEvent.click(backdrop!);
      }

      expect(await screen.findByRole('dialog', {
        name: 'Modifications non enregistrées',
      })).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', {
        name: 'Abandonner les modifications',
      }));
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
    },
  );

  it('cancels only the discard confirmation and preserves dirty form data', async () => {
    const { onClose } = renderStudentForm();
    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
      target: { value: 'Mariam' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.getByRole('dialog', { name: 'Modifications non enregistrées' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    const confirmationRemoval = waitForElementToBeRemoved(() => screen.queryByRole(
      'dialog',
      { name: 'Modifications non enregistrées' },
    ));
    await userEvent.click(screen.getByRole('button', { name: 'Continuer la modification' }));
    await confirmationRemoval;
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: /^Prénom$/ })).toHaveValue('Mariam');
  });

  it('announces validation errors beside required controls and focuses the first invalid field', async () => {
    renderStudentForm();

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    const summary = await screen.findByRole('alert');
    const firstName = screen.getByRole('textbox', { name: /^Prénom$/ });
    expect(summary).toHaveTextContent('Veuillez remplir tous les champs obligatoires');
    expect(firstName).toHaveAttribute('aria-invalid', 'true');
    expect(firstName).toHaveAccessibleDescription('Veuillez remplir tous les champs obligatoires');
    expect(firstName).toHaveFocus();
  });

  it('normalizes API field errors, links them to controls, and focuses the first rejected field', async () => {
    (userService.updateUser as Mock).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Les données sont invalides.',
            details: {
              first_name: ['Ce prénom est indisponible.'],
              email: ['Cette adresse est invalide.'],
            },
          },
        },
      },
    });
    renderStudentForm({ student });
    await waitForEditValues();

    const firstName = screen.getByRole('textbox', { name: /^Prénom$/ });
    fireEvent.change(firstName, { target: { value: 'Aïssata' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    const summary = await screen.findByRole('alert');
    const email = screen.getByRole('textbox', { name: 'Email' });
    expect(summary).toHaveTextContent('Ce prénom est indisponible.');
    expect(firstName).toHaveAttribute('aria-invalid', 'true');
    expect(firstName).toHaveAccessibleDescription('Ce prénom est indisponible.');
    await waitFor(() => expect(firstName).toHaveFocus());

    const emailSummaryLink = within(summary).getByRole('link', {
      name: 'Cette adresse est invalide.',
    });
    expect(emailSummaryLink).toHaveAttribute('href', '#student-email');
    fireEvent.click(emailSummaryLink);
    expect(email).toHaveFocus();
  });

  it('focuses the error summary when an API failure has no field keys', async () => {
    (userService.updateUser as Mock).mockRejectedValue({
      response: {
        data: {
          error: { message: 'Le dossier étudiant ne peut pas être enregistré.' },
        },
      },
    });
    renderStudentForm({ student });
    await waitForEditValues();

    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
      target: { value: 'Aïssata' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Le dossier étudiant ne peut pas être enregistré.');
    await waitFor(() => expect(summary).toHaveFocus());
  });

  it('keeps explicit summary navigation on the target step instead of returning to the first error', async () => {
    (studentService.updateStudent as Mock).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Les données sont invalides.',
            details: {
              first_name: ['Le prénom doit être vérifié.'],
              program: ['Le programme doit être vérifié.'],
            },
          },
        },
      },
    });
    renderStudentForm({ student });
    await waitForEditValues();

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom du tuteur' }), {
      target: { value: 'Parent Diallo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const firstName = await screen.findByRole('textbox', { name: /^Prénom$/ });
    await waitFor(() => expect(firstName).toHaveFocus());
    const summary = screen.getByRole('alert');
    const programLink = within(summary).getByRole('link', {
      name: 'Le programme doit être vérifié.',
    });
    expect(programLink).toHaveAttribute('href', '#student-program');

    fireEvent.click(programLink);

    await waitFor(() => {
      expect(screen.getByRole('group', {
        name: 'Informations Académiques',
      })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /Programme/ })).toHaveFocus();
    });
  });

  it('PATCHes only the changed user attribute when saving from the identity step', async () => {
    const { onClose, onSuccess } = renderStudentForm({ student });
    await waitForEditValues();

    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
      target: { value: 'Aïssata' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith(2, {
        first_name: 'Aïssata',
      });
    });
    expect(studentService.updateStudent).not.toHaveBeenCalled();
    expect(studentService.getStudent).toHaveBeenCalledWith(1);
    expect(onSuccess).toHaveBeenCalledWith(student);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uploads only the replacement photo and invalidates exact affected queries', async () => {
    const savedStudent = {
      ...student,
      photo: 'https://api.example.test/media/students/photos/new-profile.png',
    };
    (studentService.updateStudent as Mock).mockResolvedValue(savedStudent);
    const { invalidateQueries, onClose, onSuccess } = renderStudentForm({ student });
    await waitForEditValues();

    const replacement = new File(['photo-bytes'], 'new-profile.png', {
      type: 'image/png',
    });
    fireEvent.change(screen.getByLabelText('Photo de profil'), {
      target: { files: [replacement] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByRole('group', { name: 'Informations Académiques' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(studentService.updateStudent).toHaveBeenCalledTimes(1));
    const [, payload] = (studentService.updateStudent as Mock).mock.calls[0];
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('photo')).toBe(replacement);
    expect(Array.from(payload.keys())).toEqual(['photo']);
    expect(userService.updateUser).not.toHaveBeenCalled();

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(4));
    expect(invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: studentQueryKeys.lists() },
      { queryKey: studentQueryKeys.summaries() },
      { queryKey: studentQueryKeys.detail(1), exact: true },
      { queryKey: studentQueryKeys.idCard(1), exact: true },
    ]);
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: studentQueryKeys.all,
    });
    expect(onSuccess).toHaveBeenCalledWith(savedStudent);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invalidates list and summary prefixes after create without invalidating all student data', async () => {
    const { invalidateQueries } = renderStudentForm();
    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
      target: { value: 'Mariam' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^Nom$/ }), {
      target: { value: 'Diallo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.click(screen.getByRole('button', { name: "Créer l'étudiant" }));

    await waitFor(() => expect(studentService.createStudent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
    expect(invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: studentQueryKeys.lists() },
      { queryKey: studentQueryKeys.summaries() },
    ]);
  });

  it('keeps create invalidation to list and summary prefixes when a photo is selected', async () => {
    const { invalidateQueries } = renderStudentForm();
    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom$/ }), {
      target: { value: 'Mariam' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^Nom$/ }), {
      target: { value: 'Diallo' },
    });
    const photo = new File(['photo-bytes'], 'profile.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Photo de profil'), {
      target: { files: [photo] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.click(screen.getByRole('button', { name: "Créer l'étudiant" }));

    await waitFor(() => expect(studentService.createStudent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
    expect(invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: studentQueryKeys.lists() },
      { queryKey: studentQueryKeys.summaries() },
    ]);
  });
});
