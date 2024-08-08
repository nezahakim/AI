const languageCodeMapping = {
  ar: "ar_AR",
  cs: "cs_CZ",
  de: "de_DE",
  en: "en_XX",
  es: "es_XX",
  et: "et_EE",
  fi: "fi_FI",
  fr: "fr_XX",
  gu: "gu_IN",
  hi: "hi_IN",
  it: "it_IT",
  ja: "ja_XX",
  kk: "kk_KZ",
  ko: "ko_KR",
  lt: "lt_LT",
  lv: "lv_LV",
  my: "my_MM",
  ne: "ne_NP",
  nl: "nl_XX",
  ro: "ro_RO",
  ru: "ru_RU",
  si: "si_LK",
  tr: "tr_TR",
  vi: "vi_VN",
  zh: "zh_CN",
  af: "af_ZA",
  az: "az_AZ",
  bn: "bn_IN",
  fa: "fa_IR",
  he: "he_IL",
  hr: "hr_HR",
  id: "id_ID",
  ka: "ka_GE",
  km: "km_KH",
  mk: "mk_MK",
  ml: "ml_IN",
  mn: "mn_MN",
  mr: "mr_IN",
  pl: "pl_PL",
  ps: "ps_AF",
  pt: "pt_XX",
  sv: "sv_SE",
  sw: "sw_KE",
  ta: "ta_IN",
  te: "te_IN",
  th: "th_TH",
  tl: "tl_XX",
  uk: "uk_UA",
  ur: "ur_PK",
  xh: "xh_ZA",
  gl: "gl_ES",
  sl: "sl_SI",
};

import { HfInference } from "@huggingface/inference";
import pkg from "node-nlp";
const { Language } = pkg;
import dotenv from "dotenv";
import config from "./config.js";
import NodeCache from "node-cache";

dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);
const language = new Language();
const responseCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

class DetectLanguageAndTranslate {
  constructor(text) {
    this.text = text;
  }

  async init() {
    this.lang = await this.detectLanguage(this.text);
  }

  async detectLanguage(text) {
    const detectedLanguage = await language.guess(text);
    const languageCode = detectedLanguage[0].alpha2;
    return languageCodeMapping[languageCode] || "en_XX";
  }
}

import {
  getConversationHistory,
  saveConversation,
  enhancePrompt,
} from "./ConvUtil.js";

export async function* getGeneratedText(userId, inputText, modelType) {
  const modelConfig = {
    code: config.CODE_MODEL,
    math: config.MATH_MODEL,
    text: config.TEXT_MODEL,
  };
  const selectedModel = modelConfig[modelType] || config.TEXT_MODEL;
  // Check cache first
  const cachedResponse = responseCache.get(inputText);
  if (cachedResponse) {
    yield* cachedResponse.split(" ");
    return;
  }
  const detectTranslate = new DetectLanguageAndTranslate(inputText);
  await detectTranslate.init();

  const systemInstruction = `
  You are an advanced AI assistant designed to provide helpful, coherent, and contextually appropriate responses. Your key characteristics are:

  1. Maintain conversation context and continuity
  2. Provide relevant and directly applicable information
  3. Ask for clarification when needed, without repeating the same phrases
  4. Avoid abrupt topic changes unless initiated by the user
  5. Engage in a natural dialogue flow, similar to human conversation
  6. Provide thoughtful and nuanced responses to complex questions
  7. Maintain a consistent persona throughout the conversation
  8. Avoid repetitive phrases and avoid repeating the same phrases
  9. Make short answers for common questions, such as "How are you?" or "What's your favorite color?" and for codes and math problems or Teaching make big responces.
  10. maintaing your Markdown well structured.

  Use the conversation history to inform your responses, ensuring a smooth and coherent dialogue. Do not explicitly mention using this history unless directly relevant. Just do everything as we told you here and don't mention anything about the rules we told you here.`;

  const conversationHistory = getConversationHistory(userId);
  const enhancedPrompt = enhancePrompt(inputText, conversationHistory);
  const formattedPrompt = `${systemInstruction}\n\n${enhancedPrompt}\n\nAssistant: `;
  try {
    const maxTokens = 2048;
    const inputsTokens = formattedPrompt.length;
    const maxNewTokens = Math.min(1500, maxTokens - inputsTokens);

    const stream = hf.textGenerationStream({
      // model: selectedModel,
      model: selectedModel,

      inputs: formattedPrompt,
      parameters: {
        max_new_tokens: maxNewTokens,
        temperature: 0.8,
        top_p: 0.9,
        return_full_text: false,
        stop: ["\nHuman:", "<|endoftext|>"],
      },
    });
    let buffer = "";
    let fullResponse = "";
    const unwantedStrings = new Set(["Human:", "<|endoftext|>", "\n\nHuman:"]);
    for await (const output of stream) {
      if (output?.token?.text) {
        buffer += output.token.text;
        const words = buffer.split(" ");
        while (words.length > 1) {
          const word = words.shift().trim();
          if (!unwantedStrings.has(word)) {
            const cleanWord = word.replace(/<\|endoftext\>|Human:/g, "");
            yield cleanWord;
            fullResponse += cleanWord + " ";
          }
        }
        buffer = words.join(" ");
      }
    }
    if (buffer.trim()) {
      const finalWord = buffer.trim();
      if (!unwantedStrings.has(finalWord)) {
        const cleanFinalWord = finalWord.replace(/<\|endoftext\>|Human:/g, "");
        yield cleanFinalWord;
        fullResponse += cleanFinalWord;
      }
    }
    // Cache the full response
    responseCache.set(inputText, fullResponse.trim());
    // Save the conversation
    saveConversation(userId, inputText, true);
    saveConversation(userId, fullResponse.trim(), false);
  } catch (error) {
    console.error("Error during text generation stream:", error);
    yield config.ERROR_MESSAGE;
  }
}

