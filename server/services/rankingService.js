/**
 * Ranking Service
 * Merges OpenAlex + PubMed results, deduplicates, scores, and returns top N
 */

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Score a publication based on multiple signals
 */
function scorePublication(pub, keywords = []) {
    let score = 0;

    // 1. Recency score (0–30 points)
    if (pub.year) {
        const age = CURRENT_YEAR - pub.year;
        if (age <= 1) score += 30;
        else if (age <= 3) score += 25;
        else if (age <= 5) score += 18;
        else if (age <= 10) score += 10;
        else score += 5;
    }

    // 2. Keyword density in title (0–25 points)
    const titleLower = (pub.title || '').toLowerCase();
    let titleMatches = 0;
    for (const kw of keywords) {
        if (titleLower.includes(kw.toLowerCase())) titleMatches++;
    }
    score += Math.min(titleMatches * 8, 25);

    // 3. Keyword density in abstract (0–20 points)
    const abstractLower = (pub.abstract || '').toLowerCase();
    let abstractMatches = 0;
    for (const kw of keywords) {
        if (abstractLower.includes(kw.toLowerCase())) abstractMatches++;
    }
    score += Math.min(abstractMatches * 4, 20);

    // 4. Abstract length — proxy for completeness (0–15 points)
    const abstractLen = (pub.abstract || '').length;
    if (abstractLen > 800) score += 15;
    else if (abstractLen > 400) score += 10;
    else if (abstractLen > 100) score += 5;

    // 5. Citation count (0–10 points, OpenAlex only)
    if (pub.citations) {
        if (pub.citations > 500) score += 10;
        else if (pub.citations > 100) score += 7;
        else if (pub.citations > 20) score += 4;
    }

    return score;
}

/**
 * Score a clinical trial
 */
function scoreTrial(trial, keywords = []) {
    let score = 0;

    // Recruiting status (most valuable)
    if (trial.status === 'RECRUITING') score += 40;
    else if (trial.status === 'ACTIVE_NOT_RECRUITING') score += 25;
    else if (trial.status === 'COMPLETED') score += 15;
    else if (trial.status === 'NOT_YET_RECRUITING') score += 20;

    // Keyword match in title
    const titleLower = (trial.title || '').toLowerCase();
    for (const kw of keywords) {
        if (titleLower.includes(kw.toLowerCase())) score += 8;
    }

    // Has contact information (actionable)
    if (trial.contact) score += 10;

    // Has location
    if (trial.locations && trial.locations.length > 0) score += 5;

    // Summary keyword match
    const summaryLower = (trial.briefSummary || '').toLowerCase();
    for (const kw of keywords) {
        if (summaryLower.includes(kw.toLowerCase())) score += 3;
    }

    return score;
}

/**
 * Deduplicate publications by normalized title
 */
function deduplicatePublications(publications) {
    const seen = new Map();
    for (const pub of publications) {
        const key = normalizeTitle(pub.title);
        if (!seen.has(key)) {
            seen.set(key, pub);
        } else {
            // Prefer the one with more content
            const existing = seen.get(key);
            if ((pub.abstract || '').length > (existing.abstract || '').length) {
                seen.set(key, pub);
            }
        }
    }
    return [...seen.values()];
}

function normalizeTitle(title) {
    return (title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .substring(0, 60);
}

/**
 * Rank and filter publications
 */
function rankPublications(publications, keywords, topN = 8) {
    const deduped = deduplicatePublications(publications);
    const scored = deduped
        .filter((p) => p.title && p.title !== 'Untitled')
        .map((pub) => ({ ...pub, _score: scorePublication(pub, keywords) }))
        .sort((a, b) => b._score - a._score);

    return scored.slice(0, topN).map(({ _score, ...pub }) => pub);
}

/**
 * Rank and filter clinical trials
 */
function rankTrials(trials, keywords, topN = 6) {
    const seen = new Set();
    const unique = trials.filter((t) => {
        if (seen.has(t.nctId)) return false;
        seen.add(t.nctId);
        return true;
    });

    const scored = unique
        .filter((t) => t.title)
        .map((trial) => ({ ...trial, _score: scoreTrial(trial, keywords) }))
        .sort((a, b) => b._score - a._score);

    return scored.slice(0, topN).map(({ _score, ...trial }) => trial);
}

module.exports = { rankPublications, rankTrials };
