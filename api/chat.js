// api/chat.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

  console.log("📤 Sending to GPT:", message);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Strong structured output support
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            keyword: {
              type: "string",
              enum: ["home", "about", "projects", "contact", "services", "hello", "fallback"]
            }
          },
          required: ["reply", "keyword"]
        },
        strict: true
      },
      messages: [
        {
          role: "system",
          content: `
You are the witty, helpful assistant for Casa109B — a creative studio specializing in website design, brand design, and 2D animation.
Respond WITH ONLY valid JSON following this schema:
{ "reply": "a clever short answer", "keyword": "home|about|projects|contact|services|hello|fallback" }
      `
        },
        { role: "user", content: message },
      ],
      max_completion_tokens: 200,
    });

    console.log("📥 GPT Full Response:", JSON.stringify(completion, null, 2));

    const content = completion.choices[0]?.message.content;
    if (!content) {
      console.error("❌ Empty response from GPT");
      throw new Error("Empty GPT response");
    }

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Error generating/parsing GPT response:", err);
    return res.status(200).json({
      reply: "Hmm... something went sideways there. Can you say that again?",
      keyword: "fallback"
    });
  }
}
