// FILE: src/__tests__/EventCard.test.jsx
//
// LAYER: Frontend unit test
// Tests EventCard's rendering and its price-calculation logic.
// Includes a regression test for the null-category crash we fixed earlier.

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EventCard from '../components/EventCard';

function renderCard(event) {
  return render(
    <MemoryRouter>
      <EventCard event={event} />
    </MemoryRouter>
  );
}

const baseEvent = {
  id: 'event-1',
  title: 'Solfest',
  venue: 'Uhuru Gardens',
  date: '2026-07-25T21:00:00.000Z',
  category: { name: 'Concerts' },
  tiers: [
    { id: 't1', name: 'Regular', price: '10' },
    { id: 't2', name: 'VIP', price: '25' },
  ],
};

describe('EventCard', () => {
  it('renders the event title and venue', () => {
    renderCard(baseEvent);
    expect(screen.getByText('Solfest')).toBeInTheDocument();
    expect(screen.getByText('📍 Uhuru Gardens')).toBeInTheDocument();
  });

  it('displays the category name when present', () => {
    renderCard(baseEvent);
    expect(screen.getByText('Concerts')).toBeInTheDocument();
  });

  it('shows the lowest tier price, not just the first one listed', () => {
    renderCard(baseEvent);
    // Lowest of 10 and 25 should be shown, even though VIP (25) isn't first
    expect(screen.getByText('KES 10')).toBeInTheDocument();
  });

  it('shows KES 0 when there are no tiers at all', () => {
    const eventWithNoTiers = { ...baseEvent, tiers: [] };
    renderCard(eventWithNoTiers);
    expect(screen.getByText('KES 0')).toBeInTheDocument();
  });

  it('does not crash when category is null (regression test)', () => {
    // This exact scenario caused a real production crash before it was fixed:
    // typeof null === 'object' caused event.category.name to be accessed on null.
    const eventWithNullCategory = { ...baseEvent, category: null };
    expect(() => renderCard(eventWithNullCategory)).not.toThrow();
    expect(screen.getByText('Solfest')).toBeInTheDocument();
  });

  it('links to the correct event details page', () => {
    renderCard(baseEvent);
    const link = screen.getByText('View Details').closest('a');
    expect(link).toHaveAttribute('href', '/event/event-1');
  });
});