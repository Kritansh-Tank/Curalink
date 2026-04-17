/**
 * Query Expander
 * Builds optimized search strings from user context
 */

/**
 * Expand a user query using disease context and intent
 * @param {string} query - Raw user message
 * @param {string} disease - Disease context from conversation
 * @param {string} intent - Specific intent/topic
 * @param {string} location - Optional location
 * @returns {{ publicationQuery: string, trialQuery: string, expandedTerms: string[] }}
 */
function expandQuery(query, disease = '', intent = '', location = '') {
    const terms = new Set();
    const diseaseLower = disease.toLowerCase().trim();
    const intentLower = intent.toLowerCase().trim();
    const queryLower = query.toLowerCase().trim();

    // Add disease as a core term
    if (disease) terms.add(disease.trim());

    // Extract key concepts from the query
    const medicalKeywords = extractMedicalKeywords(queryLower);
    medicalKeywords.forEach((k) => terms.add(k));

    // If query explicitly mentions the disease or synonyms, combine with intent
    if (intent && disease) {
        terms.add(`${intent.trim()} ${disease.trim()}`);
    }

    // Synonym expansion for common diseases
    const synonyms = getDiseaseAliases(diseaseLower);
    synonyms.forEach((s) => terms.add(s));

    // Build primary publication query (disease + intent combined)
    // Only append disease if the query doesn't already mention it
    const queryAlreadyHasDisease = disease && queryLower.includes(diseaseLower);
    let publicationQuery = (disease && !queryAlreadyHasDisease)
        ? `${query} ${disease}`.trim()
        : query;

    if (intent && disease && !queryLower.includes(intentLower)) {
        publicationQuery = `${intent} ${disease}`;
    }

    // Build clinical trial query (condition-focused)
    const trialQuery = disease || query;

    const expandedTerms = [...terms].filter(Boolean);

    return {
        publicationQuery,
        trialQuery,
        expandedTerms,
        disease: disease || extractDiseaseFromQuery(queryLower),
        location,
    };
}

function extractMedicalKeywords(text) {
    const medicalPatterns = [
        /treatment[s]?/gi,
        /therap[yi][es]*/gi,
        /clinical trial[s]?/gi,
        /drug[s]?/gi,
        /medication[s]?/gi,
        /surger[yi]/gi,
        /symptom[s]?/gi,
        /diagnosis/gi,
        /prognosis/gi,
        /prevention/gi,
        /vaccine[s]?/gi,
        /immunotherapy/gi,
        /chemotherapy/gi,
        /radiation/gi,
        /biomarker[s]?/gi,
        /genetic[s]?/gi,
    ];
    const found = [];
    for (const pattern of medicalPatterns) {
        const matches = text.match(pattern);
        if (matches) found.push(...matches.map((m) => m.toLowerCase()));
    }
    return [...new Set(found)];
}

function getDiseaseAliases(disease) {
    const aliases = {
        "parkinson's disease": ["parkinson's", 'parkinsons disease', 'PD'],
        "alzheimer's disease": ["alzheimer's", 'alzheimers disease', 'AD dementia'],
        'lung cancer': ['non-small cell lung cancer', 'NSCLC', 'lung carcinoma'],
        diabetes: ['type 2 diabetes', 'diabetes mellitus', 'T2DM'],
        'heart disease': ['cardiovascular disease', 'coronary artery disease', 'CVD'],
        'breast cancer': ['breast carcinoma', 'mammary cancer'],
        'multiple sclerosis': ['MS', 'multiple sclerosis treatment'],
    };
    return aliases[disease] || [];
}

function extractDiseaseFromQuery(text) {
    const knownDiseases = [
        'lung cancer', 'breast cancer', 'diabetes', "parkinson's disease", "alzheimer's disease",
        'heart disease', 'multiple sclerosis', 'covid-19', 'depression', 'hypertension',
        'arthritis', 'asthma', 'stroke', 'obesity', 'chronic kidney disease',
    ];
    for (const d of knownDiseases) {
        if (text.includes(d)) return d;
    }
    return '';
}

module.exports = { expandQuery };
