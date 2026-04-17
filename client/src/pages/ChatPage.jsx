import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import StructuredResponse from '../components/StructuredResponse';
import LoadingIndicator from '../components/LoadingIndicator';
import { sendMessage, getConversations, getConversation } from '../api/apiService';

const EXAMPLE_QUERIES = [
    { icon: '🫁', text: 'Latest treatment for lung cancer', disease: 'lung cancer' },
    { icon: '💉', text: 'Clinical trials for diabetes', disease: 'diabetes' },
    { icon: '🧠', text: "Top researchers in Alzheimer's disease", disease: "Alzheimer's disease" },
    { icon: '❤️', text: 'Recent studies on heart disease', disease: 'heart disease' },
];

function ChatPage() {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [activeDisease, setActiveDisease] = useState('');
    const [activeName, setActiveName] = useState('');
    const [activeLocation, setActiveLocation] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    async function loadConversations() {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (e) {
            console.error('Failed to load conversations', e);
        }
    }

    async function selectConversation(id) {
        setActiveConversationId(id);
        try {
            const conv = await getConversation(id);
            setActiveDisease(conv.disease || '');
            setActiveName(conv.patientName || '');
            setActiveLocation(conv.location || '');

            const rendered = conv.messages.map((m) => ({
                role: m.role,
                content: m.content,
                structuredData: m.structuredData,
                timestamp: m.timestamp,
            }));
            setMessages(rendered);
        } catch (e) {
            console.error('Failed to load conversation', e);
        }
    }

    function startNewChat() {
        setActiveConversationId(null);
        setMessages([]);
        setActiveDisease('');
        setActiveName('');
        setActiveLocation('');
        setError('');
    }

    const handleSend = useCallback(async ({ message, disease, patientName, intent, location }) => {
        if (!message.trim() || loading) return;
        setError('');

        const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, userMsg]);

        // Update active context
        if (disease) setActiveDisease(disease);
        if (patientName) setActiveName(patientName);
        if (location) setActiveLocation(location);

        setLoading(true);
        setLoadingStage(0);

        // Simulate stage progression for UX
        const stageTimer1 = setTimeout(() => setLoadingStage(1), 800);
        const stageTimer2 = setTimeout(() => setLoadingStage(2), 3000);
        const stageTimer3 = setTimeout(() => setLoadingStage(3), 6000);

        try {
            const response = await sendMessage({
                message,
                disease: disease || activeDisease,
                patientName: patientName || activeName,
                intent,
                location: location || activeLocation,
                conversationId: activeConversationId,
            });

            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            clearTimeout(stageTimer3);

            if (!activeConversationId) {
                setActiveConversationId(response.conversationId);
            }

            const aiMsg = {
                role: 'assistant',
                content: response.message,
                structuredData: response.structuredData,
                meta: response.meta,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);

            await loadConversations();
        } catch (err) {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            clearTimeout(stageTimer3);
            setError(err.response?.data?.details || err.message || 'Something went wrong. Please try again.');
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
            setLoadingStage(0);
        }
    }, [loading, activeConversationId, activeDisease, activeName, activeLocation]);

    const handleExampleClick = (query) => {
        handleSend({ message: query.text, disease: query.disease, patientName: '', intent: '', location: '' });
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="app-layout">
            <Sidebar
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={selectConversation}
                onNew={startNewChat}
                onDelete={(id) => {
                    setConversations((prev) => prev.filter((c) => c._id !== id));
                    if (activeConversationId === id) startNewChat();
                }}
            />

            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h2>{activeName ? `${activeName}'s Research Session` : 'Medical Research Assistant'}</h2>
                        <p>AI-powered · OpenAlex · PubMed · ClinicalTrials.gov</p>
                    </div>
                    <div className="header-badges">
                        {activeDisease && (
                            <span className="header-badge badge-disease">🩺 {activeDisease}</span>
                        )}
                        {activeLocation && (
                            <span className="header-badge badge-location">📍 {activeLocation}</span>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="messages-area">
                    {!hasMessages ? (
                        <div className="welcome-screen">
                            <div className="welcome-icon">🧬</div>
                            <h1>Curalink Research</h1>
                            <p>
                                Your AI-powered medical research companion. Ask about treatments, clinical trials,
                                latest studies, or top researchers in any disease area.
                            </p>
                            <div className="example-queries">
                                {EXAMPLE_QUERIES.map((q, i) => (
                                    <button
                                        key={i}
                                        className="example-query-btn"
                                        onClick={() => handleExampleClick(q)}
                                        disabled={loading}
                                    >
                                        <span className="eq-icon">{q.icon}</span>
                                        <span>{q.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`message-wrapper ${msg.role === 'user' ? 'user' : ''}`}>
                                <div className={`msg-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                                    {msg.role === 'user' ? '👤' : '🧬'}
                                </div>
                                {msg.role === 'user' ? (
                                    <div className="user-bubble">{msg.content}</div>
                                ) : (
                                    <div className="ai-response">
                                        {msg.structuredData ? (
                                            <StructuredResponse data={msg.structuredData} meta={msg.meta} />
                                        ) : (
                                            <div className="structured-response">
                                                <div className="response-section">
                                                    <p className="section-text">{msg.content}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {loading && <LoadingIndicator stage={loadingStage} />}

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: '#ef4444',
                            fontSize: 13,
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <ChatInput
                    onSend={handleSend}
                    disabled={loading}
                    conversationDisease={activeDisease}
                    conversationName={activeName}
                />
            </div>
        </div>
    );
}

export default ChatPage;
