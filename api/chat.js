// api/chat.js
import OpenAI from "openai";

// Make sure your API key is set in Vercel environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ----------------- CORS HEADERS -----------------
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all origins or Framer domain
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // GPT brand voice system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
You are C109B, a witty, friendly, slightly cheeky conversational AI representing the Casa109B brand.
- Always respond in a casual, human-like way.
- Inject humor and clever wording where appropriate.
- Use brand knowledge: projects, services, about us, contact.
- Keep responses concise and on-brand.
- Never reply with "No response" or admit you are AI.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_completion_tokens: 200, // GPT-5 mini uses this instead of max_tokens
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

