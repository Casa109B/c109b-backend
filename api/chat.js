import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // --- CORS HEADERS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔑 Call GPT with forced JSON response format
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" }, // << FORCES VALID JSON
      messages: [
        {
          role: "system",
          content: `
You are Casa109B's chatbot, a helpful, witty navigation and sales assistant.
You must always respond in this exact JSON format — no other text, no markdown:

{
  "reply": "a short, witty response to the user",
  "keyword": "one of [home, about, projects, contact, fallback]"
}

Use "keyword" to indicate which page they should be redirected to.
If unsure, use "fallback".
Casa109B is a creative studio focused on website design, brand design, and 2D animation.
`,
        },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

    const rawResponse = completion.choices?.[0]?.message?.content || "";
    console.log("🔎 RAW GPT RESPONSE:", rawResponse);

    let parsed;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (err) {
      console.error("❌ JSON parse failed:", err);
      return res.status(200).json({
        reply: "Sorry, I didn't understand that",
        keyword: "fallback",
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}

