const axios = require('axios');

/**
 * Fetch publications from OpenAlex
 * Retrieves up to 200 results for depth-first retrieval
 */
async function fetchFromOpenAlex(query, pageSize = 100) {
    const results = [];
    try {
        // Fetch two pages for deeper pool
        const pages = [1, 2];
        const perPage = Math.min(pageSize, 100);

        const requests = pages.map((page) =>
            axios.get('https://api.openalex.org/works', {
                params: {
                    search: query,
                    'per-page': perPage,
                    page,
                    sort: 'relevance_score:desc',
                    filter: 'from_publication_date:2015-01-01',
                },
                headers: { 'User-Agent': 'Curalink/1.0 (mailto:curalink@example.com)' },
                timeout: 12000,
            })
        );

        const responses = await Promise.allSettled(requests);

        for (const res of responses) {
            if (res.status === 'fulfilled' && res.value.data?.results) {
                for (const work of res.value.data.results) {
                    const abstract = extractAbstract(work);
                    if (!abstract && !work.title) continue;

                    results.push({
                        source: 'OpenAlex',
                        title: work.title || 'Untitled',
                        abstract: abstract || '',
                        authors: extractAuthors(work),
                        year: work.publication_year || null,
                        url: work.doi
                            ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}`
                            : work.id || '',
                        citations: work.cited_by_count || 0,
                    });
                }
            }
        }
    } catch (err) {
        console.error('[OpenAlex] Error:', err.message);
    }
    return results;
}

function extractAbstract(work) {
    if (work.abstract) return work.abstract;
    if (work.abstract_inverted_index) {
        try {
            const wordMap = work.abstract_inverted_index;
            const positions = [];
            for (const [word, locs] of Object.entries(wordMap)) {
                for (const pos of locs) {
                    positions.push({ word, pos });
                }
            }
            positions.sort((a, b) => a.pos - b.pos);
            return positions.map((p) => p.word).join(' ');
        } catch {
            return '';
        }
    }
    return '';
}

function extractAuthors(work) {
    try {
        return (work.authorships || [])
            .slice(0, 5)
            .map((a) => a.author?.display_name || '')
            .filter(Boolean)
            .join(', ');
    } catch {
        return '';
    }
}

module.exports = { fetchFromOpenAlex };
