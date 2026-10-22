export interface NormalizedApiError {
  message: string;
  fields: Record<string, string[]>;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMessages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(toMessages).filter(Boolean);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [String(value)];
  }

  return [];
};

const collectFields = (source: unknown): Record<string, string[]> => {
  if (!isRecord(source)) return {};

  return Object.entries(source).reduce<Record<string, string[]>>(
    (fields, [field, value]) => {
      const messages = toMessages(value);
      if (messages.length > 0) fields[field] = messages;
      return fields;
    },
    {},
  );
};

/**
 * Supports both normal DRF errors (`{ username: [...] }`) and this project's
 * exception envelope (`{ error: { message, details } }`).
 */
export const normalizeApiError = (
  data: unknown,
  fallback = 'Une erreur est survenue',
): NormalizedApiError => {
  if (typeof data === 'string' && data.trim()) {
    return { message: data, fields: {} };
  }

  if (!isRecord(data)) {
    return { message: fallback, fields: {} };
  }

  const envelope = isRecord(data.error) ? data.error : null;
  const fields = collectFields(envelope?.details);

  if (Object.keys(fields).length === 0) {
    const metadataKeys = new Set(['detail', 'error', 'message', 'code', 'status_code']);
    Object.entries(data).forEach(([field, value]) => {
      if (metadataKeys.has(field)) return;
      const messages = toMessages(value);
      if (messages.length > 0) fields[field] = messages;
    });
  }

  const firstField = Object.entries(fields)[0];
  const firstFieldMessage = firstField?.[1]?.[0];
  const directDetail = typeof data.detail === 'string' ? data.detail : '';
  const directMessage = typeof data.message === 'string' ? data.message : '';
  const directError = typeof data.error === 'string' ? data.error : '';
  const envelopeMessage = typeof envelope?.message === 'string' ? envelope.message : '';

  const message = firstFieldMessage
    ? `${firstField[0]}: ${firstFieldMessage}`
    : directDetail || directMessage || directError || envelopeMessage || fallback;

  return { message, fields };
};

export const getFieldError = (
  error: NormalizedApiError | null,
  field: string,
): string => error?.fields[field]?.join(' ') || '';
