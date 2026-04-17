const axios = require('axios');

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Fetch clinical trials from ClinicalTrials.gov v2 API
 */
async function fetchClinicalTrials(disease, intent = '', location = '', pageSize = 50) {
    const results = [];
    try {
        const queryCondition = disease;
        const queryTerm = intent ? `${intent} ${disease}` : disease;

        // Fetch both RECRUITING and ALL statuses in parallel for broader pool
        const requests = [
            axios.get(BASE_URL, {
                params: {
                    'query.cond': queryCondition,
                    'query.term': queryTerm,
                    'filter.overallStatus': 'RECRUITING',
                    pageSize: Math.min(pageSize, 100),
                    format: 'json',
                },
                timeout: 12000,
            }),
            axios.get(BASE_URL, {
                params: {
                    'query.cond': queryCondition,
                    'query.term': queryTerm,
                    pageSize: Math.min(pageSize, 100),
                    format: 'json',
                },
                timeout: 12000,
            }),
        ];

        const responses = await Promise.allSettled(requests);
        const seen = new Set();

        for (const res of responses) {
            if (res.status !== 'fulfilled') continue;
            const studies = res.value.data?.studies || [];

            for (const study of studies) {
                const proto = study?.protocolSection;
                const nctId = proto?.identificationModule?.nctId || '';
                if (seen.has(nctId)) continue;
                seen.add(nctId);

                const title =
                    proto?.identificationModule?.officialTitle ||
                    proto?.identificationModule?.briefTitle ||
                    'Untitled';

                const status =
                    proto?.statusModule?.overallStatus || 'Unknown';

                const briefSummary =
                    proto?.descriptionModule?.briefSummary || '';

                // Eligibility
                const eligibility = proto?.eligibilityModule?.eligibilityCriteria || '';
                const minAge = proto?.eligibilityModule?.minimumAge || '';
                const maxAge = proto?.eligibilityModule?.maximumAge || '';
                const sex = proto?.eligibilityModule?.sex || '';

                // Locations
                const locationList = proto?.contactsLocationsModule?.locations || [];
                const locationNames = locationList
                    .slice(0, 3)
                    .map((l) => [l.city, l.country].filter(Boolean).join(', '))
                    .filter(Boolean);

                // Filter by location if provided
                if (location && locationNames.length > 0) {
                    const locLower = location.toLowerCase();
                    const isRelevant = locationNames.some(
                        (l) => l.toLowerCase().includes(locLower.split(',')[0].trim())
                    );
                    // Don't exclude — just mark location relevance but include all
                }

                // Contacts
                const contacts = proto?.contactsLocationsModule?.centralContacts || [];
                const primaryContact = contacts[0]
                    ? {
                        name: contacts[0].name || '',
                        phone: contacts[0].phone || '',
                        email: contacts[0].email || '',
                    }
                    : null;

                // Dates
                const startDate = proto?.statusModule?.startDateStruct?.date || '';
                const completionDate =
                    proto?.statusModule?.primaryCompletionDateStruct?.date ||
                    proto?.statusModule?.completionDateStruct?.date || '';

                // Conditions
                const conditions = proto?.conditionsModule?.conditions || [];

                results.push({
                    nctId,
                    title,
                    status,
                    briefSummary,
                    eligibility: eligibility.substring(0, 600),
                    minAge,
                    maxAge,
                    sex,
                    locations: locationNames,
                    contact: primaryContact,
                    startDate,
                    completionDate,
                    conditions,
                    url: `https://clinicaltrials.gov/study/${nctId}`,
                });
            }
        }
    } catch (err) {
        console.error('[ClinicalTrials] Error:', err.message);
    }
    return results;
}

module.exports = { fetchClinicalTrials };
