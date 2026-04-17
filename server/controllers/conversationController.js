const Conversation = require('../models/Conversation');

async function getConversations(req, res) {
    try {
        const conversations = await Conversation.find(
            {},
            { title: 1, disease: 1, patientName: 1, createdAt: 1, 'messages': { $slice: -1 } }
        ).sort({ updatedAt: -1 }).limit(50);
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getConversation(req, res) {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ error: 'Not found' });
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deleteConversation(req, res) {
    try {
        await Conversation.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getConversations, getConversation, deleteConversation };
