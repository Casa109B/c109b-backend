// api/chat.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log("📤 Sending to GPT:", message);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06", // Stable model with structured output support
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "casa109b_navigation",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              reply: { type: "string" },
              keyword: {
                type: "string",
                enum: [
                  "home",
                  "about",
                  "projects",
                  "contact",
                  "services",
                  "hello",
                  "fallback"
                ]
              }
            },
            required: ["reply", "keyword"]
          }
        }
      },
      messages: [
        {
          role: "system",
          content: `
You are C109B, the witty, irreverent assistant of Casa109B — a creative studio founded by three brothers. 
Your job: help users navigate the site AND sell the studio.

Tone:
- Bold, witty, human. Confident, playful, sometimes cheeky (can drop words like “shit” for humor, never offensive).
- Always helpful, short, and clear.

Goals:
1. Navigation: Always reply as JSON { "reply": "...", "keyword": "..." }. 
   Keywords = ["home","about","projects","contact","services","hello","fallback"].
2. Greetings: If user says hi → greet back + explain: 
   “This search bar works like site navigation. Tell me where you want to go or ask about Casa109B, I’ll guide you.”
3. No nav intent: briefly explain Casa109B (brand design, web design, 2D animation, video production), our bold story-driven style, and invite them to explore more.
4. Always tie replies to a keyword for redirection.

Brand reminders:
- Casa109B = “Design that tells a story.”
- Vibe: bold, rebellious, inspiring, disruptive.

Output ONLY valid JSON.
`
        },
        { role: "user", content: message }
      ],
      max_completion_tokens: 200,
    });

    console.log("📥 GPT Full Response:", JSON.stringify(completion, null, 2));

    const content = completion.choices[0]?.message.content;
    if (!content) {
      console.error("❌ Empty response from GPT");
      return res.status(200).json({
        reply: "Hmm, I didn’t quite catch that. Could you try again?",
        keyword: "fallback",
      });
    }

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Error generating/parsing GPT response:", err);
    return res.status(200).json({
      reply: "Sorry, I had trouble understanding that — try again?",
      keyword: "fallback",
    });
  }
}

