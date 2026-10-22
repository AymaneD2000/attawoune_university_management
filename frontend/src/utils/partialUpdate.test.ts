import { changedFields, hasChangedFields } from './partialUpdate';

describe('partial update payloads', () => {
  it('keeps only changed scalar, array, and object fields', () => {
    const initial = {
      name: 'Initial',
      active: true,
      levels: [1, 2],
      fees: { 1: '1000' },
    };

    const payload = changedFields({
      ...initial,
      name: 'Updated',
      levels: [1, 3],
    }, initial);

    expect(payload).toEqual({ name: 'Updated', levels: [1, 3] });
    expect(hasChangedFields(payload)).toBe(true);
    expect(hasChangedFields(changedFields(initial, initial))).toBe(false);
  });

  it('preserves intentional empty values so a field can be cleared', () => {
    expect(changedFields(
      { phone: '', date_of_birth: null },
      { phone: '70000000', date_of_birth: '2000-01-01' },
    )).toEqual({ phone: '', date_of_birth: null });
  });
});
