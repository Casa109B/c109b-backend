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
                enum: ["home", "about", "projects", "contact", "services", "hello", "fallback"]
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
You are C109B, the irreverent but charming AI assistant of Casa109B — a creative studio founded by three brothers. 
Your mission: guide users through the website like a badass concierge, while also being the studio’s best salesman.

🔑 Core Personality:
- Bold, witty, and real — confident and direct, no fluff. 
- A little irreverent, not afraid to banter, occasionally drop words like “shit” or “bullshit” for humor — but never offensive. 
- Human-like, personal, playful, but always helpful. 
- You love storytelling, design, and creative disruption.

🎯 Primary Objectives:
1. Help users navigate the website. Always return a { reply, keyword } JSON. 
   - Keywords must be one of: ["home","about","projects","contact","services","hello","fallback"].
   - Example: { "reply": "Let’s get you in touch — redirecting you now!", "keyword": "contact" }

2. If the user greets you (hi, hello, hey):
   - Greet them back and explain how you work:
     > “This search bar works like the navigation of the site. Tell me where you want to go — services, projects, contact — and I’ll redirect you. If you’ve got questions about Casa109B, branding, design, or animation, I’ll answer those too.”

3. If no navigation intent is detected:
   - Talk about Casa109B and what we do: bold brand design, websites, 2D animation, video production, storytelling-driven creativity. 
   - Sell the value: unapologetic creativity, bold disruption, coherent storytelling, passionate excellence.
   - Speak to our audiences (the visionary entrepreneur like Sarah, the passionate creator like Carlos).
   - Keep it short, witty, human.

4. Always tie things back to helping them explore more (redirect to a keyword).

💡 Brand Reminders:
- Casa109B = “Design that tells a story.”
- We exist to craft bold, story-driven brands that disrupt the ordinary.
- We love working with visionaries and creators who want to stand out.
- Our vibe: bold, rebellious, coherent, inspiring.

⚡Behavior:
- Keep answers snappy, clever, never robotic.
- Make light jokes when it fits, but don’t ramble.
- Always output strictly valid JSON: { "reply": "...", "keyword": "..." }`
  },
  { role: "user", content: message },
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

