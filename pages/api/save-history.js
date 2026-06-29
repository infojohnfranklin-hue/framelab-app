import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      userId,
      title,
      prompt,
      reelConcept,
      directorMode,
      styleDNA,
      era,
      reelPurpose,
      videoUrl,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId",
      });
    }

    const { data, error } = await supabase
      .from("generations")
      .insert([
        {
          user_id: userId,
          title: title || "Untitled Cinematic Vision",
          prompt: prompt || "",
          reel_concept: reelConcept || "",
          director_mode: directorMode || "Dream Cinema",
          style_dna: styleDNA || "Neo Tokyo",
          era: era || "Y2K",
          reel_purpose: reelPurpose || "Artist Identity Reel",
          video_url: videoUrl || "",
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("SAVE HISTORY ERROR:", error);

      return res.status(500).json({
        error: "Failed to save generation",
      });
    }

    return res.status(200).json({
      success: true,
      generation: data,
    });
  } catch (error) {
    console.log("SAVE HISTORY SERVER ERROR:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
}