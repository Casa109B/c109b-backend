// api/chat.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" }, // <-- forces JSON response
      messages: [
        {
          role: "system",
          content: `
You are the witty, friendly AI assistant for Casa109B, a creative studio specializing in website design, brand design, and 2D animation.
Respond with helpful, clever, and short replies — in JSON only.
Detect the user's intent and always return:
{
  "reply": "your friendly reply here",
  "keyword": "projects|about|contact|services|home|hello|fallback"
}
          `,
        },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

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
