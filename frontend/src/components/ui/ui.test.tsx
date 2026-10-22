import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button, IconButton } from './Button';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DialogShell } from './DialogShell';
import { ErrorState, PageSkeleton } from './Feedback';
import { Field } from './Field';
import { FilterToolbar } from './FilterToolbar';
import { FormSection, StickyFormActions } from './FormSection';
import { Pagination } from './Pagination';
import { ResponsiveDataView } from './ResponsiveDataView';
import { ToastProvider, useToast } from './ToastProvider';
import {
  EmptyState as LegacyEmptyState,
  ListLoading,
  PaginationBar,
} from '../common/EntityDisplay';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' },
  }),
}));

const ToastTrigger = () => {
  const toast = useToast();
  return <button onClick={() => toast.success('Étudiant enregistré')}>notify</button>;
};

expect.extend(toHaveNoViolations);

const getAnimationsDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations');
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
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

describe('UI foundation primitives', () => {
  it('disables a loading button and exposes busy state', () => {
    render(<Button loading>Enregistrer</Button>);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('requires an accessible label for icon-only buttons', () => {
    render(<IconButton label="Modifier"><span aria-hidden="true">x</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('offers a retry action on request failure', () => {
    const retry = vi.fn();
    render(<ErrorState title="Chargement impossible" description="Réessayez." onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('announces skeleton loading with a translated status label', () => {
    render(<PageSkeleton />);
    expect(screen.getByRole('status', { name: 'common.loading' })).toBeInTheDocument();
  });

  it('switches responsive data states', () => {
    const retry = vi.fn();
    const { rerender } = render(
      <ResponsiveDataView
        loading
        backgroundFetching={false}
        error={false}
        empty={false}
        desktop={<p>Vue bureau</p>}
        mobile={<p>Vue mobile</p>}
        emptyTitle="Vide"
        emptyDescription="Aucune donnée"
        errorTitle="Erreur"
        errorDescription="Impossible"
        onRetry={retry}
      />,
    );

    expect(screen.getByRole('status', { name: 'common.loading' })).toBeInTheDocument();

    rerender(
      <ResponsiveDataView
        loading={false}
        backgroundFetching={false}
        error
        empty={false}
        desktop={<p>Vue bureau</p>}
        mobile={<p>Vue mobile</p>}
        emptyTitle="Vide"
        emptyDescription="Aucune donnée"
        errorTitle="Erreur"
        errorDescription="Impossible"
        onRetry={retry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Erreur');

    rerender(
      <ResponsiveDataView
        loading={false}
        backgroundFetching={false}
        error={false}
        empty
        desktop={<p>Vue bureau</p>}
        mobile={<p>Vue mobile</p>}
        emptyTitle="Vide"
        emptyDescription="Aucune donnée"
        errorTitle="Erreur"
        errorDescription="Impossible"
        onRetry={retry}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Vide' })).toBeInTheDocument();

    rerender(
      <ResponsiveDataView
        loading={false}
        backgroundFetching={false}
        error={false}
        empty={false}
        desktop={<p>Vue bureau</p>}
        mobile={<p>Vue mobile</p>}
        emptyTitle="Vide"
        emptyDescription="Aucune donnée"
        errorTitle="Erreur"
        errorDescription="Impossible"
        onRetry={retry}
      />,
    );
    expect(screen.getByText('Vue bureau').parentElement).toHaveClass('hidden', 'md:block');
    expect(screen.getByText('Vue mobile').parentElement).toHaveClass('md:hidden');
  });

  it('exposes an explicitly localized background refresh progress indicator', () => {
    render(
      <ResponsiveDataView
        loading={false}
        backgroundFetching
        error={false}
        empty={false}
        desktop={<p>Vue bureau</p>}
        mobile={<p>Vue mobile</p>}
        emptyTitle="Vide"
        emptyDescription="Aucune donnée"
        errorTitle="Erreur"
        errorDescription="Impossible"
        refreshLabel="Actualisation"
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Actualisation' })).toBeInTheDocument();
  });

  it('removes an active filter chip from a 44px control', () => {
    const remove = vi.fn();
    render(
      <FilterToolbar
        label="Filtres"
        chips={[{ key: 'status', label: 'Actif', onRemove: remove }]}
        onClear={vi.fn()}
        clearLabel="Effacer les filtres"
      >
        <input aria-label="Recherche" />
      </FilterToolbar>,
    );

    const chip = screen.getByRole('button', { name: 'Actif' });
    expect(chip).toHaveClass('min-h-11');
    fireEvent.click(chip);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('disables pagination at both boundaries', () => {
    const { rerender } = render(
      <Pagination
        page={1}
        pageSize={20}
        currentCount={20}
        total={21}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'common.prev' })).toBeDisabled();

    rerender(
      <Pagination
        page={2}
        pageSize={20}
        currentCount={1}
        total={21}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'common.next' })).toBeDisabled();
  });

  it('keeps legacy entity display signatures while delegating to responsive primitives', () => {
    const { rerender } = render(<ListLoading cards />);
    expect(screen.getByRole('status', { name: 'common.loading' })).toBeInTheDocument();

    rerender(
      <LegacyEmptyState
        title="Aucun résultat"
        description="Modifiez les filtres puis réessayez."
      />,
    );
    expect(screen.getByRole('heading', { name: 'Aucun résultat' })).toHaveClass('text-ui-foreground');

    rerender(
      <PaginationBar
        currentPage={1}
        currentCount={20}
        total={21}
        pageSize={20}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        nextDisabled={false}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'common.pagination' })).toBeInTheDocument();
  });

  it('uses semantic on-color tokens for success and danger buttons', () => {
    render(
      <>
        <Button variant="success">Valider</Button>
        <Button variant="danger">Supprimer</Button>
      </>,
    );

    ['Valider', 'Supprimer'].forEach((name) => {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveClass('text-ui-on-primary');
      expect(button).not.toHaveClass('text-white');
    });
  });

  it('announces success without moving focus', () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Étudiant enregistré');
  });

  it('gives the translated toast dismiss control a 44px keyboard-focusable target', () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'notify' }));

    expect(screen.getByRole('button', { name: 'common.close' })).toHaveClass(
      'min-h-11',
      'min-w-11',
      'focus-visible:ring-4',
      'focus-visible:ring-ui-ring/20',
    );
  });

  it('has no basic axe violations', async () => {
    const { container } = render(<Button>Ajouter</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('associates a dialog title and description while keeping actions outside its scroll body', async () => {
    const Harness = () => {
      const [open, setOpen] = React.useState(true);

      return (
        <DialogShell
          open={open}
          title="Modifier"
          description="Dossier étudiant"
          onClose={() => setOpen(false)}
          footer={<button>Enregistrer</button>}
        >
          <p>Formulaire</p>
        </DialogShell>
      );
    };

    render(
      <Harness />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Modifier' });
    expect(dialog).toHaveAccessibleDescription('Dossier étudiant');
    expect(
      within(screen.getByTestId('dialog-scroll-body')).queryByRole('button', {
        name: 'Enregistrer',
      }),
    ).not.toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('prevents dialog dismissal while busy', async () => {
    const onClose = vi.fn();
    const Harness = () => {
      const [open, setOpen] = React.useState(true);
      const [busy, setBusy] = React.useState(true);

      return (
        <DialogShell
          open={open}
          busy={busy}
          title="Modifier"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          footer={<button onClick={() => setBusy(false)}>Terminer</button>}
        >
          Formulaire
        </DialogShell>
      );
    };

    render(<Harness />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'common.close' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'common.close' })).toBeEnabled());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('restores focus to the confirmation trigger after cancellation', async () => {
    const Harness = () => {
      const [open, setOpen] = React.useState(false);

      return (
        <>
          <button onClick={() => setOpen(true)}>Supprimer</button>
          <ConfirmationDialog
            open={open}
            title="Confirmer"
            description="Action irréversible"
            confirmLabel="Confirmer la suppression"
            cancelLabel="Annuler"
            tone="danger"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      );
    };

    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    const dialogRemoval = waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveFocus();
    });
    await dialogRemoval;
  });

  it('connects a field control to its required error message', () => {
    render(
      <Field id="email" label="E-mail" required error="L’e-mail est obligatoire">
        <input />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: /E-mail/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-message');
    expect(screen.getByText('L’e-mail est obligatoire')).toHaveAttribute('id', 'email-message');
  });

  it('preserves child descriptions when adding its own field message', () => {
    render(
      <>
        <span id="format-help">Format professionnel</span>
        <Field id="email" label="E-mail" hint="Nous ne partagerons pas cette adresse">
          <input aria-describedby="format-help" />
        </Field>
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'aria-describedby',
      'format-help email-message',
    );
  });

  it('groups form content in a named section and lays actions out responsively', () => {
    render(
      <>
        <FormSection title="Identité" description="Informations personnelles">
          <input aria-label="Prénom" />
        </FormSection>
        <StickyFormActions>
          <Button>Enregistrer</Button>
        </StickyFormActions>
      </>,
    );

    expect(screen.getByRole('group', { name: 'Identité' })).toHaveTextContent('Informations personnelles');
    expect(screen.getByRole('button', { name: 'Enregistrer' }).parentElement).toHaveClass(
      'flex-col',
      'sm:flex-row',
    );
    expect(screen.getByRole('button', { name: 'Enregistrer' }).parentElement).not.toHaveClass(
      'flex-col-reverse',
    );
  });
});
