const axios = require('axios');
const xml2js = require('xml2js');

const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const NCBI_TOOL = 'Curalink';
const NCBI_EMAIL = 'curalink@example.com';

/**
 * Fetch publications from PubMed
 * Step 1: esearch to get IDs, Step 2: efetch to get full records
 */
async function fetchFromPubMed(query, maxResults = 100) {
    try {
        // Step 1: Search for IDs
        const searchRes = await axios.get(ESEARCH_URL, {
            params: {
                db: 'pubmed',
                term: query,
                retmax: maxResults,
                sort: 'pub date',
                retmode: 'json',
                tool: NCBI_TOOL,
                email: NCBI_EMAIL,
            },
            timeout: 12000,
        });

        const idList = searchRes.data?.esearchresult?.idlist || [];
        if (idList.length === 0) return [];

        // Step 2: Fetch details for all IDs (batch)
        const ids = idList.join(',');
        const fetchRes = await axios.get(EFETCH_URL, {
            params: {
                db: 'pubmed',
                id: ids,
                retmode: 'xml',
                tool: NCBI_TOOL,
                email: NCBI_EMAIL,
            },
            timeout: 20000,
        });

        return parsePubMedXML(fetchRes.data);
    } catch (err) {
        console.error('[PubMed] Error:', err.message);
        return [];
    }
}

async function parsePubMedXML(xmlData) {
    try {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        const articles = result?.PubmedArticleSet?.PubmedArticle;
        if (!articles) return [];

        const articleArray = Array.isArray(articles) ? articles : [articles];

        return articleArray.map((item) => {
            const medline = item?.MedlineCitation;
            const article = medline?.Article;
            const pmid = medline?.PMID?._ || medline?.PMID || '';

            // Title
            const title =
                typeof article?.ArticleTitle === 'string'
                    ? article.ArticleTitle
                    : article?.ArticleTitle?._ || 'Untitled';

            // Abstract
            let abstract = '';
            if (article?.Abstract?.AbstractText) {
                const at = article.Abstract.AbstractText;
                if (typeof at === 'string') abstract = at;
                else if (Array.isArray(at)) abstract = at.map((a) => (typeof a === 'string' ? a : a._ || '')).join(' ');
                else if (at._) abstract = at._;
            }

            // Authors
            const authorList = article?.AuthorList?.Author;
            let authors = '';
            if (authorList) {
                const arr = Array.isArray(authorList) ? authorList : [authorList];
                authors = arr
                    .slice(0, 5)
                    .map((a) => `${a.LastName || ''} ${a.ForeName || a.Initials || ''}`.trim())
                    .filter(Boolean)
                    .join(', ');
            }

            // Year
            const pubDate = article?.Journal?.JournalIssue?.PubDate;
            const year = pubDate?.Year || pubDate?.MedlineDate?.substring(0, 4) || null;

            return {
                source: 'PubMed',
                title,
                abstract,
                authors,
                year: year ? parseInt(year, 10) : null,
                url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
                pmid: String(pmid),
                citations: 0,
            };
        });
    } catch (err) {
        console.error('[PubMed] XML parse error:', err.message);
        return [];
    }
}

module.exports = { fetchFromPubMed };
