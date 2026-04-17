const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Build a messages array for Groq Chat Completion
 */
function buildMessages(userMessage, disease, patientName, publications, trials, conversationHistory) {
    const patientCtx = patientName ? `Patient: ${patientName}. ` : '';
    const diseaseCtx = disease ? `Primary condition: ${disease}. ` : '';

    const history = conversationHistory
        .slice(-4)
        .map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
        }));

    const pubsText = publications
        .slice(0, 4)
        .map(
            (p, i) =>
                `[PUB${i + 1}] ${p.title} (${p.year || 'N/A'}) — ${p.authors?.split(',')[0] || 'Unknown'} et al. Source: ${p.source}\nAbstract: ${(p.abstract || '').substring(0, 200)}...`
        )
        .join('\n\n');

    const trialsText = trials
        .slice(0, 3)
        .map(
            (t, i) =>
                `[TRIAL${i + 1}] ${t.title}\nStatus: ${t.status} | NCT: ${t.nctId} | Location: ${(t.locations || []).slice(0, 2).join(', ') || 'N/A'}\nSummary: ${(t.briefSummary || '').substring(0, 150)}...`
        )
        .join('\n\n');

    const systemPrompt = `You are Curalink, an expert AI medical research assistant. You ONLY provide information grounded in the research data provided. You do NOT hallucinate or invent facts.

PATIENT CONTEXT: ${patientCtx}${diseaseCtx}

RESEARCH PUBLICATIONS:
${pubsText || 'No publications retrieved.'}

CLINICAL TRIALS:
${trialsText || 'No clinical trials retrieved.'}

INSTRUCTIONS:
- Synthesize the above research to answer the user's question thoroughly.
- Reference specific publications by their [PUB#] tags and trials by [TRIAL#].
- Your response MUST follow this EXACT JSON structure (no markdown code blocks, pure JSON):
{
  "conditionOverview": "A 2-3 sentence overview of the condition relevant to the question.",
  "researchInsights": "A detailed 3-5 paragraph analysis drawing from the publications above. Be specific, cite [PUB#] tags. Cover mechanisms, treatments, outcomes, and emerging evidence.",
  "clinicalRelevance": "1-2 paragraphs on what the clinical trials reveal about current research directions. Reference [TRIAL#] tags.",
  "keyFindings": ["Finding 1 with citation [PUB#]", "Finding 2 with citation [PUB#]", "Finding 3"],
  "recommendations": "Personalized summary of what the research suggests for this patient context. Remind user to consult their physician.",
  "disclaimer": "This is for research purposes only. Always consult a qualified healthcare professional."
}`;

    return [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
    ];
}

/**
 * Call Groq Cloud LLM
 */
async function callGroq(messages) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
        throw new Error('Groq API Key not configured');
    }

    const response = await axios.post(
        GROQ_BASE_URL,
        {
            model: GROQ_MODEL,
            messages,
            temperature: 0.3,
            max_tokens: 2000,
            top_p: 1,
            stream: false,
            response_format: { type: 'json_object' },
        },
        {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );
    return response.data?.choices[0]?.message?.content || '';
}

/**
 * Parse LLM JSON response safely
 */
function parseLLMResponse(raw) {
    try {
        return JSON.parse(raw.trim());
    } catch (e) {
        try {
            const firstBrace = raw.indexOf('{');
            const lastBrace = raw.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
            }
        } catch (e2) {
            console.warn('[LLM] JSON parse failed:', e2.message);
        }
    }
    return null;
}

/**
 * Structured fallback when LLM is unavailable
 */
function buildFallbackResponse(userMessage, disease, publications, trials) {
    const topPub = publications[0];
    const topTrial = trials[0];

    return {
        conditionOverview: `Research overview for ${disease || 'the specified condition'} based on retrieved publications and clinical trial data.`,
        researchInsights: publications.length > 0
            ? `Based on ${publications.length} retrieved publications, the most relevant recent work includes: "${topPub?.title || ''}" (${topPub?.year || 'N/A'}) by ${topPub?.authors || 'Unknown authors'}. ${topPub?.abstract ? topPub.abstract.substring(0, 400) + '...' : ''}`
            : 'No publications were retrieved for this query. Please try refining your search terms.',
        clinicalRelevance: trials.length > 0
            ? `${trials.length} clinical trials are currently available. The most relevant: "${topTrial?.title}" (Status: ${topTrial?.status}). ${topTrial?.briefSummary?.substring(0, 300) || ''}`
            : 'No clinical trials were found for this specific query.',
        keyFindings: publications.slice(0, 3).map(
            (p) => `${p.title} (${p.year || 'N/A'}) — ${p.source}`
        ),
        recommendations: `Review the publications and clinical trials provided. Consult with a qualified healthcare professional before making any medical decisions.`,
        disclaimer: 'This is for research purposes only. Always consult a qualified healthcare professional.',
    };
}

/**
 * Main LLM function — tries Groq, falls back to structured template
 */
async function generateResponse(userMessage, disease, patientName, publications, trials, conversationHistory = []) {
    const messages = buildMessages(userMessage, disease, patientName, publications, trials, conversationHistory);

    try {
        console.log(`[LLM] Calling Groq (${GROQ_MODEL})...`);
        const rawResponse = await callGroq(messages);
        const parsed = parseLLMResponse(rawResponse);

        if (parsed && typeof parsed === 'object') {
            console.log('[LLM] Structured JSON response received from Groq');
            return { parsed, rawResponse, usedLLM: true };
        }

        console.warn('[LLM] Groq response not valid JSON, wrapping raw text');
        return {
            parsed: {
                conditionOverview: disease ? `Information regarding ${disease}.` : "Condition overview.",
                researchInsights: rawResponse.length > 500 ? rawResponse.substring(0, 1000) + "..." : rawResponse,
                clinicalRelevance: "Please refer to the clinical trials listed below.",
                keyFindings: [],
                recommendations: "Consult your healthcare provider for personalized advice.",
                disclaimer: 'This is for research purposes only. Always consult a qualified healthcare professional.',
            },
            rawResponse,
            usedLLM: true,
        };
    } catch (err) {
        console.warn('[LLM] Groq call failed, using fallback:', err.message);
        const fallback = buildFallbackResponse(userMessage, disease, publications, trials);
        return { parsed: fallback, rawResponse: '', usedLLM: false };
    }
}

module.exports = { generateResponse };
