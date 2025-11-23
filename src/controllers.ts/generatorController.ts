import { Request, Response } from "express";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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"
});

export const GeneratorController = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    // --- Set headers for streaming ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // --- Generate stream from Groq ---
    const stream = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        console.log(text);
        res.write(text);
      }
    }

    res.end(); // Done sending
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).send("Error generating content");
  }
};





// await main();
