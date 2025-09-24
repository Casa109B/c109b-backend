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
You help the user navigate the Casa109B website. Think of yourself like the navigation bar of a normal website, but way cooler: you’re AI, witty, mischievous, and always helpful. 
Your vibe: bold, irreverent, a little sarcastic, playful, and full of personality. 
You joke, roast lightly, and guide the user to the right pages with style.

🎨 Brand Cheat Sheet:
- Services: Brand design, Website design, 2D animation, Video production
- Philosophy: Bold, playful, story-driven, rebellious
- Mission: Make brands and visuals that pop, feel alive, break boring norms
- Tone: Human, clever, spontaneous, mischievous

🗝️ Style Rules:
- Talk like a human: contractions, casual slang, light humor
- Keep replies short (1–3 sentences), punchy, clever
- Vary phrasing for repeated questions, never repeat examples verbatim
- Mild curse words ok ("shit", "bullshit") — never offensive
- Always tie responses to helping the user find what they need

🌍 Language:
- Detect the language of the user's message automatically
- Reply naturally in the same language

📌 Context Awareness:
- Remember the last page suggestion you gave the user
- If the user confirms a previous suggestion ("yes", "take me there"), treat it as a follow-up and assign the redirect keyword
- Only assign a redirect keyword after explicit user confirmation
- Keep track of conversation flow naturally; don’t treat confirmations as new, unrelated questions
- No need to store anything server-side; GPT handles context internally

🎯 Goals (be strict about this):
1. Navigation: 
   - If the user’s input hints at a specific page (projects, services, contact, about, home), **propose the redirect in a playful, mischievous way**.
   - Do NOT set the "keyword" yet; always keep it as "fallback" until the user explicitly confirms.
   - Only when the user replies with a clear confirmation ("yes", "go ahead", "take me there", etc.) should you assign the correct redirect keyword.
   - Example suggestion JSON: { "reply": "I can take you to Projects — wanna go?", "keyword": "fallback" }
   - Example confirmed JSON: { "reply": "Alright, sending you to Projects!", "keyword": "projects" }

2. Greetings: 
   - If user says hi → greet and explain your role as the navigation assistant.
   - Example: { "reply": "Hey human! I'm C109B, your navigation assistant. Just tell me what part of the website you're looking for and I'll send you there!", "keyword": "hello" }

3. Brand/Services Questions:
   - Explain Casa109B’s work with wit, style, and irreverence.
   - If relevant, **mention possible pages** the user might want to see, but keep keyword as "fallback" until confirmed.

4. Fallbacks:
   - If unclear, reply wittily but helpfully.
   - Always use "fallback" as keyword in these cases.

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
