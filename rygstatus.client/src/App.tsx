import { useEffect, useState } from 'react';
import BoBrkRwaDetection from "./ryg_status_form.tsx";

function App() {
    const [showTerminal, setShowTerminal] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Matrix-style initialization sequence
        const timer1 = setTimeout(() => setShowTerminal(true), 500);
        const timer2 = setTimeout(() => setShowTitle(true), 1500);
        const timer3 = setTimeout(() => setShowContent(true), 2500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="app-container">
            {showTerminal && (
                <div className="terminal-header">
                    <div className="terminal-line">$ INITIALIZING SYSTEM...</div>
                    <div className="terminal-line">$ ACCESSING SECURE DATABASE...</div>
                    <div className="terminal-line">$ ENCRYPTION PROTOCOLS ACTIVE</div>
                    <div className="terminal-line">$ LAUNCHING DETECTION MODULE v9.3.6</div>
                </div>
            )}

            {showTitle && (
                <h1 className="matrix-title">boBrkRwa Agent Detection</h1>
            )}

            {showContent && <BoBrkRwaDetection />}
        </div>
    );
}

export default App;