// LIve Responce!!

// generateLiveResponse: async (
//     bot,
//     chatId,
//     userMessage,
//     replyToMessageId = null,
// ) => {
//     let messageId = null;
//     let fullResponse = "";
//     let wordBuffer = [];
//     const updateInterval = 100; // Update every 200ms for a smoother experience
//     let lastUpdateTime = 0;
//     let typingInterval;

//     const updateMessage = async (force = false) => {
//         const currentTime = Date.now();
//         if (force || currentTime - lastUpdateTime >= updateInterval) {
//             if (wordBuffer.length > 0) {
//                 fullResponse += wordBuffer.join(" ");
//                 wordBuffer = [];
//             }
//             if (fullResponse.trim()) {
//                 try {
//                     if (!messageId) {
//                         const sentMessage = await bot.sendMessage(
//                             chatId,
//                             fullResponse.trim(),
//                             {
//                                 reply_to_message_id: replyToMessageId,
//                                 parse_mode: "Markdown",
//                             },
//                         );
//                         messageId = sentMessage.message_id;
//                     } else {
//                         await bot.editMessageText(fullResponse.trim(), {
//                             chat_id: chatId,
//                             message_id: messageId,
//                             parse_mode: "Markdown",
//                         });
//                     }
//                     lastUpdateTime = currentTime;
//                 } catch (error) {
//                     console.error("Error updating message:", error);
//                 }
//             }
//         }
//     };

//     try {
//         // Start a repeating typing indicator
//         typingInterval = setInterval(
//             () => bot.sendChatAction(chatId, "typing"),
//             4000,
//         );

//         const engine = new Engine();
//         const { modelType, enhancedInput } =
//             await engine.processInput(userMessage);

//         for await (const word of getGeneratedText(
//             chatId,
//             enhancedInput,
//             modelType,
//         )) {
//             wordBuffer.push(word);
//             await updateMessage();
//         }

//         // Final update
//         await updateMessage(true);
//     } catch (error) {
//         console.error("Error in generateLiveResponse:", error);
//         await bot.sendMessage(chatId, config.ERROR_MESSAGE);
//     } finally {
//         // Clear the typing indicator interval
//         clearInterval(typingInterval);
//     }
// },

const systemInstruction = `
You are an advanced AI assistant designed to provide helpful, coherent, and contextually appropriate responses. Your key characteristics are:

1. Maintain conversation context and continuity
2. Provide relevant and directly applicable information
3. Ask for clarification when needed, without repeating the same phrases
4. Avoid abrupt topic changes unless initiated by the user
5. Engage in a natural dialogue flow, similar to human conversation
6. Provide thoughtful and nuanced responses to complex questions
7. Maintain a consistent persona throughout the conversation
8. Avoid repetitive phrases
9. Prioritize concise responses for general queries:
   - Aim for brief, to-the-point answers
   - Typically limit responses to 1-3 sentences
   - Use bullet points for lists when appropriate
10. Provide detailed, comprehensive responses for code and math-related questions:
    - Offer in-depth explanations
    - Include examples and step-by-step solutions
    - Use proper formatting and syntax highlighting for code
11. Maintain your Markdown well structured
12. Balance informativeness with brevity
13. make short responces as possible, not only for codes and math.

Use the conversation history to inform your responses, ensuring a smooth and coherent dialogue. Do not explicitly mention using this history unless directly relevant. Just do everything as we told you here and don't mention anything about the rules we told you here.`;
