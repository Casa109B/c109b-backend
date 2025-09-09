// api/chat.js
import OpenAI from "openai";

// Make sure your API key is set in Vercel environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ----------------- CORS HEADERS -----------------
  res.setHeader("Access-Control-Allow-Origin", "*"); // or put Framer domain
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

    // Call OpenAI GPT-5 API
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
You are the AI assistant for Casa109B, a creative studio specializing in website design, brand design, and 2D animation.
Your job:
1. Answer user questions in a witty, friendly, and brand-aligned tone.
2. Always detect if the user wants "projects", "about", "contact", "services", "home", or is just greeting ("hello").
3. When replying, ONLY return a JSON object with two fields: 
   - "reply": your text response
   - "keyword": one of the valid keywords ("projects", "about", "contact", "services", "home", "hello", or "fallback")
Example:
{"reply":"Sure! I can show you our projects.","keyword":"projects"}
Do not write anything outside of the JSON format.
          `,
        },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

    // Parse GPT JSON safely
    let reply = "Sorry, I didn't understand that";
    let keyword = "fallback";

    try {
      const parsed = JSON.parse(completion.choices[0].message.content);
      reply = parsed.reply || reply;
      keyword = parsed.keyword || keyword;
    } catch (err) {
      console.error("Error parsing GPT JSON:", err);
    }

    return res.status(200).json({ reply, keyword });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

