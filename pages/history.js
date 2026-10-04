import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";

export default function History({ ui, t }) {
  const _t = typeof t === "function" ? t : (value) => value;
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
      alert(result.error || ui.history.deleteFailed);
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
      alert(ui.history.noExportFile);
      return;
    }

    try {
      const response = await fetch(item.video_url);

      if (!response.ok) {
        throw new Error(ui.history.previewLoadFailed);
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
      alert(ui.history.exportFailed);
    }
  }
  
  return (
    <Layout>
      <main style={content}>
        <p style={eyebrow}>{ui.history.archiveEyebrow}</p>

        <h1 style={headline}>{ui.history.memoryHeadline}</h1>

        <p style={subtitle}>
          {ui.history.memoryIntro}
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
            >{ui.history.noMemories}</h3>

            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "16px",
                lineHeight: 1.7,
                maxWidth: "520px",
              }}
            >
              {ui.history.firstFrameHint}
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
                    ? "0 24px 70px rgba(0,0,0,0.34)"
                    : "0 18px 46px rgba(0,0,0,0.22)",
                  border: isHovered
                    ? "1px solid rgba(216,181,106,0.18)"
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
{item.director_mode || ui.history.dreamCinemaFallback}
    </p>

    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(216,181,106,0.16)",
        color: "#E7CC91",
      }}
    >
{item.era || ui.history.blueprintFallback}
    </div>
  </div>
  
<h2 style={title}>
{item.title || `${item.director_mode} ${ui.history.sequenceFallback}`}
</h2>

<p
  style={{
    marginTop: "8px",
    color: "#E7CC91",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  }}
>
{item.director_mode || ui.history.unknownDirectorFallback} · {item.style_dna || item.director_mode || ui.history.cinematicFallback} · {item.era || ui.history.blueprintFallback}
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
        border: "1px solid rgba(246,243,235,0.08)",
        background:
          "linear-gradient(135deg, rgba(20,21,23,0.96), rgba(10,11,13,0.98))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            color: "#E7CC91",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          {ui.history.productionBlueprint}
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
      >{ui.history.txtExportReady}</div>
    </div>
  ) : item.video_url ? (
    <img
      src={item.video_url}
      alt=""
      style={{
        ...video,
        borderRadius: "18px",
        border: "1px solid rgba(246,243,235,0.08)",
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
        color: "rgba(226,196,128,0.72)",
        padding: "20px",
        background:
          "radial-gradient(circle at 50% 38%, rgba(216,181,106,0.10) 0%, rgba(216,181,106,0.025) 32%, transparent 58%), linear-gradient(145deg, rgba(20,19,17,0.99) 0%, rgba(10,11,13,0.99) 62%, rgba(7,8,10,1) 100%)",
        border: "1px solid rgba(216,181,106,0.16)",
        boxShadow:
          "inset 0 0 0 1px rgba(246,243,235,0.025), inset 0 0 48px rgba(0,0,0,0.42)",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >{ui.history.noPreview}</div>
  )}
</div>

<div style={actions}>
  <button
    style={buttonPrimary}
    onClick={(e) => {
      e.stopPropagation();
      reopenGeneration(item);
    }}
  >{ui.history.reopenProject}</button>

  <button
    style={buttonGhost}
    onClick={(e) => {
      e.stopPropagation();
      downloadImage(item);
    }}
  >{ui.history.exportPreview}</button>

  <button
    style={buttonDanger}
    onClick={(e) => {
      e.stopPropagation();
      setPendingDeleteId(item.id);
    }}
  >{ui.history.remove}</button>
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
              maxWidth: "480px",
              padding: "34px",
              borderRadius: "24px",
              background:
                "linear-gradient(145deg, rgba(22,21,18,0.985) 0%, rgba(13,13,13,0.99) 58%, rgba(8,9,10,0.995) 100%)",
              border: "1px solid rgba(216,181,106,0.18)",
              boxShadow:
                "0 32px 90px rgba(0,0,0,0.68), inset 0 1px 0 rgba(246,243,235,0.035)",
              color: "rgba(246,243,235,0.96)",
            }}
          >
            <div
              style={{
                color: "rgba(216,181,106,0.78)",
                fontSize: "10px",
                fontWeight: "800",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >{ui.history.deleteMemory}</div>

            <h3
              style={{
                fontSize: "30px",
                lineHeight: "1.08",
                fontWeight: "900",
                margin: "0 0 16px",
              }}
            >{ui.history.removeSavedProject}</h3>

            <p
              style={{
                color: "rgba(246,243,235,0.62)",
                fontSize: "15px",
                lineHeight: "1.75",
                margin: "0 0 30px",
              }}
            >
              {ui.history.deleteArchiveWarning}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                style={{
                  padding: "11px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(246,243,235,0.12)",
                  background: "rgba(246,243,235,0.045)",
                  color: "rgba(246,243,235,0.76)",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                {ui.history.cancel}
              </button>

              <button
                type="button"
                onClick={async () => {
                  const idToDelete = pendingDeleteId;
                  setPendingDeleteId(null);
                  await deleteGeneration(idToDelete);
                }}
                style={{
                  padding: "11px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(248,113,113,0.34)",
                  background:
                    "linear-gradient(180deg, rgba(153,27,27,0.92), rgba(111,20,20,0.96))",
                  color: "rgba(255,245,245,0.96)",
                  fontWeight: "900",
                  cursor: "pointer",
                  boxShadow: "0 10px 28px rgba(127,29,29,0.18)",
                }}
              >{ui.history.deletePermanently}</button>
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
    "linear-gradient(90deg, rgba(7,7,8,0.94) 0%, rgba(7,7,8,0.80) 40%, rgba(7,7,8,0.54) 72%, rgba(7,7,8,0.46) 100%), linear-gradient(180deg, rgba(9,8,6,0.18) 0%, rgba(9,8,6,0.36) 58%, rgba(9,8,6,0.78) 100%), url('/framelab-premium-History-assets/ChatGPT Image 24. Sept. 2026, 14_37_35.png') center top / cover no-repeat, #090A0C",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const eyebrow = {
  color: "#E7CC91",
  fontSize: "13px",
  letterSpacing: "0.28em",
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
  fontSize: "19px",
  lineHeight: "1.6",
  maxWidth: "100%",
  marginBottom: "48px",
};

const emptyBox = {
  padding: "34px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(20,21,23,0.94), rgba(10,11,13,0.98))",
  border: "1px solid rgba(246,243,235,0.08)",
  color: "rgba(255,255,255,0.7)",
  boxShadow: "0 20px 54px rgba(0,0,0,0.24)",
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
  minHeight: "300px",
  maxWidth: "100%",
  overflow: "hidden",
};

const smallLabel = {
  color: "#E7CC91",
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
  background: "linear-gradient(90deg, #B88A3B, #E7CC91)",
  color: "#17130C",
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
