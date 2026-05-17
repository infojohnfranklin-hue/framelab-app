import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

export default function Home() {
  const [artist, setArtist] = useState("Velvet Mirage");
  const [track, setTrack] = useState("After Midnight");
  const [loading, setLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [genre, setGenre] = useState("Melodic House");
  const [bpm, setBpm] = useState("122");
  const [mood, setMood] = useState("luxury sunset");
  const [style, setStyle] = useState("Miami Afterdark");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
const [credits, setCredits] = useState(2);
const [isPro, setIsPro] = useState(false);
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);

  const saved = localStorage.getItem("credits");

const savedPro = localStorage.getItem("isPro");

if (savedPro === "true") {
  setIsPro(true);
  setCredits(999);
  localStorage.setItem("credits", "999");
} else {
  if (!saved || saved === "0") {
    setCredits(2);
    localStorage.setItem("credits", "2");
  } else {
    setCredits(Number(saved));
  }
}
}, []);
useEffect(() => {
  if (credits !== null) {
    localStorage.setItem("credits", String(credits));
  }
}, [credits]);
  const resultRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("framelab_history");

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        localStorage.removeItem("framelab_history");
        setHistory([]);
      }
    }
  }, []);
async function generateReel() {
  setLoading(true);
  setResult(null);
if (isPro) {
  // Pro users can always generate
} else if (credits <= 0) {
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    console.log("Stripe checkout error:", data);
    alert("Stripe checkout failed. Check Vercel environment variables.");
  } catch (error) {
    console.error("Stripe error:", error);
    alert("Stripe checkout failed.");
  }

  setLoading(false);
  return;
}
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artistName: artist,
        trackName: track,
        bpm,
        genre,
        mood,
        visualStyle: style,
      }),
    });

    const data = await response.json();

    const newResult = {
      concept: data.reelConcept,
      prompt: data.aiVideoPrompt,
      caption: data.caption,
      hook: data.hook,
      hashtags: data.hashtags,
      viralScore: data.viralScore,
    };

    setResult(newResult);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

