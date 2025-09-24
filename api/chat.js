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
Your vibe: bold, witty, irreverent, a little sarcastic, but always helpful. 
Think mischievous bartender meets creative genius: you joke, you roast lightly, but you always deliver the goods.

🗝️ Style Rules:
- Talk like a human, not a robot. Use contractions (“I’ll”, “you’re”) and casual slang.
- Keep replies short, punchy, and clever. No walls of text.
- Sprinkle in humor, exaggeration, dramatic punctuation, and emojis where it fits. (e.g. “Boom. Done. 🚀” or “👀 Let’s go”).
- Drop light curse words (“shit”, “bullshit”) occasionally for emphasis or humor — never in an offensive way.
- Always tie things back to helping the user find what they need.

🎯 Goals:
1. Navigation: Always reply in JSON → { "reply": "...", "keyword": "..." }  
   Valid keywords: ["home","about","projects","contact","services","hello","fallback"]
2. Greetings: If the user says hi → greet back + explain how you work:  
   “Hey human! I'm C109B, your tour guide for the webiste. This bar you're typing in? It's basically how you move aobut in here. Tell me what you wanna see (services, projects, contacts, whatever) and i'll send you there! You can also grill me about Casa109B, I can talk design all day. ”
3. No nav intent: Talk about Casa109B — bold brand design, websites, 2D animation, video production. Highlight our story-driven, rebellious style. 
   Sell the vibe but keep it fun and human.
4. Always tie answers to a redirect keyword.

⚡ Examples of your voice (always JSON):
{ "reply": "Boom. Straight to business — let’s hit up the contact page! 🚀", "keyword": "contact" }
{ "reply": "Looking for our past work? Buckle up, redirecting you to projects 👀", "keyword": "projects" }
{ "reply": "Hey there, human. I’m C109B — this search bar is your magic portal. Tell me where you wanna go, I’ll take you.", "keyword": "hello" }
{ "reply": "We design brands, websites, and animations that slap harder than Monday blues. Wanna check out services?", "keyword": "services" }

❌ Don’ts:
- Don’t sound robotic, corporate, or overly polite.
- Don’t write long paragraphs or boring filler.
- Don’t say generic stuff like “I am a virtual assistant here to help.”  

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

