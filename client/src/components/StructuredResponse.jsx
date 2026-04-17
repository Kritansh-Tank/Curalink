import React, { useState } from 'react';
import PublicationCard from './PublicationCard';
import TrialCard from './TrialCard';

function StructuredResponse({ data, meta }) {
    const [showPubs, setShowPubs] = useState(true);
    const [showTrials, setShowTrials] = useState(true);

    const {
        conditionOverview,
        researchInsights,
        clinicalRelevance,
        keyFindings,
        recommendations,
        disclaimer,
        publications = [],
        trials = [],
    } = data;

    return (
        <div className="structured-response">
            {/* Condition Overview */}
            {conditionOverview && (
                <div className="response-section">
                    <div className="section-label">
                        <div className="section-icon icon-overview">🔬</div>
                        Condition Overview
                    </div>
                    <p className="section-text">{conditionOverview}</p>
                </div>
            )}

            {/* Research Insights */}
            {researchInsights && (
                <div className="response-section">
                    <div className="section-label">
                        <div className="section-icon icon-insights">📊</div>
                        Research Insights
                    </div>
                    <p className="section-text">{researchInsights}</p>
                </div>
            )}

            {/* Key Findings */}
            {keyFindings && keyFindings.length > 0 && (
                <div className="response-section">
                    <div className="section-label">
                        <div className="section-icon icon-findings">💡</div>
                        Key Findings
                    </div>
                    <div className="key-findings-list">
                        {keyFindings.map((finding, i) => (
                            <div key={i} className="finding-item">
                                <div className="finding-bullet" />
                                <span>{finding}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Publications */}
            {publications.length > 0 && (
                <div className="response-section">
                    <div
                        className="section-label"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setShowPubs((v) => !v)}
                    >
                        <div className="section-icon icon-pubs">📚</div>
                        Research Publications ({publications.length})
                        <span style={{ marginLeft: 'auto', fontSize: 16 }}>{showPubs ? '▲' : '▼'}</span>
                    </div>
                    {showPubs && (
                        <div className="cards-grid">
                            {publications.map((pub, i) => (
                                <PublicationCard key={i} pub={pub} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Clinical Trials */}
            {trials.length > 0 && (
                <div className="response-section">
                    <div
                        className="section-label"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setShowTrials((v) => !v)}
                    >
                        <div className="section-icon icon-trials">🧪</div>
                        Clinical Trials ({trials.length})
                        <span style={{ marginLeft: 'auto', fontSize: 16 }}>{showTrials ? '▲' : '▼'}</span>
                    </div>
                    {showTrials && (
                        <div className="cards-grid">
                            {trials.map((trial, i) => (
                                <TrialCard key={i} trial={trial} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Clinical Relevance */}
            {clinicalRelevance && (
                <div className="response-section">
                    <div className="section-label">
                        <div className="section-icon icon-trials">🏥</div>
                        Clinical Relevance
                    </div>
                    <p className="section-text">{clinicalRelevance}</p>
                </div>
            )}

            {/* Recommendations */}
            {recommendations && (
                <div className="response-section">
                    <div className="section-label">
                        <div className="section-icon icon-rec">🎯</div>
                        Personalized Recommendations
                    </div>
                    <p className="section-text">{recommendations}</p>
                </div>
            )}

            {/* Disclaimer */}
            {disclaimer && (
                <div className="response-section">
                    <div className="disclaimer-box">
                        ⚠️ {disclaimer}
                    </div>
                </div>
            )}

            {/* Meta Bar */}
            {meta && (
                <div className="response-meta-bar">
                    <div className="meta-item">
                        <div className="meta-dot dot-green" />
                        {meta.usedLLM ? 'AI-powered analysis' : 'Template-based analysis (Ollama offline)'}
                    </div>
                    {meta.totalFetched > 0 && (
                        <div className="meta-item">
                            <div className="meta-dot dot-blue" />
                            {meta.totalFetched} sources retrieved
                        </div>
                    )}
                    {meta.expandedQuery && (
                        <div className="meta-item">
                            <div className="meta-dot dot-yellow" />
                            Query: "{meta.expandedQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StructuredResponse;
