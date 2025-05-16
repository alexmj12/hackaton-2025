import { useState, useEffect } from 'react';
import type { JSX } from 'react/jsx-runtime';

interface Question {
    id: number;
    text: string;
    answer: boolean | null;
}
// @ts-ignore
enum RygStatus {
    Red = 0,
    Yellow = 1,
    Green = 2
}

function BoBrkRwaDetection() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [status, setStatus] = useState<RygStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [codeRain, setCodeRain] = useState<JSX.Element[]>([]);
    // Add state to track whether to show warning
    const [showSelectionWarning, setShowSelectionWarning] = useState(false);

    // Matrix code rain effect remains unchanged
    useEffect(() => {
        const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*ΦΨΩαβγδεζηθικλμνξοπρστυφχψω";
        const columns: JSX.Element[] = [];
        
        for (let i = 0; i < 20; i++) {
            const duration = 5 + Math.random() * 10;
            const delay = Math.random() * 5;
            const leftPos = Math.random() * 100;
            const columnChars = [];
            
            for (let j = 0; j < 10; j++) {
                const randomChar = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
                columnChars.push(
                    <div key={`char-${j}`} style={{ 
                        opacity: 1 - (j * 0.1), 
                        animationDelay: `${j * 0.1}s`,
                        textShadow: '0 0 5px #00FF41'
                    }}>
                        {randomChar}
                    </div>
                );
            }
            
            columns.push(
                <div 
                    key={`column-${i}`} 
                    className="code-column" 
                    style={{ 
                        left: `${leftPos}%`, 
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`
                    }}
                >
                    {columnChars}
                </div>
            );
        }
        setCodeRain(columns);
    }, []);

    // Status helper functions unchanged
    const getStatusClass = (status: RygStatus | null): string => {
        if (status === null) return '';
        return RygStatus[status].toLowerCase();
    };

    const getStatusText = (status: RygStatus | null): string => {
        if (status === null) return '';
        return RygStatus[status];
    };

    const baseApiUrl = '/api';

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setError(null);
            // Simulate terminal loading
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const response = await fetch(`${baseApiUrl}/RygStatus/questions`);
            if (!response.ok) {
                throw new Error(`Terminal connection error: ${response.status}`);
            }
            const data = await response.json();
            // Set answer to null initially (unselected)
            setQuestions(data.map((q: Question) => ({ ...q, answer: null })));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError('Connection failure. System reset required.');
            setLoading(false);
        }
    };

    const handleAnswerChange = (value: boolean) => {
        const currentQuestion = questions[currentQuestionIndex];
        setQuestions(questions.map(q => 
            q.id === currentQuestion.id ? { ...q, answer: value } : q
        ));
        // Hide the warning when user makes a selection
        setShowSelectionWarning(false);
    };

    const handleNext = () => {
        const currentQuestion = questions[currentQuestionIndex];
        
        // Check if question is answered
        if (currentQuestion.answer === null) {
            // Show the warning if user tries to proceed without selection
            setShowSelectionWarning(true);
            return;
        }
        
        // If question is answered and not the last one, proceed
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            // Reset warning state when moving to next question
            setShowSelectionWarning(false);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            // Reset warning state when moving to previous question
            setShowSelectionWarning(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const currentQuestion = questions[currentQuestionIndex];
        
        // Check if the current question has been answered
        if (currentQuestion.answer === null) {
            setShowSelectionWarning(true);
            return;
        }
        
        // Check if all questions have been answered
        if (questions.some(q => q.answer === null)) {
            setError('PROTOCOL ERROR: All assessment parameters must be configured before execution.');
            return;
        }
        
        try {
            setError(null);
            setLoading(true);
            
            // Simulate processing animation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(`${baseApiUrl}/RygStatus/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questions)
            });
            
            if (!response.ok) {
                throw new Error(`Connection failure: ${response.status}`);
            }
            
            const result = await response.json();
            setStatus(result as RygStatus);
            setIsSubmitted(true);
            setLoading(false);
        } catch (error) {
            console.error('Error submitting responses:', error);
            setError('Data transmission interrupted. Retry protocol initiated.');
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setIsSubmitted(false);
        setStatus(null);
        setCurrentQuestionIndex(0);
        setShowSelectionWarning(false);
        fetchQuestions();
    };

    const LoadingComponent = () => (
        <div className="loading-state">
            <div>INITIALIZING SCAN</div>
            <div className="typing-animation">
                <span className="cursor"></span>
            </div>
        </div>
    );

    if (loading) {
        return <LoadingComponent />;
    }

    if (questions.length === 0) {
        return <div className="loading-state">SYSTEM FAILURE: NO DATA AVAILABLE</div>;
    }

    if (isSubmitted) {
        return (
            <div className="bobrkrwa-detection">
                <div className="code-rain">{codeRain}</div>
                <div className={`status-result ${getStatusClass(status)}`}>
                    <h2>DETECTION RESULTS</h2>
                    <div className="terminal-output">
                        {Array.from("ANALYSIS COMPLETE").map((char, i) => (
                            <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                                {char === " " ? '\u00A0' : char}
                            </span>
                        ))}
                    </div>
                    <div className="status-text">STATUS: {getStatusText(status)}</div>
                    <br />
                    <button className="matrix-button" onClick={handleStartOver}>
                        REINITIALIZE
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    return (
        <div className="bobrkrwa-detection">
            <div className="code-rain">{codeRain}</div>
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            <div className="question-widget">
                <div className="question-progress">
                    SEQUENCE {currentQuestionIndex + 1} OF {questions.length}
                </div>
                <div className="question-content">
                    <p>{currentQuestion.text}</p>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                checked={currentQuestion.answer === true}
                                onChange={() => handleAnswerChange(true)}
                                data-test-id={`question-${currentQuestion.id}-affirmative`}
                            />
                            AFFIRMATIVE
                        </label>
                        <label>
                            <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                checked={currentQuestion.answer === false}
                                onChange={() => handleAnswerChange(false)}
                                data-test-id={`question-${currentQuestion.id}-negative`}
                            />
                            NEGATIVE
                        </label>
                    </div>
                    {/* Only show warning when user has attempted to proceed */}
                    {showSelectionWarning && (
                        <div className="input-requirement">
                            SELECTION REQUIRED TO PROCEED
                        </div>
                    )}
                </div>
                <div className="navigation-buttons">
                    <button 
                        type="button" 
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                    >
                        BACK
                    </button>
                    {isLastQuestion ? (
                        <button 
                            type="button" 
                            onClick={handleSubmit}
                        >
                            EXECUTE
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleNext}
                        >
                            PROCEED
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BoBrkRwaDetection;