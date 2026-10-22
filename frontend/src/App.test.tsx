import { vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchableSelect from './components/common/SearchableSelect';

test('searchable select loads and selects an option', async () => {
  const onChange = vi.fn();
  const onSearch = vi.fn().mockResolvedValue([
    { id: 7, label: 'Enseignant Test' },
  ]);

  render(
    <SearchableSelect
      value=""
      onChange={onChange}
      onSearch={onSearch}
      placeholder="Choisir un enseignant"
    />,
  );

  fireEvent.click(screen.getByText('Choisir un enseignant'));
  fireEvent.click(await screen.findByText('Enseignant Test'));

  expect(onChange).toHaveBeenCalledWith(7);
  expect(screen.getByText('Enseignant Test')).toBeInTheDocument();
});
