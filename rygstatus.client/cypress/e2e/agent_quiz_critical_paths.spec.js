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
    // We expect 5 random questions from the set of 10
    let questionCounter = 0;
    
    // Function to handle each question
    const handleQuestion = () => {
      // Get the question text
      cy.get('.question-content p').then(($questionText) => {
        const questionText = $questionText.text().trim();
        console.log(`Answering question: ${questionText}`);
        
        // Get the answer for this question based on the path data
        const expectedAnswer = pathData.questionAnswers[questionText];
        
        if (expectedAnswer === undefined) {
          throw new Error(`Unknown question text: ${questionText}`);
        }
        
        // Select AFFIRMATIVE for true, NEGATIVE for false
        if (expectedAnswer) {
          // True = AFFIRMATIVE = first radio button
          cy.get('.radio-group input[type="radio"]').first().check({force: true});
        } else {
          // False = NEGATIVE = second radio button
          cy.get('.radio-group input[type="radio"]').last().check({force: true});
        }
        
        // Increment question counter
        questionCounter++;
        
        // Check if this is the last question (5th)
        cy.get('.question-progress').then(($progress) => {
          const progressText = $progress.text();
          const currentQuestion = parseInt(progressText.match(/\d+/)[0]);
          const totalQuestions = parseInt(progressText.match(/OF (\d+)/)[1]);
          
          if (questionCounter < totalQuestions) {
            // Not the last question, click Proceed
            cy.get('.navigation-buttons button').click();
            handleQuestion(); // Process the next question
          } else {
            // Last question, click Execute
            cy.get('.navigation-buttons button').contains(/Execute|Submit/i).click({force: true});
            
            // Verify the result after a delay
            cy.wait(1000); // Give time for result to appear
            cy.get('.result-status, [data-testid="status-display"]', { timeout: 10000 })
              .should('exist')
              .and('be.visible')
              .and('contain', pathData.expectedStatus);
            
            // Verify the color/status
            cy.get('.result-status, [data-testid="status-display"]').should('contain', pathData.expectedColor);
          }
        });
      });
    };
    
    // Start handling the first question
    handleQuestion();
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
