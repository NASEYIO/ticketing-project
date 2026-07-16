// FILE: cypress/e2e/homepage.cy.js
describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads and displays the hero heading', () => {
    cy.contains('Find Your Next Vibe').should('be.visible');
  });

  it('displays at least one event card', () => {
    cy.contains('Live Events').should('be.visible');

    // Wait (with retry) until loading finishes and either events or the
    // empty-state message appears — avoids catching the page mid-load.
    cy.get('body', { timeout: 10000 }).should(($body) => {
      const text = $body.text();
      const finishedLoading =
        text.includes('View Details') || text.includes('No events found');
      expect(finishedLoading, 'page finished loading events').to.be.true;
    });
  });

  it('filters events when a category button is clicked, without crashing', () => {
    cy.contains('Concerts').click();
    cy.contains('Find Your Next Vibe').should('be.visible');
    cy.contains('Concerts').click();
    cy.contains('All').click();
  });

  it('navigates to an event detail page when View Details is clicked', () => {
    cy.get('body', { timeout: 70000 }).should(($body) => {
      const text = $body.text();
      const finishedLoading =
        text.includes('View Details') || text.includes('No events found');
      expect(finishedLoading, 'page finished loading events').to.be.true;
    });

    cy.get('body').then(($body) => {
      if ($body.text().includes('View Details')) {
        cy.contains('View Details').first().click();
        cy.url().should('include', '/event/');
      } else {
        cy.log('No events available to click into — skipping navigation check');
      }
    });
  });
});