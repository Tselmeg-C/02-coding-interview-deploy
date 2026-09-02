import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('offers creation of an interview room', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Create interview room' })).toBeInTheDocument();
  });

  it('shows an actionable error for an unknown room', async () => {
    render(<MemoryRouter initialEntries={['/room/not-a-room']}><App /></MemoryRouter>);
    expect(await screen.findByText('Room unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a new room' })).toBeInTheDocument();
  });
});
