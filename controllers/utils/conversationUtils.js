// ConvUtil.js
const NodeCache = require('node-cache');
const conversationCache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

export function saveConversation(userId, message, isUser = true) {
  const history = conversationCache.get(userId) || [];
  history.push({ text: message, isUser, timestamp: Date.now() });
  conversationCache.set(userId, history);
}

export function getConversationHistory(userId) {
  return conversationCache.get(userId) || [];
}

export function enhancePrompt(inputText, conversationHistory) {
  const recentHistory = conversationHistory.slice(-5); // Consider last 5 interactions
  const contextPrompt = recentHistory.map(h => 
    `${h.isUser ? 'Human' : 'Assistant'}: ${h.text}`
  ).join('\n');

  return `${contextPrompt}\n\nHuman: ${inputText}`;
}

export function generateFollowUpQuestion(context) {
  const questions = [
    "How does that make you feel?",
    "What are your thoughts on that?",
    "Have you considered any alternatives?",
    "Is there anything specific you'd like to focus on?",
    "How can I help you further with this?",
    "Did you manage to complete your tasks for today?",
    "Have you taken any breaks to relax?",
    "Is there anything exciting coming up in your week?",
  ];
  // Choose a relevant question based on context
  return questions[Math.floor(Math.random() * questions.length)];
}

export function cleanUpOldConversations() {
  const keys = conversationCache.keys();
  const oneDayAgo = Date.now() - 86400000;

  keys.forEach(key => {
    const history = conversationCache.get(key);
    if (history[history.length - 1].timestamp < oneDayAgo) {
      conversationCache.del(key);
    }
  });
}

// Run cleanup daily
setInterval(cleanUpOldConversations, 86400000);