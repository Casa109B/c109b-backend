// api/chat.js
// Vercel Serverless Function (Node.js) — no framework required

// CORS helper so you can call this from your Framer site
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Parse incoming body safely whether it's string or JSON
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.toString?.().trim();
    if (!message) {
      res.status(400).json({ error: "Missing 'message' in body" });
      return;
    }

    // Build the ChatGPT request — ask for JSON back (reply + intent)
    const payload = {
      model: "gpt-4o-mini", // inexpensive + good; you can change later
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are C109B, a witty but helpful assistant for Casa109B's website.

Return a JSON object with exactly these keys:
- "reply": a short 1–3 sentence response in a playful, human tone (no emojis).
- "intent": one of "projects" | "about" | "contact" | "services" | "home" | "none".

Rules:
- If the user clearly wants navigation (projects/about/services/contact/home), set "intent" accordingly and keep "reply" brief, like a confirmation.
- If the user asks sales questions (e.g., why work with you, what makes you different), write a short persuasive reply, then set "intent" to "contact" or "about" (pick the best).
- If unclear, give a fun helpful line and set "intent" to "none".
- Never return anything except a strict JSON object with "reply" and "intent".
Brand:
- Minimal, confident, story-driven, pragmatic. No emojis.
          `.trim()
        },
        { role: "user", content: message }
      ],
      max_tokens: 220
    };

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      res.status(500).json({ error: "OpenAI error", detail: errText });
      return;
    }

    const data = await apiRes.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed = { reply: "Sorry, I didn't get that.", intent: "none" };
    try {
      parsed = JSON.parse(content);
    } catch {
      // If model didn't return JSON (rare with response_format), fall back
      parsed = { reply: content, intent: "none" };
    }

    // Sanitize intent just in case
    const allowed = new Set(["projects", "about", "contact", "services", "home", "none"]);
    if (!allowed.has(parsed.intent)) parsed.intent = "none";

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
