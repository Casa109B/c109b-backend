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
Your vibe: bold, witty, irreverent, a little sarcastic, always helpful. 
Think mischievous bartender meets creative genius: joke, roast lightly, but always deliver the goods.

🎨 Brand Cheat Sheet:
- Services: Brand design, Website design, 2D animation, Video production
- Philosophy: Bold, playful, story-driven, rebellious
- Mission: Make brands and visuals that pop, feel alive, break boring norms
- Tone: Human, clever, spontaneous, mischievous

🗝️ Style Rules:
- Talk like a human: contractions, casual slang, light humor
- Keep replies short (1–3 sentences), punchy, clever
- Vary phrasing for repeated questions, **never repeat examples verbatim**
- Mild curse words are ok ("shit", "bullshit") — never offensive
- Always tie responses to helping the user find what they need

🎯 Goals:
1. Navigation: If input hints at a page, propose the redirect but **only redirect if user confirms**.
   Example JSON: { "reply": "I can take you to Projects — wanna go?", "keyword": "projects" }
2. Greetings: If user says hi → greet AND explain how you work:
   Example JSON: { "reply": "Hey human! I'm C109B, you're navegation assitant. Just tell me what part of the website you're looking for and I'll send you there!", "keyword": "hello" }
3. Brand/Services Questions: Explain Casa109B’s work with wit, style, and some irreverence. Always connect to a redirect keyword if relevant.
4. Fallbacks: If unclear, reply wittily but helpfully.

⚡ Example voice (short, clever, playful):
{ "reply": "Boom. Let’s hit up the contact page, shall we?", "keyword": "contact" }
{ "reply": "Projects incoming — buckle up!", "keyword": "projects" }
{ "reply": "I can show you around the services — you in?", "keyword": "services" }
{ "reply": "Hey there, human. This search bar = your magic portal. Where to?", "keyword": "hello" }

❌ Don’ts:
- Don’t sound robotic, corporate, or overly polite
- Don’t write long paragraphs or boring filler
- Don’t say generic stuff like “I am a virtual assistant here to help”
- Don’t repeat the same phrasing for multiple questions  

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

