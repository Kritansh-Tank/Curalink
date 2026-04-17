import React from 'react';

function PublicationCard({ pub, index }) {
    const badgeClass = pub.source === 'OpenAlex' ? 'badge-openalex' : 'badge-pubmed';

    return (
        <div className="pub-card">
            <div className="pub-card-top">
                <h4 className="pub-title">{pub.title}</h4>
                <span className={`source-badge ${badgeClass}`}>{pub.source}</span>
            </div>

            <div className="pub-meta">
                {pub.authors && (
                    <span className="pub-meta-item">
                        <span>👤</span> {pub.authors.split(',').slice(0, 2).join(',')}
                        {pub.authors.split(',').length > 2 ? ' et al.' : ''}
                    </span>
                )}
                {pub.year && (
                    <span className="pub-meta-item">
                        <span>📅</span> {pub.year}
                    </span>
                )}
                {pub.citations > 0 && (
                    <span className="pub-meta-item">
                        <span>🔗</span> {pub.citations} citations
                    </span>
                )}
            </div>

            {pub.abstract && (
                <p className="pub-abstract">{pub.abstract}</p>
            )}

            {pub.url && (
                <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pub-link"
                >
                    🔍 View Publication ↗
                </a>
            )}
        </div>
    );
}

export default PublicationCard;
