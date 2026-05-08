import { GROQ_API_KEY, GROQ_MODEL } from "../config/config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const AIChatSession = {
  sendMessage: async (prompt) => {
    if (!GROQ_API_KEY) {
      throw new Error("Missing VITE_GROQ_API_KEY in frontend environment.");
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a resume assistant. Always return valid JSON only, with no markdown fences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message =
        payload?.error?.message || "Groq request failed. Please try again.";
      throw new Error(message);
    }

    const content = payload?.choices?.[0]?.message?.content || "{}";
    return {
      response: {
        text: () => content,
      },
    };
  },
};
