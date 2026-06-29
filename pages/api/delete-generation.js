import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("DELETE API BODY:", req.body);
    console.log(
      "SUPABASE URL EXISTS:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log(
      "SERVICE KEY EXISTS:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Missing generation id",
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("generations")
      .delete()
      .eq("id", Number(id))
      .select();

    if (error) {
      console.log("DELETE API ERROR:", error);

      return res.status(500).json({
        error: error.message,
      });
    }

    console.log("DELETE SUCCESS:", data);

    return res.status(200).json({
      success: true,
      deleted: data,
    });
  } catch (error) {
    console.log("DELETE API CRASH:", error);

    return res.status(500).json({
      error: error.message || "Delete failed",
    });
  }
}