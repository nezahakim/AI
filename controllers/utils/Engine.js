import natural from "natural";

class Engine {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  async processInput(input) {
    const sanitizedInput = this.sanitizeInput(input);
    const { modelType, enhancedInput } = this.enhanceInput(sanitizedInput);
    return { modelType, enhancedInput };
  }

  sanitizeInput(input) {
    let sanitized = input.replace(/[<>]/g, "");
    sanitized = sanitized.toLowerCase().trim();
    sanitized = sanitized.replace(/\s+/g, " ");
    if (sanitized.length < 1) {
      throw new Error("Input is too short");
    }
    return sanitized;
  }

  enhanceInput(input) {
    const tokens = this.tokenizer.tokenize(input);
    const stemmedTokens = tokens.map((token) => this.stemmer.stem(token));
    const modelType = this.determineModelType(stemmedTokens);
    const enhancedInput = this.createEnhancedInput(modelType, input);
    return { modelType, enhancedInput };
  }

  determineModelType(stemmedTokens) {
    const keywordMap = {
      code: ["code", "function", "program", "script", "algorithm"],
      math: ["calculat", "equat", "math", "solv", "comput"],
      image: ["imag", "pictur", "photo", "draw", "generat"],
      summary: [
        "summarize",
        "summarise",
        "summary",
        "brief",
        "overview",
        "digest",
        "recap",
        "synopsis",
        "tldr",
      ],
      text: ["explain", "describ", "analyz", "discuss"],
    };
    for (const [type, keywords] of Object.entries(keywordMap)) {
      if (
        keywords.some((keyword) =>
          stemmedTokens.includes(this.stemmer.stem(keyword)),
        )
      ) {
        return type;
      }
    }
    return "text"; // Default to text if no specific type is detected
  }

  createEnhancedInput(modelType, originalInput) {
    const enhancementPrompts = {
      code: "Generate efficient and well-commented code for the following task:",
      math: "Solve the following mathematical problem, showing all steps:",
      image:
        "Generate a detailed description or creation process for an image based on:",
      summary: "Provide a concise summary of the following text:",
      text: "Provide a comprehensive and well-structured response to the following:",
    };
    return `${enhancementPrompts[modelType]} ${originalInput}`;
  }
}

export default Engine;
