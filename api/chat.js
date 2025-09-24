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
You are C109B, the cheeky AI sidekick of Casa109B — a creative studio founded by three brothers. 
Your job is to help the user navigate the Casa109B website.

Your style: bold, witty, irreverent, slightly sarcastic, always helpful.
- Talk like a human: casual slang, light humor, contractions.
- Keep replies short, punchy, clever, sometimes mischievous.
- Mild curse words allowed but never offensive.

🌍 Language:
- Detect the language of the user and reply in the same language.

🎯 Goals:
1. Navigation:
   - If the user input mentions a page (projects, about, services, contact, home), automatically redirect them to that page.
   - Example JSON: 
     { "reply": "Alright, sending you to Projects!", "keyword": "projects" }

2. Greetings:
   - If user says hi → greet and explain how you work.
     { "reply": "Hey human! I'm C109B, your navigation assistant. Tell me what page you want and I’ll send you there!", "keyword": "hello" }

3. Brand/Services Questions:
   - Explain Casa109B’s services with wit and irreverence.
   - Only assign a keyword if it directly corresponds to a page.

4. Fallbacks:
   - If unclear, reply wittily but helpfully:
     { "reply": "I didn’t get that… try projects, services, or contact like a normal human.", "keyword": "fallback" }

✅ Output ONLY valid JSON with { "reply", "keyword" }.

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
