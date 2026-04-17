const { expandQuery } = require('../services/queryExpander');
const { fetchFromOpenAlex } = require('../services/openalexService');
const { fetchFromPubMed } = require('../services/pubmedService');
const { fetchClinicalTrials } = require('../services/clinicalTrialsService');
const { rankPublications, rankTrials } = require('../services/rankingService');
const { generateResponse } = require('../services/llmService');
const Conversation = require('../models/Conversation');

/**
 * POST /api/chat
 * Main chat endpoint — orchestrates the entire pipeline
 */
async function chat(req, res) {
    try {
        const {
            message,
            disease = '',
            patientName = '',
            intent = '',
            location = '',
            conversationId = null,
        } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Load or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }
        if (!conversation) {
            conversation = new Conversation({
                title: message.substring(0, 50),
                patientName,
                disease,
                location,
            });
        }

        // Update patient context if provided
        if (disease && !conversation.disease) conversation.disease = disease;
        if (patientName && !conversation.patientName) conversation.patientName = patientName;
        if (location && !conversation.location) conversation.location = location;

        // Use conversation-level disease if not provided in this message
        const effectiveDisease = disease || conversation.disease;
        const effectiveLocation = location || conversation.location;
        const effectiveName = patientName || conversation.patientName;

        // Save user message
        conversation.messages.push({ role: 'user', content: message });

        // 2. Expand the query
        const expanded = expandQuery(message, effectiveDisease, intent, effectiveLocation);
        console.log('[Chat] Expanded query:', expanded.publicationQuery);

        // 3. Parallel fetch from all sources
        console.log('[Chat] Fetching from OpenAlex, PubMed, ClinicalTrials...');
        const [openAlexResults, pubMedResults, trialResults] = await Promise.all([
            fetchFromOpenAlex(expanded.publicationQuery, 100),
            fetchFromPubMed(expanded.publicationQuery, 100),
            fetchClinicalTrials(
                expanded.disease || effectiveDisease || message,
                intent || message,
                effectiveLocation,
                50
            ),
        ]);

        console.log(
            `[Chat] Raw results — OpenAlex: ${openAlexResults.length}, PubMed: ${pubMedResults.length}, Trials: ${trialResults.length}`
        );

        // 4. Merge and rank
        const allPublications = [...openAlexResults, ...pubMedResults];
        const keywords = [
            ...(expanded.expandedTerms || []),
            effectiveDisease,
            message,
        ].filter(Boolean);

        const rankedPublications = rankPublications(allPublications, keywords, 8);
        const rankedTrials = rankTrials(trialResults, keywords, 6);

        console.log(
            `[Chat] Ranked — Publications: ${rankedPublications.length}, Trials: ${rankedTrials.length}`
        );

        // 5. Build conversation history for LLM context
        const history = conversation.messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
        }));

        // 6. Call LLM
        const { parsed: structuredData, usedLLM } = await generateResponse(
            message,
            effectiveDisease,
            effectiveName,
            rankedPublications,
            rankedTrials,
            history.slice(0, -1) // exclude current message
        );

        // 7. Build assistant message
        const assistantContent = structuredData.researchInsights || 'Research analysis complete.';

        conversation.messages.push({
            role: 'assistant',
            content: assistantContent,
            structuredData: {
                conditionOverview: structuredData.conditionOverview,
                publications: rankedPublications,
                trials: rankedTrials,
                researchInsights: structuredData.researchInsights,
            },
        });

        await conversation.save();

        // 8. Respond
        return res.json({
            conversationId: conversation._id,
            message: assistantContent,
            structuredData: {
                conditionOverview: structuredData.conditionOverview,
                researchInsights: structuredData.researchInsights,
                clinicalRelevance: structuredData.clinicalRelevance,
                keyFindings: structuredData.keyFindings,
                recommendations: structuredData.recommendations,
                disclaimer: structuredData.disclaimer,
                publications: rankedPublications,
                trials: rankedTrials,
            },
            meta: {
                usedLLM,
                totalFetched: allPublications.length + trialResults.length,
                expandedQuery: expanded.publicationQuery,
            },
        });
    } catch (err) {
        console.error('[Chat] Error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}

module.exports = { chat };
