import OpenAI from "openai";
import { getFreeUses, increaseFreeUses } from "../lib/credits";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }
const identifier =
  req.headers["x-forwarded-for"] ||
  req.socket.remoteAddress ||
  "guest";

const freeUses = await getFreeUses(identifier);

if (freeUses >= 2) {
  return res.status(403).json({
    message: "Free limit reached — Upgrade to Pro",
  });
}
  try {
    const { artistName, trackName, bpm, genre, mood, visualStyle } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are FrameLab, an elite creative director for viral TikTok and Instagram music reels. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `
Create a premium cinematic reel package for a musician.

Return ONLY valid JSON with these exact keys:
{
  "reelConcept": "",
  "aiVideoPrompt": "",
  "caption": "",
  "hook": "",
  "hashtags": "",
  "viralScore": ""
}

Artist: ${artistName}
Track: ${trackName}
Genre: ${genre}
Mood: ${mood}
BPM: ${bpm}
Visual Style: ${visualStyle}
`,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({ error: "No AI response received" });
    }

    const data = JSON.parse(text);
await increaseFreeUses(identifier);
    return res.status(200).json(data);
  } catch (error) {
    console.error("FrameLab API Error:", error);

    return res.status(500).json({
      error: "AI generation failed",
      details: error.message,
    });
  }
}