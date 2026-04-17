import React from 'react';

const STATUS_LABELS = {
    RECRUITING: 'Recruiting',
    COMPLETED: 'Completed',
    ACTIVE_NOT_RECRUITING: 'Active',
    NOT_YET_RECRUITING: 'Upcoming',
    TERMINATED: 'Terminated',
    WITHDRAWN: 'Withdrawn',
    SUSPENDED: 'Suspended',
};

function TrialCard({ trial }) {
    const statusKey = trial.status || 'UNKNOWN';
    const statusClass = `status-${statusKey}`;
    const label = STATUS_LABELS[statusKey] || statusKey;

    return (
        <div className="trial-card">
            <div className="trial-card-top">
                <h4 className="trial-title">{trial.title}</h4>
                <span className={`status-badge ${statusClass}`}>{label}</span>
            </div>

            {trial.briefSummary && (
                <p className="trial-summary">{trial.briefSummary}</p>
            )}

            <div className="trial-details">
                {trial.locations && trial.locations.length > 0 && (
                    <div className="trial-detail-row">
                        <span className="trial-detail-label">📍 Location</span>
                        <span>{trial.locations.join(' • ')}</span>
                    </div>
                )}

                {(trial.minAge || trial.maxAge) && (
                    <div className="trial-detail-row">
                        <span className="trial-detail-label">🎂 Age</span>
                        <span>
                            {trial.minAge && `From ${trial.minAge}`}
                            {trial.minAge && trial.maxAge && ' — '}
                            {trial.maxAge && `To ${trial.maxAge}`}
                        </span>
                    </div>
                )}

                {trial.sex && trial.sex !== 'ALL' && (
                    <div className="trial-detail-row">
                        <span className="trial-detail-label">👤 Sex</span>
                        <span style={{ textTransform: 'capitalize' }}>{trial.sex.toLowerCase()}</span>
                    </div>
                )}

                {trial.contact && (trial.contact.name || trial.contact.email || trial.contact.phone) && (
                    <div className="trial-detail-row">
                        <span className="trial-detail-label">📞 Contact</span>
                        <span>
                            {trial.contact.name && <>{trial.contact.name}</>}
                            {trial.contact.email && <> · {trial.contact.email}</>}
                            {trial.contact.phone && <> · {trial.contact.phone}</>}
                        </span>
                    </div>
                )}

                {trial.startDate && (
                    <div className="trial-detail-row">
                        <span className="trial-detail-label">🗓 Start</span>
                        <span>{trial.startDate}</span>
                    </div>
                )}
            </div>

            {trial.nctId && (
                <a
                    href={trial.url || `https://clinicaltrials.gov/study/${trial.nctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nct-link"
                >
                    🧪 {trial.nctId} — View Trial ↗
                </a>
            )}
        </div>
    );
}

export default TrialCard;
