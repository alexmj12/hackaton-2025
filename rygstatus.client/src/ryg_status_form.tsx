import { useState, useEffect } from 'react';

interface Question {
    id: number;
    text: string;
    answer: boolean;
}

// @ts-ignore
enum RygStatus {
    Red = 0,
    Yellow = 1,
    Green = 2
}

function RygStatusForm() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [status, setStatus] = useState<RygStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

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
            const response = await fetch(`${baseApiUrl}/RygStatus/questions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setQuestions(data.map((q: Question) => ({ ...q, answer: false })));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError('Failed to load questions. Please try again later.');
            setLoading(false);
        }
    };

    const handleAnswerChange = (value: boolean) => {
        const currentQuestion = questions[currentQuestionIndex];
        setQuestions(questions.map(q => 
            q.id === currentQuestion.id ? { ...q, answer: value } : q
        ));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            const response = await fetch(`${baseApiUrl}/RygStatus/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questions)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setStatus(result as RygStatus);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting responses:', error);
            setError('Failed to submit responses. Please try again.');
        }
    };

    const handleStartOver = () => {
        setIsSubmitted(false);
        setStatus(null);
        setCurrentQuestionIndex(0);
        fetchQuestions();
    };

    if (loading) {
        return <div>Loading questions...</div>;
    }

    if (questions.length === 0) {
        return <div>No questions available.</div>;
    }

    if (isSubmitted) {
        return (
            <div className="ryg-status-form">
                <div className={`status-result ${getStatusClass(status)}`}>
                    <h2>Your Status Result</h2>
                    <div className="status-text">Status: {getStatusText(status)}</div>
                    <button className="start-over-button" onClick={handleStartOver}>
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
        <div className="ryg-status-form">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            <div className="question-widget">
                <div className="question-progress">
                    Question {currentQuestionIndex + 1} of {questions.length}
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
                            />
                            Yes
                        </label>
                        <label>
                            <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                checked={currentQuestion.answer === false}
                                onChange={() => handleAnswerChange(false)}
                            />
                            No
                        </label>
                    </div>
                </div>
                <div className="navigation-buttons">
                    <button 
                        type="button" 
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                    >
                        Previous
                    </button>
                    {isLastQuestion ? (
                        <button type="button" onClick={handleSubmit}>Submit</button>
                    ) : (
                        <button type="button" onClick={handleNext}>Next</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RygStatusForm;