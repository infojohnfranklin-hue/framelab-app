import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";

export default function History() {
  const router = useRouter();
  const { user } = useUser();
  const [generations, setGenerations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    async function loadGenerations() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log(error);
        return;
      }

console.log("HISTORY DATA:", data);
setGenerations(data || []);
    }

    loadGenerations();
  }, [user?.id]);

  async function deleteGeneration(id) {
    if (!id) return;

    const response = await fetch("/api/delete-generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json();

    console.log("DELETE RESULT:", result);

    if (!response.ok) {
      alert(result.error || "Delete failed");
      return;
    }

    setGenerations((current) => current.filter((item) => item.id !== id));
  }

  function reopenGeneration(item) {
    console.log("REOPEN ITEM:", item);

    localStorage.setItem(
      "reopenGeneration",
      JSON.stringify(item)
    );

    if (item.expanded_prompt) {
      router.push("/videos");
      return;
    }

    router.push("/");
  }

  async function downloadImage(item) {
    if (item.expanded_prompt) {
      const blob = new Blob([item.expanded_prompt], {
        type: "text/plain;charset=utf-8",
      });

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${item.director_mode || "cinematic"}-blueprint.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
      return;
    }

    if (!item.video_url) {
      alert("No export file available.");
      return;
    }

    try {
      const response = await fetch(item.video_url);

      if (!response.ok) {
        throw new Error("Preview file could not be loaded.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${item.director_mode || "cinematic"}-preview.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      alert("Export failed. The saved file may no longer be available.");
    }
  }
  
  return (
    <Layout>
      <main style={content}>
        <p style={eyebrow}>GENERATION ARCHIVE</p>

        <h1 style={headline}>Your cinematic memory system.</h1>

        <p style={subtitle}>
          Reopen, export and manage your saved AI cinematic frames.
        </p>

        {generations.length === 0 && (
          <div style={emptyBox}>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "12px",
                color: "#fff",
              }}
            >
              No cinematic memories yet.
            </h3>

            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "16px",
                lineHeight: 1.7,
                maxWidth: "520px",
              }}
            >
              Generate your first AI-directed cinematic frame and save it to
              your archive.
            </p>
          </div>
        )}

        <div style={grid}>
          {generations.map((item) => {
            const isHovered = hoveredId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => reopenGeneration(item)}
                style={{
                  ...card,
                  transform: isHovered
                    ? "translateY(-8px) scale(1.015)"
                    : "translateY(0) scale(1)",
                  boxShadow: isHovered
                    ? "0 0 90px rgba(168,85,247,0.28)"
                    : "0 0 46px rgba(124,58,237,0.14)",
                  border: isHovered
                    ? "1px solid rgba(168,85,247,0.35)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
<div style={textArea}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    }}
  >
    <p style={smallLabel}>
{item.director_mode || "Dream Cinema"}
    </p>

    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "rgba(168,85,247,0.15)",
        border: "1px solid rgba(168,85,247,0.3)",
        color: "#c084fc",
      }}
    >
{item.era || "Blueprint"}
    </div>
  </div>
  
<h2 style={title}>
{item.title || `${item.director_mode} Sequence`}
</h2>

<p
  style={{
    marginTop: "8px",
    color: "#a855f7",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  }}
>
{item.director_mode || "Unknown Director"} · {item.style_dna || item.director_mode || "Cinematic"} · {item.era || "Blueprint"}
</p>

<p style={promptText}>
  {item.reel_concept
    ? `${item.reel_concept.slice(0, 180)}${
        item.reel_concept.length > 180 ? "..." : ""
      }`
    : `${(item.prompt || "").slice(0, 180)}${
        (item.prompt || "").length > 180 ? "..." : ""
      }`}
</p>

</div>

