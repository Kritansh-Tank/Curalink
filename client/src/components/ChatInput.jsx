import React, { useState, useRef, useEffect } from 'react';

const EXAMPLE_QUERIES = [
    { icon: '🫁', text: 'Latest treatment for lung cancer' },
    { icon: '💉', text: 'Clinical trials for diabetes' },
    { icon: '🧠', text: "Top researchers in Alzheimer's disease" },
    { icon: '❤️', text: 'Recent studies on heart disease' },
];

function ChatInput({ onSend, disabled, conversationDisease, conversationName }) {
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [disease, setDisease] = useState(conversationDisease || '');
    const [patientName, setPatientName] = useState(conversationName || '');
    const [intent, setIntent] = useState('');
    const [location, setLocation] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
    }, [message]);

    const handleSend = () => {
        if (!message.trim() || disabled) return;
        onSend({ message: message.trim(), disease, patientName, intent, location });
        setMessage('');
        setIntent('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleExampleClick = (text) => {
        setMessage(text);
        textareaRef.current?.focus();
    };

    return (
        <div className="chat-input-area">
            {/* Structured Form */}
            {showForm && (
                <div className="structured-form">
                    <div className="form-field">
                        <label className="form-label">Patient Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. John Smith"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Disease of Interest</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Parkinson's disease"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Specific Query / Intent</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Deep Brain Stimulation"
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Location (Optional)</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Toronto, Canada"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Main Input Row */}
            <div className="input-row">
                <div className="text-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="main-text-input"
                        placeholder={
                            disabled
                                ? 'Researching...'
                                : "Ask about any medical condition, treatment, or research topic..."
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        rows={1}
                    />
                    <div className="input-actions">
                        <button
                            className={`toggle-form-btn ${showForm ? 'active' : ''}`}
                            onClick={() => setShowForm((v) => !v)}
                            title="Toggle structured input form"
                            type="button"
                        >
                            {showForm ? '✕ Close' : '⚙ Details'}
                        </button>
                    </div>
                </div>
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    title="Send (Enter)"
                >
                    {disabled ? '⏳' : '↑'}
                </button>
            </div>

            {/* Example queries shown only when message empty */}
            {!message && !disabled && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {EXAMPLE_QUERIES.map((eq, i) => (
                        <button
                            key={i}
                            onClick={() => handleExampleClick(eq.text)}
                            style={{
                                padding: '4px 10px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '20px',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = 'var(--accent-primary)';
                                e.target.style.color = 'var(--text-secondary)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            {eq.icon} {eq.text}
                        </button>
                    ))}
                </div>
            )}

            <p className="input-hint">Enter ↵ to send · Shift+Enter for new line · Use ⚙ Details for structured input</p>
        </div>
    );
}

export default ChatInput;
