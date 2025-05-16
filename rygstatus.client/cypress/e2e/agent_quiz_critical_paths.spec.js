// Agent Detection Quiz Critical Path Tests
// This spec file tests all three possible outcomes of the Agent Detection quiz

describe('Agent Detection Quiz', () => {
  // Define test data for all three paths
  const testPaths = {
    green: {
      name: 'Green Path → Verified Rebel',
      // Map question texts to expected answers
      questionAnswers: {
        'Comfort built on illusion is still worth preserving.': false,
        'You would risk your life to help strangers gain freedom from a system that deceives them.': true,
        'Rules imposed by unseen authorities should always be obeyed for the sake of order.': false,
        'Knowing the future removes the freedom to choose differently.': false,
        'A single person can fundamentally change the fate of an entire world.': true,
        'Violence is sometimes necessary to break oppressive control.': true,
        'Doubt in what your senses tell you is a sign of weakness.': false,
        'Sacrificing personal happiness for the greater good is a worthy choice.': true,
        'Machines, once given power, will inevitably seek to dominate humans.': true,
        'Love is a force powerful enough to alter destiny.': true
      },
      expectedStatus: 'Verified Rebel',
      expectedColor: 'Green'
    },
    yellow: {
      name: 'Yellow Path → Under Surveillance',
      questionAnswers: {
        'Comfort built on illusion is still worth preserving.': true,
        'You would risk your life to help strangers gain freedom from a system that deceives them.': false,
        'Rules imposed by unseen authorities should always be obeyed for the sake of order.': false,
        'Knowing the future removes the freedom to choose differently.': true,
        'A single person can fundamentally change the fate of an entire world.': true,
        'Violence is sometimes necessary to break oppressive control.': false,
        'Doubt in what your senses tell you is a sign of weakness.': true,
        'Sacrificing personal happiness for the greater good is a worthy choice.': true,
        'Machines, once given power, will inevitably seek to dominate humans.': false,
        'Love is a force powerful enough to alter destiny.': true
      },
      expectedStatus: 'Under Surveillance',
      expectedColor: 'Yellow'
    },
    red: {
      name: 'Red Path → Potential Agent',
      questionAnswers: {
        'Comfort built on illusion is still worth preserving.': true,
        'You would risk your life to help strangers gain freedom from a system that deceives them.': false,
        'Rules imposed by unseen authorities should always be obeyed for the sake of order.': true,
        'Knowing the future removes the freedom to choose differently.': true,
        'A single person can fundamentally change the fate of an entire world.': false,
        'Violence is sometimes necessary to break oppressive control.': false,
        'Doubt in what your senses tell you is a sign of weakness.': true,
        'Sacrificing personal happiness for the greater good is a worthy choice.': false,
        'Machines, once given power, will inevitably seek to dominate humans.': false,
        'Love is a force powerful enough to alter destiny.': false
      },
      expectedStatus: 'Potential Agent',
      expectedColor: 'Red'
    }
  };

  beforeEach(() => {
    // Common setup for all tests
    cy.visit('/agent-detection/quiz');
    
    // Verify we're on the quiz page
    cy.url().should('include', '/agent-detection/quiz');
  });

  // Helper function to answer quiz questions based on the specified path
  const answerQuizQuestions = (pathData) => {
    // The quiz presents 5 random questions from the set of 10
    // For each question:
    // 1. Read the question text
    // 2. Select the answer (radio button)
    // 3. Click PROCEED for questions 1-4, EXECUTE for question 5
    // 4. After EXECUTE, wait 3 seconds, then verify status

    for (let i = 0; i < 5; i++) {
      cy.get('.question-content p').should('be.visible').then(($questionText) => {
        const questionText = $questionText.text().trim();
        const expectedAnswer = pathData.questionAnswers[questionText];
        if (expectedAnswer === undefined) {
          throw new Error(`Unknown question text: ${questionText}`);
        }
        // True = AFFIRMATIVE = first radio button, False = NEGATIVE = last radio button
        if (expectedAnswer) {
          cy.get('.radio-group input[type="radio"]').first().check({ force: true });
        } else {
          cy.get('.radio-group input[type="radio"]').last().check({ force: true });
        }
      });

      if (i <= 4) {
        cy.get('.navigation-buttons button').contains(/PROCEED/i).click({ force: true });
      } else {
        cy.get('.navigation-buttons button').contains(/EXECUTE/i).click({ force: true });
        cy.wait(3000); // Wait 3 seconds for result
        cy.get('.result-status, [data-testid="status-display"]', { timeout: 10000 })
          .should('exist')
          .and('be.visible')
          .and('contain', pathData.expectedStatus);
        cy.get('.result-status, [data-testid="status-display"]').should('contain', pathData.expectedColor);
      }
    }
  };

  it('Green Path → Verified Rebel', () => {
    // Test for the Green path - should result in "Verified Rebel" status
    answerQuizQuestions(testPaths.green);
  });

  it('Yellow Path → Under Surveillance', () => {
    // Test for the Yellow path - should result in "Under Surveillance" status
    answerQuizQuestions(testPaths.yellow);
  });

  it('Red Path → Potential Agent', () => {
    // Test for the Red path - should result in "Potential Agent" status
    answerQuizQuestions(testPaths.red);
  });
});
