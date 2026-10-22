import { getFieldError, normalizeApiError } from './apiError';

describe('normalizeApiError', () => {
  it('extracts validation details from the backend error envelope', () => {
    const error = normalizeApiError({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erreur de validation des données.',
        details: {
          password: ['Ce mot de passe est trop courant.'],
        },
        status_code: 400,
      },
    });

    expect(error.message).toBe('password: Ce mot de passe est trop courant.');
    expect(getFieldError(error, 'password')).toBe('Ce mot de passe est trop courant.');
  });

  it('uses the envelope message when there are no field details', () => {
    const error = normalizeApiError({
      error: {
        code: 'PERMISSION_DENIED',
        message: "Vous n'avez pas la permission d'effectuer cette action.",
        status_code: 403,
      },
    });

    expect(error.message).toBe("Vous n'avez pas la permission d'effectuer cette action.");
  });

  it('still supports normal flat DRF field errors', () => {
    const error = normalizeApiError({
      username: ['Un utilisateur avec ce nom existe déjà.'],
    });

    expect(error.message).toBe('username: Un utilisateur avec ce nom existe déjà.');
    expect(getFieldError(error, 'username')).toBe('Un utilisateur avec ce nom existe déjà.');
  });
});