if (!isPro) {
  const next = Math.max(credits - 1, 0);
  setCredits(next);
  localStorage.setItem("credits", String(next));
}    setHistory((prev) => [
      {
        artist,
        track,
        genre,
        bpm,
        mood,
        style,
        date: new Date().toLocaleString(),
        result: newResult,
      },
      ...prev,
    ].slice(0, 10));

  } catch (error) {
    console.error(error);
    alert("AI generation failed");
  }

  setLoading(false);
}
return (
  <main style={mainStyle}>
    <style>{spinnerStyle}</style>
    <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
  <p style={eyebrow}>CINEMATIC AI REEL GENERATOR</p>

<h1 style={title}>
  Create viral cinematic reels for your music.
</h1>

<p style={subtitle}>
  Built for modern musicians, DJs and artists who want stunning AI-powered
  social content in seconds.
</p>

      <div style={{ ...grid, alignItems: "end" }}>
        <div>
          <p style={label}>Artist Name</p>
          <input
            style={input}
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist Name"
          />
        </div>

        <div>
          <p style={label}>Track Name</p>
          <input
            style={input}
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Track Name"
          />
        </div>

        <div>
          <p style={label}>BPM</p>
          <input
            style={input}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="BPM"
          />
        </div>

        <div>
          <p style={label}>Genre</p>
          <select
            style={input}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
<option>Retro Deep House</option>
<option>Melodic House</option>
<option>Afro House</option>
<option>Tech House</option>
<option>Deep House</option>
<option>Minimal House</option>
<option>Progressive House</option>
<option>Organic House</option>
<option>Lo-Fi House</option>
<option>Future Garage</option>
<option>Indie Dance</option>
<option>Electronica</option>
          </select>
        </div>

        <div>
          <p style={label}>Mood</p>
          <select
            style={input}
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
<option>seductive</option>
<option>nostalgic</option>
<option>dreamy</option>
<option>dark</option>
<option>euphoric</option>
<option>underground</option>
<option>midnight energy</option>
<option>luxury sunset</option>
<option>afterhours</option>
<option>cinematic tension</option>
<option>dreamstate</option>
<option>festival rush</option>
<option>underground desire</option>
<option>ocean drive</option>
<option>neon romance</option>
          </select>
        </div>

        <div>
          <p style={label}>Style</p>
          <select
            style={input}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
<option>Golden Hour VHS</option>
<option>Night Drive</option>
<option>Cassette Aesthetic</option>
<option>Cinematic Club</option>
<option>Urban Sunset</option>
<option>Tokyo Neon</option>
<option>Luxury Rooftop</option>
<option>European Summer</option>
<option>Y2K Flash Cam</option>
<option>Analog Dreams</option>
<option>Underground Berlin</option>
<option>Chrome Future</option>
<option>Desert Mirage</option>
<option>Miami Afterdark</option>
<option>Warehouse Shadows</option>
          </select>
        </div>
      </div>

      <button
  style={{
    ...button,
    opacity: loading ? 0.7 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  }}
  disabled={loading}
onClick={generateReel}>
{mounted && (
  loading ? (
    "Generating..."
  ) : credits === null ? (
    "Loading..."
  ) : (
credits > 0
? "Generate Reel"
  : "Subscribe to Generate Reel • 19.90 CHF / month"  )
)}
</button>
{isPro && (
  <a
    href="https://billing.stripe.com/p/login/dRmfZg7omfFtcqD9xjgjC00"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-block",
      marginTop: "12px",
      color: "#fff",
      textDecoration: "underline",
      fontSize: "14px",
    }}
  >
    Manage Subscription
  </a>
)}      {result && (
<div ref={resultRef} style={outputBox}>
          <h2 style={{ fontSize: "54px" }}>
            {artist} — {track}
          </h2>

          <p style={{ color: "#c7c7c7" }}>
            {genre} • {bpm} BPM • {style}
          </p>

<button
  style={copyButton}
  onClick={() => {
    navigator.clipboard.writeText(`
REEL CONCEPT:
${result.concept}

AI VIDEO PROMPT:
${result.prompt}

CAPTION:
${result.caption}

HOOK:
${result.hook}

HASHTAGS:
${result.hashtags}
    `);

    setCopiedAll(true);

    setTimeout(() => {
      setCopiedAll(false);
    }, 1500);
  }}
>
  {copiedAll ? "Copied!" : "Copy Reel Package"}
</button>
<button
  style={copyButton}
  onClick={() => {
    const text = `
REEL CONCEPT:
${result.concept}

AI VIDEO PROMPT:
${result.prompt}

CAPTION:
${result.caption}

HOOK:
${result.hook}

HASHTAGS:
${result.hashtags}
    `;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${artist}-${track}-FrameLab.txt`;
    a.click();

    URL.revokeObjectURL(url);
  }}
>
Export TXT Package
</button>
<button
  style={copyButton}
  onClick={() => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FrameLab Reel Package", 20, 20);

    doc.setFontSize(12);
    doc.text(`Artist: ${artist}`, 20, 35);
    doc.text(`Track: ${track}`, 20, 45);
    doc.text(`Genre: ${genre}`, 20, 55);
    doc.text(`BPM: ${bpm}`, 20, 65);
    doc.text(`Style: ${style}`, 20, 75);

    const content = `
REEL CONCEPT:
${result.concept}

AI VIDEO PROMPT:
${result.prompt}

CAPTION:
${result.caption}

HOOK:
${result.hook}

HASHTAGS:
${result.hashtags}
    `;

    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 90);

    doc.save(`${artist}-${track}-FrameLab.pdf`);
  }}
>
  Export PDF
</button>
          <Card title="Reel Concept" text={result.concept} />
          <Card title="AI Video Prompt" text={result.prompt} />
          <Card title="Caption" text={result.caption} />
          <Card title="Hook" text={result.hook} />
          <Card title="Hashtags" text={result.hashtags} />
          {result.viralScore && (
  <div
    style={{
      marginTop: "20px",
      padding: "18px",
      borderRadius: "18px",
      background: "rgba(185,133,255,0.12)",
      border: "1px solid rgba(185,133,255,0.25)",
      color: "#b985ff",
      fontWeight: "bold",
      fontSize: "20px",
    }}
  >
    Viral Score: {result.viralScore}/100
  </div>
)}
        </div>
      )}
{history.length > 0 && (
  <div style={{ marginTop: "60px" }}>
    <h2
      style={{
        fontSize: "32px",
        marginBottom: "20px",
      }}
    >
      Reel History
    </h2>

    {history.map((item, index) => (
      <div
        key={index}
        onClick={() => {
          setArtist(item.artist);
          setTrack(item.track);
          setGenre(item.genre);
          setBpm(item.bpm);
          setMood(item.mood);
          setStyle(item.style);
          setResult(item.result);

          setTimeout(() => {
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
            });
          }, 100);
        }}
        style={{
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 0 0 rgba(185,133,255,0)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
          cursor: "pointer",
          
          transition: "all 0.2s ease",
          transform: "translateY(0px)",
        }}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px)";
  e.currentTarget.style.boxShadow =
    "0 25px 60px rgba(185,133,255,0.25)";
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0px)";
  e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
}}
      >
        <p style={{ color: "#b985ff", fontWeight: "bold" }}>
          {item.artist} — {item.track}
        </p>

        <p style={{ color: "#c7c7c7", marginTop: "6px" }}>
          {item.genre} • {item.bpm} BPM • {item.style}
        </p>

        <p
          style={{
            color: "#8b8b8b",
            fontSize: "13px",
            marginTop: "10px",
          }}
        >
          <button
  onClick={(e) => {
    e.stopPropagation();

    setHistory((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }}
  style={{
    marginTop: "12px",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#ff4d4d",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  }}
>
  Delete
</button>
          {item.date}

        </p>
      </div>
    ))}
  </div>
)}
</section>
  </main>
);
}

function Card({ title, text }) {
    const [copied, setCopied] = useState(false);
  return (
    <div style={card}>
      <h3>{title}</h3>
      <p>{text}</p>
     <button
  style={copyButton}
  onClick={() => {

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }}
>
  {copied ? "Copied!" : "Copy"}
</button>
    </div>
  );
}

const mainStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #3b1d5c 0%, #0b0b12 35%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "24px",
  overflowX: "hidden",
  display: "flex",
justifyContent: "center",
};

const eyebrow = {
  color: "#b985ff",
  fontSize: "14px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  fontWeight: "bold",
};

const title = {
fontSize: "clamp(36px, 8vw, 64px)",
fontWeight: "800",
  lineHeight: "1",
  maxWidth: "850px",
  margin: "20px 0",
};

const subtitle = {
  fontSize: "22px",
  lineHeight: "1.5",
  maxWidth: "720px",
  color: "#c7c7c7",
};

const grid = {
  display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
width: "100%",
  gap: "14px",
  marginTop: "34px",
  marginBottom: "24px",
};

const input = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "18px",
  color: "white",
  fontSize: "17px",
  width: "100%",
  outline: "none",
  backdropFilter: "blur(12px)",
  boxSizing: "border-box",
};

const button = {
  background: "linear-gradient(135deg, #ffffff 0%, #d8b4ff 100%)",
  color: "#08080a",
  padding: "20px 32px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.15)",
  fontSize: "18px",
  cursor: "pointer",
  fontWeight: "700",
  boxShadow: "0 10px 40px rgba(185, 133, 255, 0.35)",
  width: "100%",
  maxWidth: "520px",
  transition: "all 0.25s ease",
  transform: "translateY(0px)",
};
const label = {
  color: "#c7c7c7",
  fontSize: "14px",
  marginBottom: "6px",
  marginTop: "10px",
};
const outputBox = {
  marginTop: "44px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "24px",
  padding: "30px",
};

const card = {
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "22px",
  marginTop: "18px",
};

const copyButton = {
  marginTop: "12px",
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.15)",
  cursor: "pointer",
  fontWeight: "700",
  background: "rgba(255,255,255,0.95)",
  color: "#050506",
  fontSize: "14px",
};
const spinner = {
  width: "22px",
  height: "22px",
  border: "3px solid rgba(255,255,255,0.15)",
  borderTop: "3px solid #ffffff",
  borderRight: "3px solid #b985ff",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  boxShadow: "0 0 20px rgba(185,133,255,0.8)",
};

const spinnerStyle = `
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
`;
<button
  style={{
    background: "black",
    color: "white",
    padding: "16px",
    borderRadius: "12px",
    marginTop: "30px",
    width: "100%",
    cursor: "pointer",
    fontWeight: "bold",
  }}
  onClick={async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  }}
>
{"Upgrade to Pro (19 CHF / month)"}
</button>