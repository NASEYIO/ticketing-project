// FILE: __tests__/unit/ticketAvailability.test.js
//
// LAYER: Unit test
// METHODOLOGY: TDD (Red-Green-Refactor)
// This test is written BEFORE the implementation exists.
// Running it now should FAIL, because calculateAvailability doesn't exist yet.

const { calculateAvailability } = require('../../utils/ticketAvailability');

describe('calculateAvailability', () => {
  it('returns the correct remaining count for a partially sold tier', () => {
    const tier = { capacity: 100, sold: 30 };
    expect(calculateAvailability(tier)).toBe(70);
  });

  it('returns 0 when a tier is completely sold out', () => {
    const tier = { capacity: 50, sold: 50 };
    expect(calculateAvailability(tier)).toBe(0);
  });

  it('never returns a negative number, even if sold exceeds capacity', () => {
    // Defensive case: protects against bad data/race conditions
    const tier = { capacity: 20, sold: 25 };
    expect(calculateAvailability(tier)).toBe(0);
  });

  it('returns the full capacity when nothing has sold yet', () => {
    const tier = { capacity: 10, sold: 0 };
    expect(calculateAvailability(tier)).toBe(10);
  });
});