<div style={videoArea}>
  {item.expanded_prompt ? (
    <div
      style={{
        ...video,
        height: "420px",
        padding: "22px",
        borderRadius: "18px",
        border: "1px solid rgba(168,85,247,0.24)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(88,28,135,0.22))",
        boxShadow: "inset 0 0 40px rgba(124,58,237,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            color: "#c4b5fd",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Production Blueprint
        </div>

        <pre
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.78)",
            fontSize: "11px",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          {(item.expanded_prompt || "").split("\n").slice(0, 18).join("\n")}
        </pre>
      </div>

      <div
        style={{
          marginTop: "16px",
          color: "#a78bfa",
          fontSize: "10px",
          fontWeight: "900",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        TXT Export Ready
      </div>
    </div>
  ) : item.video_url ? (
    <img
      src={item.video_url}
      alt=""
      style={{
        ...video,
        borderRadius: "18px",
        border: "1px solid rgba(168,85,247,0.22)",
      }}
    />
  ) : (
    <div
      style={{
        ...video,
        height: "420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "rgba(196,181,253,0.7)",
        padding: "20px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(88,28,135,0.28))",
        border: "1px solid rgba(168,85,247,0.18)",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      No preview available
    </div>
  )}
</div>

<div style={actions}>
  <button
    style={buttonPrimary}
    onClick={(e) => {
      e.stopPropagation();
      reopenGeneration(item);
    }}
  >
    Reopen Project
  </button>

  <button
    style={buttonGhost}
    onClick={(e) => {
      e.stopPropagation();
      downloadImage(item);
    }}
  >
    Export Preview
  </button>

  <button
    style={buttonDanger}
    onClick={(e) => {
      e.stopPropagation();
      setPendingDeleteId(item.id);
    }}
  >
    Remove
  </button>
</div>
              </div>
            );
          })}
        </div>
      {pendingDeleteId && (
        <div
          onClick={() => setPendingDeleteId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(2,6,23,0.72)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              borderRadius: "28px",
              background:
                "linear-gradient(180deg, rgba(18,18,32,0.98), rgba(8,8,16,0.98))",
              border: "1px solid rgba(248,113,113,0.24)",
              boxShadow:
                "0 30px 100px rgba(0,0,0,0.62), 0 0 80px rgba(127,29,29,0.22)",
              color: "white",
            }}
          >
            <div
              style={{
                color: "#fca5a5",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Delete Memory
            </div>

            <h3
              style={{
                fontSize: "30px",
                lineHeight: "1.05",
                fontWeight: "900",
                margin: "0 0 14px",
              }}
            >
              Remove this saved project?
            </h3>

            <p
              style={{
                color: "rgba(255,255,255,0.68)",
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 24px",
              }}
            >
              This will permanently remove the selected FrameLab history item from your archive.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.86)",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const idToDelete = pendingDeleteId;
                  setPendingDeleteId(null);
                  await deleteGeneration(idToDelete);
                }}
                style={{
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(248,113,113,0.38)",
                  background:
                    "linear-gradient(90deg, rgba(127,29,29,0.95), rgba(239,68,68,0.88))",
                  color: "white",
                  fontWeight: "900",
                  cursor: "pointer",
                  boxShadow: "0 14px 44px rgba(239,68,68,0.22)",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </Layout>
  );
}

const content = {
  flex: 1,
  padding: "70px",
  background:
    "radial-gradient(circle at top, rgba(124,58,237,0.28) 0%, #050507 58%)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const eyebrow = {
  color: "#a78bfa",
  letterSpacing: "4px",
  fontWeight: "800",
  marginBottom: "22px",
};

const headline = {
  fontSize: "72px",
  lineHeight: "0.98",
  fontWeight: "900",
  maxWidth: "100%",
  marginBottom: "24px",
  wordBreak: "normal",
};

const subtitle = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "20px",
  lineHeight: "1.6",
  maxWidth: "100%",
  marginBottom: "48px",
};

const emptyBox = {
  padding: "34px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(88,28,135,0.18))",
  border: "1px solid rgba(168,85,247,0.2)",
  color: "rgba(255,255,255,0.7)",
  boxShadow: "0 0 50px rgba(124,58,237,0.12)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 420px))",
  justifyContent: "start",
  gap: "32px",
  width: "100%",
  maxWidth: "100%",
};

const card = {
  minHeight: "560px",
  padding: "28px",
  borderRadius: "30px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.35s ease",
  overflow: "hidden",
  maxWidth: "100%",
  cursor: "pointer",
};

const textArea = {
  height: "300px",
  maxWidth: "100%",
  overflow: "hidden",
};

const smallLabel = {
  color: "#c4b5fd",
  fontWeight: "800",
  marginBottom: "16px",
};

const title = {
  fontSize: "30px",
  lineHeight: "1.05",
  fontWeight: "900",
  maxWidth: "100%",
  wordBreak: "break-word",
};

const promptText = {
  color: "rgba(255,255,255,0.66)",
  lineHeight: "1.65",
  whiteSpace: "pre-wrap",
};

const videoArea = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "auto",
};

const video = {
  width: "240px",
  height: "420px",
  objectFit: "cover",
  borderRadius: "24px",
  background: "#111",
};

const videoPlaceholder = {
  width: "240px",
  height: "420px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.5)",
};

const actions = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginTop: "16px",
  paddingBottom: "8px",
  flexWrap: "nowrap",
};

const buttonPrimary = {
padding: "10px 12px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  color: "white",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const buttonGhost = {
  padding: "10px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const buttonDanger = {
  padding: "10px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(248,113,113,0.25)",
  background: "rgba(248,113,113,0.08)",
  color: "#fecaca",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};
