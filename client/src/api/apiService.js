import axios from 'axios';

const api = axios.create({
    baseURL: 'https://curalink-gc3s.onrender.com/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 180000, // 3 min for LLM
});

export async function sendMessage({ message, disease, patientName, intent, location, conversationId }) {
    const { data } = await api.post('/chat', {
        message,
        disease: disease || '',
        patientName: patientName || '',
        intent: intent || '',
        location: location || '',
        conversationId: conversationId || null,
    });
    return data;
}

export async function getConversations() {
    const { data } = await api.get('/conversations');
    return data;
}

export async function getConversation(id) {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
}

export async function deleteConversation(id) {
    const { data } = await api.delete(`/conversations/${id}`);
    return data;
}

export default api;
