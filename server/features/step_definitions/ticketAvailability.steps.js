// FILE: features/step_definitions/ticketAvailability.steps.js
//
// This file connects the plain-English Gherkin scenarios above
// to real, executable test code against the real application.

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');
const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/prisma');

let createdEventId = null;
let createdOrganizerId = null;
let response = null;

Before(async function () {
  createdEventId = null;
  createdOrganizerId = null;
  response = null;
});

After(async function () {
  // Clean up any test data we created, so tests don't pile up in the database
  if (createdEventId) {
    await prisma.tier.deleteMany({ where: { eventId: createdEventId } });
    await prisma.event.delete({ where: { id: createdEventId } }).catch(() => {});
  }
  if (createdOrganizerId) {
    await prisma.user.delete({ where: { id: createdOrganizerId } }).catch(() => {});
  }
});

Given('an event exists with a ticket tier that has capacity {int} and {int} sold', async function (capacity, sold) {
  const organizer = await prisma.user.create({
    data: {
      email: `bdd-test-${Date.now()}@example.com`,
      phoneNumber: `07${Date.now().toString().slice(-8)}`,
      passwordHash: 'not-used-in-this-test',
      name: 'BDD Test Organizer',
      role: 'ORGANIZER',
    },
  });
  createdOrganizerId = organizer.id;

  const event = await prisma.event.create({
    data: {
      title: 'BDD Test Event',
      description: 'Created for a BDD scenario',
      venue: 'Test Venue',
      date: new Date(),
      isApproved: true,
      organizerId: organizer.id,
      tiers: {
        create: [{ name: 'General', price: 10, capacity, sold }],
      },
    },
  });
  createdEventId = event.id;
});

Given('no event exists with a given id', function () {
  createdEventId = '00000000-0000-0000-0000-000000000000';
});

When('I request the availability for that event', async function () {
  response = await request(app).get(`/api/events/${createdEventId}/availability`);
});

Then('the response should show {int} tickets remaining for that tier', function (expectedRemaining) {
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.tiers[0].remaining, expectedRemaining);
});

Then('the response should indicate the event was not found', function () {
  assert.strictEqual(response.status, 404);
});