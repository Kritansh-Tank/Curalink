const express = require('express');
const router = express.Router();
const {
    getConversations,
    getConversation,
    deleteConversation,
} = require('../controllers/conversationController');

router.get('/', getConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);

module.exports = router;
