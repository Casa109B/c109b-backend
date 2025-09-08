import { Configuration, OpenAIApi } from "openai";

export default async function handler(req, res) {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse the request body
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!configuration.apiKey) {
      return res.status(500).json({ error: "OpenAI API key not set" });
    }

    const openai = new OpenAIApi(configuration);

    // Send the message to ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-mini", // You can change to gpt-4-mini if you want
      messages: [
        { role: "system", content: "You are a helpful assistant for Casa109B website." },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const responseText = completion.choices[0].message.content;

    res.status(200).json({ response: responseText });
  } catch (error) {
    console.error("Chat function error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}

