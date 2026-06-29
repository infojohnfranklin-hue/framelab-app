import { useState, useRef, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { directorModes } from "../data/directorModes";

const genres = [
  "Deep House",
  "Melodic House",
  "Afro House",
  "Tech House",
  "Techno",
  "Minimal House",
  "Progressive House",
  "Organic House",
  "Lo-Fi House",
  "Future Garage",
  "Indie Dance",
  "Electronica",
  "Ambient",
  "Downtempo",
  "Trance",
  "Hard Techno",
  "Garage",
  "House",
  "Electronic Pop",
];

const cinematicDNAOptions = [
  "Neo Tokyo",
  "Miami Vice",
  "Dark Luxury",
  "Dreamscape",
  "Ocean Noir",
  "Desert Mirage",
  "Chrome Dreams",
  "Sacred Geometry",
  "Cathedral Light",
  "Blade Runner Noir",
  "Soft Apocalypse",
  "Luxury Underground",
  "Analog VHS Dream",
  "Frosted Glass Cinema",
  "Golden Hour Melancholy",
  "Rainy Neon Streets",
  "Editorial Fashion Film",
  "Surreal Museum Space",
  "Industrial Velvet",
  "Moonlit Minimalism",
  "Solar Chrome",
  "Underwater Cathedral",
  "Desert Monolith",
  "Pearl Archive",
  "Obsidian Ritual",
  "Glacier Noir",
  "Candlelit Futurism",
  "Concrete Dreamscape",
  "Mythic Sci-Fi",
  "Silent Luxury",
];

const eraOptions = [
  "1970s Analog Film",
  "1980s Neon Noir",
  "1990s Music Video",
  "Y2K Digital Gloss",
  "2010s Clean Social Era",
  "Modern Luxury",
  "Near-Future Editorial",
  "Futuristic 2090",
  "Retro VHS",
  "Polaroid Memory",
  "Early Internet Dream",
  "Chrome Millennium",
  "Post-Club Dawn",
  "Timeless Cinema",
  "Ancient Future",
  "Soft Apocalypse",
  "Luxury Archive",
  "Underground Rave Era",
  "Minimal Future",
  "Mythic Past",
];

const reelPurposeOptions = [
  "Artist Identity Reel",
  "Track Launch Teaser",
  "Festival Visual Moment",
  "Spotify Canvas Direction",
  "Music Video Concept Seed",
  "Luxury Brand Mood Film",
  "Live Visual Intro",
  "Editorial Campaign Cut",
  "Social Teaser Hook",
  "Album World Reveal",
];

const moodOptions = [
  "Nocturnal Intimacy",
  "Euphoric Release",
  "Melancholic Glow",
  "Tense Anticipation",
  "Hypnotic Motion",
  "Romantic Distance",
  "Dark Elegance",
  "Festival Energy",
  "Afterhours Drift",
  "Dreamlike Suspense",
  "Luxury Calm",
  "Emotional Lift",
  "Underground Heat",
  "Soft Nostalgia",
  "Mystic Wonder",
  "Cold Futurism",
  "Warm Cinematic Hope",
  "Lonely Neon",
  "Confident Arrival",
  "Surreal Stillness",
];

const visualStyleOptions = [
  "Wet Chrome Reflections",
  "Soft Grain Cinema",
  "Glass Shadow Luxury",
  "Neon Rain Noir",
  "Editorial Flash",
  "Analog VHS Texture",
  "Pearl Light Minimalism",
  "Concrete Noir",
  "Solar Haze",
  "Dark Velvet Atmosphere",
  "Silver Smoke",
  "High Fashion Blur",
  "Mirror Room Glow",
  "Infrared Dream",
  "Cold Digital Gloss",
  "Golden Hour Surrealism",
  "Black Marble Cinema",
  "Holographic Mist",
  "Dusty Film Memory",
  "Luxury Night Drive",
];

const bannedCreativeArchetypeWords = [
  "study",
  "method",
  "doctrine",
  "logic",
  "system",
  "theory",
  "protocol",
  "framework",
  "flux",
  "resonance",
  "resonant",
  "drift",
  "echo",
  "pulse",
  "pulsing",
  "ascension",
  "reflection",
  "reflective",
  "observer",
  "movement",
  "weave",
  "weaver",
  "collective",
  "convergence",
  "assembly",
  "alliance",
  "society",
  "network",
  "union",
  "order",
  "navigator",
  "conductor",
  "keeper",
  "guardian",
  "watcher",
  "builder",
  "creator",
  "curator",
  "explorer",
  "master",
  "designer",
  "engineer",
  "architect",
  "aurelia",
  "aetheris",
  "vestige",
  "solmere",
  "lustrebound",
  "grainfall",
  "nexus",
  "reverie",
  "ascendant",
  "eclipse",
  "ethereal",
  "celestial",
  "pathweaver",
  "pathweavers",
  "kinship",
  "observational",
  "moving",
  "drifting",
  "reflecting",
  "navigational",
  "conductive",
  "sculpted",
];

function isInvalidCreativeArchetype(value) {
  if (!value) return true;

  const normalized = value.toLowerCase();

  return bannedCreativeArchetypeWords.some((word) =>
    normalized.includes(word)
  );
}

const globalCss = `
  * {
    box-sizing: border-box;
  }

  .premium-action-button {
    transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
  }

  .premium-action-button:hover {
    transform: translateY(-3px) scale(1.015);
    box-shadow:
      0 0 44px rgba(192,132,252,0.46),
      0 18px 70px rgba(168,85,247,0.36) !important;
    filter: brightness(1.08);
  }

  .premium-action-button:active {
    transform: translateY(0px) scale(0.99);
  }

  .premium-export-button {
    transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
  }

  .premium-export-button:hover {
    transform: translateY(-3px) scale(1.018);
    box-shadow:
      0 0 58px rgba(216,180,254,0.62),
      0 14px 42px rgba(216,180,254,0.38) !important;
    filter: brightness(1.06);
  }

  .premium-export-button:active {
    transform: translateY(0px) scale(0.99);
  }

  html,
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden !important;
    background: #050507;
  }

  input,
  select,
  textarea,
  button {
    font-family: inherit;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 980px) {
    .generate-title {
      font-size: 62px !important;
      line-height: 0.96 !important;
      max-width: 760px !important;
    }

    .director-intelligence-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 768px) {
    .generate-content {
      width: 100% !important;
      max-width: 100% !important;
      padding: 28px 22px 118px !important;
      overflow-x: hidden !important;
    }

    .generate-title {
      font-size: 52px !important;
      line-height: 0.95 !important;
      max-width: 100% !important;
    }

    .generate-grid,
    .creative-grid,
    .performance-grid,
    .history-grid {
      grid-template-columns: 1fr !important;
    }

    input,
    select,
    textarea,
    button {
      width: 100% !important;
      max-width: 100% !important;
    }

    .history-delete-button {
      width: auto !important;
      max-width: fit-content !important;
    }
  }
`;

const inputStyle = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
  fontSize: "14px",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const copyButton = {
  padding: "12px 18px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(90deg, #7c3aed, #c084fc)",
  color: "white",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "13px",
};

function FieldLabel({ children }) {
  return (
    <p
      style={{
        color: "#cfcfe7",
        marginBottom: "8px",
        fontSize: "13px",
        fontWeight: "700",
      }}
    >
      {children}
    </p>
  );
}

async function copyToClipboard(text) {
  const safeText = String(text || "");

  if (!safeText.trim()) {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(safeText);
      return true;
    }
  } catch (error) {
    console.error("Clipboard API failed:", error);
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = safeText;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    return copied;
  } catch (error) {
    console.error("Fallback copy failed:", error);
    return false;
  }
}

