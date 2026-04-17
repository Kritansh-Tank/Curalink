import React, { useEffect } from 'react';
import { deleteConversation } from '../api/apiService';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
}

function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">🧬</div>
                    <div>
                        <div className="logo-text">Curalink</div>
                        <div className="logo-tagline">AI Medical Research</div>
                    </div>
                </div>
                <button className="new-chat-btn" onClick={onNew}>
                    + New Research Session
                </button>
            </div>

            <div className="sidebar-list">
                {conversations.length === 0 ? (
                    <div className="sidebar-empty">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔬</div>
                        <p>No sessions yet.</p>
                        <p style={{ marginTop: 4 }}>Start a new research session above.</p>
                    </div>
                ) : (
                    <>
                        <div className="sidebar-section-label">Recent Sessions</div>
                        {conversations.map((conv) => (
                            <div
                                key={conv._id}
                                className={`conversation-item ${activeId === conv._id ? 'active' : ''}`}
                                onClick={() => onSelect(conv._id)}
                            >
                                <div className="conv-title">
                                    {conv.title || 'Research Session'}
                                </div>
                                {conv.disease && (
                                    <div className="conv-disease">
                                        <span>🩺</span> {conv.disease}
                                    </div>
                                )}
                                <div className="conv-date">{formatDate(conv.createdAt)}</div>
                                <button
                                    className="delete-conv-btn"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await deleteConversation(conv._id);
                                        onDelete(conv._id);
                                    }}
                                    title="Delete session"
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'center',
            }}>
                Powered by OpenAlex · PubMed · ClinicalTrials
            </div>
        </div>
    );
}

export default Sidebar;
