import React from 'react';

const STAGES = [
    { key: 'expanding', label: 'Expanding query with disease context...' },
    { key: 'fetching', label: 'Fetching from OpenAlex, PubMed & ClinicalTrials...' },
    { key: 'ranking', label: 'Ranking and filtering research pool...' },
    { key: 'reasoning', label: 'LLM reasoning over evidence...' },
];

function LoadingIndicator({ stage = 1 }) {
    return (
        <div className="loading-wrapper">
            <div className="msg-avatar ai-avatar">🧬</div>
            <div className="loading-card">
                <div className="loading-header">
                    <div className="loading-spinner" />
                    <span className="loading-text">Researching medical literature...</span>
                </div>

                <div className="loading-stages">
                    {STAGES.map((s, idx) => {
                        const isDone = idx < stage;
                        const isActive = idx === stage;
                        return (
                            <div
                                key={s.key}
                                className={`stage-item ${isDone ? 'done' : isActive ? 'active' : ''}`}
                            >
                                <div className="stage-dot" />
                                <span>
                                    {isDone ? '✓ ' : ''}{s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <div className="skeleton-bar full" />
                    <div className="skeleton-bar medium" />
                    <div className="skeleton-bar short" />
                </div>
            </div>
        </div>
    );
}

export default LoadingIndicator;
