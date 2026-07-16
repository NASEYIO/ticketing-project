// FILE: __tests__/integration/events.test.js
//
// LAYER: Integration test
// WHY: This checks that GET /api/events correctly talks to the real
// database and returns a properly-shaped response — not just that a
// single function works in isolation.

const request = require('supertest');
const app = require('../../server');

describe('GET /api/events', () => {
  it('responds with 200 and an array of events', async () => {
    const response = await request(app).get('/api/events');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('each event includes the expected core fields', async () => {
    const response = await request(app).get('/api/events');

    if (response.body.length > 0) {
      const event = response.body[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('venue');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('tiers');
    }
  });
});