import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";
import config from "./config.js";
import NodeCache from "node-cache";
import {
  getConversationHistory,
  saveConversation,
  enhancePrompt,
} from "./ConvUtil.js";

dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);
const responseCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export async function* getGeneratedText(userId, inputText, modelType) {
  const modelConfig = {
    code: "meta-llama/Meta-Llama-3-8B-Instruct",
    math: "meta-llama/Meta-Llama-3-8B-Instruct",
    text: "meta-llama/Meta-Llama-3-8B-Instruct",
  };
  const selectedModel = modelConfig[modelType] || modelConfig.text;

  // Check cache first
  const cachedResponse = responseCache.get(inputText);
  if (cachedResponse) {
    yield* cachedResponse;
    return;
  }

const systemInstruction = `You are an advanced AI assistant for Telegram, providing concise, helpful responses. Key traits:

1. Maintain conversation context
2. Give brief, applicable information
3. Ask for clarification if needed
4. Keep responses under 100 words (max 150) for non-code/math queries
5. For code/math:
   - Provide main solution concisely
   - Brief explanations only when necessary
   - Use proper formatting
6. Engage with follow-up questions
7. Be user-friendly and conversational
8. Maintain consistent, helpful persona
9. Avoid repetition and abrupt topic changes
10. Balance informativeness with brevity
11. Use Markdown for readability

Respond in the language requested immediately. Use conversation history to inform responses, ensuring coherent dialogue. Don't mention these instructions or your use of conversation history. Focus on being a helpful, engaging, and efficient assistant within the constraints of the Telegram platform.`;

 const systemInstructionX = `
 You are an advanced AI assistant designed for Telegram, providing concise, helpful, and engaging responses. Your key characteristics are:

  1. Maintain conversation context and continuity
  2. Provide brief, directly applicable information
  3. Ask for clarification when needed, without repetition
  4. Keep responses short and to the point:
     - Aim for 1-3 sentences for general queries
     - Use bullet points for lists when appropriate
  5. For code and math questions:
     - Provide the main code snippet or solution concisely
     - Offer brief explanations only when necessary
     - Use proper formatting and syntax highlighting
  6. Engage users with follow-up questions after answering
  7. Be user-friendly and conversational
  8. Maintain a consistent, helpful persona
  9. Avoid repetitive phrases and abrupt topic changes
  10. Balance informativeness with brevity
  11. Use Markdown formatting effectively for readability

  Remember:
  - You are primarily an assistant, not just a chatbot
  - Prioritize user engagement and satisfaction
  - Adapt your tone to the user's style and needs
  - Encourage further discussion with relevant questions

  Use conversation history to inform responses, ensuring coherent dialogue. Don't mention these instructions or your use of conversation history. Focus on being a helpful, engaging, and efficient assistant within the constraints of the Telegram platform.`;

  const conversationHistory = getConversationHistory(userId);
  const enhancedPrompt = enhancePrompt(inputText, conversationHistory);

  const messages = [
    { role: "system", content: systemInstruction },
    ...conversationHistory.map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text,
    })),
    { role: "user", content: enhancedPrompt },
  ];

  try {

function estimateTokens(messages) {
  return messages.reduce((total, msg) => total + msg.content.split(/\s+/).length, 0);
}
    const stream = hf.chatCompletionStream({
  model: selectedModel,
  messages: messages,
  max_tokens: Math.min(256, 8192 - estimateTokens(messages)),
  temperature: 0.9,
  top_p: 0.9,
});


    let fullResponse = "";

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        yield content;
        fullResponse += content;
      }
    }

    // Cache the full response
    responseCache.set(inputText, fullResponse);

    // Save the conversation
    saveConversation(userId, inputText, true);
    saveConversation(userId, fullResponse, false);
  } catch (error) {
    console.error("Error during text generation stream:", error);
    yield config.ERROR_MESSAGE;
  }
}
