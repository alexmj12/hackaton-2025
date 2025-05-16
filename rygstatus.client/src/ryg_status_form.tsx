import { useState, useEffect } from 'react';

interface Question {
    id: number;
    text: string;
    answer: boolean;
}

enum RygStatus {
    Red = 0,
    Yellow = 1,
    Green = 2
}

function RygStatusForm() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [status, setStatus] = useState<RygStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getStatusClass = (status: RygStatus | null): string => {
        if (status === null) return '';
        return RygStatus[status].toLowerCase();
    };

    const getStatusText = (status: RygStatus | null): string => {
        if (status === null) return '';
        return RygStatus[status];
    };

    // Define base API URL
    const baseApiUrl = '/api'; // You might need to adjust this based on your setup

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

    const handleAnswerChange = (questionId: number, value: boolean) => {
        setQuestions(questions.map(q => 
            q.id === questionId ? { ...q, answer: value } : q
        ));
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
        } catch (error) {
            console.error('Error submitting responses:', error);
            setError('Failed to submit responses. Please try again.');
        }
    };

    if (loading) {
        return <div>Loading questions...</div>;
    }

    return (
        <div className="ryg-status-form">
            <h2>RYG Status Questions</h2>
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                {questions.map(question => (
                    <div key={question.id} className="question-item">
                        <p>{question.text}</p>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={question.answer === true}
                                    onChange={() => handleAnswerChange(question.id, true)}
                                />
                                Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={question.answer === false}
                                    onChange={() => handleAnswerChange(question.id, false)}
                                />
                                No
                            </label>
                        </div>
                    </div>
                ))}
                <button type="submit">Submit Responses</button>
            </form>

            {status !== null && (
                <div className={`status-result ${getStatusClass(status)}`}>
                    Status: {getStatusText(status)}
                </div>
            )}
        </div>
    );
}

export default RygStatusForm;