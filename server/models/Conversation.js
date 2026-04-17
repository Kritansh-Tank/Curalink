const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  structuredData: {
    conditionOverview: String,
    publications: [mongoose.Schema.Types.Mixed],
    trials: [mongoose.Schema.Types.Mixed],
    researchInsights: String,
  },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'New Conversation' },
    patientName: { type: String, default: '' },
    disease: { type: String, default: '' },
    location: { type: String, default: '' },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
