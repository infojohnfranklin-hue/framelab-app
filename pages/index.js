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
  "Pop",
  "R&B / Soul",
  "Rock",
  "Reggae",
  "Jazz",
  "Latin",
  "Country",
  "Hip-Hop / Rap",
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
      0 0 40px rgba(216,181,106,0.26),
      0 18px 70px rgba(216,181,106,0.20) !important;
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
      0 0 42px rgba(216,181,106,0.24),
      0 14px 42px rgba(0,0,0,0.32) !important;
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
  border: "1px solid rgba(216,181,106,0.16)",
  background: "rgba(13,13,18,0.72)",
  color: "white",
  outline: "none",
  fontSize: "14px",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.035), 0 8px 24px rgba(0,0,0,0.10)",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const copyButton = {
  padding: "12px 18px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(90deg, #B88A3B, #E7CC91)",
  color: "#17130C",
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

function OutputCard({ title, text, t = (value) => value }) {
  const [copyLabel, setCopyLabel] = useState(t("Copy"));
  const [isHovered, setIsHovered] = useState(false);

  if (!text) return null;

  async function handleCopy(event) {
    event.stopPropagation();

    const copied = await copyToClipboard(text);

    if (copied) {
      setCopyLabel(t("Copied"));
      setTimeout(() => setCopyLabel(t("Copy")), 1200);
    } else {
      setCopyLabel(t("Failed"));
      setTimeout(() => setCopyLabel(t("Copy")), 1200);
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
          ? "1px solid rgba(216,181,106,0.18)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isHovered
          ? "0 24px 80px rgba(0,0,0,0.32)"
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
              copyLabel === t("Copied")
                ? "linear-gradient(90deg, #22c55e, #86efac)"
                : "rgba(255,255,255,0.08)",
            color: copyLabel === t("Copied") ? "#07130b" : "white",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              copyLabel === t("Copied")
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
        marginBottom: "20px",
        padding: "22px 24px",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))",
        border: "1px solid rgba(216,181,106,0.14)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          color: "#E7CC91",
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
            background: "linear-gradient(90deg, #B88A3B 0%, #D8B56A 50%, #E7CC91 100%)",
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
    !rawCreativeArchetype ||
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

export default function Home({ language, ui, t = (value) => value }) {
  const { isSignedIn, user } = useUser();

  const [artist, setArtist] = useState("Aurora Wolves");
  const [track, setTrack] = useState("Northern Migration");
  const [genre, setGenre] = useState("Ambient");
  const [bpm, setBpm] = useState("92");
  const [mood, setMood] = useState("Warm Cinematic Hope");
  const [style, setStyle] = useState("Soft Grain Cinema");
  const [styleDNA, setStyleDNA] = useState("Ocean Noir");
  const [era, setEra] = useState("1970s Analog Film");
  const [reelPurpose, setReelPurpose] = useState("Artist Identity Reel");
  const [userReelVision, setUserReelVision] = useState("");
  const [directorMode, setDirectorMode] = useState("Poetic Documentary");

  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [remainingCredits, setRemainingCredits] = useState(2);
  const [mounted, setMounted] = useState(false);
  const generationRequestIdRef = useRef(null);

  const [result, setResult] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCopyLabel, setExportCopyLabel] = useState(
    ui.generate.copyFullPackage
  );
  const [promptCopyLabel, setPromptCopyLabel] = useState(
    ui.generate.copyVideoPrompt
  ); 

  const resultRef = useRef(null);

  const creativeBriefEngines = [
    artist && track,
    genre && bpm && mood,
    style,
    directorMode,
    styleDNA && era,
    reelPurpose,
  ];

  const creativeBriefCompletedEngines = creativeBriefEngines.filter(Boolean).length;
  const creativeBriefProgress = Math.round(
    (creativeBriefCompletedEngines / creativeBriefEngines.length) * 100
  );
  const creativeBriefComplete =
    creativeBriefCompletedEngines === creativeBriefEngines.length;

  const creativeContext = {
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
    bpmNumber: Number(bpm),
    genreSignal: String(genre || "").toLowerCase(),
    moodSignal: String(mood || "").toLowerCase(),
    styleSignal: String(style || "").toLowerCase(),
    directorSignal: String(directorMode || "").toLowerCase(),
    dnaSignal: String(styleDNA || "").toLowerCase(),
    eraSignal: String(era || "").toLowerCase(),
    purposeSignal: String(reelPurpose || "").toLowerCase(),
  };

  const briefingCopy = (englishValue, germanValue) =>
    language === "Deutsch" ? germanValue : englishValue;

  const identityEngineIntelligence = (() => {
    const { artist, track, genreSignal, moodSignal, purposeSignal } = creativeContext;

    if (!artist || !track) {
      return briefingCopy("Waiting for artist identity.", "Identitätsprofil ausstehend.");
    }

    const identityPressure =
      genreSignal.includes("techno")
        ? briefingCopy("a precise, high-control electronic identity", "eine präzise, stark kontrollierte elektronische Identität")
        : genreSignal.includes("house")
        ? briefingCopy("a warm but curated club-facing identity", "eine warme, aber kuratierte cluborientierte Identität")
        : genreSignal.includes("ambient") || genreSignal.includes("downtempo")
        ? briefingCopy("an atmospheric identity built through restraint and space", "eine atmosphärische Identität, die durch Zurückhaltung und Raum entsteht")
        : briefingCopy("a distinctive release identity shaped by the selected sound", "eine eigenständige Release-Identität, geprägt vom gewählten Sound");

    const emotionalPosition =
      moodSignal.includes("nocturnal")
        ? briefingCopy("The artist should feel intimate, late-night and close to the listener.", "Der Artist sollte intim, nächtlich und nah am Publikum wirken.")
        : moodSignal.includes("hypnotic")
        ? briefingCopy("The artist should feel magnetic, repetitive and difficult to look away from.", "Der Artist sollte magnetisch, repetitiv und visuell fesselnd wirken.")
        : moodSignal.includes("tense")
        ? briefingCopy("The artist should feel controlled, unresolved and visually disciplined.", "Der Artist sollte kontrolliert, spannungsvoll und visuell diszipliniert wirken.")
        : moodSignal.includes("euphoric")
        ? briefingCopy("The artist should feel expansive, luminous and release-driven.", "Der Artist sollte weit, leuchtend und auf den Release ausgerichtet wirken.")
        : briefingCopy("The artist identity should follow the emotional pressure of the track.", "Die Artist-Identität sollte der emotionalen Spannung des Tracks folgen.");

    const releasePosition =
      purposeSignal.includes("identity")
        ? briefingCopy("Prioritize recognition over plot.", "Priorisiere Wiedererkennbarkeit vor Handlung.")
        : purposeSignal.includes("launch") || purposeSignal.includes("teaser")
        ? briefingCopy("Prioritize immediate memory and anticipation.", "Priorisiere unmittelbare Wiedererkennbarkeit und Erwartung.")
        : purposeSignal.includes("canvas")
        ? briefingCopy("Prioritize loopable visual identity.", "Priorisiere eine visuelle Identität, die als Loop funktioniert.")
        : briefingCopy("Prioritize a clear creative signature for the release.", "Priorisiere eine klare kreative Handschrift für den Release.");

    return language === "Deutsch"
      ? `Kreative Einschätzung: ${artist} — ${track} sollte ${identityPressure} vermitteln. ${emotionalPosition} ${releasePosition}`
      : `Creative Assessment: ${artist} — ${track} should present ${identityPressure}. ${emotionalPosition} ${releasePosition}`;
  })();

  const sonicPressureIntelligence = (() => {
    const bpmNumber = Number(bpm);
    const genreSignal = String(genre || "").toLowerCase();
    const moodSignal = String(mood || "").toLowerCase();

    if (!genre || !bpm || !mood) {
      return briefingCopy("Waiting for sonic profile.", "Klangprofil ausstehend.");
    }

    const tempoDirection =
      bpmNumber >= 130
        ? briefingCopy("high-pressure kinetic pacing", "ein druckvolles, kinetisches Tempo")
        : bpmNumber >= 118
        ? briefingCopy("controlled forward momentum", "kontrollierten Vorwärtsdrang")
        : briefingCopy("slow-burn emotional movement", "langsam aufgebaute emotionale Bewegung");

    const genreDirection =
      genreSignal.includes("minimal")
        ? briefingCopy("minimal repetition, negative space and restrained structural tension", "minimale Wiederholung, Negativraum und zurückhaltende strukturelle Spannung")
        : genreSignal.includes("progressive")
        ? briefingCopy("gradual escalation, layered movement and long-form release pressure", "graduelle Steigerung, geschichtete Bewegung und langfristig aufgebauten Release-Druck")
        : genreSignal.includes("techno")
        ? briefingCopy("industrial drive, physical pulse and machine-like persistence", "industriellen Drive, physischen Puls und maschinelle Beharrlichkeit")
        : genreSignal.includes("house")
        ? briefingCopy("club warmth, groove continuity and body-led motion", "Club-Wärme, Groove-Kontinuität und körpergeführte Bewegung")
        : genreSignal.includes("ambient") || genreSignal.includes("downtempo")
        ? briefingCopy("atmospheric drift, suspended rhythm and emotional spaciousness", "atmosphärisches Driften, schwebenden Rhythmus und emotionale Weite")
        : briefingCopy("genre-led rhythm behavior and musical pressure", "genregeprägtes Rhythmusverhalten und musikalischen Druck");

    const moodDirection =
      moodSignal.includes("tense")
        ? briefingCopy("anticipation should stay unresolved instead of exploding too early", "die Erwartung sollte offenbleiben, statt sich zu früh zu entladen")
        : moodSignal.includes("nocturnal")
        ? briefingCopy("night pressure should feel intimate, controlled and close to the skin", "die nächtliche Spannung sollte intim, kontrolliert und unmittelbar wirken")
        : moodSignal.includes("euphoric")
        ? briefingCopy("release moments should feel earned, luminous and expansive", "Release-Momente sollten verdient, leuchtend und weit wirken")
        : moodSignal.includes("melancholic")
        ? briefingCopy("movement should carry emotional weight rather than pure energy", "Bewegung sollte emotionales Gewicht statt bloßer Energie tragen")
        : moodSignal.includes("romantic")
        ? briefingCopy("distance, restraint and longing should shape the rhythm", "Distanz, Zurückhaltung und Sehnsucht sollten den Rhythmus prägen")
        : moodSignal.includes("hypnotic")
        ? briefingCopy("repetition should become the main visual engine", "Wiederholung sollte zum zentralen visuellen Motor werden")
        : briefingCopy("the emotional tone should control how the rhythm is perceived", "der emotionale Ton sollte bestimmen, wie der Rhythmus wahrgenommen wird");

    return language === "Deutsch"
      ? `Kreative Einschätzung: ${genre} bei ${bpm} BPM deutet auf ${tempoDirection} hin. Nutze ${genreDirection}; ${moodDirection}.`
      : `Creative Assessment: ${genre} at ${bpm} BPM suggests ${tempoDirection}. Use ${genreDirection}; ${moodDirection}.`;
  })();

  const materialLanguageIntelligence = (() => {
    const { styleSignal, genreSignal, moodSignal, bpmNumber } = creativeContext;

    if (!style) {
      return briefingCopy("Waiting for material language.", "Visuelle Sprache ausstehend.");
    }

    const sonicBehavior =
      bpmNumber >= 130
        ? briefingCopy("fast rhythmic pressure", "schnellen rhythmischen Druck")
        : bpmNumber >= 118
        ? briefingCopy("controlled forward motion", "kontrollierte Vorwärtsbewegung")
        : briefingCopy("slow atmospheric movement", "langsame atmosphärische Bewegung");

    const emotionalBehavior =
      moodSignal.includes("tense")
        ? briefingCopy("unresolved tension", "ungelöste Spannung")
        : moodSignal.includes("hypnotic")
        ? briefingCopy("repetition and trance-like continuity", "Wiederholung und tranceartige Kontinuität")
        : moodSignal.includes("nocturnal")
        ? briefingCopy("intimate night pressure", "intime nächtliche Spannung")
        : moodSignal.includes("melancholic")
        ? briefingCopy("emotional residue", "emotionale Nachwirkung")
        : briefingCopy("the selected emotional tone", "den gewählten emotionalen Ton");

    const genreBehavior =
      genreSignal.includes("techno")
        ? briefingCopy("machine persistence", "maschinelle Beharrlichkeit")
        : genreSignal.includes("house")
        ? briefingCopy("groove continuity", "Groove-Kontinuität")
        : genreSignal.includes("ambient") || genreSignal.includes("downtempo")
        ? briefingCopy("spacious drift", "räumliches Driften")
        : briefingCopy("the track rhythm", "den Rhythmus des Tracks");

    if (styleSignal.includes("vhs") || styleSignal.includes("analog") || styleSignal.includes("dusty")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: Imperfektion sollte auf ${genreBehavior} reagieren. Körnung, Bleeding und optischer Zerfall müssen ${emotionalBehavior} tragen, statt nur als Filter darüberzuliegen.`
      : `Creative Assessment: Imperfection should respond to ${genreBehavior}. Grain, bleed and optical decay must carry ${emotionalBehavior}, not sit on top as a filter.`;
    }

    if (styleSignal.includes("chrome") || styleSignal.includes("reflection") || styleSignal.includes("glass")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: Reflektierende Oberflächen sollten ${sonicBehavior} in Lichtverhalten übersetzen. Highlights und Spiegel müssen Rhythmus, Druck und ${emotionalBehavior} sichtbar machen.`
      : `Creative Assessment: Reflective surfaces should translate ${sonicBehavior} into light behavior. Highlights and mirrors must reveal rhythm, pressure and ${emotionalBehavior}.`;
    }

    if (styleSignal.includes("editorial") || styleSignal.includes("fashion")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: Editorial-Licht sollte ${genreBehavior} in klare visuelle Gesten übersetzen. Kontrast, Pose und Reveal müssen von ${emotionalBehavior} geprägt wirken.`
      : `Creative Assessment: Editorial light should turn ${genreBehavior} into decisive visual gestures. Contrast, pose and reveal must feel shaped by ${emotionalBehavior}.`;
    }

    if (styleSignal.includes("velvet") || styleSignal.includes("dark")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: Dunkelheit sollte ${sonicBehavior} aufnehmen. Textur, Schatten und Negativraum müssen ${emotionalBehavior} tragen, statt zu leerer Atmosphäre zu werden.`
      : `Creative Assessment: Darkness should absorb ${sonicBehavior}. Texture, shadow and negative space must hold ${emotionalBehavior} instead of becoming empty atmosphere.`;
    }

    return language === "Deutsch"
    ? `Kreative Einschätzung: Der visuelle Stil sollte ${genreBehavior}, ${sonicBehavior} und ${emotionalBehavior} über das gesamte Reel in Materialverhalten übersetzen.`
    : `Creative Assessment: The visual style should convert ${genreBehavior}, ${sonicBehavior} and ${emotionalBehavior} into material behavior across the reel.`;
  })();

  const directorGrammarIntelligence = (() => {
    const { directorSignal, styleSignal, genreSignal, moodSignal, bpmNumber } = creativeContext;

    if (!directorMode) {
      return briefingCopy("Waiting for director grammar.", "Regielogik ausstehend.");
    }

    const cameraEnergy =
      bpmNumber >= 130
        ? briefingCopy("pressure-driven movement", "druckgetriebene Bewegung")
        : bpmNumber >= 118
        ? briefingCopy("controlled camera momentum", "kontrollierten Kamerafluss")
        : briefingCopy("patient observational movement", "ruhige beobachtende Bewegung");

    const materialInfluence =
      styleSignal.includes("chrome") || styleSignal.includes("reflection")
        ? briefingCopy("reflections should guide framing and reveal timing", "Reflexionen sollten Framing und Reveal-Timing führen")
        : styleSignal.includes("vhs") || styleSignal.includes("analog")
        ? briefingCopy("camera grammar should allow imperfection, drift and optical memory", "die Kamerasprache sollte Imperfektion, Drift und optische Erinnerung zulassen")
        : styleSignal.includes("velvet") || styleSignal.includes("dark")
        ? briefingCopy("framing should protect darkness, negative space and restraint", "das Framing sollte Dunkelheit, Negativraum und Zurückhaltung bewahren")
        : briefingCopy("visual material should determine how the camera discovers the subject", "das visuelle Material sollte bestimmen, wie die Kamera das Motiv entdeckt");

    const sonicInfluence =
      genreSignal.includes("techno")
        ? briefingCopy("movement should feel mechanical and disciplined", "Bewegung sollte mechanisch und diszipliniert wirken")
        : genreSignal.includes("house")
        ? briefingCopy("movement should preserve groove and body rhythm", "Bewegung sollte Groove und Körperrhythmus bewahren")
        : briefingCopy("movement should follow the track\'s internal pressure", "Bewegung sollte der inneren Spannung des Tracks folgen");

    if (directorSignal.includes("neo noir") || directorSignal.includes("sci-fi") || directorSignal.includes("sci fi")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: ${directorMode} sollte ${cameraEnergy} bewusst statt zufällig wirken lassen. ${materialInfluence}; ${sonicInfluence}.`
      : `Creative Assessment: ${directorMode} should make ${cameraEnergy} feel intentional, not random. ${materialInfluence}; ${sonicInfluence}.`;
    }

    if (directorSignal.includes("analog") || directorSignal.includes("memory")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: ${directorMode} sollte die Kamera wie ein Erinnerungsmedium behandeln. ${materialInfluence}; das Timing muss ${moodSignal || "den emotionalen Ton"} respektieren.`
      : `Creative Assessment: ${directorMode} should treat the camera like a memory device. ${materialInfluence}; pacing must respect ${moodSignal || "the emotional tone"}.`;
    }

    if (directorSignal.includes("spatial") || directorSignal.includes("architecture")) {
      return language === "Deutsch"
      ? `Kreative Einschätzung: ${directorMode} sollte Raumlogik vor Nahaufnahme-Spektakel priorisieren. Kamerabewegung muss sichtbar machen, wie Klang, Material und Raum einander beeinflussen.`
      : `Creative Assessment: ${directorMode} should prioritize room logic over close-up spectacle. Camera movement must reveal how sound, material and space affect each other.`;
    }

    return language === "Deutsch"
    ? `Kreative Einschätzung: ${directorMode} sollte die klanglichen und materiellen Entscheidungen in Kameraverhalten, präzises Framing und Reveal-Timing übersetzen.`
    : `Creative Assessment: ${directorMode} should translate the sonic and material decisions into camera behavior, framing discipline and reveal timing.`;
  })();

  const worldLogicIntelligence = (() => {
    const { dnaSignal, eraSignal, styleSignal, directorSignal, genreSignal, moodSignal } = creativeContext;

    if (!styleDNA || !era) {
      return briefingCopy("Waiting for world logic.", "Bildwelt ausstehend.");
    }

    const eraBehavior =
      eraSignal.includes("ancient")
        ? briefingCopy("time should feel mythic, ritualized and older than technology", "Zeit sollte mythisch, ritualisiert und älter als Technologie wirken")
        : eraSignal.includes("future") || eraSignal.includes("2090")
        ? briefingCopy("time should feel engineered, speculative and physically transformed", "Zeit sollte konstruiert, spekulativ und physisch transformiert wirken")
        : eraSignal.includes("chrome") || eraSignal.includes("millennium")
        ? briefingCopy("time should feel polished, synthetic and culturally over-designed", "Zeit sollte poliert, synthetisch und kulturell überinszeniert wirken")
        : eraSignal.includes("vhs") || eraSignal.includes("analog")
        ? briefingCopy("time should feel degraded, remembered and imperfect", "Zeit sollte degradiert, erinnert und unvollkommen wirken")
        : briefingCopy("the selected era should define the world\'s visual laws", "die gewählte Ära sollte die visuellen Gesetze der Welt definieren");

    const dnaBehavior =
      dnaSignal.includes("noir")
        ? briefingCopy("the world should hide information through shadow, reflection and partial visibility", "die Welt sollte Informationen durch Schatten, Reflexion und partielle Sichtbarkeit verbergen")
        : dnaSignal.includes("dream")
        ? briefingCopy("the world should follow emotional logic instead of realism", "die Welt sollte einer emotionalen Logik statt dem Realismus folgen")
        : dnaSignal.includes("luxury")
        ? briefingCopy("the world should communicate status through restraint, material control and silence", "die Welt sollte Status durch Zurückhaltung, Materialkontrolle und Stille vermitteln")
        : dnaSignal.includes("tokyo") || dnaSignal.includes("chrome")
        ? briefingCopy("the world should feel dense, reflective and technologically saturated", "die Welt sollte dicht, reflektierend und technologisch gesättigt wirken")
        : briefingCopy("the cinematic DNA should control atmosphere, architecture and behavior", "die Cinematic DNA sollte Atmosphäre, Architektur und Verhalten steuern");

    const materialBehavior =
      styleSignal.includes("chrome") || styleSignal.includes("reflection")
        ? briefingCopy("surfaces must behave like active storytelling devices", "Oberflächen müssen als aktive Mittel des Storytellings funktionieren")
        : styleSignal.includes("vhs") || styleSignal.includes("analog")
        ? briefingCopy("imperfection must become part of the world physics", "Imperfektion muss Teil der Physik dieser Welt werden")
        : styleSignal.includes("dark") || styleSignal.includes("velvet")
        ? briefingCopy("darkness must define what the viewer is allowed to understand", "Dunkelheit muss bestimmen, was das Publikum verstehen darf")
        : briefingCopy("materials must reinforce the world\'s internal rules", "Materialien müssen die inneren Regeln der Welt verstärken");

    const directorBehavior =
      directorSignal.includes("minimal") || directorSignal.includes("monumental")
        ? briefingCopy("camera logic should make the world feel larger than the subject", "die Kameralogik sollte die Welt größer als das Motiv wirken lassen")
        : directorSignal.includes("noir") || directorSignal.includes("sci")
        ? briefingCopy("camera logic should reveal the world through controlled fragments", "die Kameralogik sollte die Welt durch kontrollierte Fragmente enthüllen")
        : briefingCopy("camera logic should expose how the world behaves under pressure", "die Kameralogik sollte zeigen, wie sich die Welt unter Druck verhält");

    return language === "Deutsch"
    ? `Kreative Einschätzung: ${styleDNA} in ${era} sollte eine Welt schaffen, in der ${eraBehavior}. ${dnaBehavior}; ${materialBehavior}; ${directorBehavior}.`
    : `Creative Assessment: ${styleDNA} in ${era} should create a world where ${eraBehavior}. ${dnaBehavior}; ${materialBehavior}; ${directorBehavior}.`;
  })();

  const releaseObjectiveIntelligence = (() => {
    const { purposeSignal, genreSignal, moodSignal, directorSignal } = creativeContext;

    if (!reelPurpose) {
      return briefingCopy("Waiting for release objective.", "Release-Ziel ausstehend.");
    }

    const purposeBehavior =
      purposeSignal.includes("identity")
        ? briefingCopy("the reel should make the artist recognizable before it explains anything", "das Reel sollte den Artist wiedererkennbar machen, bevor es etwas erklärt")
        : purposeSignal.includes("teaser") || purposeSignal.includes("launch")
        ? briefingCopy("the reel should create anticipation without resolving the full idea", "das Reel sollte Erwartung erzeugen, ohne die gesamte Idee aufzulösen")
        : purposeSignal.includes("canvas")
        ? briefingCopy("the reel should become a hypnotic loop that strengthens track memory", "das Reel sollte zu einem hypnotischen Loop werden, der die Wiedererkennbarkeit des Tracks stärkt")
        : purposeSignal.includes("festival")
        ? briefingCopy("the reel should communicate scale, impact and instant visual readability", "das Reel sollte Größe, Wirkung und unmittelbare visuelle Lesbarkeit vermitteln")
        : purposeSignal.includes("editorial") || purposeSignal.includes("campaign")
        ? briefingCopy("the reel should feel campaign-ready, intentional and visually ownable", "das Reel sollte kampagnenreif, bewusst gestaltet und visuell eigenständig wirken")
        : purposeSignal.includes("video")
        ? briefingCopy("the reel should seed a larger music-video world without revealing everything", "das Reel sollte eine größere Musikvideo-Welt anlegen, ohne alles vorwegzunehmen")
        : briefingCopy("the reel should serve the selected release goal with a clear creative function", "das Reel sollte dem gewählten Release-Ziel mit einer klaren kreativen Funktion dienen");

    const emotionalStrategy =
      moodSignal.includes("hypnotic")
        ? briefingCopy("Repetition should become the retention mechanism.", "Wiederholung sollte zum Mechanismus für Wiedererkennung werden.")
        : moodSignal.includes("tense")
        ? briefingCopy("Unresolved pressure should hold attention.", "Ungelöste Spannung sollte die Aufmerksamkeit halten.")
        : moodSignal.includes("nocturnal")
        ? briefingCopy("Intimacy and atmosphere should create recognition.", "Intimität und Atmosphäre sollten Wiedererkennbarkeit schaffen.")
        : moodSignal.includes("euphoric")
        ? briefingCopy("Release and lift should create shareability.", "Auflösung und Auftrieb sollten Teilbarkeit fördern.")
        : briefingCopy("The emotional tone should define what the viewer remembers.", "Der emotionale Ton sollte bestimmen, was dem Publikum in Erinnerung bleibt.");

    const formatStrategy =
      genreSignal.includes("techno")
        ? briefingCopy("Keep the visual system disciplined and physical.", "Halte das visuelle System diszipliniert und physisch.")
        : genreSignal.includes("house")
        ? briefingCopy("Keep the visual system warm, rhythmic and body-led.", "Halte das visuelle System warm, rhythmisch und körpergeführt.")
        : directorSignal.includes("minimal")
        ? briefingCopy("Keep the concept precise, iconic and stripped of excess.", "Halte das Konzept präzise, ikonisch und frei von Überfluss.")
        : briefingCopy("Keep the final creative signal easy to understand within seconds.", "Halte das finale kreative Signal innerhalb weniger Sekunden verständlich.");

    return language === "Deutsch"
    ? `Kreative Einschätzung: Für ${reelPurpose} gilt: ${purposeBehavior}. ${emotionalStrategy} ${formatStrategy}`
    : `Creative Assessment: For ${reelPurpose}, ${purposeBehavior}. ${emotionalStrategy} ${formatStrategy}`;
  })();

  const selectedDirector =
    directorModes.find((mode) => mode.name === directorMode) ||
    directorModes?.[0];

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const matrixTests = {
      1: {
        genre: "Techno",
        mood: "Lonely Neon",
        style: "Neon Rain Noir",
        directorMode: "Neo Noir Sci-Fi",
        styleDNA: "Blade Runner Noir",
        era: "Near-Future Editorial",
        reelPurpose: "Track Launch Teaser",
      },
      2: {
        genre: "Downtempo",
        mood: "Warm Cinematic Hope",
        style: "Soft Grain Cinema",
        directorMode: "Indie Realism",
        styleDNA: "Golden Hour Melancholy",
        era: "Timeless Cinema",
        reelPurpose: "Artist Identity Reel",
      },
      3: {
        genre: "Future Garage",
        mood: "Cold Futurism",
        style: "Cold Digital Gloss",
        directorMode: "Cyberpunk Motion",
        styleDNA: "Neo Tokyo",
        era: "Chrome Millennium",
        reelPurpose: "Social Teaser Hook",
      },
      4: {
        genre: "Deep House",
        mood: "Luxury Calm",
        style: "Wet Chrome Reflections",
        directorMode: "Luxury Sci-Fi",
        styleDNA: "Chrome Dreams",
        era: "Modern Luxury",
        reelPurpose: "Luxury Brand Mood Film",
      },
      5: {
        genre: "Melodic House",
        mood: "Hypnotic Motion",
        style: "Mirror Room Glow",
        directorMode: "Symmetry Cinema",
        styleDNA: "Sacred Geometry",
        era: "Minimal Future",
        reelPurpose: "Spotify Canvas Direction",
      },
      6: {
        genre: "Ambient",
        mood: "Surreal Stillness",
        style: "Pearl Light Minimalism",
        directorMode: "Spatial Architecture",
        styleDNA: "Cathedral Light",
        era: "Ancient Future",
        reelPurpose: "Album World Reveal",
      },
      7: {
        genre: "Minimal House",
        mood: "Tense Anticipation",
        style: "Concrete Noir",
        directorMode: "Monumental Minimalism",
        styleDNA: "Concrete Dreamscape",
        era: "Near-Future Editorial",
        reelPurpose: "Live Visual Intro",
      },
      8: {
        genre: "Organic House",
        mood: "Mystic Wonder",
        style: "Holographic Mist",
        directorMode: "Submerged Noir",
        styleDNA: "Underwater Cathedral",
        era: "Ancient Future",
        reelPurpose: "Music Video Concept Seed",
      },
      9: {
        genre: "Electronic Pop",
        mood: "Confident Arrival",
        style: "Editorial Flash",
        directorMode: "Editorial Fashion Film",
        styleDNA: "Editorial Fashion Film",
        era: "Y2K Digital Gloss",
        reelPurpose: "Editorial Campaign Cut",
      },
      10: {
        genre: "Lo-Fi House",
        mood: "Soft Nostalgia",
        style: "Dusty Film Memory",
        directorMode: "Analog Memory",
        styleDNA: "Pearl Archive",
        era: "Polaroid Memory",
        reelPurpose: "Spotify Canvas Direction",
      },
      11: {
        genre: "Indie Dance",
        mood: "Dreamlike Suspense",
        style: "Golden Hour Surrealism",
        directorMode: "Surreal Dream Cinema",
        styleDNA: "Dreamscape",
        era: "Early Internet Dream",
        reelPurpose: "Music Video Concept Seed",
      },
      12: {
        genre: "Afro House",
        mood: "Emotional Lift",
        style: "Solar Haze",
        directorMode: "Poetic Documentary",
        styleDNA: "Desert Mirage",
        era: "1970s Analog Film",
        reelPurpose: "Festival Visual Moment",
      },
      13: {
        genre: "Trance",
        mood: "Dark Elegance",
        style: "Silver Smoke",
        directorMode: "Minimal Ritual Cinema",
        styleDNA: "Obsidian Ritual",
        era: "Mythic Past",
        reelPurpose: "Artist Identity Reel",
      },
      14: {
        genre: "House",
        mood: "Euphoric Release",
        style: "High Fashion Blur",
        directorMode: "Gloss Music Video",
        styleDNA: "Luxury Underground",
        era: "1990s Music Video",
        reelPurpose: "Track Launch Teaser",
      },
    };

    window.fillFrameLabMatrixTest = (testNumber) => {
      const normalizedTestNumber =
        typeof testNumber === "string" && testNumber.trim() !== ""
          ? Number(testNumber)
          : testNumber;

      const isValidTest =
        Number.isInteger(normalizedTestNumber) &&
        Object.prototype.hasOwnProperty.call(
          matrixTests,
          normalizedTestNumber
        );

      if (!isValidTest) {
        console.error(
          `Invalid Matrix Test ${testNumber}. Available tests: 1-14`
        );
        return false;
      }

      const test = matrixTests[normalizedTestNumber];

      setArtist("Aurora Wolves");
      setTrack("Northern Migration");
      setBpm("120");

      setGenre(test.genre);
      setMood(test.mood);
      setStyle(test.style);
      setDirectorMode(test.directorMode);
      setStyleDNA(test.styleDNA);
      setEra(test.era);
      setReelPurpose(test.reelPurpose);

      console.log(
        `FrameLab Matrix Test ${normalizedTestNumber} state update requested. Verify the UI before Generate.`
      );

      return true;
    };

    return () => {
      delete window.fillFrameLabMatrixTest;
    };
  }, []);


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

      const fullPackage = item.full_package || item.fullPackage || null;
      const fullPackageResult =
        fullPackage &&
        typeof fullPackage === "object" &&
        !Array.isArray(fullPackage) &&
        fullPackage.type === "generate_reel" &&
        fullPackage.schema_version === 1 &&
        fullPackage.result &&
        typeof fullPackage.result === "object" &&
        !Array.isArray(fullPackage.result)
          ? fullPackage.result
          : null;
      const fullPackageProject =
        (fullPackage && fullPackage.generated_project) ||
        fullPackageResult?.generatedProject ||
        {};

      const reopenedArtist =
        fullPackageProject.artist ||
        item.artist ||
        titleParts[0] ||
        "Velvet Mirage";
      const reopenedTrack =
        fullPackageProject.track ||
        item.track ||
        titleParts[1] ||
        "After Midnight";
      const reopenedDirector =
        fullPackageProject.director_mode ||
        fullPackageProject.directorMode ||
        item.director_mode ||
        item.directorMode ||
        directorModes?.[0]?.name ||
        "Neo Noir Sci-Fi";
      const reopenedStyleDNA =
        fullPackageProject.cinematic_dna ||
        fullPackageProject.styleDNA ||
        fullPackageProject.style_dna ||
        item.style_dna ||
        item.styleDNA ||
        "Neo Tokyo";
      const reopenedEra =
        fullPackageProject.era ||
        (item.era === "Y2K"
          ? "Y2K Digital Gloss"
          : item.era || "Y2K Digital Gloss");
      const reopenedReelPurpose =
        fullPackageProject.reel_purpose ||
        fullPackageProject.reelPurpose ||
        item.reel_purpose ||
        item.reelPurpose ||
        item.result?.reelPurpose ||
        "Artist Identity Reel";

      setArtist(reopenedArtist);
      setTrack(reopenedTrack);
      setGenre(fullPackageProject.genre || item.genre || "Melodic House");
      setBpm(fullPackageProject.bpm || item.bpm || "122");
      setMood(fullPackageProject.mood || item.mood || "");
      setStyle(
        fullPackageProject.visual_style ||
          fullPackageProject.style ||
          item.style ||
          ""
      );
      setDirectorMode(reopenedDirector);
      setStyleDNA(reopenedStyleDNA);
      setEra(reopenedEra);
      setReelPurpose(reopenedReelPurpose);

      setResult(fullPackageResult || {
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
    if (!mounted) return ui.common.loading;
    if (loading) return ui.common.generating;

    if (!isSignedIn) return ui.generate.createAccount;

    if (userPlan === "pro") return ui.generate.generatePro;
    if (userPlan === "standard") return ui.generate.generateStandard;

    if (userPlan === "free") {
      if (remainingCredits === null) return ui.common.loading;
      if (remainingCredits > 0) {
        return ui.generate.generateCredits.replace(
          "{count}",
          String(remainingCredits)
        );
      }
      return ui.generate.upgradeMonthly;
    }

    return ui.generate.generateReel;
  }

  async function handleUpgrade() {
    if (userPlan === "pro") {
      alert(ui.common.alreadyPro);
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
      alert(ui.common.checkoutFailed);
    }
  }

  async function handleManageSubscription() {
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Failed to open subscription management"
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Manage subscription error:", error);
      alert(
        error.message || "Failed to open subscription management"
      );
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
        alert(data.message || data.error || ui.generate.thumbnailFailed);
        return;
      }

      if (data.thumbnailImage) {
        setThumbnailImage(data.thumbnailImage);
      }
    } catch (error) {
      console.error(error);
      alert(ui.generate.thumbnailFailed);
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

    let generationRequestId = null;

    if (userPlan === "free") {
      if (!generationRequestIdRef.current) {
        generationRequestIdRef.current =
          globalThis.crypto.randomUUID();
      }

      generationRequestId =
        generationRequestIdRef.current;
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
          language,
          bpm,
          genre,
          mood,
          visualStyle: style,
          styleDNA,
          directorMode,
          era,
          reelPurpose,
          userReelVision,
          generationRequestId,
        }),
            });

      const responseContentType =
        response.headers.get("content-type") || "";

      const responseText = await response.text();
      const responseBodyPreview = responseText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);

      let data = null;
      let responseParseError = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          responseParseError = error;
        }
      }

      if (
        response.status === 403 &&
        data?.code === "FREE_CREDITS_EXHAUSTED"
      ) {
        generationRequestIdRef.current = null;
        window.location.href =
          "/pricing?reason=credits-used";
        return;
      }

      if (
        !response.ok &&
        data?.code === "premium_preservation_not_passed"
      ) {
        const isEvaluationFailure =
          data?.evaluationStatus === "evaluation_failure";

        const preservationStatus =
          typeof data?.preservationStatus === "string"
            ? data.preservationStatus.trim()
            : "";

        const hasObservedRegularNonPass =
          !isEvaluationFailure &&
          preservationStatus.length > 0 &&
          preservationStatus !== "pass" &&
          preservationStatus !== "uncertain";

        const preservationMessage = isEvaluationFailure
          ? "FrameLab couldn't safely verify this result, so it wasn't returned. You can choose whether to generate again."
          : hasObservedRegularNonPass
          ? "This result didn't receive a preservation pass, so FrameLab didn't return it. You can choose whether to generate again."
          : "Generation couldn't be completed, and FrameLab didn't return this result. You can choose whether to generate again.";

        console.error("Generate preservation check blocked output:", {
          status: response.status,
          code: data?.code || null,
          evaluationStatus:
            data?.evaluationStatus || null,
          preservationStatus:
            data?.preservationStatus || null,
          uncertainFields:
            data?.uncertainFields || [],
          errorCode:
            data?.errorCode || null,
        });

        alert(preservationMessage);
        return;
      }

      if (!response.ok) {
        const serverMessage =
          data?.message ||
          data?.error ||
          "Unexpected non-JSON response from server";

        console.error("Generate API request failed:", {
          status: response.status,
          contentType: responseContentType,
          bodyPreview: responseBodyPreview,
          parseError: responseParseError?.message || null,
        });

        alert(
          `Generation failed (${response.status}): ${serverMessage}`
        );
        return;
      }

      if (
        responseParseError ||
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        console.error("Generate API returned invalid JSON:", {
          status: response.status,
          contentType: responseContentType,
          bodyPreview: responseBodyPreview,
          parseError: responseParseError?.message || null,
        });

        alert(
          `Generation failed (${response.status}): Invalid JSON response from server`
        );
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
        formatIntent: data.formatIntent || null,
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

      const fullPackage = {
        type: "generate_reel",
        schema_version: 1,
        generated_project: {
          artist,
          track,
          genre,
          bpm,
          mood,
          visual_style: style,
          director_mode: directorMode,
          cinematic_dna: styleDNA,
          era,
          reel_purpose: reelPurpose,
        },
        result: newResult,
        saved_at: new Date().toISOString(),
      };

      setResult(newResult);
      generationRequestIdRef.current = null;

      if (userPlan === "free") {
        try {
          const creditsRes = await fetch(
            `/api/credits?ts=${Date.now()}`,
            {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          );

          const creditsData =
            await creditsRes.json();

          if (
            creditsRes.ok &&
            typeof creditsData.remaining === "number"
          ) {
            setRemainingCredits(
              creditsData.remaining
            );
          }
        } catch (creditRefreshError) {
          console.error(
            "Credit refresh failed:",
            creditRefreshError
          );
        }
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
              fullPackage,
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
      alert(error.message || ui.generate.generationFailed);
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

${result?.formatIntent
  ? `══════════════════════
FORMAT INTENT
══════════════════════

FORMAT: ${result.formatIntent.format || ""}
PURPOSE: ${result.formatIntent.purpose || ""}
COMPOSITION PRIORITY: ${result.formatIntent.compositionPriority || ""}

`
  : ""}══════════════════════
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
      "linear-gradient(180deg, rgba(18,18,16,0.96) 0%, rgba(10,11,13,0.98) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 30px 120px rgba(0,0,0,0.55), 0 0 70px rgba(216,181,106,0.08)",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#090A0C",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <style jsx global>{globalCss}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            backgroundImage: 'url("/framelab-premium-generate-assets/09_framelab_generate_Hero.png")',
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(5,5,6,0.96) 0%, rgba(5,5,6,0.78) 36%, rgba(5,5,6,0.30) 68%, rgba(5,5,6,0.10) 100%), linear-gradient(180deg, rgba(5,5,6,0.06) 35%, rgba(5,5,6,0.92) 100%)",
          }}
        />


      </div>

      <main
        className="generate-content"
        style={{
          ...mainStyle,
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          background: "transparent",
          position: "relative",
          zIndex: 1,
        }}
      >
        <section
          style={{
            width: "100%",
            paddingTop: "32px",
            paddingBottom: "80px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "0 72px",
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                color: "#D8B56A",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                textAlign: "left",
                marginBottom: "22px",
              }}
            >
              CINEMATIC AI REEL GENERATOR
            </p>

            <h1
              className="generate-title"
              style={{
                color: "#F6F3EB",
                fontSize: "72px",
                lineHeight: "0.95",
                textAlign: "left",
                margin: "0",
                maxWidth: "720px",
                fontWeight: "900",
                letterSpacing: "-0.05em",
                textShadow: "0 8px 36px rgba(0,0,0,0.58)",
              }}
            >
              {ui.generate.headline}
            </h1>

            <p
              style={{
                color: "#a1a1aa",
                fontSize: "19px",
                textAlign: "left",
                maxWidth: "650px",
                margin: "24px 0 0",
                lineHeight: "1.6",
              }}
            >
              Build premium reel concepts, cinematic AI video prompts, visual
              direction systems and export-ready creative packages.
            </p>
          </div>

          <div
            style={{
              width: "calc(100% - 72px)",
              maxWidth: "1180px",
              margin: "52px 0 0 72px",
              boxSizing: "border-box",
              padding: "28px",
              borderRadius: "32px",
              background:
                "linear-gradient(180deg, rgba(22,23,25,0.94), rgba(10,11,13,0.98))",
              border: "1px solid rgba(216,181,106,0.18)",
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
                  padding: "34px",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(180deg, rgba(10,11,13,0.98), rgba(6,7,9,0.99))",
                  border: "1px solid rgba(216,181,106,0.18)",
                  boxShadow:
                    "0 32px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.035)",
                }}
              >
                <div
                  style={{
                    color: "#E7CC91",
                    fontSize: "10px",
                    fontWeight: "900",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "15px",
                  }}
                >
                  {ui.generate.briefEyebrow}
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: "32px",
                    lineHeight: "1.08",
                    letterSpacing: "-0.04em",
                    fontWeight: "900",
                    maxWidth: "700px",
                  }}
                >
                  {ui.generate.briefHeadline}
                </h3>

                <p
                  style={{
                    marginTop: "14px",
                    marginBottom: "30px",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "15px",
                    lineHeight: "1.65",
                    maxWidth: "760px",
                  }}
                >
                  {ui.generate.briefSupporting}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(max(180px, calc((100% - 24px) / 3)), 1fr))",
                      alignItems: "stretch",
                    gap: "18px",
                  }}
                >
                  {[
                    {
                      id: "identity",
                      image: "/framelab-premium-generate-assets/01_Identity_Profile.png",
                      title: ui.generate.briefIdentityTitle,
                      signal: ui.generate.briefIdentitySignal,
                      status: artist && track ? ui.generate.briefIdentityReady : ui.generate.briefWaiting,
                    },
                    {
                      id: "sonic",
                      image: "/framelab-premium-generate-assets/03_Sonic_Profile.png",
                      title: ui.generate.briefSonicTitle,
                      signal: ui.generate.briefSonicSignal,
                      status: genre && bpm && mood ? ui.generate.briefSonicReady : ui.generate.briefWaiting,
                    },
                    {
                      id: "material",
                      image: "/framelab-premium-generate-assets/02_Visual_Language.png",
                      title: ui.generate.briefMaterialTitle,
                      signal: ui.generate.briefMaterialSignal,
                      status: style ? ui.generate.briefMaterialReady : ui.generate.briefWaiting,
                    },
                    {
                      id: "director",
                      image: "/framelab-premium-generate-assets/04_Director_Logic.png",
                      title: ui.generate.briefDirectorTitle,
                      signal: ui.generate.briefDirectorSignal,
                      status: directorMode ? ui.generate.briefDirectorReady : ui.generate.briefWaiting,
                    },
                    {
                      id: "world",
                      image: "/framelab-premium-generate-assets/05_Visual_World.png",
                      title: ui.generate.briefWorldTitle,
                      signal: ui.generate.briefWorldSignal,
                      status: styleDNA && era ? ui.generate.briefWorldReady : ui.generate.briefWaiting,
                    },
                    {
                      id: "release",
                      image: "/framelab-premium-generate-assets/06_Release_Objective.png",
                      title: ui.generate.briefReleaseTitle,
                      signal: ui.generate.briefReleaseSignal,
                      status: reelPurpose ? ui.generate.briefReleaseReady : ui.generate.briefWaiting,
                    },
                  ].map((item) => {
                    const isPrimary =
                      item.id === "identity" || item.id === "director";

                    return (
                      <div
                        key={item.title}
                        style={{
                          padding: "0 20px 21px",
                          borderRadius: "16px",
                          background:
                            "linear-gradient(180deg, rgba(24,25,27,0.96), rgba(16,17,19,0.98))",
                          border: "1px solid rgba(216,181,106,0.12)",
                          boxShadow:
                            "0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.035)",
                          position: "relative",
                          overflow: "hidden",
                          display: "block",
                        }}
                      >
                        <div
                          aria-hidden="true"
                          style={{
                            position: "relative",
                            height: "148px",
                            margin: "0 -20px 18px",
                            overflow: "hidden",
                            background: "#111214",
                          }}
                        >
                          <img
                            src={item.image}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "block",
                              objectFit: "cover",
                              objectPosition: "center",
                              transform: "scale(1.025)",
                              opacity: 0.82,
                            }}
                          />

                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, rgba(8,9,11,0.04) 0%, rgba(8,9,11,0.18) 48%, rgba(16,17,19,0.96) 100%)",
                            }}
                          />

                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(110deg, rgba(216,181,106,0.10), transparent 38%, rgba(0,0,0,0.12) 78%)",
                              mixBlendMode: "screen",
                              opacity: 0.42,
                            }}
                          />
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                            flex: isPrimary ? "1.12 1 150px" : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "999px",
                                background: "#D8B56A",
                                boxShadow: "0 0 14px rgba(216,181,106,0.55)",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                color: "#E7CC91",
                                fontSize: "9px",
                                fontWeight: "950",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                              }}
                            >
                              {item.status || "Online"}
                            </span>
                          </div>

                          <div
                            style={{
                              color: "#f5f3ff",
                              fontSize: "15px",
                              fontWeight: "900",
                              marginBottom: "8px",
                              letterSpacing: "-0.015em",
                            }}
                          >
                            {item.title}
                          </div>

                          <div
                            style={{
                              color: "rgba(255,255,255,0.62)",
                              fontSize: "12px",
                              lineHeight: "1.6",
                              fontWeight: "600",
                            }}
                          >
                            {item.signal}
                          </div>
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                            flex: isPrimary ? "0.88 1 150px" : undefined,
                          }}
                        >

                          {item.id === "identity" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {identityEngineIntelligence}
                        </div>
                      )}

                          {item.id === "material" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {materialLanguageIntelligence}
                        </div>
                      )}

                          {item.id === "sonic" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {sonicPressureIntelligence}
                        </div>
                      )}

                          {item.id === "director" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {directorGrammarIntelligence}
                        </div>
                      )}

                          {item.id === "release" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {releaseObjectiveIntelligence}
                        </div>
                      )}

                          {item.id === "world" && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "11px 12px 11px 14px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.18)",
                            borderLeft: "2px solid rgba(216,181,106,0.28)",
                            color: "rgba(255,255,255,0.76)",
                            fontSize: "10px",
                            lineHeight: "1.55",
                            fontWeight: "650",
                            minHeight: "auto",
                          }}
                        >
                          {worldLogicIntelligence}
                        </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                aria-hidden="true"
                style={{
                  gridColumn: "1 / -1",
                  height: "1px",
                  margin: "10px 0 8px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(216,181,106,0.20) 18%, rgba(216,181,106,0.20) 82%, transparent)",
                }}
              />

              <div>
                <FieldLabel>{ui.generate.artistName}</FieldLabel>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Velvet Mirage"
                  style={inputStyle}
                />
              </div>

              <div>
                <FieldLabel>{ui.generate.trackName}</FieldLabel>
                <input
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder="e.g. After Midnight"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.genre}</FieldLabel>
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

              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.bpm}</FieldLabel>
                <input
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="122"
                  style={inputStyle}
                />
              </div>

                <div>
                  <FieldLabel>{ui.generate.mood}</FieldLabel>
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
                  <FieldLabel>{ui.generate.visualStyle}</FieldLabel>
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
              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.directorMode}</FieldLabel>
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

              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.cinematicDNA}</FieldLabel>
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

              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.era}</FieldLabel>
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

              <div
                style={{
                  paddingTop: "18px",
                  marginTop: "6px",
                  borderTop: "1px solid rgba(216,181,106,0.10)",
                }}
              >
                <FieldLabel>{ui.generate.reelPurpose}</FieldLabel>
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

              <div>
                <FieldLabel>{ui.generate.reelVisionOptional}</FieldLabel>
                <textarea
                  value={userReelVision}
                  onChange={(e) => setUserReelVision(e.target.value)}
                  maxLength={600}
                  rows={4}
                  placeholder="1–3 sentences: describe the scene, moment, relationship, action, or feeling you want FrameLab to professionally direct."
                  style={{
                    ...selectStyle,
                    minHeight: "112px",
                    resize: "vertical",
                    lineHeight: "1.5",
                  }}
                />
              </div>
              
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "24px",
                  borderRadius: "26px",
                  background:
                    "radial-gradient(circle at top left, rgba(216,181,106,0.10), rgba(255,255,255,0.035) 62%)",
                  border: "1px solid rgba(216,181,106,0.14)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
                }}
              >
                <FieldLabel>{ui.generate.selectedDirectorIntelligence}</FieldLabel>

                <div
                  className="creative-grid director-intelligence-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.85fr 1.05fr 1.1fr",
                    gap: "18px",
                    alignItems: "stretch",
                    marginTop: "12px",
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
                          background:
                            selectedDirector?.accent ||
                            "linear-gradient(180deg, rgba(20,21,23,0.92), rgba(10,11,13,0.96))",
                          color: "white",
                          fontWeight: "900",
                          fontSize: "18px",
                          boxShadow:
                            "0 0 0 1px rgba(216,181,106,0.24), 0 12px 32px rgba(0,0,0,0.28)",
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
                          {selectedDirector?.category || ui.generate.directorMode}
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
                          color: "#E7CC91",
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
                                background: "rgba(216,181,106,0.10)",
                                border: "1px solid rgba(216,181,106,0.14)",
                                color: "#E7CC91",
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
                          color: "#E7CC91",
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
                    "radial-gradient(circle at top left, rgba(216,181,106,0.10), rgba(255,255,255,0.025) 65%)",
                  border: "1px solid rgba(216,181,106,0.14)",
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
                        color: "#E7CC91",
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
                            color: "#E7CC91",
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
                        color: "#E7CC91",
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
                            color: "#E7CC91",
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
                    : "linear-gradient(90deg, #B88A3B, #E7CC91)",
                color: loading || !mounted ? "white" : "#17130C",
                fontWeight: "950",
                fontSize: "16px",
                cursor: loading || !mounted ? "not-allowed" : "pointer",
                boxShadow:
                  loading || !mounted
                    ? "none"
                    : "0 18px 60px rgba(216,181,106,0.30)",
              }}
            >
              {getButtonText()}
            </button>
            
            {isSignedIn && userPlan === "free" && (
              <p
                style={{
                  marginTop: "12px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.88)",
                  fontSize: "13px",
                }}
              >
                {ui.generate.freeCreditsLeft}: {remainingCredits} / 2
              </p>
            )}

            {isSignedIn && userPlan !== "pro" && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  onClick={handleUpgrade}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#E7CC91",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {ui.generate.upgradePro}
                </button>
              </div>
            )}

            {userPlan === "pro" && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  style={{
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    color: "#E7CC91",
                    textDecoration: "underline",
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: "14px",
                  }}
                >
                  {ui.common.manageSubscription}
                </button>
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
                    "linear-gradient(180deg, rgba(18,18,16,0.96) 0%, rgba(10,11,13,0.98) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 30px 120px rgba(0,0,0,0.55), 0 0 70px rgba(216,181,106,0.10)",
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
                    borderTop: "3px solid #D8B56A",
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
                    boxShadow: "0 0 36px rgba(216,181,106,0.14)",
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
                    "radial-gradient(circle at top, rgba(216,181,106,0.07), rgba(10,11,13,0.96) 70%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 20px 70px rgba(0,0,0,0.28)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#E7CC91",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >{ui.generate.exportPackage}</div>

                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: "14px",
                    marginBottom: "22px",
                  }}
                >{ui.generate.exportDescription}</p>

                <button
                  className="premium-export-button"
                  style={{
                    ...copyButton,
                    width: "100%",
                    maxWidth: "420px",
                    height: "46px",
                    background:
                      "linear-gradient(90deg, #B88A3B 0%, #D8B56A 50%, #E7CC91 100%)",
                    color: "#17130C",
                    boxShadow:
                      "0 0 30px rgba(216,181,106,0.24), 0 10px 35px rgba(0,0,0,0.35)",
                  }}
                  onClick={() => setShowExportModal(true)}
                >
                  {ui.generate.exportCenter}
                </button>
              </div>

              <ResultSectionHeader
                eyebrow={ui.generate.conceptFoundation}
                title={ui.generate.creativeCore}
                description={ui.generate.creativeCoreDescription}
              />

              <OutputCard t={t} title={ui.generate.reelConcept} text={result.concept} />

              <OutputCard t={t}
                title={ui.generate.cinematicIdentity}
                text={buildCinematicIdentityText(result.cinematicIdentity)}
              />

              {result.formatIntent && (
                <OutputCard t={t}
                  title={ui.generate.formatIntent}
                  text={`FORMAT: ${result.formatIntent.format || ""}
PURPOSE: ${result.formatIntent.purpose || ""}
COMPOSITION PRIORITY: ${result.formatIntent.compositionPriority || ""}`}
                />
              )}

              <OutputCard t={t}
                title={ui.generate.directorsNotes}
                text={result.directorSummary}
              />

              <OutputCard t={t} title={ui.generate.narrativeArc} text={result.narrativeArc} />

              <ResultSectionHeader
                eyebrow={ui.generate.productionBlueprint}
                title={ui.generate.aiVideoDirection}
                description={ui.generate.aiVideoDescription}
              />

              <OutputCard t={t}
                title={ui.generate.cinematicSequence}
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
                  <div
                    style={{
                      position: "relative",
                      marginTop: "38px",
                      paddingTop: "28px",
                      background:
                        "linear-gradient(180deg, rgba(216,181,106,0.045) 0%, rgba(216,181,106,0.012) 42%, rgba(216,181,106,0) 100%)",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "1px",
                        background:
                          "linear-gradient(90deg, rgba(216,181,106,0) 0%, rgba(216,181,106,0.58) 18%, rgba(216,181,106,0.22) 72%, rgba(216,181,106,0) 100%)",
                        boxShadow: "0 0 24px rgba(216,181,106,0.14)",
                      }}
                    />
                    <ResultSectionHeader
                      eyebrow={ui.generate.socialDelivery}
                      title={ui.generate.platformPackage}
                      description={ui.generate.platformDescription}
                    />
                  </div>

                  {[
                    result.caption,
                    result.instagramCaption,
                    result.tiktokCaption,
                    result.shortsCaption,
                  ].some((value) => String(value || "").trim()) && (
                    <OutputCard t={t}
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
                    <OutputCard t={t}
                      title={ui.generate.hookVariants}
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

                  <OutputCard t={t} title={ui.generate.hashtags} text={result.hashtags} />
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
                  eyebrow={ui.generate.performanceIntelligence}
                  title={ui.generate.conceptStrengthAnalysis}
                  description={ui.generate.qualityDescription}
                />
              )}
              
              {result.viralScore && (
                <div
                  style={{
                    marginTop: "22px",
                    padding: "24px",
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      color: "#E7CC91",
                      fontSize: "11px",
                      fontWeight: "900",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    {ui.generate.viralScore}
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
                          "linear-gradient(90deg, #B88A3B, #D8B56A, #E7CC91)",
                        boxShadow: "0 0 22px rgba(216,181,106,0.20)",
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
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      color: "#E7CC91",
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
                            color: "#D8B56A",
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
              
              {(String(result.thumbnailPrompt || "").trim() || thumbnailImage) && (
                <div
                  style={{
                    marginTop: "52px",
                    paddingTop: "30px",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.006) 42%, rgba(255,255,255,0) 100%)",
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      borderRadius: "22px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <h3
                      style={{
                        color: "white",
                        marginBottom: "14px",
                        fontSize: "20px",
                      }}
                    >
                      {ui.generate.thumbnailConcept}
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
                {ui.generate.reelHistory}
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
                        "linear-gradient(180deg, rgba(20,21,23,0.96) 0%, rgba(10,11,13,0.98) 100%)",
                      border: "1px solid rgba(216,181,106,0.14)",
                      borderRadius: "28px",
                      padding: "24px",
                      marginBottom: "24px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow:
                        "0 30px 90px rgba(0,0,0,0.45), 0 0 80px rgba(216,181,106,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                  >
                    <p style={{ color: "#E7CC91", fontWeight: "bold" }}>
                      {item.artist} — {item.track}
                    </p>

                    <p style={{ color: "#c7c7c7", marginTop: "6px" }}>
                      {item.genre} • {item.bpm} BPM • {item.style}
                    </p>

                    <p
                      style={{
                        color: "#D8B56A",
                        marginTop: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {item.directorMode || ui.generate.directorMode} ·{" "}
                      {item.styleDNA || ui.generate.cinematicDNA} · {item.era || ui.generate.era}
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
                          background: "rgba(216,181,106,0.12)",
                          color: "#E7CC91",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {ui.generate.viralLabel} {item.result?.viralScore || "--"}
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
                        {item.result?.bestPlatform || ui.generate.platformNA}
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
                        {item.result?.contentType || ui.generate.contentTypeNA}
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
                        {ui.common.delete}
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
                  "linear-gradient(180deg, rgba(20,21,23,0.98), rgba(9,10,12,0.98))",
                borderRadius: "24px",
                padding: "24px",
                border: "1px solid rgba(216,181,106,0.18)",
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

              <h2 style={{ color: "white", marginBottom: "10px" }}>{ui.generate.exportPackage}</h2>

              <p
                style={{
                  color: "#a1a1aa",
                  lineHeight: "1.7",
                  fontSize: "14px",
                  marginBottom: "20px",
                }}
              >{ui.generate.exportModalDescription}</p>

                <button
                  style={{
                    ...copyButton,
                    width: "100%",
                    marginBottom: "12px",
                    background:
                      exportCopyLabel === t("Copied")
                        ? "linear-gradient(90deg, #22c55e, #86efac)"
                        : copyButton.background,
                    color: exportCopyLabel === t("Copied") ? "#07130b" : "white",
                  }}
                  onClick={async () => {
                    const copied = await copyToClipboard(buildExportText());

                    if (copied) {
                      setExportCopyLabel(t("Copied"));
                      setTimeout(
                        () =>
                          setExportCopyLabel(ui.generate.copyFullPackage),
                        1400
                      );
                    } else {
                      setExportCopyLabel(t("Copy Failed"));
                      setTimeout(
                        () =>
                          setExportCopyLabel(ui.generate.copyFullPackage),
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
                      promptCopyLabel === t("Copied")
                        ? "linear-gradient(90deg, #22c55e, #86efac)"
                        : "rgba(255,255,255,0.08)",
                    color: promptCopyLabel === t("Copied") ? "#07130b" : "white",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onClick={async () => {
                    const copied = await copyToClipboard(result?.prompt || "");

                    if (copied) {
                      setPromptCopyLabel(t("Copied"));
                      setTimeout(
                        () =>
                          setPromptCopyLabel(ui.generate.copyVideoPrompt),
                        1400
                      );
                    } else {
                      setPromptCopyLabel(t("Copy Failed"));
                      setTimeout(
                        () =>
                          setPromptCopyLabel(ui.generate.copyVideoPrompt),
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
const frameLabSynthesisIntelligence = () => {
  return {
    identity: identityEngineIntelligence,
    sonic: sonicPressureIntelligence,
    material: materialLanguageIntelligence,
    director: directorGrammarIntelligence,
    world: worldLogicIntelligence,
    release: releaseObjectiveIntelligence,
  };
};

