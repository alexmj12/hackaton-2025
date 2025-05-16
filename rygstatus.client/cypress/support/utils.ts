// Utility functions for Cypress tests

/**
 * Intercepts API calls and mocks responses
 * @param route The API route to intercept
 * @param fixture The fixture file to use as a response
 * @param statusCode The HTTP status code to return
 */
export const mockApiResponse = (route: string, fixture: string, statusCode = 200) => {
  return cy.intercept('GET', route, {
    statusCode,
    fixture
  }).as(`get${fixture.split('/').pop()?.split('.')[0]}`);
};

/**
 * Waits for all API calls to complete
 * @param aliases Array of Cypress aliases for the intercepted requests
 */
export const waitForApiCalls = (aliases: string[]) => {
  aliases.forEach(alias => {
    cy.wait(`@${alias}`);
  });
};

/**
 * Custom assertion for checking RYG status values
 * @param element Cypress element
 * @param expectedStatus Expected status (red, yellow, green)
 */
export const shouldHaveRygStatus = (element: Cypress.Chainable, expectedStatus: 'red' | 'yellow' | 'green') => {
  const statusClassMap = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  };
  
  element.should('have.class', statusClassMap[expectedStatus]);
};

/**
 * Helper to check accessibility issues with custom configuration
 * @param context Optional element context to check
 * @param options Optional axe options
 */
export const runAccessibilityTests = (context?: string, options?: Record<string, any>) => {
  // Use the commands imported from cypress-axe
  cy.injectAxe();
  cy.checkA11y(context, options);
};
