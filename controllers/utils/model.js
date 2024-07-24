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

export async function* getGeneratedText(inputText, modelType) {
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

  const systemInstruction = `You are a helpful, intelligent assistant. Provide concise and accurate responses.
  `;

  const formattedPrompt = `${systemInstruction}\n\nHuman: ${inputText}\n\nAssistant: `;

  try {
    const stream = hf.textGenerationStream({
      model: selectedModel,
      inputs: formattedPrompt,
      parameters: {
        max_new_tokens: Math.min(config.MAX_TOKENS, 1500),
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
  } catch (error) {
    console.error("Error during text generation stream:", error);
    yield config.ERROR_MESSAGE;
  }
}