function OutputCard({ title, text }) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [isHovered, setIsHovered] = useState(false);

  if (!text) return null;

  async function handleCopy(event) {
    event.stopPropagation();

    const copied = await copyToClipboard(text);

    if (copied) {
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    } else {
      setCopyLabel("Failed");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginTop: "22px",
        padding: "24px",
        borderRadius: "24px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))",
        border: isHovered
          ? "1px solid rgba(192,132,252,0.32)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isHovered
          ? "0 24px 80px rgba(168,85,247,0.18)"
          : "0 18px 60px rgba(0,0,0,0.22)",
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.22s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "14px",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            color: "white",
            margin: 0,
            fontSize: "20px",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...copyButton,
            width: "auto",
            minWidth: "68px",
            padding: "9px 14px",
            fontSize: "12px",
            background:
              copyLabel === "Copied"
                ? "linear-gradient(90deg, #22c55e, #86efac)"
                : "rgba(255,255,255,0.08)",
            color: copyLabel === "Copied" ? "#07130b" : "white",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              copyLabel === "Copied"
                ? "0 0 24px rgba(34,197,94,0.28)"
                : "none",
          }}
        >
          {copyLabel}
        </button>
      </div>

      <div
        style={{
          color: "#d7d7df",
          lineHeight: "1.85",
          fontSize: "14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ResultSectionHeader({ eyebrow, title, description }) {
  return (
    <div
      style={{
        marginTop: "42px",
        marginBottom: "18px",
        padding: "22px 24px",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(255,255,255,0.035))",
        border: "1px solid rgba(185,133,255,0.16)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          color: "#c084fc",
          fontSize: "11px",
          fontWeight: "900",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          color: "white",
          margin: 0,
          fontSize: "24px",
          letterSpacing: "-0.03em",
          lineHeight: "1.15",
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            color: "#a1a1aa",
            marginTop: "8px",
            marginBottom: 0,
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function ProgressMetric({ label, value }) {
  const parsedValue = Number(value) || 0;
  const width = Math.max(0, Math.min(parsedValue * 10, 100));

  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "7px",
          color: "#d7d7df",
          fontSize: "14px",
        }}
      >
        <span>{label}</span>
        <span>{parsedValue}/10</span>
      </div>

      <div
        style={{
          height: "8px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: "linear-gradient(90deg, #b985ff, #d8b4fe)",
          }}
        />
      </div>
    </div>
  );
}

function buildCinematicIdentityText(identity) {
  if (!identity) return "";

  const toCleanTitleWord = (value) => {
    const cleanWord = String(value || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .trim();

    if (!cleanWord) return "";

    return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
  };

  const buildDisplayCreativeArchetypeFallback = (sourceIdentity) => {
    const sourceText = [
      ...(Array.isArray(sourceIdentity?.visualDNA)
        ? sourceIdentity.visualDNA
        : []),
      sourceIdentity?.projectCodename || "",
      sourceIdentity?.snowflakeSignature || "",
    ].join(" ");

    const blockedWords = [
      "concept",
      "native",
      "identity",
      "state",
      "frame",
      "framelab",
      "lab",
      "project",
      "codename",
      "signature",
    ];

    const words = sourceText
      .split(/[^a-zA-Z0-9]+/)
      .map((word) => word.trim())
      .filter(Boolean)
      .filter((word) => word.length > 2)
      .filter((word) => !blockedWords.includes(word.toLowerCase()))
      .filter((word) => !isInvalidCreativeArchetype(word))
      .map((word) => toCleanTitleWord(word))
      .filter(Boolean);

    const first = words[0] || "Material";
    const second = words.find((word) => word !== first) || "Pressure";

    const endings = [
      "Compression Field",
      "Suspension State",
      "Fracture Condition",
      "Containment Form",
      "Material Tension",
      "Surface Pressure",
      "Density Shift",
      "Structural Inversion",
      "Layered Rupture",
      "Tactile Threshold",
    ];

    const seed = `${sourceIdentity?.projectCodename || ""}${
      sourceIdentity?.snowflakeSignature || ""
    }`;

    const endingIndex =
      Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      endings.length;

    return `${first} ${second} ${endings[endingIndex]}`;
  };

  const rawCreativeArchetype = identity.creativeArchetype || "";

  const creativeArchetype =
    isInvalidCreativeArchetype(rawCreativeArchetype) ||
    String(rawCreativeArchetype).toLowerCase().includes("concept-native") ||
    String(rawCreativeArchetype).toLowerCase().includes("concept native")
      ? buildDisplayCreativeArchetypeFallback(identity)
      : rawCreativeArchetype;

  return `PROJECT CODENAME:
${identity.projectCodename || ""}

CREATIVE ARCHETYPE:
${creativeArchetype}

VISUAL DNA:
${Array.isArray(identity.visualDNA) ? identity.visualDNA.join("\n") : ""}

EMOTIONAL TONE:
${Array.isArray(identity.emotionalTone) ? identity.emotionalTone.join("\n") : ""}

AUDIENCE EMOTION:
${
  Array.isArray(identity.audienceEmotion)
    ? identity.audienceEmotion.join("\n")
    : ""
}

SNOWFLAKE SIGNATURE:
${identity.snowflakeSignature || ""}`;
}

export default function Home() {
  const { isSignedIn, user } = useUser();

  const [artist, setArtist] = useState("Acid Smile");
  const [track, setTrack] = useState("303 Love");
  const [genre, setGenre] = useState("Tech House");
  const [bpm, setBpm] = useState("133");
  const [mood, setMood] = useState("Nocturnal Intimacy");
  const [style, setStyle] = useState("Wet Chrome Reflections");
  const [styleDNA, setStyleDNA] = useState("Neo Tokyo");
  const [era, setEra] = useState("1970s Analog Film");
  const [reelPurpose, setReelPurpose] = useState("Artist Identity Reel");
  const [directorMode, setDirectorMode] = useState("Neo Noir Sci-Fi");

  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [remainingCredits, setRemainingCredits] = useState(2);
  const [mounted, setMounted] = useState(false);

  const [result, setResult] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCopyLabel, setExportCopyLabel] = useState(
    "Copy Full Creative Package"
  );
  const [promptCopyLabel, setPromptCopyLabel] = useState(
    "Copy AI Video Prompt Only"
  ); 

  const resultRef = useRef(null);

  const selectedDirector =
    directorModes.find((mode) => mode.name === directorMode) ||
    directorModes?.[0];

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const creditsRes = await fetch("/api/credits");
        const creditsData = await creditsRes.json();

        if (typeof creditsData.remaining !== "undefined") {
          setRemainingCredits(creditsData.remaining);
        }

        const planRes = await fetch("/api/me-plan");
        const planData = await planRes.json();

        setUserPlan(planData.plan || "free");
      } catch (error) {
        console.error(error);
      } finally {
        setMounted(true);
      }
    };

    loadCredits();
  }, []);

  useEffect(() => {
    const savedReopen = localStorage.getItem("reopenGeneration");

    if (!savedReopen) return;

    try {
      const item = JSON.parse(savedReopen);

      const titleParts = String(item.title || "")
        .split("—")
        .map((part) => part.trim());

      const reopenedArtist = item.artist || titleParts[0] || "Velvet Mirage";
      const reopenedTrack = item.track || titleParts[1] || "After Midnight";
      const reopenedDirector =
        item.director_mode ||
        item.directorMode ||
        directorModes?.[0]?.name ||
        "Neo Noir Sci-Fi";
      const reopenedStyleDNA =
        item.style_dna || item.styleDNA || "Neo Tokyo";
      const reopenedEra =
        item.era === "Y2K"
          ? "Y2K Digital Gloss"
          : item.era || "Y2K Digital Gloss";
      const reopenedReelPurpose =
        item.reel_purpose ||
        item.reelPurpose ||
        item.result?.reelPurpose ||
        "Artist Identity Reel";

      setArtist(reopenedArtist);
      setTrack(reopenedTrack);
      setGenre(item.genre || "Melodic House");
      setBpm(item.bpm || "122");
      setMood(item.mood || "");
      setStyle(item.style || "");
      setDirectorMode(reopenedDirector);
      setStyleDNA(reopenedStyleDNA);
      setEra(reopenedEra);
      setReelPurpose(reopenedReelPurpose);

      setResult({
        concept: item.reel_concept || item.reelConcept || "",
        cinematicIdentity: null,
        prompt: item.prompt || "",
        caption: "",
        instagramCaption: "",
        tiktokCaption: "",
        shortsCaption: "",
        hashtags: "",
        hook: "",
        curiosityHook: "",
        emotionalHook: "",
        viralHook: "",
        viralScore: "",
        emotionScore: 0,
        curiosityScore: 0,
        visualNoveltyScore: 0,
        replayScore: 0,
        brandabilityScore: 0,
        whyThisWorks: [],
        bestPlatform: "",
        targetAudience: "",
        contentType: "",
        viralityReason: "",
        thumbnailPrompt: "",
        directorSummary: item.director_summary || "",
        narrativeArc: "",
        directorMode: reopenedDirector,
        styleDNA: reopenedStyleDNA,
        era: reopenedEra,
        reelPurpose: reopenedReelPurpose,
        previewImage: item.video_url || null,
      });

      setThumbnailImage(item.video_url || null);
      localStorage.removeItem("reopenGeneration");

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 150);
    } catch (error) {
      console.error("Failed to reopen generation:", error);
      localStorage.removeItem("reopenGeneration");
    }
  }, []);

  function getButtonText() {
    if (!mounted) return "Loading...";
    if (loading) return "Generating...";

    if (!isSignedIn) return "Create free account to continue";

    if (userPlan === "pro") return "Generate Reel · Pro Unlimited";
    if (userPlan === "standard") return "Generate Reel · Standard";

    if (userPlan === "free") {
      if (remainingCredits === null) return "Loading...";
      if (remainingCredits > 0) return `Generate Reel (${remainingCredits} left)`;
      return "Upgrade for CHF 19.90/month";
    }

    return "Generate Reel";
  }

  async function handleUpgrade() {
    if (userPlan === "pro") {
      alert("You already have Pro Unlimited.");
      return;
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: "pro" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert("Checkout failed.");
    }
  }

  async function generateThumbnail() {
    if (!result?.thumbnailPrompt || thumbnailLoading) return;

    setThumbnailLoading(true);

    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailPrompt: result.thumbnailPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Thumbnail generation failed");
        return;
      }

      if (data.thumbnailImage) {
        setThumbnailImage(data.thumbnailImage);
      }
    } catch (error) {
      console.error(error);
      alert("Thumbnail generation failed.");
    } finally {
      setThumbnailLoading(false);
    }
  }

  async function generateReel() {
    if (loading) return;

    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    if (userPlan === "free" && remainingCredits <= 0) {
      window.location.href = "/pricing?reason=credits-used";
      return;
    }

    setLoading(true);
    setResult(null);
    setThumbnailImage(null);

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
          styleDNA,
          directorMode,
          era,
          reelPurpose,
        }),
            });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Generation failed");
        return;
      }

      const newResult = {
        generatedProject: {
          artist,
          track,
          genre,
          bpm,
          mood,
          style,
          directorMode,
          styleDNA,
          era,
          reelPurpose,
        },

        concept: data.reelConcept || "",
        cinematicIdentity: data.cinematicIdentity || null,
        prompt: data.aiVideoPrompt || "",

        caption:
          data.captions?.caption ||
          data.captions?.instagramCaption ||
          "",
        instagramCaption: data.captions?.instagramCaption || "",
        tiktokCaption: data.captions?.tiktokCaption || "",
        shortsCaption: data.captions?.shortsCaption || "",
        hashtags: data.captions?.hashtags || "",

        hook: data.hooks?.hook || data.hooks?.primaryHook || "",
        curiosityHook: data.hooks?.curiosityHook || "",
        emotionalHook: data.hooks?.emotionalHook || "",
        viralHook: data.hooks?.viralHook || "",

        viralScore: data.scores?.viralScore || "",
        emotionScore: data.scores?.emotionScore || 9,
        curiosityScore: data.scores?.curiosityScore || 9,
        visualNoveltyScore: data.scores?.visualNoveltyScore || 9,
        replayScore: data.scores?.replayScore || 8,
        brandabilityScore: data.scores?.brandabilityScore || 9,

        whyThisWorks: Array.isArray(data.whyThisWorks)
          ? data.whyThisWorks
          : [data.whyThisWorks || ""],

        bestPlatform: data.bestPlatform || "",
        targetAudience: data.targetAudience || "",
        contentType: data.contentType || "",
        viralityReason: data.viralityReason || "",
        thumbnailPrompt: data.thumbnailPrompt || "",
        directorSummary: data.directorSummary || "",

        narrativeArc: data.narrativeArc
          ? `Stage 1: ${data.narrativeArc.stage1 || ""}

Stage 2: ${data.narrativeArc.stage2 || ""}

Stage 3: ${data.narrativeArc.stage3 || ""}`
          : "",

        directorMode,
        styleDNA,
        era,
        reelPurpose,
        previewImage: data.previewImage || null,
      };

      setResult(newResult);

      if (userPlan === "free") {
        await fetch("/api/use-credit", { method: "POST" });
        setRemainingCredits((prev) => Math.max((prev || 0) - 1, 0));
      }

      if (isSignedIn && user?.id) {
        try {
          await fetch("/api/save-history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              title: `${artist} — ${track}`,
              prompt: newResult.prompt,
              reelConcept: newResult.concept,
              directorMode,
              styleDNA,
              era,
              reelPurpose,
              artist,
              track,
              genre,
              bpm,
              mood,
              style,
              camera: directorMode,
            }),
          });
        } catch (saveError) {
          console.error("History save failed:", saveError);
        }
      }

      const newHistory = [
        {
          artist,
          track,
          genre,
          bpm,
          mood,
          style,
          styleDNA,
          directorMode,
          era,
          reelPurpose,
          date: new Date().toLocaleString(),
          result: newResult,
        },
        ...history,
      ].slice(0, 10);

      setHistory(newHistory);
      localStorage.setItem("framelab_history", JSON.stringify(newHistory));

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      console.error(error);
      alert(error.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function buildExportText() {
    const generatedProject = result?.generatedProject || {};
    const exportArtist = generatedProject.artist ?? artist;
    const exportTrack = generatedProject.track ?? track;
    const exportGenre = generatedProject.genre ?? genre;
    const exportBpm = generatedProject.bpm ?? bpm;
    const exportMood = generatedProject.mood ?? mood;
    const exportStyle = generatedProject.style ?? style;
    const exportDirectorMode = generatedProject.directorMode ?? directorMode;
    const exportStyleDNA = generatedProject.styleDNA ?? styleDNA;
    const exportEra = generatedProject.era ?? era;
    const exportReelPurpose = generatedProject.reelPurpose ?? reelPurpose;

    return `FRAMELAB CREATIVE PACKAGE

══════════════════════
PROJECT
══════════════════════

ARTIST: ${exportArtist}
TRACK: ${exportTrack}
GENRE: ${exportGenre}
BPM: ${exportBpm}
MOOD: ${exportMood}
VISUAL STYLE: ${exportStyle}
DIRECTOR MODE: ${exportDirectorMode}
CINEMATIC DNA: ${exportStyleDNA}
ERA: ${exportEra}
REEL PURPOSE: ${exportReelPurpose}

══════════════════════
REEL CONCEPT
══════════════════════

${result?.concept || ""}

══════════════════════
CINEMATIC IDENTITY
══════════════════════

${buildCinematicIdentityText(result?.cinematicIdentity)}

══════════════════════
DIRECTOR'S NOTES
══════════════════════

${result?.directorSummary || ""}

══════════════════════
NARRATIVE ARC
══════════════════════

${result?.narrativeArc || ""}

══════════════════════
AI VIDEO PROMPT
══════════════════════

${result?.prompt || ""}

══════════════════════
HOOKS
══════════════════════

PRIMARY HOOK:
${result?.hook || ""}

CURIOSITY HOOK:
${result?.curiosityHook || ""}

EMOTIONAL HOOK:
${result?.emotionalHook || ""}

VIRAL HOOK:
${result?.viralHook || ""}

══════════════════════
CAPTIONS
══════════════════════

MAIN CAPTION:
${result?.caption || ""}

INSTAGRAM:
${result?.instagramCaption || ""}

TIKTOK:
${result?.tiktokCaption || ""}

YOUTUBE SHORTS:
${result?.shortsCaption || ""}

══════════════════════
HASHTAGS
══════════════════════

${result?.hashtags || ""}

══════════════════════
THUMBNAIL CONCEPT
══════════════════════

${result?.thumbnailPrompt || ""}

══════════════════════
GENERATED BY FRAMELAB
══════════════════════`;
  }

  const mainStyle = {
    flex: 1,
    minHeight: "100vh",
    padding: "40px 24px",
    color: "white",
  };

  const outputBox = {
    marginTop: "70px",
    padding: "36px",
    borderRadius: "32px",
    background:
      "linear-gradient(180deg, rgba(18,18,28,0.96) 0%, rgba(10,10,18,0.98) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 30px 120px rgba(0,0,0,0.55), 0 0 80px rgba(168,85,247,0.18)",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 34%), radial-gradient(circle at top right, rgba(192,132,252,0.14), transparent 30%), #050508",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style jsx global>{globalCss}</style>

      <main
        className="generate-content"
        style={{
          ...mainStyle,
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            zIndex: 999,
          }}
        >
          <SignedOut>
            <button
              onClick={() => (window.location.href = "/sign-in")}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "none",
                background: "#9b85ff",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <section
          style={{
            width: "100%",
            maxWidth: "1180px",
            margin: "0 auto",
            paddingTop: "34px",
            paddingBottom: "80px",
          }}
        >
          <p
            style={{
              color: "#b985ff",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            CINEMATIC AI REEL GENERATOR
          </p>

          <h1
            className="generate-title"
            style={{
              color: "white",
              fontSize: "clamp(44px, 8vw, 88px)",
              lineHeight: "0.95",
              textAlign: "center",
              margin: "0 auto 22px",
              maxWidth: "1040px",
              fontWeight: "950",
              letterSpacing: "-0.06em",
            }}
          >
            Create viral cinematic reels for your music.
          </h1>

          <p
            style={{
              color: "#a1a1aa",
              fontSize: "16px",
              textAlign: "center",
              maxWidth: "760px",
              margin: "0 auto",
              lineHeight: "1.8",
            }}
          >
            Build premium reel concepts, cinematic AI video prompts, visual
            direction systems and export-ready creative packages.
          </p>

          <div
            style={{
              marginTop: "52px",
              padding: "28px",
              borderRadius: "32px",
              background:
                "linear-gradient(180deg, rgba(18,18,28,0.88), rgba(9,9,16,0.96))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 30px 110px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="generate-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "18px",
              }}
            >
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "26px",
                  borderRadius: "28px",
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(255,255,255,0.045))",
                  border: "1px solid rgba(196,181,253,0.18)",
                  boxShadow: "0 22px 70px rgba(0,0,0,0.24)",
                }}
              >
                <div
                  style={{
                    color: "#c4b5fd",
                    fontSize: "11px",
                    fontWeight: "900",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  What Generate Reel Creates
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: "26px",
                    lineHeight: "1.15",
                    letterSpacing: "-0.04em",
                    fontWeight: "950",
                    maxWidth: "820px",
                  }}
                >
                  A complete premium reel concept package — not a generic prompt.
                </h3>

                <p
                  style={{
                    marginTop: "12px",
                    marginBottom: "20px",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "15px",
                    lineHeight: "1.75",
                    maxWidth: "900px",
                  }}
                >
                  FrameLab turns your artist, track, genre, mood and visual direction into a ready-to-use creative system for short-form video, social rollout and AI video generation.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    "Reel Concept",
                    "AI Video Prompt",
                    "Hooks",
                    "Captions",
                    "Director Notes",
                    "Cinematic Identity",
                    "Creative Scores",
                    "Export Package",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        padding: "13px 14px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.055)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f5f3ff",
                        fontSize: "13px",
                        fontWeight: "850",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Artist Name</FieldLabel>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Velvet Mirage"
                  style={inputStyle}
                />
              </div>

              <div>
                <FieldLabel>Track Name</FieldLabel>
                <input
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder="e.g. After Midnight"
                  style={inputStyle}
                />
              </div>

              <div>
                <FieldLabel>Genre</FieldLabel>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  style={selectStyle}
                >
                  {genres.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>BPM</FieldLabel>
                <input
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="122"
                  style={inputStyle}
                />
              </div>

                <div>
                  <FieldLabel>Mood</FieldLabel>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    style={selectStyle}
                  >
                    {moodOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Visual Style</FieldLabel>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    style={selectStyle}
                  >
                    {visualStyleOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              <div>
                <FieldLabel>Director Mode</FieldLabel>
                <select
                  value={directorMode}
                  onChange={(e) => setDirectorMode(e.target.value)}
                  style={selectStyle}
                >
                  {directorModes.map((mode) => (
                    <option key={mode.name} value={mode.name}>
                      {mode.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Cinematic DNA</FieldLabel>
                <select
                  value={styleDNA}
                  onChange={(e) => setStyleDNA(e.target.value)}
                  style={selectStyle}
                >
                  {cinematicDNAOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Era</FieldLabel>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  style={selectStyle}
                >
                  {eraOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Reel Purpose</FieldLabel>
                <select
                  value={reelPurpose}
                  onChange={(e) => setReelPurpose(e.target.value)}
                  style={selectStyle}
                >
                  {reelPurposeOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "24px",
                  borderRadius: "26px",
                  background:
                    "radial-gradient(circle at top left, rgba(185,133,255,0.14), rgba(255,255,255,0.035) 62%)",
                  border: "1px solid rgba(185,133,255,0.16)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
                }}
              >
                <FieldLabel>Selected Director Intelligence</FieldLabel>

                <div
                  className="creative-grid director-intelligence-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.85fr 1.05fr 1.1fr",
                    gap: "18px",
                    alignItems: "stretch",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "18px",
                          display: "grid",
                          placeItems: "center",
                          background: selectedDirector?.accent || "#7c3aed",
                          color: "white",
                          fontWeight: "900",
                          fontSize: "18px",
                          boxShadow: "0 0 34px rgba(168,85,247,0.28)",
                        }}
                      >
                        {selectedDirector?.avatar || "◆"}
                      </div>

                      <div>
                        <div
                          style={{
                            color: "white",
                            fontWeight: "950",
                            fontSize: "18px",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {selectedDirector?.name || directorMode}
                        </div>

                        <div
                          style={{
                            color: "#a1a1aa",
                            fontSize: "13px",
                            marginTop: "3px",
                          }}
                        >
                          {selectedDirector?.category || "Director Mode"}
                          </div>
                        </div>
                      </div>

                      <p
                        style={{
                          color: "#cfcfe7",
                          fontSize: "14px",
                          lineHeight: "1.75",
                          margin: 0,
                        }}
                      >
                        {selectedDirector?.cameraStyle ||
                          "Cinematic camera behavior and visual direction."}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          color: "#c084fc",
                          fontSize: "10px",
                          fontWeight: "900",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Best For
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {(selectedDirector?.bestFor || [])
                          .slice(0, 4)
                          .map((item) => (
                            <span
                              key={item}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "999px",
                                background: "rgba(185,133,255,0.1)",
                                border: "1px solid rgba(185,133,255,0.16)",
                                color: "#d8b4fe",
                                fontSize: "11px",
                                fontWeight: "800",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "18px",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          color: "#c084fc",
                          fontSize: "10px",
                          fontWeight: "900",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Output Influence
                      </div>

                      <p
                        style={{
                          color: "#d7d7df",
                          fontSize: "13px",
                          lineHeight: "1.7",
                          margin: 0,
                        }}
                      >
                        {selectedDirector?.outputInfluence?.promptBias ||
                          "Applies this director's cinematic logic to the generated reel package."}
                      </p>
                  </div>
                </div>
              </div>
            </div>
                        {selectedDirector && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "22px",
                  borderRadius: "24px",
                  background:
                    "radial-gradient(circle at top left, rgba(185,133,255,0.16), rgba(255,255,255,0.025) 65%)",
                  border: "1px solid rgba(185,133,255,0.14)",
                }}
              >
                <div
                  className="creative-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.15fr 0.85fr",
                    gap: "18px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#c084fc",
                        fontSize: "11px",
                        fontWeight: "900",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Director Logic
                    </div>

                    <p
                      style={{
                        color: "#d7d7df",
                        lineHeight: "1.75",
                        margin: 0,
                        fontSize: "14px",
                      }}
                    >
                      {selectedDirector.shotLogic ||
                        selectedDirector.description ||
                        "Frames the reel through a specific cinematic logic."}
                    </p>

                    {selectedDirector?.avoid?.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: "900",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          Avoid
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {selectedDirector.avoid.slice(0, 4).map((item) => (
                            <span
                              key={item}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.045)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#cfcfe7",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#c084fc",
                        fontSize: "11px",
                        fontWeight: "900",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Visual Rules
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {selectedDirector.visualRules &&
                        Object.values(selectedDirector.visualRules).map(
                          (rule) => (
                            <span
                              key={rule}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#d7d7df",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              {rule}
                            </span>
                          )
                        )}
                    </div>

                    {selectedDirector?.outputInfluence && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px",
                          borderRadius: "14px",
                          background: "rgba(255,255,255,0.035)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          style={{
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: "900",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          Camera Bias
                        </div>

                        <p
                          style={{
                            color: "#d7d7df",
                            fontSize: "12px",
                            lineHeight: "1.6",
                            margin: 0,
                          }}
                        >
                          {selectedDirector.outputInfluence.framingBias ||
                            selectedDirector.outputInfluence.pacingBias ||
                            "Applies this director's framing, pacing and visual rhythm to the generated reel."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              className="premium-action-button"
              onClick={generateReel}
              disabled={loading || !mounted}
              style={{
                marginTop: "24px",
                width: "100%",
                padding: "18px 28px",
                borderRadius: "999px",
                border: "none",
                background:
                  loading || !mounted
                    ? "rgba(255,255,255,0.12)"
                    : "linear-gradient(90deg, #7c3aed, #c084fc)",
                color: "white",
                fontWeight: "950",
                fontSize: "16px",
                cursor: loading || !mounted ? "not-allowed" : "pointer",
                boxShadow:
                  loading || !mounted
                    ? "none"
                    : "0 18px 60px rgba(168,85,247,0.34)",
              }}
            >
              {getButtonText()}
            </button>
            
            {isSignedIn && userPlan === "free" && (
              <p
                style={{
                  marginTop: "12px",
                  textAlign: "center",
                  color: "#bda7ff",
                  fontSize: "13px",
                }}
              >
                Free credits left: {remainingCredits} / 2
              </p>
            )}

            {isSignedIn && userPlan !== "pro" && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  onClick={handleUpgrade}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#c4b5fd",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  Upgrade to Pro Unlimited
                </button>
              </div>
            )}

            {userPlan === "pro" && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <a
                  href="https://billing.stripe.com/p/login/dRmfZg7onfTccD9xjgjC00"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#bda7ff",
                    textDecoration: "underline",
                    fontSize: "14px",
                  }}
                >
                  Manage Subscription
                </a>
              </div>
            )}
          </div>

          {loading && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(5,5,10,0.82)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "32px",
                  padding: "42px 32px",
                  background:
                    "linear-gradient(180deg, rgba(18,18,28,0.96) 0%, rgba(10,10,18,0.98) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 30px 120px rgba(0,0,0,0.55), 0 0 80px rgba(168,85,247,0.22)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "84px",
                    height: "84px",
                    margin: "0 auto 24px",
                    borderRadius: "999px",
                    border: "3px solid rgba(255,255,255,0.08)",
                    borderTop: "3px solid #c084fc",
                    animation: "spin 1s linear infinite",
                  }}
                />

                <h2
                  style={{
                    fontSize: "32px",
                    marginBottom: "14px",
                    fontWeight: "900",
                    letterSpacing: "-1px",
                  }}
                >
                  Directing Your Reel
                </h2>

                <p
                  style={{
                    color: "#a1a1aa",
                    lineHeight: "1.8",
                    fontSize: "15px",
                  }}
                >
                  FrameLab AI is generating cinematic concepts, visual
                  direction and viral-ready reel assets.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div ref={resultRef} style={outputBox}>
              {result.previewImage && (
                <img
                  src={result.previewImage}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: "28px",
                    marginBottom: "30px",
                    objectFit: "cover",
                    boxShadow: "0 0 40px rgba(124,58,237,0.35)",
                  }}
                />
              )}

              <h2
                style={{
                  fontSize: "clamp(28px, 6vw, 54px)",
                  lineHeight: "1.08",
                  textAlign: "center",
                  maxWidth: "900px",
                  margin: "0 auto 14px",
                  letterSpacing: "-0.04em",
                }}
              >
                {artist} — {track}
              </h2>

              <p
                style={{
                  color: "#c7c7c7",
                  textAlign: "center",
                  marginTop: "8px",
                }}
              >
                {genre} • {bpm} BPM • {directorMode} • {styleDNA} • {era} •{" "}
                {reelPurpose}
              </p>

              <div
                style={{
                  maxWidth: "680px",
                  margin: "52px auto 46px",
                  padding: "32px",
                  borderRadius: "28px",
                  background:
                    "radial-gradient(circle at top, rgba(124,58,237,0.28), rgba(10,10,20,0.94) 70%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 20px 70px rgba(124,58,237,0.22)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#c084fc",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Export Package
                </div>

                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: "14px",
                    marginBottom: "22px",
                  }}
                >
                  Copy or export your complete FrameLab reel package.
                </p>

                <button
                  className="premium-export-button"
                  style={{
                    ...copyButton,
                    width: "100%",
                    maxWidth: "420px",
                    height: "46px",
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #d8b4fe 100%)",
                    color: "#111827",
                    boxShadow:
                      "0 0 30px rgba(216,180,254,0.35), 0 10px 35px rgba(216,180,254,0.35)",
                  }}
                  onClick={() => setShowExportModal(true)}
                >
                  Export Center
                </button>
              </div>

              <ResultSectionHeader
                eyebrow="Concept Foundation"
                title="Creative Core"
                description="The central idea, cinematic identity and director logic behind this reel."
              />

              <OutputCard title="Reel Concept" text={result.concept} />

              <OutputCard
                title="Cinematic Identity"
                text={buildCinematicIdentityText(result.cinematicIdentity)}
              />

              <OutputCard
                title="Director's Notes"
                text={result.directorSummary}
              />

              <OutputCard title="Narrative Arc" text={result.narrativeArc} />

              <ResultSectionHeader
                eyebrow="Production Blueprint"
                title="AI Video Direction"
                description="The cinematic sequence and production-ready visual prompt for generation."
              />

              <OutputCard
                title="Cinematic Sequence"
                text={result.prompt}
              />

              {[
                result.caption,
                result.instagramCaption,
                result.tiktokCaption,
                result.shortsCaption,
                result.hook,
                result.curiosityHook,
                result.emotionalHook,
                result.viralHook,
                result.hashtags,
              ].some((value) => String(value || "").trim()) && (
                <>
                  <ResultSectionHeader
                    eyebrow="Social Delivery"
                    title="Platform Package"
                    description="Captions, hooks and hashtags prepared for short-form release."
                  />

                  {[
                    result.caption,
                    result.instagramCaption,
                    result.tiktokCaption,
                    result.shortsCaption,
                  ].some((value) => String(value || "").trim()) && (
                    <OutputCard
                      title="Platform Captions"
                      text={`MAIN CAPTION:
${result.caption}

INSTAGRAM CAPTION:
${result.instagramCaption}

TIKTOK CAPTION:
${result.tiktokCaption}

YOUTUBE SHORTS CAPTION:
${result.shortsCaption}`}
                    />
                  )}

                  {[
                    result.hook,
                    result.curiosityHook,
                    result.emotionalHook,
                    result.viralHook,
                  ].some((value) => String(value || "").trim()) && (
                    <OutputCard
                      title="Hook Variants"
                      text={`PRIMARY HOOK:
${result.hook}

CURIOSITY HOOK:
${result.curiosityHook}

EMOTIONAL HOOK:
${result.emotionalHook}

VIRAL HOOK:
${result.viralHook}`}
                    />
                  )}

                  <OutputCard title="Hashtags" text={result.hashtags} />
                </>
              )}
                            
              {[
                result.viralScore,
                ...(result.whyThisWorks || []),
                result.emotionScore,
                result.curiosityScore,
                result.visualNoveltyScore,
                result.replayScore,
                result.brandabilityScore,
                result.bestPlatform,
                result.targetAudience,
                result.contentType,
                result.viralityReason,
              ].some((value) =>
                typeof value === "number"
                  ? value > 0
                  : String(value || "").trim()
              ) && (
                <ResultSectionHeader
                  eyebrow="Performance Intelligence"
                  title="Concept Strength Analysis"
                  description="A quality check of viral potential, creative logic, audience fit and content performance."
                />
              )}
              
              {result.viralScore && (
                <div
                  style={{
                    marginTop: "22px",
                    padding: "24px",
                    borderRadius: "24px",
                    background:
                      "linear-gradient(135deg, rgba(185,133,255,0.18), rgba(255,255,255,0.035))",
                    border: "1px solid rgba(185,133,255,0.24)",
                    boxShadow:
                      "0 18px 70px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "#c084fc",
                      fontSize: "11px",
                      fontWeight: "900",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Viral Score
                  </div>

                  <h3
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "22px",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Reel Potential Rating: {result.viralScore}/10
                  </h3>

                  <p
                    style={{
                      color: "#a1a1aa",
                      marginTop: "8px",
                      marginBottom: "18px",
                      fontSize: "13px",
                      lineHeight: "1.7",
                    }}
                  >
                    Strong concept with high visual replay potential.
                  </p>

                  <div
                    style={{
                      height: "10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "80%",
                        height: "100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(90deg, #7c3aed, #c084fc, #f0abfc)",
                        boxShadow: "0 0 22px rgba(192,132,252,0.36)",
                      }}
                    />
                  </div>
                </div>
              )}

              {result.whyThisWorks?.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "24px",
                    borderRadius: "24px",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      color: "#c084fc",
                      fontSize: "11px",
                      fontWeight: "900",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Creative Analysis
                  </div>

                  <h3
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "22px",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Why This Concept Works
                  </h3>

                  <p
                    style={{
                      color: "#a1a1aa",
                      marginTop: "8px",
                      marginBottom: "18px",
                      fontSize: "13px",
                      lineHeight: "1.7",
                    }}
                  >
                    A quick readability check showing the strongest creative reasons behind this reel concept.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    {result.whyThisWorks.map((reason, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "14px",
                          background: "rgba(255,255,255,0.035)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#d7d7df",
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                      >
                        ✓ {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {[
                result.emotionScore,
                result.curiosityScore,
                result.visualNoveltyScore,
                result.replayScore,
                result.brandabilityScore,
              ].some((value) => Number(value) > 0) && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "22px",
                    borderRadius: "22px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3
                    style={{
                      color: "white",
                      marginBottom: "18px",
                      fontSize: "20px",
                    }}
                  >
                    Content Performance Analysis
                  </h3>

                  <div className="performance-grid">
                    <ProgressMetric
                      label="Emotion"
                      value={result.emotionScore}
                    />
                    <ProgressMetric
                      label="Curiosity"
                      value={result.curiosityScore}
                    />
                    <ProgressMetric
                      label="Visual Novelty"
                      value={result.visualNoveltyScore}
                    />
                    <ProgressMetric
                      label="Replay Potential"
                      value={result.replayScore}
                    />
                    <ProgressMetric
                      label="Brandability"
                      value={result.brandabilityScore}
                    />
                  </div>
                </div>
              )}

              {[
                result.bestPlatform,
                result.targetAudience,
                result.contentType,
                result.viralityReason,
              ].some((value) => String(value || "").trim()) && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "22px",
                    borderRadius: "22px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3
                    style={{
                      color: "white",
                      marginBottom: "14px",
                      fontSize: "20px",
                    }}
                  >
                    AI Content Intelligence
                  </h3>

                  <div
                    className="creative-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "18px",
                      marginTop: "16px",
                    }}
                  >
                    {[
                      ["BEST PLATFORM", result.bestPlatform],
                      ["TARGET AUDIENCE", result.targetAudience],
                      ["CONTENT TYPE", result.contentType],
                      ["VIRALITY TRIGGER", result.viralityReason],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          padding: "14px",
                          borderRadius: "14px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            color: "#9f7aea",
                            fontSize: "11px",
                            letterSpacing: "1px",
                            fontWeight: 800,
                          }}
                        >
                          {label}
                        </div>

                        <div style={{ color: "white", marginTop: "7px" }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div
                style={{
                  display:
                    String(result.thumbnailPrompt || "").trim() || thumbnailImage
                      ? "block"
                      : "none",
                  marginTop: "20px",
                  padding: "22px",
                  borderRadius: "22px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3
                  style={{
                    color: "white",
                    marginBottom: "14px",
                    fontSize: "20px",
                  }}
                >
                  Thumbnail Concept
                </h3>

                <div
                  style={{
                    color: "#cfcfe7",
                    lineHeight: "1.8",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result.thumbnailPrompt}
                </div>

                {thumbnailImage && (
                  <img
                    src={thumbnailImage}
                    alt="Generated thumbnail"
                    style={{
                      width: "100%",
                      borderRadius: "20px",
                      marginTop: "18px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                )}

              </div>
            </div>
          )}
          
          {history.length > 0 && (
            <div style={{ marginTop: "48px" }}>
              <h2
                style={{
                  fontSize: "32px",
                  marginBottom: "20px",
                  letterSpacing: "-0.03em",
                }}
              >
                Reel History
              </h2>

              <div className="history-grid">
                {history.map((item, index) => (
                  <div
                    key={`${item.artist}-${item.track}-${index}`}
                    onClick={() => {
                      setArtist(item.artist || "");
                      setTrack(item.track || "");
                      setGenre(item.genre || "Melodic House");
                      setBpm(item.bpm || "122");
                      setMood(item.mood || "");
                      setStyle(item.style || "");
                      setDirectorMode(
                        item.directorMode || directorModes?.[0]?.name || ""
                      );
                      setStyleDNA(item.styleDNA || "Neo Tokyo");
                      setEra(item.era || "Y2K");
                      setResult(item.result || null);
                      setThumbnailImage(null);

                      setTimeout(() => {
                        resultRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }, 100);
                    }}
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(14,10,24,0.96) 0%, rgba(8,8,18,0.98) 100%)",
                      border: "1px solid rgba(180,140,255,0.12)",
                      borderRadius: "28px",
                      padding: "24px",
                      marginBottom: "24px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow:
                        "0 30px 90px rgba(0,0,0,0.45), 0 0 80px rgba(120,70,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
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
                        color: "#b985ff",
                        marginTop: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {item.directorMode || "Director Mode"} ·{" "}
                      {item.styleDNA || "Cinematic DNA"} · {item.era || "Era"}
                    </p>

                    <p
                      style={{
                        color: "#9ca3af",
                        marginTop: "10px",
                        fontSize: "12px",
                        lineHeight: "1.6",
                        maxWidth: "760px",
                      }}
                    >
                      {(item.result?.concept || "").slice(0, 150)}
                      {(item.result?.concept || "").length > 150 ? "..." : ""}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "14px",
                      }}
                    >
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "rgba(185,133,255,0.12)",
                          color: "#b985ff",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        Viral: {item.result?.viralScore || "--"}
                      </span>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.06)",
                          color: "#d7d7d7",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {item.result?.bestPlatform || "Platform N/A"}
                      </span>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.06)",
                          color: "#d7d7d7",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {item.result?.contentType || "Content Type N/A"}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "#8b8b8b",
                        fontSize: "13px",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        className="history-delete-button"
                        onClick={(e) => {
                          e.stopPropagation();

                          const updatedHistory = history.filter(
                            (_, i) => i !== index
                          );

                          setHistory(updatedHistory);
                          localStorage.setItem(
                            "framelab_history",
                            JSON.stringify(updatedHistory)
                          );
                        }}
                        style={{
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

                      <span style={{ marginLeft: "10px" }}>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {showExportModal && (
          <div
            onClick={() => setShowExportModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "22px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "420px",
                maxWidth: "100%",
                background:
                  "linear-gradient(180deg, rgba(17,24,39,0.98), rgba(8,8,18,0.98))",
                borderRadius: "24px",
                padding: "24px",
                border: "1px solid rgba(168,85,247,0.25)",
                position: "relative",
                boxShadow: "0 30px 120px rgba(0,0,0,0.55)",
              }}
            >
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "900",
                }}
              >
                ×
              </button>

              <h2 style={{ color: "white", marginBottom: "10px" }}>
                Export Package
              </h2>

              <p
                style={{
                  color: "#a1a1aa",
                  lineHeight: "1.7",
                  fontSize: "14px",
                  marginBottom: "20px",
                }}
              >
                Copy the complete FrameLab reel package for production,
                briefing or client handoff.
              </p>

                <button
                  style={{
                    ...copyButton,
                    width: "100%",
                    marginBottom: "12px",
                    background:
                      exportCopyLabel === "Copied"
                        ? "linear-gradient(90deg, #22c55e, #86efac)"
                        : copyButton.background,
                    color: exportCopyLabel === "Copied" ? "#07130b" : "white",
                  }}
                  onClick={async () => {
                    const copied = await copyToClipboard(buildExportText());

                    if (copied) {
                      setExportCopyLabel("Copied");
                      setTimeout(
                        () =>
                          setExportCopyLabel("Copy Full Creative Package"),
                        1400
                      );
                    } else {
                      setExportCopyLabel("Copy Failed");
                      setTimeout(
                        () =>
                          setExportCopyLabel("Copy Full Creative Package"),
                        1400
                      );
                    }
                  }}
                >
                  {exportCopyLabel}
                </button>

                <button
                  style={{
                    ...copyButton,
                    width: "100%",
                    background:
                      promptCopyLabel === "Copied"
                        ? "linear-gradient(90deg, #22c55e, #86efac)"
                        : "rgba(255,255,255,0.08)",
                    color: promptCopyLabel === "Copied" ? "#07130b" : "white",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onClick={async () => {
                    const copied = await copyToClipboard(result?.prompt || "");

                    if (copied) {
                      setPromptCopyLabel("Copied");
                      setTimeout(
                        () =>
                          setPromptCopyLabel("Copy AI Video Prompt Only"),
                        1400
                      );
                    } else {
                      setPromptCopyLabel("Copy Failed");
                      setTimeout(
                        () =>
                          setPromptCopyLabel("Copy AI Video Prompt Only"),
                        1400
                      );
                    }
                  }}
                >
                  {promptCopyLabel}
                </button>
                            </div>
          </div>
        )}
      </main>
    </div>
  );
}