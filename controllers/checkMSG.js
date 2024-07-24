export default function CheckMSG(msg) {
  const text = msg.toLowerCase();

  const companyPatterns = [
    /notifycode.*founding|notifycode.*established|notifycode.*started/,
    /notifycode.*age|notifycode.*how.*old/,
    /notifycode.*team.*size|notifycode.*number.*of.*employees/,
    /notifycode.*funding|notifycode.*investment/,
    /notifycode.*revenue|notifycode.*financials/,
    /notifycode.*clients|notifycode.*customer/,
    /notifycode.*technologies|notifycode.*tech/,
    /notifycode.*roadmap|notifycode.*future/,
    /notifycode.*hiring|notifycode.*jobs/,
    /notifycode.*internships/,
    /notifycode.*work.*culture/,
    /notifycode.*awards/,
    /notifycode.*patents/,
    /notifycode.*open.*source/,
    /notifycode.*ai.*ethics/,
    /notifycode.*data.*privacy/,
    /notifycode.*sustainability/,
    /notifycode.*social.*responsibility/,
    /notifycode.*partners/,
    /notifycode.*customer.*support/,
    /notifycode.*training.*programs/,
    /notifycode.*api/,
    /notifycode.*case.*studies/,
    /notifycode.*blog/,
    /notifycode.*events/,
    /notifycode.*demo/,
    /notifycode.*pricing/,
    /notifycode.*services|notifycode.*offer/,
    /notifycode.*mission/,
    /notifycode.*location/,
    /notifycode.*join/,
    /notifycode.*products/,
    /notifycode.*what.*is/,
    /notifycode.*about/,
  ];

  // Detailed responses
  const responses = {
    "when were you created":
      "I was created in June-July 2024 by the team at NotifyCode Inc.",
    "what's your best name": "I'm NezaAI.",
    "who created you":
      "I'm NezaAI, an assistant created by the team at NotifyCode Inc. Our team of developers and AI experts designed and built me to assist you with various tasks and provide helpful information.",
    "notifycode founding":
      "NotifyCode Inc. was founded in early 2024 by Neza Hakim, with the goal of revolutionizing AI integration in software solutions.",
    "notifycode age":
      "NotifyCode Inc. is a young and dynamic company, founded in 2024. Despite its youth, it's already making waves in the AI industry.",
    "notifycode team size":
      "As an AI, I don't have real-time information about NotifyCode Inc.'s team size. The company is growing rapidly to meet the increasing demand for AI solutions.",
    "notifycode funding":
      "For the most up-to-date information on NotifyCode Inc.'s funding status, please check our official website or contact the company directly.",
    "notifycode revenue":
      "As an AI assistant, I don't have access to NotifyCode Inc.'s financial information. For such details, please contact the company through official channels.",
    "notifycode clients":
      "NotifyCode Inc. works with a diverse range of clients across various industries. For specific client information, please reach out to our sales team.",
    "notifycode technologies":
      "NotifyCode Inc. utilizes cutting-edge AI technologies, including natural language processing, machine learning, and deep learning, to create innovative software solutions.",
    "notifycode roadmap":
      "NotifyCode Inc. is continuously evolving its AI technologies. While I don't have specific details about the roadmap, the company is committed to pushing the boundaries of AI integration in software.",
    "notifycode hiring":
      "NotifyCode Inc. is always looking for talented individuals passionate about AI and software development. Check our careers page for current openings.",
    "notifycode internships":
      "NotifyCode Inc. offers internship opportunities for students and recent graduates interested in AI and software development. Visit our careers page for more information.",
    "notifycode work culture":
      "NotifyCode Inc. prides itself on fostering an innovative, collaborative, and inclusive work environment where creativity and technical excellence are highly valued.",
    "notifycode awards":
      "While I don't have specific information about awards, NotifyCode Inc. is recognized for its innovative approach to AI integration in software solutions.",
    "notifycode patents":
      "NotifyCode Inc. is actively involved in R&D and may have patents pending or granted. For specific patent information, please contact the company directly.",
    "notifycode open source":
      "NotifyCode Inc. believes in contributing to the tech community. Check our GitHub page for any open-source projects we may have released.",
    "notifycode ai ethics":
      "NotifyCode Inc. is committed to developing AI responsibly, adhering to ethical guidelines and prioritizing user privacy and data security.",
    "notifycode data privacy":
      "NotifyCode Inc. takes data privacy seriously, implementing robust security measures and complying with relevant data protection regulations.",
    "notifycode sustainability":
      "NotifyCode Inc. is committed to sustainable practices, aiming to minimize its environmental impact while developing cutting-edge AI solutions.",
    "notifycode social responsibility":
      "NotifyCode Inc. believes in using AI for social good and participates in initiatives to apply its technology to address societal challenges.",
    "notifycode partners":
      "NotifyCode Inc. collaborates with various technology partners to enhance its AI capabilities. For specific partnership information, please check our website.",
    "notifycode customer support":
      "NotifyCode Inc. offers comprehensive customer support for its products and services. You can reach our support team through the contact information on our website.",
    "notifycode training programs":
      "NotifyCode Inc. provides training programs to help clients and partners effectively utilize our AI solutions. Contact our sales team for more information.",
    "notifycode api":
      "NotifyCode Inc. offers APIs for some of its AI services, allowing developers to integrate our technology into their applications. Check our developer portal for details.",
    "notifycode case studies":
      "NotifyCode Inc. has several case studies showcasing successful implementations of our AI solutions. You can find these on our website under the 'Resources' section.",
    "notifycode blog":
      "NotifyCode Inc. maintains a blog with insights into AI technology, industry trends, and company news. You can find it on our website.",
    "notifycode events":
      "NotifyCode Inc. participates in and hosts various tech events and webinars. Check our website or social media channels for upcoming events.",
    "notifycode demo":
      "To see a demo of NotifyCode Inc.'s AI capabilities, please contact our sales team. They'll be happy to arrange a personalized demonstration.",
    "notifycode pricing":
      "NotifyCode Inc.'s pricing varies depending on the specific services and scale of implementation. For a customized quote, please reach out to our sales team.",
    "notifycode services":
      "NotifyCode Inc. offers a range of AI-powered software solutions, including custom AI development, AI integration into existing systems, and AI consultation services.",
    "notifycode mission":
      "NotifyCode Inc.'s mission is to revolutionize software development by integrating advanced AI capabilities, making technology more intuitive and helpful for users worldwide.",
    "notifycode location":
      "As an AI, I don't have information about NotifyCode Inc.'s physical location. You can check their official website for the most up-to-date contact information.",
    "join notifycode":
      "If you're interested in joining NotifyCode Inc., I recommend checking their official website or LinkedIn page for current job openings and application procedures.",
    "notifycode products":
      "NotifyCode Inc.'s flagship product is NezaAI, which is me. I'm an AI assistant designed to help with various tasks. The company is continuously working on new AI-powered software solutions.",
    "what is notifycode":
      "NotifyCode Inc. is a software solutions company that specializes in integrating AI into various applications. They created me, NezaAI, as part of their mission to innovate in the AI space.",
    "tell me about notifycode":
      "NotifyCode Inc. is at the forefront of AI-driven software solutions. Founded by Neza Hakim, the company focuses on creating intelligent systems like myself to assist and enhance various software applications.",
    "notifycode products":
      "NotifyCode Inc.'s flagship product is NezaAI, an AI assistant designed to help with various tasks. The company is also working on new AI-powered software solutions.",
    "notifycode mission":
      "NotifyCode Inc.'s mission is to revolutionize software development by integrating advanced AI capabilities, making technology more intuitive and helpful for users worldwide.",
  };

  const matchesPatterning = companyPatterns.some((pattern) =>
    pattern.test(text.toLowerCase()),
  );

  if (matchesPatterning) {
    // Return the appropriate response based on the question
    for (const [pattern, response] of Object.entries(responses)) {
      if (new RegExp(pattern, "i").test(text)) {
        return response;
      }
    }
  }

  //Time and Date
  const resp = {
    "date today": () => {
      const currentDate = new Date();
      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedDate = currentDate.toLocaleDateString(undefined, options);
      return `Today's date is ${formattedDate}. At NotifyCode Inc., we ensure our AI systems can handle time-sensitive information accurately to provide you with up-to-date responses.`;
    },
    "time now": () => {
      const currentTime = new Date();
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formattedTime = currentTime.toLocaleTimeString(undefined, options);
      return `The current time is ${formattedTime}. NotifyCode Inc. incorporates precise time management into our AI models to ensure timely and relevant information for users.`;
    },
    "current date": () => {
      const currentDate = new Date();
      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedDate = currentDate.toLocaleDateString(undefined, options);
      return `The current date is ${formattedDate}. NotifyCode Inc. values accuracy in date and time handling as part of our comprehensive AI solutions.`;
    },
    "current time": () => {
      const currentTime = new Date();
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formattedTime = currentTime.toLocaleTimeString(undefined, options);
      return `The current time is ${formattedTime}. At NotifyCode Inc., we integrate precise timekeeping into our AI technology to enhance user experience.`;
    },
    "date and time": () => {
      const currentDate = new Date();
      const dateOptions = { year: "numeric", month: "long", day: "numeric" };
      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formattedDate = currentDate.toLocaleDateString(
        undefined,
        dateOptions,
      );
      const formattedTime = currentDate.toLocaleTimeString(
        undefined,
        timeOptions,
      );
      return `The current date is ${formattedDate} and the time is ${formattedTime}. NotifyCode Inc. ensures our AI provides accurate and timely information to assist you effectively.`;
    },
  };

  const query = text.toLowerCase();
  for (const key in resp) {
    if (query.includes(key)) {
      return resp[key]();
    }
  }

  //Weather
  const weatherPatterns = [
    /what.*weather.*today/,
    /tell.*weather.*now/,
    /weather.*city/,
    /current.*weather/,
    /weather.*now/,
    /weather.*forecast/,
  ];

  // Check if the text matches any of the defined patterns
  const matchesPattern = weatherPatterns.some((pattern) => pattern.test(text));

  if (matchesPattern) {
    return "Want to know the weather in your city? Just use the command `/weather <city name>`.";
  }

  const namePatterns = [
    /what.*you.*name/,
    /your.*name/,
    /who.*you.*called/,
    /who.*are.*you/,
    /what.*your.*name/,
    /name.*you/,
    /who.*is.*you/,
  ];

  // Check if the text matches any of the defined patterns
  const matchesPatternn = namePatterns.some((pattern) => pattern.test(text));

  if (matchesPatternn) {
    return "I'm NezaAI, an assistant made by NotifyCode Inc. I'm here to help you with various tasks and answer your questions.";
  }

  const creationPatterns = [
    /who.*built.*you/,
    /who.*created.*you/,
    /who.*made.*you/,
    /who.*is.*your.*creator/,
    /how.*long.*to.*build.*you/,
    /how.*long.*did.*it.*take.*to.*create.*you/,
    /how.*was.*you.*built/,
    /who.*developed.*you/,
    /who.*is.*behind.*you/,
  ];

  // Detailed responses
  const responsess = {
    creator:
      "I'm NezaAI, an assistant created by the team at NotifyCode Inc. Our team of developers and AI experts designed and built me to assist you with various tasks and provide helpful information.",
    developmentTime:
      "The development of NezaAI took several months of hard work and dedication. Our team focused on creating advanced features and ensuring a smooth user experience.",
    teamInfo:
      "NotifyCode Inc. is a dedicated team of software engineers and AI specialists committed to developing innovative solutions and enhancing user interactions.",
  };

  // Check if the text matches any of the defined patterns
  const matchesPatternx = creationPatterns.some((pattern) =>
    pattern.test(text),
  );

  if (matchesPatternx) {
    // Determine which specific question was asked
    if (
      /who.*built.*you|who.*created.*you|who.*made.*you|who.*is.*your.*creator|who.*developed.*you|who.*is.*behind.*you/.test(
        text,
      )
    ) {
      return responsess.creator;
    }
    if (
      /how.*long.*to.*build.*you|how.*long.*did.*it.*take.*to.*create.*you|how.*was.*you.*built/.test(
        text,
      )
    ) {
      return responsess.developmentTime;
    }
    if (/who.*is.*your.*team|who.*is.*behind.*you/.test(text)) {
      return responsess.teamInfo;
    }
  }
  // Add more custom handlers here, such as weather information, online searches, etc.

  return false;
}
