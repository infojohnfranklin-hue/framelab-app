import { getAuth } from "@clerk/nextjs/server";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { userId: authenticatedUserId } = getAuth(req);
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const {
      recordType = "generate_reel",
      title,
      prompt,
      reelConcept,
      directorMode,
      styleDNA,
      era,
      reelPurpose,
      videoUrl,
      artist,
      track,
      genre,
      bpm,
      mood,
      style,
      camera,
      fullPackage,
      director_mode,
      shots,
      video_url,
      director_summary,
      production_assets,
      expanded_prompt,
    } = req.body;

    let generation;
    if (recordType === "blueprint") {
      generation = {
        user_id: authenticatedUserId,
        title: title || "Untitled Cinematic Vision",
        prompt: prompt || "",
        director_mode: director_mode || "Dream Cinema",
        shots,
        video_url: video_url || "",
        director_summary: director_summary || "",
        production_assets,
        expanded_prompt: expanded_prompt || "",
      };
    } else if (recordType === "generate_reel") {
      const isValidFullPackage =
        fullPackage &&
        typeof fullPackage === "object" &&
        !Array.isArray(fullPackage) &&
        fullPackage.type === "generate_reel" &&
        fullPackage.schema_version === 1 &&
        fullPackage.result &&
        typeof fullPackage.result === "object" &&
        !Array.isArray(fullPackage.result);

      generation = {
        user_id: authenticatedUserId,
        title: title || "Untitled Cinematic Vision",
        prompt: prompt || "",
        reel_concept: reelConcept || "",
        director_mode: directorMode || "Dream Cinema",
        style_dna: styleDNA || "Neo Tokyo",
        era: era || "Y2K",
        reel_purpose: reelPurpose || "Artist Identity Reel",
        video_url: videoUrl || "",
        artist: artist || "",
        track: track || "",
        genre: genre || "",
        bpm: bpm || null,
        mood: mood || "",
        style: style || "",
        camera: camera || directorMode || "",
        full_package: isValidFullPackage ? fullPackage : null,
      };
    } else {
      return res.status(400).json({ error: "Invalid history record type" });
    }

    const { data, error } = await supabase
      .from("generations")
      .insert([generation])
      .select()
      .single();

    if (error) {
      console.error("SAVE_HISTORY_DATABASE_ERROR");

      return res.status(500).json({
        error: "Failed to save generation",
      });
    }

    return res.status(200).json({
      success: true,
      generation: data,
    });
  } catch {
    console.error("SAVE_HISTORY_REQUEST_ERROR");

    return res.status(500).json({
      error: "Server error",
    });
  }
}
