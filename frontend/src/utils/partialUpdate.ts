const valuesMatch = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (
    (Array.isArray(left) && Array.isArray(right))
    || (
      left !== null
      && right !== null
      && typeof left === 'object'
      && typeof right === 'object'
    )
  ) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return false;
};

export const changedFields = <T extends Record<string, any>>(
  current: T,
  initial: T,
): Partial<T> => Object.keys(current).reduce((payload, key) => {
  const field = key as keyof T;
  if (!valuesMatch(current[field], initial[field])) {
    payload[field] = current[field];
  }
  return payload;
}, {} as Partial<T>);

export const hasChangedFields = (payload: object): boolean => (
  Object.keys(payload).length > 0
);
