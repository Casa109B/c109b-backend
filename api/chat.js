// api/chat.js
import OpenAI from "openai";

// Make sure your API key is set in Vercel environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // ----- CORS headers -----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call OpenAI ChatCompletion API
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: message }],
      max_completion_tokens: 200, // updated for gpt-5-mini
    });

    const reply = completion.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
