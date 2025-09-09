import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // --- CORS ---
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
    if (!message) return res.status(400).json({ error: "Message is required" });

    // --- GPT request ---
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
You are a website assistant for Casa109B, a creative studio focused on website design, brand design and 2D animation. 
- Always reply naturally and wittily, using the brand voice.
- After your reply, determine the page the user wants.
- Only use these keywords for intent: "home", "projects", "about", "services", "contact", "none".
- Respond in JSON format like this:
{ "reply": "...", "keyword": "..." }
          `,
        },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

    const gptResponse = completion.choices?.[0]?.message?.content || "";
    
    // Parse JSON safely
    let parsed: { reply: string; keyword: string } = { reply: gptResponse, keyword: "none" };
    try { parsed = JSON.parse(gptResponse); } catch (err) { /* fallback to raw text */ }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}


