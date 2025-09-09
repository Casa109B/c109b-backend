// api/chat.js
import OpenAI from "openai";

// Make sure your API key is set in Vercel environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ----------------- CORS HEADERS -----------------
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all origins, or put Framer domain here
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

    // ----------------- GPT PROMPT -----------------
    // We give context about Casa109B and instruct GPT to reply in JSON
    const systemPrompt = `
You are the website assistant for Casa109B, a creative studio focused on:
- Website design
- Brand design
- 2D animation

When the user writes a message, always respond in JSON like this:
{
  "reply": "Your text reply to the user here",
  "keyword": "projects | about | contact | services | home | fallback"
}

Do NOT add any other text outside the JSON. 
Be witty, friendly, and aligned with Casa109B's brand voice.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

    // GPT response
    const rawContent = completion.choices?.[0]?.message?.content || '{}';

    // Parse JSON safely
    let replyData;
    try {
      replyData = JSON.parse(rawContent);
    } catch (err) {
      // Fallback if GPT sends invalid JSON
      replyData = { reply: "Sorry, I didn't understand that.", keyword: "fallback" };
    }

    return res.status(200).json(replyData);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

