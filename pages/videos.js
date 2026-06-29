import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { directorModes } from "../data/directorModes";
import {
  directorStyles,
  buildCinematicPrompt,
} from "../lib/promptEngine.js";

export default function VideosPage() {
  const eyebrow = {
  color: "#a78bfa",
  letterSpacing: "4px",
  fontWeight: "700",
  marginBottom: "20px",
};

const headline = {
  fontSize: "88px",
  lineHeight: "0.95",
  fontWeight: "900",
  maxWidth: "920px",
  marginBottom: "30px",
};

const subline = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "30px",
  lineHeight: "1.7",
  maxWidth: "760px",
  marginBottom: "60px",
};

const generatorBox = {
  marginBottom: "60px",
  padding: "40px",
  borderRadius: "34px",
  minWidth: "360px",
  background:
    "linear-gradient(180deg, rgba(20,20,35,0.96), rgba(10,10,20,0.98))",
  border: "1px solid rgba(168,85,247,0.14)",
  boxShadow: "0 0 80px rgba(124,58,237,0.12)",
  backdropFilter: "blur(16px)",
};

const generatorEyebrow = {
  color: "#a78bfa",
  fontWeight: "800",
  letterSpacing: "3px",
  marginBottom: "18px",
};

const generatorHeadline = {
  fontSize: "42px",
  fontWeight: "900",
  marginBottom: "20px",
};
const audioUploadBox = {
  marginBottom: "16px",
  padding: "12px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(168,85,247,0.18)",
};

const audioUploadLabel = {
  color: "#c4b5fd",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "2px",
  marginBottom: "10px",
};

const audioInput = {
  width: "100%",
  color: "white",
};

const audioFileName = {
  marginTop: "8px",
  color: "rgba(255,255,255,0.7)",
  fontSize: "12px",
};
const moodSuggestionRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "16px",
};

const moodSuggestionChip = {
  padding: "10px 14px",
  borderRadius: "999px",
  border: "1px solid rgba(168,85,247,0.28)",
  background: "rgba(168,85,247,0.14)",
  color: "white",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  transition: "all 0.22s ease",
  boxShadow: "0 0 18px rgba(168,85,247,0.08)",
};
const hookBox = {
  marginBottom: "24px",
  padding: "24px",
  borderRadius: "24px",
  border: "1px solid rgba(168,85,247,0.16)",
  background: "rgba(168,85,247,0.08)",
};

const hookLabel = {
  color: "#a78bfa",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "2px",
  marginBottom: "12px",
};

const hookText = {
  color: "white",
  fontSize: "28px",
  fontWeight: "900",
  lineHeight: "1.1",
  maxWidth: "720px",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: "260px",
  padding: "42px",
  borderRadius: "26px",
  border: "1px solid rgba(168,85,247,0.12)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  color: "white",
  fontSize: "20px",
  lineHeight: "1.8",
  outline: "none",
  resize: "none",
  overflowY: "scroll",
  overflowX: "hidden",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  marginBottom: "30px",
  boxShadow: "inset 0 0 30px rgba(124,58,237,0.05)",
  backdropFilter: "blur(10px)",
};

const modeRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
  marginBottom: "30px",
  alignItems: "stretch",
};

const modeButton = {
  padding: "16px 20px",
  borderRadius: "999px",
  border: "1px solid rgba(168,85,247,0.18)",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
  fontSize: "14px",
  height: "112px",
  minHeight: "112px",
  maxHeight: "112px",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  textAlign: "center",
  lineHeight: "1.18",
  boxSizing: "border-box",
  overflow: "hidden",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "normal",
  hyphens: "none",
  backdropFilter: "blur(10px)",
  transition: "all 0.35s ease",
  animation: "none",
  boxShadow: "0 0 20px rgba(124,58,237,0.08)",
};

const buttonRow = {
  display: "flex",
  flexDirection: "column",
  gap: "22px",
  marginTop: "36px",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
};

const generateButton = {
  width: "100%",
  maxWidth: "720px",
  padding: "18px 28px",
  borderRadius: "999px",
  border: "none",
  background:
    "linear-gradient(90deg, #7c3aed, #c084fc)",
  color: "white",
  fontSize: "16px",
  fontWeight: "950",
  cursor: "pointer",
  transition: "all 0.22s ease",
  boxShadow:
    "0 20px 78px rgba(168,85,247,0.48), 0 0 120px rgba(168,85,247,0.20)",
  letterSpacing: "-0.02em",
  textShadow: "0 1px 12px rgba(255,255,255,0.16)",
  backdropFilter: "blur(14px)",
};

const saveButton = {
  width: "auto",
  minWidth: "180px",
  padding: "10px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(196,181,253,0.18)",
  background: "rgba(124,58,237,0.08)",
  color: "#d8b4fe",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer",
};

const resultBox = {
  marginTop: "30px",
  padding: "28px",
  borderRadius: "28px",
  backdropFilter: "blur(16px)",
};

const resultEyebrow = {
  color: "#c4b5fd",
  fontWeight: "800",
  marginBottom: "14px",
};

const resultTitle = {
  fontSize: "36px",
  fontWeight: "900",
  marginBottom: "14px",
  letterSpacing: "-1px",
};

const resultMeta = {
  color: "rgba(255,255,255,0.7)",
};

const expandedPromptText = {
  marginTop: "24px",
  color: "#d8ccff",
  lineHeight: "1.9",
  fontSize: "15px",
  whiteSpace: "pre-wrap",
  padding: "22px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(168,85,247,0.12)",
  fontFamily: "monospace",
};

const shotMetaBadge = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(168,85,247,0.12)",
  color: "rgba(255,255,255,0.72)",
  fontSize: "11px",
  fontWeight: "800",
};
const shotsTitle = {
  color: "#a78bfa",
  fontWeight: "800",
  marginBottom: "18px",
  letterSpacing: "2px",
};

const shotCard = {
  padding: "28px",
  borderRadius: "24px",
  marginBottom: "18px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  border: "1px solid rgba(168,85,247,0.18)",
  boxShadow: "0 0 40px rgba(124,58,237,0.12)",
  backdropFilter: "blur(16px)",
  transition: "all 0.3s ease",
  position: "relative",
overflowY: "auto",
overflowX: "hidden",
};

const shotLabel = {
  color: "#c084fc",
  fontWeight: "900",
  marginBottom: "14px",
  letterSpacing: "3px",
  fontSize: "11px",
  textTransform: "uppercase",
  
};
const shotValue = {
  color: "white",
  fontSize: "14px",
  lineHeight: "1.6",
  fontWeight: "600",
};

const premiumCopyButton = {
  width: "auto",
  minWidth: "138px",
  height: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(168,85,247,0.36)",
  background:
    "linear-gradient(180deg, rgba(168,85,247,0.18), rgba(76,29,149,0.24))",
  color: "#f5f3ff",
  fontSize: "12px",
  fontWeight: "850",
  letterSpacing: "0.01em",
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(168,85,247,0.12)",
  whiteSpace: "nowrap",
};

const premiumCopyButtonCopied = {
  ...premiumCopyButton,
  border: "1px solid rgba(134,239,172,0.48)",
  background:
    "linear-gradient(90deg, rgba(34,197,94,0.92), rgba(134,239,172,0.88))",
  color: "#07130b",
  boxShadow: "0 0 20px rgba(34,197,94,0.18)",
};

const premiumSecondaryButton = {
  ...premiumCopyButton,
  minWidth: "154px",
  border: "1px solid rgba(196,181,253,0.24)",
  background: "rgba(255,255,255,0.055)",
  color: "#e9d5ff",
  boxShadow: "none",
};

const shotText = {
  color: "white",
  fontSize: "16px",
  lineHeight: "1.8",
  fontWeight: "500",
  maxWidth: "900px",
};

const heroVideoBox = {
  position: "relative",
  borderRadius: "34px",
  overflow: "hidden",
  marginBottom: "40px",
};

const heroVideo = {
  width: "100%",
  height: "520px",
  objectFit: "contain",
  background: "#000",
  display: "block",
};

const videoOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.18) 100%)",
  zIndex: 1,
};

const videoText = {
  position: "absolute",
  bottom: "40px",
  left: "40px",
  zIndex: 2,
};

const featuredLabel = {
  color: "#c4b5fd",
  fontWeight: "800",
  letterSpacing: "3px",
  marginBottom: "16px",
};

const featuredHeadline = {
  fontSize: "72px",
  lineHeight: "0.92",
  fontWeight: "900",
  maxWidth: "820px",
  letterSpacing: "-2px",
  textShadow: "0 0 40px rgba(124,58,237,0.25)",
};

const grid = {
  display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(280px, 320px))",
justifyContent: "center",
  gap: "24px",
};

const reelCard = {
  borderRadius: "32px",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(168,85,247,0.12)",
  transition: "0.35s ease",
  cursor: "pointer",
  boxShadow: "0 0 40px rgba(124,58,237,0.08)",
  backdropFilter: "blur(12px)",
};

const reelPreview = {
  height: "240px",
  background: `
    radial-gradient(circle at top, rgba(168,85,247,0.35), transparent 60%),
    linear-gradient(180deg, rgba(25,25,40,0.2), rgba(5,5,10,1))
  `,
  position: "relative",
  overflow: "hidden",
};

const reelTitle = {
  fontSize: "34px",
  marginBottom: "14px",
  fontWeight: "900",
};

const reelText = {
  color: "rgba(255,255,255,0.65)",
  lineHeight: "1.7",
};

const loadingBox = {
  marginTop: "30px",
  padding: "40px",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
};

const loadingText = {
  color: "white",
  fontSize: "18px",
  fontWeight: "700",
};

const loadingBar = {
  width: "100%",
  height: "12px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.07)",
  marginTop: "22px",
  border: "1px solid rgba(168,85,247,0.18)",
};

const loadingProgress = {
  width: "68%",
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #22d3ee 100%)",
  boxShadow: "0 0 28px rgba(168,85,247,0.45)",
  animation: "pulse 1.8s ease-in-out infinite",
};
const spinner = {
  width: "60px",
  height: "60px",
  border: "4px solid rgba(255,255,255,0.1)",
  borderTop: "4px solid #a855f7",
  borderRadius: "999px",
  animation: "spin 1s linear infinite",
};

const router = useRouter();

useEffect(() => {
  if (!router.isReady) return;

  if (router.query.prompt) {
    setPrompt(router.query.prompt || "");
  }
}, [router.isReady]);

const { user } = useUser();

const [activeVideo, setActiveVideo] = useState(null);
const [prompt, setPrompt] = useState("");
const [shotSequence, setShotSequence] = useState([]);
const [audioFile, setAudioFile] = useState(null);
const [audioAnalysis, setAudioAnalysis] = useState(null);
const [audioAnalyzing, setAudioAnalyzing] = useState(false);
const [audioAnalysisError, setAudioAnalysisError] = useState("");
const [visualReferenceFile, setVisualReferenceFile] = useState(null);
const [visualReferencePreview, setVisualReferencePreview] = useState("");
const [visualReferenceType, setVisualReferenceType] = useState("portrait");
const [visualReferenceDragging, setVisualReferenceDragging] = useState(false);
const [visualReferenceError, setVisualReferenceError] = useState("");
const [moodSuggestions, setMoodSuggestions] = useState([]);
const [selectedMode, setSelectedMode] = useState("Neo Noir Sci-Fi");
const [userPlan, setUserPlan] = useState("free");
const [credits, setCredits] = useState(3);

useEffect(() => {
  async function loadPlan() {
    try {
      const res = await fetch("/api/me-plan");
      const data = await res.json();
      setUserPlan(data.plan || "free");
    } catch (error) {
      console.error("PLAN LOAD ERROR:", error);
    }
  }

  loadPlan();
}, []);
const activeDirector = directorModes.find(
  (mode) => mode.name === selectedMode
);

const isPremiumMode = activeDirector?.premium;

const hasAccess =
  userPlan === "pro"
    ? true
    : userPlan === "standard"
    ? !isPremiumMode
    : !isPremiumMode;
          const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedShots, setGeneratedShots] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [expandedPrompt, setExpandedPrompt] = useState("");
  const [showFullBlueprint, setShowFullBlueprint] = useState(false);
  const [displayedPrompt, setDisplayedPrompt] = useState("");
  const [shots, setShots] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Blueprint");
  const [shotCopyLabel, setShotCopyLabel] = useState("Copy Director Notes");
  const [assetCopyLabel, setAssetCopyLabel] = useState("");
  const [shotPromptCopyLabel, setShotPromptCopyLabel] = useState("Copy AI Video Prompt");
  const [selectedShot, setSelectedShot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [generatedHook, setGeneratedHook] = useState("");
  const [productionAssets, setProductionAssets] = useState(null);
  const [directorSummary, setDirectorSummary] = useState("");

useEffect(() => {
  const reopenPrompt = localStorage.getItem("reopenPrompt");
  const reopenMode = localStorage.getItem("reopenMode");
  const reopenImage = localStorage.getItem("reopenImage");
    const reopenGeneration = localStorage.getItem("reopenGeneration");

if (reopenGeneration) {
  const parsedGeneration = JSON.parse(reopenGeneration);

  setPrompt(parsedGeneration.prompt || "");
  setExpandedPrompt(parsedGeneration.expanded_prompt || parsedGeneration.prompt || "");
  setSelectedMode(parsedGeneration.director_mode || "Neo Tokyo");
  setVideoUrl(parsedGeneration.video_url || "");
  setGenerated(true);

  if (parsedGeneration.director_summary) {
    setDirectorSummary(parsedGeneration.director_summary);
  }

  if (parsedGeneration.production_assets) {
    setProductionAssets(parsedGeneration.production_assets);
  }

  if (parsedGeneration.shots?.length > 0) {
    setGeneratedShots(parsedGeneration.shots);
    setShots(parsedGeneration.shots);
  }

  localStorage.removeItem("reopenGeneration");
  return;
}

if (reopenPrompt && !reopenPrompt.includes("cinematic shots generated")) {
  setPrompt(reopenPrompt);
  setExpandedPrompt(reopenPrompt);
  setGenerated(true);

  localStorage.setItem(
    "framelabActiveProject",
    reopenPrompt.slice(0, 42) || "Untitled Project"
  );
}

if (reopenPrompt?.includes("cinematic shots generated")) {
  localStorage.removeItem("reopenPrompt");
}

  if (reopenMode) {
    setSelectedMode(reopenMode);
  }

  if (reopenImage) {
    setVideoUrl(reopenImage);
  }

const savedPrompt = localStorage.getItem("activePrompt");

if (
  !reopenPrompt &&
  savedPrompt &&
  !savedPrompt.includes("cinematic shots generated")
) {
  setPrompt(savedPrompt);
}
}, []);
const reels = [
  {
    title: "Neo Tokyo Nights",
    mode: "Neo Tokyo",
    video: "/videos/neo-tokyo.mp4",
  },
  {
    title: "Chrome Dreams",
    mode: "Chrome Dreams",
    video: "/videos/chrome-dreams.mp4",
  },
  {
    title: "Blade Runner",
    mode: "Blade Runner",
    video: "/videos/blade-runner.mp4",
  },
  {
    title: "Sacred Geometry",
    mode: "Sacred Geometry",
    video: "/videos/sacred-geometry.mp4",
  },
];
const selectedDirectorMode = directorModes.find(
  (mode) => mode.name === selectedMode
);
const visualRules = selectedDirectorMode?.visualRules;

const accentColor = selectedDirectorMode?.accent || "#7c3aed";
function startTypingEffect(text) {
  setDisplayedPrompt("");

  let index = 0;

  const typingInterval = setInterval(() => {
    index += 4;

    setDisplayedPrompt(text.slice(0, index));

    if (index >= text.length) {
      clearInterval(typingInterval);
    }
  }, 18);
}


function handleVisualReferenceUpload(file) {
  if (!file) return;

  if (!file.type || !file.type.startsWith("image/")) {
    setVisualReferenceError("Please upload a portrait, product or mood image.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setVisualReferenceError("Image is too large. Please use an image under 10 MB.");
    return;
  }

  if (visualReferencePreview) {
    URL.revokeObjectURL(visualReferencePreview);
  }

  const previewUrl = URL.createObjectURL(file);

  setVisualReferenceFile(file);
  setVisualReferencePreview(previewUrl);
  setVisualReferenceType("portrait");
  setVisualReferenceError("");
}

function clearVisualReference(event) {
  event.preventDefault();
  event.stopPropagation();

  if (visualReferencePreview) {
    URL.revokeObjectURL(visualReferencePreview);
  }

  setVisualReferenceFile(null);
  setVisualReferencePreview("");
  setVisualReferenceType("portrait");
  setVisualReferenceError("");
}

async function analyzeAudioReference(file) {
  if (!file) return;

  setAudioFile(file);
  setAudioAnalysis(null);
  setAudioAnalysisError("");
  setMoodSuggestions([]);
  setAudioAnalyzing(true);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Audio analysis is not supported in this browser.");
    }

    const audioContext = new AudioContextClass();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;

    const blockSize = Math.max(1024, Math.floor(channelData.length / 600));
    const energyFrames = [];

    let rmsTotal = 0;
    let peak = 0;
    let frameCount = 0;

    for (let i = 0; i < channelData.length; i += blockSize) {
      let sum = 0;
      let samples = 0;

      for (let j = i; j < Math.min(i + blockSize, channelData.length); j++) {
        const value = channelData[j];
        sum += value * value;
        peak = Math.max(peak, Math.abs(value));
        samples += 1;
      }

      const frameRms = Math.sqrt(sum / Math.max(samples, 1));
      energyFrames.push(frameRms);
      rmsTotal += frameRms;
      frameCount += 1;
    }

    const averageRms = rmsTotal / Math.max(frameCount, 1);

    let onsetCount = 0;

    for (let i = 1; i < energyFrames.length; i++) {
      const previous = energyFrames[i - 1];
      const current = energyFrames[i];

      if (current > averageRms * 1.25 && current > previous * 1.35) {
        onsetCount += 1;
      }
    }

    const onsetsPerMinute =
      duration > 0 ? Math.round((onsetCount / duration) * 60) : 0;

    const energyLabel =
      averageRms > 0.14 || peak > 0.88
        ? "High"
        : averageRms > 0.07 || peak > 0.55
        ? "Medium"
        : "Low";

    const rhythmLabel =
      onsetsPerMinute > 105
        ? "Fast rhythmic pulse"
        : onsetsPerMinute > 65
        ? "Controlled mid-tempo pulse"
        : "Slow atmospheric pulse";

    const durationLabel =
      duration >= 60
        ? `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`
        : `${Math.round(duration)}s`;

    const blueprintInfluence =
      energyLabel === "High" || rhythmLabel === "Fast rhythmic pulse"
        ? "Use clearer hook timing, shorter holds, stronger motion accents and faster transitions while keeping every shot readable."
        : energyLabel === "Medium"
        ? "Use balanced pacing, controlled camera movement, tactile detail pauses and measured transitions."
        : "Use slow holds, restrained camera motion, longer detail moments and a more atmospheric final frame.";

    const editRhythm =
      energyLabel === "High" || rhythmLabel === "Fast rhythmic pulse"
        ? `Open with a readable hook frame.
Move quickly into subject focus.
Cut into tactile detail on the first strong pulse.
Land the hero image with clear impact.
Use controlled motion accents.
Resolve before the sequence becomes visually crowded.`
        : energyLabel === "Medium"
        ? `Start with a clear atmospheric setup.
Move into subject focus with measured timing.
Pause briefly for tactile detail.
Land the hero frame with controlled emphasis.
Build motion through visible change.
Resolve with a clean final memory frame.`
        : `Start with a patient visual hold.
Move into subject focus slowly.
Let the tactile detail breathe.
Hold the hero image longer.
Use minimal motion and soft transitions.
Resolve with a restrained final memory frame.`;

    const motionLanguage =
      energyLabel === "High" || rhythmLabel === "Fast rhythmic pulse"
        ? "controlled rhythmic motion with readable pulse-driven accents"
        : energyLabel === "Medium"
        ? "measured cinematic movement shaped by the audio rhythm"
        : "slow restrained camera movement shaped by the audio atmosphere";

    const musicDirection = `Audio Reference · ${durationLabel} · ${energyLabel} Energy · ${rhythmLabel}`;

    setAudioAnalysis({
      fileName: file.name,
      duration,
      durationLabel,
      sampleRate,
      averageRms,
      peak,
      onsetCount,
      onsetsPerMinute,
      energyLabel,
      rhythmLabel,
      blueprintInfluence,
      editRhythm,
      motionLanguage,
      musicDirection,
    });

    await audioContext.close();
  } catch (error) {
    console.error("Audio analysis error:", error);
    setAudioAnalysisError(
      "Audio could not be analyzed locally. The blueprint will continue without audio influence."
    );
  } finally {
    setAudioAnalyzing(false);
  }
}

async function handleGenerate() {
  if (userPlan === "free" && credits <= 0) {
  router.push("/pricing?reason=credits-used");
  return;
}

  if (isPremiumMode && userPlan !== "pro") {
  router.push("/pricing?reason=generate-premium");
  return;
}
if (!hasAccess) {
  router.push("/pricing?reason=premium-director");
  return;
}

  setSaved(false);
  setGenerated(false);
  setGenerating(true);
  setSelectedShot(null);
  setExpandedPrompt("");
  setDisplayedPrompt("");

const sourceVision =
  prompt && prompt.trim()
    ? prompt.trim()
    : "A luxury fashion campaign in Neo Tokyo during neon rain. Slow cinematic camera movement, reflective streets, emotional narration, premium visual atmosphere.";

const cinematicPrompt = buildCinematicPrompt(sourceVision, selectedMode);
const sequenceShots = generateShotSequence(selectedMode, sourceVision);

setShots(sequenceShots);
const openingTitles = [
  "Neon Arrival",
  "Future Echo",
  "Silent Horizon",
  "Chrome Cathedral",
  "Electric Memory",
  "Midnight Signal",
  "Glass Skyline",
  "Lost Frequency",
];
  const directorTitles = {
"Blade Runner": {
  opening: [
    "Neon Witness",
    "Rain Memory",
    "Electric Fugitive",
    "Chrome Ghost",
    "Synthetic Echo",
    "Last Broadcast",
  ],

  second: [
    "Replicant Close-Up",
    "Noir Reflection",
    "Artificial Desire",
    "Rainlit Face",
    "Memory Implant",
    "Silent Interrogation",
  ],

  third: [
    "Wet Asphalt Detail",
    "Neon Texture",
    "Glass Reflection",
    "Synthetic Skin",
    "Electric Smoke",
    "Chrome Fragment",
  ],

  fourth: [
    "The Runner Appears",
    "Shadow Pursuit",
    "Noir Encounter",
    "Dystopian Hero",
    "Final Chase",
    "City Hunter",
  ],

  fifth: [
    "Rainfall Acceleration",
    "Neon Drift",
    "Hovercar Signal",
    "Cybernetic Pulse",
    "Streetlight Motion",
    "Electric Escape",
  ],

  sixth: [
    "Tears in Neon",
    "Last City Light",
    "Synthetic Goodbye",
    "Memory Fade",
    "Final Broadcast",
    "Dystopian Silence",
  ],
},

A24: {
  opening: [
    "Kitchen Silence",
    "Window Light",
    "The Last Look",
    "Sunday Memory",
    "Quiet Departure",
    "Unspoken Goodbye",
  ],

  second: [
    "Unspoken Face",
    "Bedroom Stillness",
    "Family Table",
    "Soft Eye Contact",
    "Private Moment",
    "Held Breath",
  ],

  third: [
    "Curtain Texture",
    "Dust in Window Light",
    "Hands on Fabric",
    "Quiet Detail",
    "Empty Chair",
    "Faded Photograph",
  ],

  fourth: [
    "The Decision",
    "Silent Breakdown",
    "Last Conversation",
    "Emotional Threshold",
    "The Realization",
    "Human Distance",
  ],

  fifth: [
    "Slow Walk Home",
    "Hallway Drift",
    "Breathing Room",
    "Soft Motion",
    "Passing Time",
    "Muted Movement",
  ],

  sixth: [
    "After the Goodbye",
    "The Room Remains",
    "Final Window Light",
    "Quiet Ending",
    "Memory of Sunday",
    "Unfinished Silence",
  ],
},
"Neo Tokyo": {
  opening: [
    "Rainlit Skyline",
    "Mirror District",
    "Neon Arrival",
    "Signal Atmosphere",
    "Zero District",
    "Digital Horizon",
  ],

  second: [
    "Silent Witness",
    "Cyber Dream",
    "Signal Receiver",
    "Digital Shadow",
    "Neon Encounter",
    "Ghost Interface",
  ],

  third: [
    "Liquid Detail",
    "Chrome Reflection",
    "Circuit Texture",
    "Hologram Fragment",
    "Electric Surface",
    "Synthetic Pattern",
  ],

  fourth: [
    "Shadow Presence",
    "Rainlit Silhouette",
    "The Messenger",
    "Ghost Operator",
    "Urban Figure",
    "Neon Icon",
  ],

  fifth: [
    "Controlled Drift",
    "Elegant Orbit",
    "Rainlit Sweep",
    "Mirror Motion",
    "Neon Flow",
    "City Glide",
  ],

  sixth: [
    "Infinite Goodbye",
    "Final Horizon",
    "Signal Fade",
    "Digital Afterglow",
    "Last Transmission",
    "Neon Memory",
  ],
},  
"Chrome Dreams": {
  opening: [
    "Liquid Silver",
    "Crystal Horizon",
    "Titanium Bloom",
    "Mirror Pulse",
    "Luxury Resonance",
    "Velvet Reflection",
  ],

  second: [
    "Polished Desire",
    "Luxury Close-Up",
    "Chrome Reflection",
    "Elegant Surface",
    "Premium Gaze",
    "Mirror Detail",
  ],

  third: [
    "Metallic Texture",
    "Glass Detail",
    "Silk Reflection",
    "Carbon Pattern",
    "Crystal Fragment",
    "Liquid Surface",
  ],

  fourth: [
    "The Hero Product",
    "Luxury Reveal",
    "Fashion Icon",
    "Premium Silhouette",
    "Chrome Emblem",
    "The Centerpiece",
  ],

  fifth: [
    "Smooth Reveal",
    "Orbiting Chrome",
    "Luxury Motion",
    "Reflective Drift",
    "Premium Sweep",
    "Metallic Flow",
  ],

  sixth: [
    "Final Reflection",
    "Luxury Afterglow",
    "Mirror Fade",
    "Chrome Goodbye",
    "Last Shine",
    "Elegant Ending",
  ],
},
"Sacred Geometry": {
  opening: [
    "Golden Alignment",
    "Infinite Mandala",
    "Cosmic Bloom",
    "Sacred Reflection",
    "Divine Geometry",
    "Eternal Pattern",
  ],

  second: [
    "Hidden Mandala",
    "Golden Pulse",
    "Divine Reflection",
    "Infinite Bloom",
    "Celestial Alignment",
    "Cosmic Seed",
  ],

  third: [
    "Sacred Pattern",
    "Geometry Flow",
    "Golden Structure",
    "Fractal Memory",
    "Light Architecture",
    "Symmetry Detail",
  ],

  fourth: [
    "The Initiate",
    "Guardian of Light",
    "Cosmic Observer",
    "The Alchemist",
    "Sacred Presence",
    "The Oracle",
  ],

  fifth: [
    "Energy Ascension",
    "Golden Resonance",
    "Celestial Activation",
    "Quantum Harmony",
    "Divine Frequency",
    "Infinite Expansion",
  ],

  sixth: [
    "Eternal Return",
    "Sacred Completion",
    "Infinite Light",
    "Cosmic Memory",
    "Final Alignment",
    "Golden Departure",
  ],
},
};
const directorShotSystems = {
  "Blade Runner": {
    cameras: [
      "Slow noir tracking shot",
      "Rain-soaked street dolly",
      "Low angle neon silhouette",
      "Atmospheric wide establishing shot",
      "Reflective close-up movement",
      "Slow cyberpunk push-in",
    ],
    movements: [
  "Slow cinematic dolly",
  "Rain-soaked drift",
  "Atmospheric push-in",
  "Noir tracking motion",
  "Reflective orbit",
  "Slow cyberpunk glide",
],

    lenses: [
      "35mm anamorphic",
      "50mm noir prime",
      "24mm dystopian wide",
      "70mm cinematic scope",
      "85mm reflective portrait",
      "Vintage sci-fi lens",
    ],
    lighting: [
      "Neon rain reflections",
      "Dark ambient shadows",
      "Blue violet haze",
      "High contrast noir lighting",
      "Wet street glow",
      "Dystopian backlight",
    ],
  },

A24: {
  cameras: [
    "Handheld emotional framing",
    "Static intimate close-up",
    "Slow natural push-in",
    "Soft observational movement",
    "Human eye-level framing",
    "Quiet cinematic hold",
  ],

  movements: [
    "Subtle handheld drift",
    "Slow emotional push-in",
    "Observational camera hold",
    "Natural human movement",
    "Quiet cinematic tracking",
    "Gentle documentary motion",
  ],

  lenses: [
    "50mm cinematic prime",
    "35mm natural lens",
    "85mm emotional portrait",
    "40mm documentary lens",
    "Vintage film lens",
    "Soft indie cinema lens",
  ],

  lighting: [
    "Soft natural light",
    "Window light atmosphere",
    "Warm practical lighting",
    "Muted film realism",
    "Gentle shadow falloff",
    "Soft grainy daylight",
  ],
},

"Neo Tokyo": {
  cameras: [
    "Controlled neon tracking shot",
    "Slow anime-style push-in",
    "Floating cyberpunk camera drift",
    "Measured street pan",
    "Elegant neon camera sweep",
    "Rain reflection dolly",
  ],

  movements: [
    "Slow neon drift",
    "Controlled anime motion",
    "Cyberpunk hover motion",
    "Measured city sweep",
    "Elegant orbit movement",
    "Rain-soaked tracking glide",
  ],

  lenses: [
    "24mm anime wide",
    "35mm cyberpunk anamorphic",
    "50mm neon prime",
    "70mm futuristic scope",
    "Wide controlled motion lens",
    "Stylized cinematic lens",
  ],

  lighting: [
    "Purple blue neon glow",
    "Rain reflections",
    "Cyberpunk sign light",
    "Electric cyan highlights",
    "Tokyo street glow",
    "Anime contrast lighting",
  ],
},

"Chrome Dreams": {
  cameras: [
    "Wide luxury establishing shot",
    "Medium product composition",
    "Macro reflective detail shot",
    "Hero portrait framing",
    "Symmetrical geometric frame",
    "Final cinematic wide shot",
  ],

  movements: [
    "Slow cinematic dolly",
    "Controlled reveal motion",
    "Floating luxury drift",
    "Elegant orbital move",
    "Premium camera sweep",
    "Smooth final pullback",
  ],

  lenses: [
    "70mm luxury scope",
    "50mm premium prime",
    "85mm fashion lens",
    "35mm reflective lens",
    "IMAX sci-fi lens",
    "Clean commercial lens",
  ],

  lighting: [
    "Chrome reflections",
    "Soft metallic highlights",
    "Luxury studio glow",
    "High fashion lighting",
    "Sleek sci-fi reflections",
    "Premium rim light",
  ],
},

"Sacred Geometry": {
  cameras: [
    "Floating symmetrical movement",
    "Centered cosmic push-in",
    "Slow spiritual dolly",
    "Rotating geometric reveal",
    "Ethereal overhead drift",
    "Balanced ritual composition",
  ],

  movements: [
    "Slow cosmic drift",
    "Centered spiritual push-in",
    "Floating geometric orbit",
    "Rotational symmetry reveal",
    "Ethereal ascension movement",
    "Sacred cinematic glide",
  ],

  lenses: [
    "35mm symmetrical lens",
    "50mm sacred prime",
    "24mm cosmic wide",
    "70mm spiritual scope",
    "Soft ethereal lens",
    "Geometric cinematic lens",
  ],

  lighting: [
    "Ethereal glow",
    "Cosmic light patterns",
    "Soft pink atmosphere",
    "Mystical volumetric light",
    "Spiritual rim lighting",
    "Sacred geometry highlights",
  ],
},
};
const visibleDirectorShotSystems = {
  "Indie Realism": {
    cameras: [
      "Observational wide frame",
      "Intimate handheld portrait frame",
      "Soft natural detail close-up",
      "Human-centered hero portrait",
      "Controlled natural follow shot",
      "Quiet final memory frame",
    ],
    movements: [
      "Still cinematic hold",
      "Subtle handheld movement",
      "Gentle observational drift",
      "Minimal emotional hold",
      "Slow natural tracking movement",
      "Restrained final stillness",
    ],
    lenses: [
      "35mm natural lens",
      "50mm cinematic prime",
      "85mm soft portrait lens",
      "70mm intimate cinema lens",
      "40mm handheld realism lens",
      "Soft final memory lens",
    ],
    lighting: [
      "Soft natural daylight",
      "Window light atmosphere",
      "Soft grainy daylight",
      "Natural contrast on face",
      "Available light falloff",
      "Muted final ambient light",
    ],
  },

  "Neo Noir Sci-Fi": {
    cameras: [
      "Slow noir tracking shot",
      "Rain-soaked street dolly",
      "Reflective close-up movement",
      "Low-angle silhouette frame",
      "Measured noir camera sweep",
      "Slow atmospheric pullback",
    ],
    movements: [
      "Slow atmospheric reveal",
      "Smooth noir glide",
      "Controlled reflection drift",
      "Minimal silhouette hold",
      "Measured rainlit movement",
      "Restrained closing pullback",
    ],
    lenses: [
      "35mm anamorphic noir lens",
      "50mm noir prime",
      "85mm reflective detail lens",
      "70mm cinematic silhouette lens",
      "Wide controlled motion lens",
      "Vintage sci-fi closing lens",
    ],
    lighting: [
      "Neon rain reflections",
      "Dark ambient shadows",
      "Wet asphalt light falloff",
      "Low cyan backlight",
      "Rainlit street glow",
      "Dystopian final backlight",
    ],
  },
};

const visibleDirectorTitles = {
  "Indie Realism": {
    opening: [
      "Quiet Establishing",
      "Natural Light Opening",
      "Soft Room Memory",
      "First Human Frame",
      "Morning Stillness",
      "Observed Beginning",
    ],
    second: [
      "Human Detail",
      "Private Portrait",
      "Unspoken Presence",
      "Soft Eye Contact",
      "Held Expression",
      "Intimate Subject Frame",
    ],
    third: [
      "Texture of the Moment",
      "Hands and Fabric",
      "Window Light Detail",
      "Skin and Grain",
      "Quiet Physical Detail",
      "Material Stillness",
    ],
    fourth: [
      "Human Hero Frame",
      "Emotional Identity Frame",
      "Quiet Signature Portrait",
      "Natural Light Hero",
      "Intimate Poster Moment",
      "Still Human Center",
    ],
    fifth: [
      "Subtle Movement",
      "Walking Thought",
      "Soft Transition",
      "Observed Motion",
      "Natural Follow",
      "Breathing Room",
    ],
    sixth: [
      "Final Human Memory",
      "Quiet Resolution",
      "Last Natural Light",
      "Soft Closing Frame",
      "Emotional Afterimage",
      "Stillness After",
    ],
  },

  "Neo Noir Sci-Fi": {
    opening: [
      "Rainlit Establishing",
      "Noir City Threshold",
      "Wet Street Memory",
      "Dark Signal Arrival",
      "Reflective City Frame",
      "Dystopian Opening",
    ],
    second: [
      "Silent Subject",
      "Noir Presence",
      "Shadow Witness",
      "Rainlit Figure",
      "Controlled Entrance",
      "Reflective Tension",
    ],
    third: [
      "Wet Asphalt Detail",
      "Glass Reflection",
      "Neon Surface",
      "Rain Texture",
      "Shadow Detail",
      "Material Evidence",
    ],
    fourth: [
      "Rainlit Silhouette",
      "Noir Hero Frame",
      "Signal Figure",
      "Dark Identity Frame",
      "Cinematic Shadow",
      "Reflective Hero Moment",
    ],
    fifth: [
      "Measured Street Motion",
      "Rain Reflection Shift",
      "Noir Motion Build",
      "Controlled Light Sweep",
      "Shadow Movement",
      "Slow Tension Drift",
    ],
    sixth: [
      "Final Rain Memory",
      "Last Street Reflection",
      "Dystopian Afterglow",
      "Closing Noir Frame",
      "Signal Fade",
      "Final Shadow Hold",
    ],
  },
};

const coldExteriorDetectionSource = (sourceVision || "")
  .toLowerCase()
  .replace(/\bno\s+cold\b/g, "")
  .replace(/\bwithout\s+cold\b/g, "")
  .replace(/\bno\s+winter\b/g, "")
  .replace(/\bwithout\s+winter\b/g, "")
  .replace(/\bno\s+snow\b/g, "")
  .replace(/\bwithout\s+snow\b/g, "")
  .replace(/\bno\s+frost\b/g, "")
  .replace(/\bwithout\s+frost\b/g, "")
  .trim();

const shouldUseColdExteriorSystem =
  /\bcold\b|\bwinter\b|\bsnow\b|\bsnowflake\b|\bsnowflakes\b|\bsnowfall\b|\bice\b|\bicy\b|\bfrost\b|\bfrosty\b|\bfrozen\b|\barctic\b|\bfreezing\b|\bbreath vapor\b/.test(coldExteriorDetectionSource) &&
  !/\bindoor\b|\binside\b|\binterior\b|\broom\b|\bapartment\b|\bwindow light\b/.test(coldExteriorDetectionSource);

const coldExteriorShotSystem = {
  cameras: [
    "Cold exterior establishing frame",
    "Winter character portrait frame",
    "Frost detail close-up",
    "Crisp winter hero frame",
    "Snowfall motion frame",
    "Quiet frozen memory frame",
  ],
  movements: [
    "Still winter atmosphere hold",
    "Subtle cold handheld movement",
    "Slow frost detail observation",
    "Minimal winter portrait hold",
    "Controlled snowfall drift",
    "Restrained cold final stillness",
  ],
  lenses: [
    "35mm crisp winter lens",
    "50mm winter portrait prime",
    "85mm frost detail lens",
    "70mm cold cinematic portrait lens",
    "40mm snowfall movement lens",
    "Soft frozen memory lens",
  ],
  lighting: [
    "Crisp winter exterior light",
    "Cold natural portrait light",
    "Frosty low-temperature detail light",
    "Pale winter hero light",
    "Soft snowfall ambient light",
    "Muted frozen final light",
  ],
};

const selectedShotSystem = shouldUseColdExteriorSystem
  ? coldExteriorShotSystem
  : visibleDirectorShotSystems[selectedMode] ||
    directorShotSystems[selectedMode] ||
    directorShotSystems["Blade Runner"] ||
    directorShotSystems["Neo Tokyo"];

const activeTitleSet =
  visibleDirectorTitles[selectedMode] ||
  directorTitles[selectedMode] ||
  directorTitles["Blade Runner"] ||
  directorTitles["Neo Tokyo"];
  
const titleGroups = [
  activeTitleSet.opening,
  activeTitleSet.second,
  activeTitleSet.third,
  activeTitleSet.fourth,
  activeTitleSet.fifth,
  activeTitleSet.sixth,
];

const cleanSourceVision =
  sourceVision
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim() || "the source vision";

const sourceLower = cleanSourceVision.toLowerCase();

const environmentDetectionSource = sourceLower
  .replace(/\bno\s+rain\b/g, "")
  .replace(/\bno\s+rainy\b/g, "")
  .replace(/\bno\s+wet\s+streets\b/g, "")
  .replace(/\bno\s+wet\s+atmosphere\b/g, "")
  .replace(/\bno\s+storm\b/g, "")
  .replace(/\bno\s+heavy\s+weather\b/g, "")
  .replace(/\bwithout\s+rain\b/g, "")
  .replace(/\bwithout\s+wet\s+streets\b/g, "")
  .replace(/\bwithout\s+storm\b/g, "")
  .replace(/\bnot\s+rainy\b/g, "")
  .replace(/\bno\s+wind\b/g, "")
  .replace(/\bno\s+windy\b/g, "")
  .replace(/\bwithout\s+wind\b/g, "")
  .replace(/\bno\s+heat\b/g, "")
  .replace(/\bno\s+hot\s+sun\b/g, "")
  .replace(/\bwithout\s+heat\b/g, "")
  .replace(/\bno\s+cold\b/g, "")
  .replace(/\bwithout\s+cold\b/g, "")
  .trim();

const hasFashion = /\bfashion\b|\bcampaign\b|\bmodel\b|\bcouture\b|\brunway\b|\bstyling\b/.test(sourceLower);
const hasLuxury = /\bluxury\b|\bpremium\b|\belegant\b|\bhigh-end\b|\bdesigner\b/.test(sourceLower);
const hasRain = /\brain\b|\brainy\b|\bwet\b|\bstorm\b|\bwater\b/.test(environmentDetectionSource);
const hasNeon = /\bneon\b|\bcyber\b|\bfuturistic\b|\bcyberpunk\b/.test(sourceLower);
const hasTokyo = /\btokyo\b|\bneo tokyo\b|\bjapan\b|\bshibuya\b/.test(sourceLower);
const hasUrban = /\bcity\b|\bstreet\b|\burban\b|\bdistrict\b|\bskyline\b/.test(sourceLower);
const hasReflection = /\breflection\b|\breflective\b|\bmirror\b|\bchrome\b|\bglass\b/.test(sourceLower);
const hasProduct = /\bproduct\b|\bbrand\b|\bwatch\b|\bcar\b|\bshoe\b|\bperfume\b|\bjewelry\b|\bjewellery\b/.test(sourceLower);

const hasWetWorldReference =
  hasRain ||
  /\bwet\b|\brain-soaked\b|\bwet streets\b|\breflective streets\b|\bwater\b|\bstorm\b/.test(environmentDetectionSource);

const wetWorldReferenceGuidance = hasWetWorldReference
  ? " If rain, wet streets or wet atmosphere are visible, the subject and environment must react consistently through subtle damp hair, soft skin sheen, lightly damp collar or shoulders, controlled fabric response and physically believable wet surfaces."
  : "";

const hasWindWorldReference =
  /\bwind\b|\bwindy\b|\bbreeze\b|\bgust\b|\bstorm\b|\bairflow\b|\bcoastal\b|\brooftop\b/.test(environmentDetectionSource);

const hasHeatWorldReference =
  /\bhot\b|\bheat\b|\bsummer\b|\bsun\b|\bsunlight\b|\bdesert\b|\btropical\b|\bsweat\b|\bsweaty\b|\bhumid\b/.test(environmentDetectionSource);

const hasColdWorldReference =
  /\bcold\b|\bwinter\b|\bsnow\b|\bsnowflake\b|\bsnowflakes\b|\bsnowfall\b|\bice\b|\bicy\b|\bfrost\b|\bfrosty\b|\bfrozen\b|\barctic\b|\bfreezing\b|\bbreath vapor\b/.test(environmentDetectionSource);

const windWorldReferenceGuidance = hasWindWorldReference
  ? " If wind, rooftop air, breeze or exposed outdoor atmosphere are visible, the subject and environment must show clear but elegant wind response: visible wind-lifted hair strands, slightly loosened hairstyle shape, shirt collar or open neckline reacting to airflow, blazer edge or lightweight fabric moving subtly, and background grasses, dust, clouds or atmosphere leaning in the same believable wind direction. The wind response must be readable, not only implied, while staying premium and not stormy."
  : "";

const heatWorldReferenceGuidance = hasHeatWorldReference
  ? " If heat, strong sun, dry heat or humid atmosphere are visible, the subject and environment must show clear physical heat response: small visible sweat beads on the forehead, temples, upper lip or neck, stronger skin sheen, slightly flushed skin tone, squinting or heat-affected expression, open collar response, fabric lightly sticking or creasing from warmth, dry atmospheric haze, harsh sunlight behavior and baked outdoor surface feeling. The result must not look like a simple zoom or unchanged portrait."
  : "";

const coldWorldReferenceGuidance = hasColdWorldReference
  ? " If cold, snow, frost, freezing air or winter atmosphere are visible, the subject and environment must show clear physical cold response: visible breath vapor when appropriate, subtle redness on nose or cheeks, slight skin tension, frost or snow particles on hair, beard, shoulders or outerwear, cold-stiff fabric behavior, snowflakes or icy moisture interacting with the subject, frosted surfaces, crisp low-temperature air and physically believable winter atmosphere. The result must not look like a normal portrait with only a cold background."
  : "";

const environmentalPhysicalGuidance = `${wetWorldReferenceGuidance}${windWorldReferenceGuidance}${heatWorldReferenceGuidance}${coldWorldReferenceGuidance}`;

const visualReferenceLabel =
  visualReferenceType === "portrait"
    ? "Portrait / Identity Reference"
    : visualReferenceType === "product"
    ? "Product Reference"
    : "Mood / Visual Atmosphere Reference";

const visualReferenceGuidance = visualReferenceFile
  ? visualReferenceType === "portrait"
    ? `Uploaded visual reference: ${visualReferenceFile.name}
Use this image as the subject identity anchor. Preserve facial structure, eye area, hairline, hairstyle, grooming, age impression, expression cues, styling direction and subject presence as closely as possible. Do not replace the person with a generic model. Final likeness depends on the AI video tool used.${environmentalPhysicalGuidance}`
    : visualReferenceType === "product"
    ? `Uploaded visual reference: ${visualReferenceFile.name}
Use this image as the product identity anchor. Preserve product shape, material, surface behavior, proportions and premium object presence as closely as possible. Do not replace it with a generic object.`
    : `Uploaded visual reference: ${visualReferenceFile.name}
Use this image as the mood and visual atmosphere reference. Preserve lighting cues, color feeling, texture language, spatial mood and cinematic tone as closely as possible.`
  : "No visual reference uploaded. Blueprint visual direction follows the source idea and selected director system.";

const visualReferenceShotPromptBlock = visualReferenceFile
  ? visualReferenceType === "portrait"
    ? `VISUAL REFERENCE:
Use the attached or uploaded portrait reference image as the identity anchor. Preserve facial structure, hairstyle, grooming, age impression, styling direction and subject presence as closely as possible. Do not replace the subject with a generic person.${environmentalPhysicalGuidance} When using this prompt in an AI video tool, upload the same reference image there as well.`
    : visualReferenceType === "product"
    ? `VISUAL REFERENCE:
Use the uploaded product image as the object anchor. Preserve shape, material, surface behavior and product readability as closely as possible.`
    : `VISUAL REFERENCE:
Use the uploaded mood image to guide lighting, atmosphere, color feeling and cinematic tone.`
  : "";

const visualReferenceDirectorNotesBlock = visualReferenceFile
  ? `Visual Reference:
${visualReferenceLabel}
${visualReferenceGuidance}`
  : "";


const worldLabel = hasTokyo
  ? "Neo Tokyo"
  : hasUrban
  ? "the urban environment"
  : "the source world";

const subjectLabel = hasFashion
  ? hasLuxury
    ? "luxury fashion subject"
    : "fashion subject"
  : hasProduct
  ? "featured product"
  : "main subject";

const campaignLabel = hasFashion
  ? "campaign-level visual identity"
  : hasProduct
  ? "premium product identity"
  : "cinematic visual identity";

const environmentDetails = [
  hasRain ? "rain-soaked atmosphere" : null,
  hasReflection ? "mirror-like street reflections" : null,
  hasNeon ? "neon light pressure" : null,
  hasUrban || hasTokyo ? "deep urban scale" : null,
  hasLuxury ? "premium material detail" : null,
].filter(Boolean);

const environmentTexture =
  environmentDetails.length > 1
    ? `${environmentDetails.slice(0, -1).join(", ")} and ${environmentDetails[environmentDetails.length - 1]}`
    : environmentDetails[0] || "surface behavior, atmosphere, spatial depth and visual hierarchy";

const detailFocus = hasFashion
  ? "wet fabric tension, styling detail, reflected neon on skin, polished accessories and rain moving across premium surfaces"
  : hasProduct
  ? "material edges, reflections, texture, light falloff and the physical design language of the product"
  : "material texture, atmosphere, reflected light, surface response and physical detail inside the scene";

const conceptShotDescriptions = [
  `A wide opening shot reveals ${worldLabel} as a premium cinematic environment. The frame uses ${environmentTexture} to define the first visual rules before the sequence moves closer to the ${subjectLabel}.`,
  `The ${subjectLabel} enters with controlled presence. Posture, silhouette, styling, reflection and slow camera pressure turn the scene into a focused character or brand moment with campaign-level intention.`,
  `The camera isolates one concept-native detail: ${detailFocus}. The detail must prove the world is physically real, not just visually stylish.`,
  `The strongest image becomes a clean hero frame for the ${campaignLabel}: precise silhouette, controlled contrast, readable subject priority and a visual identity strong enough to sell the concept instantly.`,
  `The ${subjectLabel}, camera and ${worldLabel} shift together with purpose. Motion reveals new visual information through ${environmentTexture}, building visual tension while keeping the sequence controlled and readable.`,
  `The sequence resolves on a final memory frame where the ${subjectLabel}, atmosphere, surface behavior and composition lock into one premium image that feels intentional, complete and ready to become the closing frame.`,
];

const isLuxurySciFiProductBlueprint =
        selectedMode === "Luxury Sci-Fi" && hasProduct;

      const luxuryProductShotTitles = [
        "Chrome Studio Reveal",
        "Bottle Presence",
        "Macro Glass Detail",
        "Hero Product Frame",
        "Reflective Motion Shift",
        "Final Luxury Memory",
      ];

      const luxuryProductDescriptions = [
        "A wide opening shot reveals a dark chrome studio built around the floating perfume bottle. Soft reflections, elegant shadows and polished surfaces establish the premium product world before the camera moves closer.",
        "The premium perfume bottle becomes the clear subject. Its silhouette, cap geometry, glass thickness and suspended position create a controlled luxury presence inside the chrome studio.",
        "The camera moves into a slow macro detail: glass edge, liquid refraction, engraved surface, cap material, soft highlight falloff and reflection movement across the bottle.",
        "The strongest image becomes a clean hero product frame: the perfume bottle floating in precise alignment, chrome reflections controlled, shadows elegant and the product identity instantly readable.",
        "The perfume bottle, camera and reflected studio surfaces shift together with purpose. Slow macro motion reveals new glass distortion, shadow movement and chrome reflection changes while keeping the frame calm and premium.",
        "The sequence resolves on a final held product image where bottle silhouette, soft reflection, dark chrome atmosphere and luxury lighting lock into one memorable closing frame.",
      ];

      const luxuryProductShotLanguage = {
        cameras: [
          "Wide chrome studio reveal",
          "Slow product push-in",
          "Macro glass detail glide",
          "Locked hero product frame",
          "Controlled reflective orbit",
          "Slow final product pullback",
        ],
        movements: [
          "Slow cinematic dolly",
          "Measured macro push",
          "Elegant micro glide",
          "Minimal hero hold",
          "Controlled reflective orbit",
          "Slow luxury pullback",
        ],
        lenses: [
          "70mm luxury scope",
          "85mm product portrait lens",
          "100mm macro product lens",
          "70mm commercial hero lens",
          "100mm macro orbit lens",
          "Clean commercial lens",
        ],
        lighting: [
          "Soft chrome studio reflections",
          "Luxury glass highlight",
          "Controlled macro rim light",
          "Elegant shadow contrast",
          "Slow reflection sweep",
          "Premium final rim light",
        ],
      };

      const baseShots = conceptShotDescriptions.map((description, index) => {
        const modeHasCompleteShotSet =
          selectedDirectorMode?.shots?.length >= conceptShotDescriptions.length;

        const sourceShot = modeHasCompleteShotSet
          ? selectedDirectorMode.shots[index]
          : selectedMode === "Neo Noir Sci-Fi"
          ? null
          : selectedDirectorMode?.shots?.[index];

        const titles = titleGroups[index] || titleGroups[0];
        const title =
          isLuxurySciFiProductBlueprint
            ? luxuryProductShotTitles[index]
            : sourceShot?.title ||
              titles[Math.floor(Math.random() * titles.length)] ||
              [
                "Opening World Reveal",
                "Subject Emergence",
                "Material Detail",
                "Signature Hero Frame",
                "Controlled Progression",
                "Final Memory Image",
              ][index];

        return {
          title,
          description:
            isLuxurySciFiProductBlueprint
              ? luxuryProductDescriptions[index]
              : description ||
                sourceShot?.description ||
                "A clear cinematic production moment built from the source vision.",
          emotion:
            [
              "Anticipation",
              "Presence",
              "Tactile curiosity",
              "Impact",
              "Controlled tension",
              "Resolution",
            ][index] || "Cinematic focus",
          camera:
            isLuxurySciFiProductBlueprint
              ? luxuryProductShotLanguage.cameras[index]
              : sourceShot?.camera ||
                selectedShotSystem.cameras[
                  index % selectedShotSystem.cameras.length
                ],
          lens:
            isLuxurySciFiProductBlueprint
              ? luxuryProductShotLanguage.lenses[index]
              : sourceShot?.lens ||
                selectedShotSystem.lenses[
                  index % selectedShotSystem.lenses.length
                ],
          duration:
            sourceShot?.duration ||
            ["3s", "5s", "4s", "6s", "4s", "5s"][index % 6],
          lighting:
            isLuxurySciFiProductBlueprint
              ? luxuryProductShotLanguage.lighting[index]
              : sourceShot?.lighting ||
                selectedShotSystem.lighting[
                  index % selectedShotSystem.lighting.length
                ],
          movement:
            isLuxurySciFiProductBlueprint
              ? luxuryProductShotLanguage.movements[index]
              : sourceShot?.movement ||
                selectedShotSystem.movements[
                  index % selectedShotSystem.movements.length
                ],
        };
      });

const cinematicShotData = [
  {
    title: "Opening City Reveal",
    camera: "Wide aerial cinematic frame",
    movement: "Slow drone push forward",
    lens: "24mm anamorphic",
    lighting: "Neon fog with atmospheric haze",
    emotion: "Blade Runner",
  },

  {
    title: "Dreamlike Future",
    camera: "Medium symmetrical composition",
    movement: "Floating cinematic glide",
    lens: "50mm soft anamorphic",
    lighting: "Chrome reflections with soft bloom",
    emotion: "Chrome Dreams",
  },

  {
    title: "Sacred Light Frame",
    camera: "Wide cathedral interior shot",
    movement: "Slow upward tilt",
    lens: "35mm cinematic lens",
    lighting: "God rays through dust particles",
    emotion: "Cathedral Light",
  },

  {
    title: "Hero Noir Closeup",
    camera: "Extreme cinematic closeup",
    movement: "Slow handheld drift",
    lens: "85mm portrait lens",
    lighting: "High contrast noir lighting",
    emotion: "Hero Noir",
  },

  {
    title: "Geometric Awakening",
    camera: "Centered geometric composition",
    movement: "Slow orbital motion",
    lens: "40mm experimental lens",
    lighting: "Sacred glowing geometry",
    emotion: "Sacred Geometry",
  },

  {
    title: "Final Lonely Frame",
    camera: "Wide emotional street frame",
    movement: "Slow cinematic pullback",
    lens: "35mm anamorphic",
    lighting: "Cold dystopian night lighting",
    emotion: "Lonely Dystopia",
  },
];

  const generatedShots = baseShots.map((shot, index) => {
const camera = shouldUseColdExteriorSystem
  ? selectedShotSystem.cameras[index % selectedShotSystem.cameras.length]
  : shot.camera ||
    selectedShotSystem.cameras[index % selectedShotSystem.cameras.length];

const movement = shouldUseColdExteriorSystem
  ? selectedShotSystem.movements[index % selectedShotSystem.movements.length]
  : shot.movement ||
    selectedShotSystem.movements[index % selectedShotSystem.movements.length];

const lens = shouldUseColdExteriorSystem
  ? selectedShotSystem.lenses[index % selectedShotSystem.lenses.length]
  : shot.lens ||
    selectedShotSystem.lenses[index % selectedShotSystem.lenses.length];

const lighting = shouldUseColdExteriorSystem
  ? selectedShotSystem.lighting[index % selectedShotSystem.lighting.length]
  : shot.lighting ||
    selectedShotSystem.lighting[index % selectedShotSystem.lighting.length];

const title =
  shot.title ||
  cinematicShotData[index]?.title ||
  "Untitled Shot";

const sequenceRole = [
  "Establishing",
  "Character",
  "Detail",
  "Hero Moment",
  "Motion",
  "Final Frame",
][index % 6];

const storyPurpose = [
  "Establish the world, scale, atmosphere and visual rules immediately.",
  "Reveal the emotional subject, character energy or core human focus.",
  "Show tactile detail, material behavior or a small visual clue that deepens the idea.",
  "Deliver the signature image or strongest identity frame of the concept.",
  "Push visible movement, escalation or transition so the sequence gains momentum.",
  "Resolve the sequence with a memorable closing image that feels intentional and complete.",
][index % 6];

const editIntent = [
  "Open with clarity and atmosphere.",
  "Move closer and increase emotional readability.",
  "Slow down briefly so detail becomes meaningful.",
  "Hit the strongest visual statement cleanly.",
  "Accelerate with readable motion and direction.",
  "Land on a final image that can hold as the memory frame.",
][index % 6];

const directorInstruction = [
  "Frame the world clearly. Make the environment legible before stylization takes over.",
  "Prioritize expression, posture, gaze or subject emphasis over empty mood.",
  "Let the viewer observe texture, material response or a meaningful micro-action.",
  "Compose the shot like a poster frame: iconic, directable and visually decisive.",
  "Use motion to reveal change, not random drift. The camera must have a reason to move.",
  "Conclude with a frame that feels resolved, specific and strong enough to end the piece.",
][index % 6];

const visibleAction =
  shot.description ||
  shot.imagePrompt ||
  `${sourceVision} interpreted as a ${sequenceRole.toLowerCase()} cinematic moment.`;

return {
  ...shot,

  title,

  camera,
  movement,
  motion: movement,

  lens,
  lighting,

  sequenceRole,
  storyPurpose,
  editIntent,

  description: visibleAction,

  emotion:
    shot.emotion ||
    [
      "Anticipation",
      "Intimacy",
      "Curiosity",
      "Impact",
      "Acceleration",
      "Resolution",
    ][index % 6],

  shotPrompt: `
SEQUENCE ROLE:
${sequenceRole}

STORY PURPOSE:
${storyPurpose}

VISIBLE ACTION:
${visibleAction}

CAMERA:
${camera}

MOVEMENT:
${movement}

LENS:
${lens}

LIGHTING:
${lighting}

EDIT INTENT:
${editIntent}

DIRECTOR INSTRUCTION:
${directorInstruction}
${visualReferenceShotPromptBlock ? `

${visualReferenceShotPromptBlock}` : ""}

Keep the frame physically observable, visually specific, and ready for AI video generation.
`.trim(),

  directorNotes: `
Sequence Role:
${sequenceRole}

Story Purpose:
${storyPurpose}

Visible Priority:
${visibleAction}

Camera Strategy:
${camera}

Movement Strategy:
${movement}

Lens Strategy:
${lens}

Lighting Strategy:
${lighting}

Director Instruction:
${directorInstruction}

Edit Intent:
${editIntent}
${visualReferenceDirectorNotesBlock ? `

${visualReferenceDirectorNotesBlock}` : ""}

Avoid generic cinematic filler. Make the shot readable, directable, and causally connected to the previous and next moment.
`.trim(),
};
});
  try {
    const blueprintPreviewUrl = "";
    
    const sourceWantsSlow =
  /\bslow\b|\bcalm\b|\bcontrolled\b|\belegant\b|\bluxury\b|\bpremium\b|\bemotional\b|\bquiet\b|\bsoft\b|\bgraceful\b/.test(sourceLower);

const isLuxurySciFiProductFilm =
  selectedMode === "Luxury Sci-Fi" && hasProduct;

const voiceoverByDirector = {
  "Blade Runner":
    "The city remembers everything. Even the things we tried to forget.",

  "Neo Noir Sci-Fi":
    "Rain turns the street into memory. Every reflection hides a signal. Every shadow moves with restraint.",

  A24:
    "Some moments leave quietly. Others stay forever.",

  "Neo Tokyo": sourceWantsSlow
    ? "Neon rain turns the city into a mirror. Every step moves with control. Every reflection feels designed."
    : "Signals fade. Dreams remain.",

"Chrome Dreams":
`Perfection was never built.

It was imagined.

Forged from light,
reflection,
and impossible ambition.

Beyond technology.
Beyond design.

A glimpse of tomorrow.`,

  "Luxury Sci-Fi": isLuxurySciFiProductFilm
    ? "The perfume bottle floats in a dark chrome studio. Glass catches one soft reflection at a time. Every shadow makes the object feel more rare."
    : "Perfection moves through reflection with controlled precision.",

  "Sacred Geometry":
    "Every pattern leads back to the same light.",
};

const musicByDirector = {
  "Blade Runner": "Dark Synthwave · 82 BPM · Neon Noir",
  "Neo Noir Sci-Fi": audioAnalysis?.musicDirection || "Dark Ambient Noir · 82 BPM · Rainlit Science Fiction",
  A24: "Ambient Piano · 68 BPM · Emotional Cinema",
  "Neo Tokyo": sourceWantsSlow
    ? "Cinematic Future Ambient · 76 BPM · Neon Rain Elegance"
    : "Future Garage · 104 BPM · Controlled Anime Motion",
  "Chrome Dreams": "Luxury Synthwave · 88 BPM · Premium Future",
  "Luxury Sci-Fi": isLuxurySciFiProductFilm
    ? "Minimal Luxury Ambient · 74 BPM · Dark Chrome Product Film"
    : "Luxury Synthwave · 88 BPM · Premium Future",
  "Sacred Geometry": "Ethereal Ambient · 72 BPM · Spiritual Motion",
};

const captionByDirector = {
  "Blade Runner":
    "A future illuminated by memory and rain.",

  "Neo Noir Sci-Fi":
    "A rainlit sci-fi atmosphere built from shadow, reflection and slow tension.",

  A24:
    "The smallest moments often leave the deepest marks.",

  "Neo Tokyo": sourceWantsSlow
    ? "A luxury vision moving through neon rain."
    : "Some cities never sleep. Some dreams never end.",

  "Chrome Dreams":
    "A civilisation sculpted from light and reflection.",

  "Luxury Sci-Fi": isLuxurySciFiProductFilm
    ? "A floating perfume bottle shaped by chrome, shadow and glass."
    : "A luxury future sculpted from light and reflection.",

  "Sacred Geometry":
    "The universe speaks through patterns.",
};

const hookByDirector = {
  "Blade Runner":
    "The future arrived long ago. We just stopped noticing.",

  "Neo Noir Sci-Fi":
    "Every reflection knows more than the city reveals.",

  A24:
    "Some stories whisper louder than others.",

  "Neo Tokyo": sourceWantsSlow
    ? "When the city becomes a runway, every reflection tells the story."
    : "Every signal hides another reality.",

  "Chrome Dreams":
    "Perfection was never built. It was imagined.",

  "Luxury Sci-Fi": isLuxurySciFiProductFilm
    ? "The bottle floats. The room becomes reflection."
    : "Perfection was never built. It was imagined.",

  "Sacred Geometry":
    "The universe repeats what matters.",
};
setDirectorSummary(
  `${selectedMode} transforms the original idea into a cinematic production direction with a clear visual identity. The sequence moves through atmosphere, detail, character, scale and resolution, creating a coherent short-form film concept ready for AI video production.`
);

setProductionAssets({
  hook:
    hookByDirector[selectedMode] ||
    "A cinematic vision begins with a single idea.",

voiceover:
  (voiceoverByDirector[selectedMode] ||
    "A cinematic vision begins where ordinary reality ends.")
    .replace(/\n/g, "\n"),

  music:
    audioAnalysis?.musicDirection ||
    musicByDirector[selectedMode] ||
    "Cinematic Ambient · 80 BPM · Atmospheric Storytelling",

  caption:
    captionByDirector[selectedMode] ||
    "A cinematic world created from a single vision.",

  audioReference: audioAnalysis || null,

  visualReference: visualReferenceFile
    ? {
        fileName: visualReferenceFile.name,
        type: visualReferenceType,
        label: visualReferenceLabel,
        guidance: visualReferenceGuidance,
      }
    : null,
});

setVideoUrl(blueprintPreviewUrl);
  const structuredShotBlueprint = generatedShots
    .map((shot, index) => {
      const shotTitle = shot.title || `Shot ${index + 1}`;
      const sequenceRole = shot.sequenceRole || "Blueprint Moment";
      const visibleAction = shot.description || sourceVision;
      const cameraLanguage = shot.camera || "Controlled cinematic framing";
      const motionLanguage =
        shot.movement || shot.motion || "Purposeful cinematic movement";
      const lensLanguage = shot.lens || "Production-ready cinematic lens";
      const lightingLanguage = shot.lighting || "Motivated cinematic lighting";

      const defaultProductionPurposeByRole = {
        Establishing: "Establish the world, atmosphere, scale and first visual rules.",
        Character: "Give the viewer a clear subject focus and emotional anchor.",
        Detail: "Make the concept feel physically real through material behavior.",
        "Hero Moment": "Deliver the strongest identity frame of the sequence.",
        Motion: "Build controlled visual progression while revealing new information.",
        "Final Frame": "Resolve the sequence with a memorable closing image.",
      };

      const productProductionPurposeByRole = {
        Establishing: "Establish the product world, surface behavior, scale and first visual rules.",
        Character: "Give the viewer a clear product focus and premium object presence.",
        Detail: "Make the product feel physically real through glass, material, reflection and light behavior.",
        "Hero Moment": "Deliver the strongest product identity frame of the sequence.",
        Motion: "Build controlled product progression while revealing new material information.",
        "Final Frame": "Resolve the product film with a memorable closing image.",
      };

      const productionPurpose =
        (hasProduct ? productProductionPurposeByRole : defaultProductionPurposeByRole)[sequenceRole] ||
        "Advance the cinematic sequence with clear visual intent.";

      const defaultDirectorDecisionByRole = {
        Establishing: "Prioritize clarity over spectacle. The world must be readable before the style becomes intense.",
        Character: "Let posture, silhouette and controlled camera pressure create the emotional anchor of the sequence.",
        Detail: "Hold long enough for material behavior to feel real. The detail should make the concept more believable.",
        "Hero Moment": "Compose this as the campaign-defining frame. The image should be strong enough to sell the entire concept.",
        Motion: "Use movement to reveal change, not to decorate the shot. Motion must build tension while staying readable.",
        "Final Frame": "Resolve the sequence with restraint. The final image should feel complete, memorable and intentionally held.",
      };

      const productDirectorDecisionByRole = {
        Establishing: "Prioritize product readability over spectacle. The viewer must understand the object, surface system and lighting rules immediately.",
        Character: "Let silhouette, glass geometry, suspension and controlled camera pressure create premium product presence.",
        Detail: "Hold the macro detail long enough for glass, liquid, engraving, reflection and light falloff to feel physically real.",
        "Hero Moment": "Compose this as the campaign-defining product frame. The image should be strong enough to sell the object instantly.",
        Motion: "Use movement to reveal glass distortion, shadow travel and reflection change, not to decorate the shot.",
        "Final Frame": "Resolve with restraint. The final product image should feel complete, rare and intentionally held.",
      };

      const directorDecision =
        (hasProduct ? productDirectorDecisionByRole : defaultDirectorDecisionByRole)[sequenceRole] ||
        "Make this shot readable first, stylish second. The viewer must understand what changes in this moment and why it belongs in the sequence.";

      return `
SHOT ${index + 1}: ${shotTitle}

PURPOSE:
${productionPurpose}

VISIBLE ACTION:
${visibleAction}

CAMERA / MOTION / LENS / LIGHT:
Camera: ${cameraLanguage}
Motion: ${motionLanguage}
Lens: ${lensLanguage}
Lighting: ${lightingLanguage}

DIRECTOR DECISION:
${directorDecision}

COPY-READY AI VIDEO PROMPT:
Create this shot as a premium cinematic AI video moment.

Sequence role: ${sequenceRole}
Visible action: ${visibleAction}
Camera: ${cameraLanguage}
Motion: ${motionLanguage}
Lens: ${lensLanguage}
Lighting: ${lightingLanguage}
${visualReferenceShotPromptBlock ? `

${visualReferenceShotPromptBlock}` : ""}

Keep the frame physically observable, visually specific, production-ready and connected to the source idea: ${sourceVision}
`.trim();
    })
    .join("\n\n");

  
const finalPrompt = `
FRAME-LAB CINEMATIC BLUEPRINT

Premium creative direction package for turning one source idea into a directable cinematic reel, AI video sequence, storyboard foundation and production-ready visual system.

══════════════════════
1. EXECUTIVE CREATIVE DIRECTION
══════════════════════

WHAT THIS BECOMES:
A premium short-form cinematic sequence built from one source idea, translated into clear visual direction, shot logic, camera movement, lighting behavior, edit rhythm and copy-ready AI video prompts.

SOURCE IDEA:
${sourceVision}

VISUAL REFERENCE:
${visualReferenceGuidance}

DIRECTOR SYSTEM:
${selectedMode}

CREATIVE PROMISE:
The final piece should feel intentional, visually specific, emotionally readable and production-ready — not like a generic AI mood prompt.

VIEWER EXPERIENCE:
The viewer should immediately understand the world, feel the visual pressure build through the sequence, recognize the strongest hero image, and remember the final frame.

PREMIUM STANDARD:
Every shot must be observable, directable and physically grounded. The blueprint must create a clear path from idea to production.

══════════════════════
2. CONCEPT DNA LOCK
══════════════════════

THE BLUEPRINT MUST PRESERVE:
- the exact source idea
- the selected director system
- the visible world, subject, product, character or atmosphere
- uploaded visual reference identity, product or mood rules when provided
- concrete visual behavior
- shot-specific camera, motion, lens and lighting decisions
- a final image that feels memorable and intentional

THE BLUEPRINT MUST AVOID:
- generic cinematic filler
- abstract mood language without visible action
- unrelated locations, props or characters
- random style decoration
- repeated template phrasing
- director style overpowering the original idea

SNOWFLAKE QUALITY GATE:
The uniqueness must come from the concept itself: visible consequences, physical details, material behavior, camera logic, light behavior and cause-and-effect progression.

══════════════════════
3. FINAL REEL EXPERIENCE
══════════════════════

OPENING IMAGE:
The sequence begins with a clear world reveal. The viewer understands the location, atmosphere, surface behavior and visual rules immediately.

SUBJECT MOMENT:
The sequence gives the viewer a clear point of attention: a subject, product, character, silhouette, texture or emotional anchor.

DETAIL MOMENT:
The camera moves closer to show a meaningful physical detail. The detail must make the idea feel more real, not simply more decorative.

SIGNATURE HERO MOMENT:
The strongest visual identity frame appears here. This should feel like the image the user would use to sell the concept.

CONTROLLED PROGRESSION:
The camera, subject and environment progress with purpose. Movement should reveal new information without breaking the visual control of the sequence.

FINAL MEMORY FRAME:
The ending should feel resolved, premium and strong enough to hold as the final remembered image of the piece.

══════════════════════
4. SHOT-BY-SHOT PRODUCTION PLAN
══════════════════════

Each shot below is designed as a production unit: purpose, visible action, camera logic, motion behavior, lens choice, lighting system, director decision and copy-ready AI video prompt.

${structuredShotBlueprint}

══════════════════════
5. COPY-READY AI VIDEO PROMPT PACK
══════════════════════

HOW TO USE:
Use the AI VIDEO PROMPT block from each shot one at a time.
Do not generate the entire reel as one uncontrolled prompt.
Generate shot-by-shot so the sequence stays controlled, cinematic and production-ready.

MASTER DIRECTION PROMPT:
Create a premium cinematic short-form video sequence based on this source idea:

${sourceVision}

Director system:
${selectedMode}

Camera language:
${visualRules?.framing || "Controlled framing with clear subject hierarchy."}

Motion language:
${audioAnalysis?.motionLanguage || visualRules?.motion || "Purposeful camera movement with readable spatial progression."}

Lighting language:
${visualRules?.lightingStyle || "Cinematic light with motivated contrast, depth and atmosphere."}

Composition behavior:
${visualRules?.composition || "Clear visual hierarchy and production-ready framing."}

Visual reference:
${visualReferenceGuidance}

Use the shot-by-shot plan as the structure.
Every frame must contain visible action, physical detail, controlled camera logic and a memorable final image.

══════════════════════
6. VISUAL DIRECTION SYSTEM
══════════════════════

CAMERA:
${visualRules?.framing || "Use controlled framing with clear subject hierarchy."}

The camera must guide attention. Every frame should make it clear what matters and why.

MOVEMENT:
${audioAnalysis?.motionLanguage || visualRules?.motion || "Use deliberate motion with controlled transitions and readable spatial progression."}

Movement must reveal information. Avoid random drifting, empty orbiting or style movement without purpose.

LIGHTING:
${visualRules?.lightingStyle || "Use cinematic light with motivated contrast, depth and atmosphere."}

Lighting must clarify surfaces, scale, emotion and spatial hierarchy.

LENS / FRAME:
Use the shot-specific lens instructions to control intimacy, scale, compression and visual identity.

TEXTURE:
Prioritize physical details: surface reflection, material tension, weather behavior, atmosphere, skin, glass, metal, fabric, light falloff or environmental response.

COMPOSITION:
Every shot should feel usable as either a storyboard panel, AI video frame or campaign still.

══════════════════════
7. EDITING, SOUND AND TEXT SYSTEM
══════════════════════

MUSIC DIRECTION:
${audioAnalysis?.musicDirection || musicByDirector[selectedMode] || "Cinematic Ambient · 80 BPM · Atmospheric Storytelling"}

AUDIO REFERENCE ANALYSIS:
${audioAnalysis
  ? `Track: ${audioAnalysis.fileName}
Duration: ${audioAnalysis.durationLabel}
Energy: ${audioAnalysis.energyLabel}
Rhythm: ${audioAnalysis.rhythmLabel}
Blueprint influence: ${audioAnalysis.blueprintInfluence}`
  : "No audio reference uploaded. Blueprint pacing follows the selected director system and source idea."}

EDIT RHYTHM:
${audioAnalysis?.editRhythm || `Start with clarity.
Move into subject focus.
Pause for tactile detail.
Land the hero image.
Build controlled movement.
Resolve with a final memory frame.`}

The edit should feel motivated by visual progression, audio pacing and visible shot logic — not random montage energy.

HOOK:
${hookByDirector[selectedMode] || "A cinematic vision begins with a single idea."}

VOICEOVER:
${voiceoverByDirector[selectedMode] || "A cinematic vision begins where ordinary reality ends."}

CAPTION:
${captionByDirector[selectedMode] || "A cinematic world created from a single vision."}

══════════════════════
8. PRODUCTION CHECKLIST
══════════════════════

Before producing, confirm:

- Does every shot have one clear visible action?
- Does every camera movement have a reason?
- Does the lighting reveal something important?
- Is the subject, product or world readable?
- If a visual reference is uploaded, does the blueprint preserve its identity, product shape or mood direction correctly?
- Is the director style supporting the idea instead of replacing it?
- Is the final frame strong enough to remember?
- Can each AI video prompt be copied and used independently?
- Does the sequence feel premium, specific and non-template?

If any answer is no, refine the shot before generating video.

══════════════════════
9. EXPORT PACKAGE
══════════════════════

THIS BLUEPRINT CAN BE USED AS:
- a cinematic creative direction brief
- a storyboard foundation
- an AI video prompt pack
- a shot list for production
- a visual direction system
- a client-facing concept treatment
- a premium short-form reel planning document

BEST NEXT PRODUCTION STEP:
Start by producing Shot 1 as a visual test.
Then create Shot 2 and Shot 3 to verify subject, texture and world behavior before building the full sequence.

END OF FRAME-LAB CINEMATIC BLUEPRINT
  `.trim();

setExpandedPrompt(finalPrompt);
startTypingEffect(finalPrompt);
setShots(generatedShots);
setGeneratedShots(generatedShots);

setTimeout(async () => {
  setGenerating(false);
  setGenerated(true);
localStorage.setItem(
  "framelabActiveProject",
  prompt && !prompt.startsWith("Cinematic Untitled cinematic vision")
    ? prompt.slice(0, 60)
    : generatedShots?.[0]?.title || "Untitled Project"
);

localStorage.setItem(
  "framelabActiveDirector",
  selectedMode
);

localStorage.setItem(
  "framelabActivePrompt",
  finalPrompt
);
  if (userPlan === "free") {
    await fetch("/api/use-credit", {
      method: "POST",
    });

    setCredits((prev) => Math.max(prev - 1, 0));
  }
}, 1200);
  } catch (error) {
    console.log("Generate error:", error);
    alert("Something went wrong while generating.");
    setGenerating(false);
  }
}
async function handleSaveToHistory() {
  if (saving) return;

  setSaving(true);

  if (!generated) {
    alert("Please generate a blueprint first.");
    setSaving(false);
    return;
  }

  if (!user) {
    alert("Please login first.");
    setSaving(false);
    return;
  }

const payload = {
  title:
    generatedShots?.[0]?.title ||
    "Untitled Cinematic Vision",

  prompt:
    prompt && !prompt.startsWith("Cinematic Untitled cinematic vision")
      ? prompt
      : generatedShots?.[0]?.description || "Untitled cinematic vision",

  director_mode: selectedMode,
  shots: generatedShots,
  user_id: user?.id || null,
  video_url: videoUrl || "",

  director_summary: directorSummary,
  production_assets: productionAssets,
  expanded_prompt: expandedPrompt,
};

console.log("VIDEO URL SAVED:", videoUrl);
console.log("FIRST SHOT IMAGE:", generatedShots?.[0]?.image);
console.log("HISTORY PAYLOAD:", payload);

const { data, error } = await supabase
    .from("generations")
    .insert([payload]);

  if (error) {
    console.log("Supabase save error:", error);
    alert(error.message);
    setSaving(false);
    return;
  }

  setSaved(true);
  setSaving(false);

  setTimeout(() => {
    setSaved(false);
  }, 1600);
}
function generateShotSequence(mode, prompt) {
  const idea = prompt || "Untitled cinematic concept";
  const openingTitles = [
  "Neon Arrival",
  "Future Echo",
  "Silent Horizon",
  "Chrome Cathedral",
  "Electric Memory",
  "Midnight Signal",
  "Glass Skyline",
  "Lost Frequency",
];

  return [
    {
title: openingTitles[Math.floor(Math.random() * openingTitles.length)],
      imagePrompt: `${idea}, wide cinematic establishing frame, full environment reveal, atmosphere first, ${mode} visual language`,
      camera: "Wide establishing camera",
      motion: "Slow atmospheric push-in",
      lens: "24mm anamorphic lens",
      lighting: "Soft cinematic environment light",
      emotion: "World-building and anticipation",
    },
    {
      title: "Shot 02 — Emotional Close-Up",
      imagePrompt: `${idea}, emotional close-up frame, human detail, expressive face or symbolic object, ${mode} cinematic mood`,
      camera: "Intimate close-up camera",
      motion: "Subtle handheld breathing motion",
      lens: "85mm portrait lens",
      lighting: "Soft directional key light",
      emotion: "Emotion, intimacy and character",
    },
    {
      title: "Shot 03 — Motion Detail",
      imagePrompt: `${idea}, cinematic motion detail, texture, movement, reflections, atmosphere, ${mode} visual direction`,
      camera: "Low tracking camera",
      motion: "Smooth lateral tracking movement",
      lens: "50mm cinematic lens",
      lighting: "Reflections, contrast and depth",
      emotion: "Movement and cinematic rhythm",
    },
    {
      title: "Shot 04 — Final Memory Frame",
      imagePrompt: `${idea}, final cinematic ending frame, silhouette, atmosphere, iconic composition, ${mode} director style`,
      camera: "Slow pullback camera",
      motion: "Gentle cinematic retreat",
      lens: "135mm compression lens",
      lighting: "Rim light and atmospheric falloff",
      emotion: "Resolution and cinematic memory",
    },
  ];
}
return (
  <Layout>
    <style jsx global>{`
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0px);
  }
}

.cinematicTextarea::-webkit-scrollbar {
  display: none;
}

@media (max-width: 768px) {

.sidebar {
  display: none !important;
}

main {
  padding: 22px 14px !important;
}

h1 {
  font-size: 46px !important;
  line-height: 0.95 !important;
}

button {
  min-height: 44px;
}

button {
  width: 100% !important;
}

.premiumCopyAction {
  width: auto !important;
  min-width: 118px !important;
  max-width: 220px !important;
  height: 32px !important;
  min-height: 32px !important;
  padding-left: 13px !important;
  padding-right: 13px !important;
  font-size: 11px !important;
  line-height: 1 !important;
  align-self: flex-start !important;
}

.directorModeRow {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 14px !important;
  width: 100% !important;
  overflow-x: visible !important;
}

.directorModeButton {
  width: 100% !important;
  min-width: 0 !important;
  height: 104px !important;
  min-height: 104px !important;
  max-height: 104px !important;
  border-radius: 32px !important;
  padding: 14px 22px !important;
}
      
textarea {
  height: 180px !important;
  padding: 22px !important;
}

img {
  max-width: 100% !important;
}
  
video {
  max-width: 100% !important;
}
  video {
  max-width: 100% !important;
}

footer {
  flex-direction: column !important;
  gap: 18px !important;
  align-items: flex-start !important;
}
p {
  font-size: 15px !important;
  line-height: 1.5 !important;
}

pre[style*="pre-wrap"] {
  max-height: 420px !important;
  overflow-y: auto !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  padding-right: 8px !important;
}

div[style*="space-between"] {
  flex-direction: column !important;
  align-items: flex-start !important;
}

}
    `}</style>

<p style={eyebrow}>DIRECTOR AI SYSTEM</p>

      <h1 style={headline}>Director-grade cinematic blueprints.</h1>

<p style={subline}>
  Craft director-grade cinematic blueprints, visual systems,
  shot structures and production-ready creative direction.
</p>

<div style={generatorBox}>
<p style={generatorEyebrow}>DIRECTOR BLUEPRINT GENERATOR</p>
<div
  style={{
    marginBottom: "26px",
    padding: "22px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.035)",
    border: `1px solid ${accentColor}22`,
    boxShadow: `0 0 40px ${accentColor}12`,
  }}
>
<p
  style={{
    color: accentColor,
    fontSize: "38px",
    marginBottom: "14px",
  }}
>
  {selectedDirectorMode?.avatar}
</p>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "14px",
  }}
>
  <div
    style={{
      color: "white",
      fontSize: "18px",
      fontWeight: "900",
    }}
  >
    Director System: {selectedDirectorMode?.name}
  </div>

  <div
    style={{
      color: "rgba(255,255,255,0.6)",
      fontSize: "13px",
    }}
  >
    {selectedDirectorMode?.specialty}
  </div>
</div>

<div style={audioUploadBox}>
  <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    alignItems: "stretch",
  }}
>
<label
onDragOver={(e) => {
  e.preventDefault();
  setIsDragging(true);
}}
onDragLeave={() => {
  setIsDragging(false);
}}
    onDrop={(e) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];

      if (!file) return;

      analyzeAudioReference(file);
    }}
style={{
  display: "block",
  padding: "10px",
  borderRadius: "18px",
  border: "1px dashed rgba(168,85,247,0.45)",
  background:
    "linear-gradient(180deg, rgba(168,85,247,0.12), rgba(255,255,255,0.03))",
  cursor: "pointer",
  textAlign: "center",
  transform: "scale(1)",
  transition: "all 0.25s ease",
  boxShadow: "0 0 30px rgba(168,85,247,0.08)",
}}
  >
<div
  style={{
    width: "56px",
    height: "56px",
    padding: "0",
    margin: "0 auto 8px",
    borderRadius: "16px",
    background: isDragging
      ? "linear-gradient(180deg, rgba(168,85,247,0.38), rgba(168,85,247,0.18))"
      : "linear-gradient(180deg, rgba(168,85,247,0.22), rgba(168,85,247,0.08))",
    border: "1px solid rgba(168,85,247,0.32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.25s ease",
    transform: isDragging
      ? "scale(1.12) translateY(-6px)"
      : "scale(1) translateY(0px)",
    animation: isDragging ? "iconPulse 0.9s infinite" : "none",
    boxShadow: isDragging
      ? "0 0 30px rgba(168,85,247,0.28)"
      : "none",
  }}
>
  <div
  style={{
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.9)",
    position: "relative",
    boxShadow: "0 0 18px rgba(168,85,247,0.35)",
  }}
>
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "6px",
      height: "6px",
      background: "white",
      borderRadius: "999px",
      transform: "translate(-50%, -50%)",
    }}
  />
</div>
</div>
{audioFile && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "4px",
      marginBottom: "18px",
      marginTop: "-2px",
      height: "18px",
      alignItems: "flex-end",
    }}
  >
    {[...Array(7)].map((_, index) => (
      <div
        key={index}
        style={{
          width: "4px",
          height: `${10 + index * 2}px`,
          borderRadius: "999px",
          background: "rgba(255,255,255,0.9)",
          animation: `waveBounce ${
            0.5 + index * 0.08
          }s ease-in-out infinite`,
          animationDelay: `${index * 0.08}s`,
          boxShadow: "0 0 12px rgba(168,85,247,0.35)",
        }}
      />
    ))}
  </div>
)}

<p style={audioUploadLabel}>OPTIONAL AUDIO REFERENCE</p>

    <p
      style={{
        color: "rgba(255,255,255,0.62)",
        fontSize: "14px",
        marginTop: "8px",
        marginBottom: "18px",
      }}
    >
Add a track if you want the sequence to follow a mood or rhythm.
    </p>

    <input
      type="file"
      accept="audio/*"
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        analyzeAudioReference(file);
      }}
      style={{ display: "none" }}
    />

    {audioFile && (
      <div
        style={{
          marginTop: "14px",
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(168,85,247,0.22)",
        }}
      >
        <p style={audioFileName}>
          Selected track: {audioFile.name}
        </p>

        {audioAnalyzing && (
          <p
            style={{
              color: "#c4b5fd",
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            Analyzing waveform locally...
          </p>
        )}

        {audioAnalysis && (
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "13px",
              lineHeight: "1.7",
              marginTop: "10px",
            }}
          >
            <div>Duration: {audioAnalysis.durationLabel}</div>
            <div>Energy: {audioAnalysis.energyLabel}</div>
            <div>Rhythm: {audioAnalysis.rhythmLabel}</div>
            <div>Blueprint influence: {audioAnalysis.blueprintInfluence}</div>
          </div>
        )}

        {audioAnalysisError && (
          <p
            style={{
              color: "#fca5a5",
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            {audioAnalysisError}
          </p>
        )}
      </div>
    )}
  </label>

<label
onDragOver={(e) => {
  e.preventDefault();
  setVisualReferenceDragging(true);
}}
onDragLeave={() => {
  setVisualReferenceDragging(false);
}}
onDrop={(e) => {
  e.preventDefault();
  setVisualReferenceDragging(false);

  const file = e.dataTransfer.files?.[0];

  if (!file) return;

  handleVisualReferenceUpload(file);
}}
style={{
  display: "block",
  padding: "10px",
  borderRadius: "18px",
  border: "1px dashed rgba(168,85,247,0.45)",
  background:
    "linear-gradient(180deg, rgba(168,85,247,0.12), rgba(255,255,255,0.03))",
  cursor: "pointer",
  textAlign: "center",
  transform: "scale(1)",
  transition: "all 0.25s ease",
  boxShadow: "0 0 30px rgba(168,85,247,0.08)",
}}
>
  {visualReferencePreview ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "92px 1fr",
        gap: "14px",
        alignItems: "center",
        marginBottom: "14px",
        textAlign: "left",
      }}
    >
      <div
        aria-label="Visual reference preview"
        style={{
          width: "92px",
          height: "92px",
          borderRadius: "16px",
          backgroundImage: `url(${visualReferencePreview})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid rgba(168,85,247,0.36)",
          boxShadow: "0 0 24px rgba(168,85,247,0.16)",
          flexShrink: 0,
        }}
      />

      <div>
        <p style={audioUploadLabel}>OPTIONAL VISUAL REFERENCE</p>

        <p
          style={{
            color: "rgba(255,255,255,0.62)",
            fontSize: "14px",
            lineHeight: "1.45",
            marginTop: "8px",
            marginBottom: "0",
          }}
        >
          Guide identity, styling and cinematic direction.
        </p>
      </div>
    </div>
  ) : (
    <>
      <div
        style={{
          width: "56px",
          height: "56px",
          padding: "0",
          margin: "0 auto 12px",
          borderRadius: "16px",
          background: visualReferenceDragging
            ? "linear-gradient(180deg, rgba(168,85,247,0.38), rgba(168,85,247,0.18))"
            : "linear-gradient(180deg, rgba(168,85,247,0.22), rgba(168,85,247,0.08))",
          border: "1px solid rgba(168,85,247,0.32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s ease",
          transform: visualReferenceDragging
            ? "scale(1.12) translateY(-6px)"
            : "scale(1) translateY(0px)",
          animation: visualReferenceDragging ? "iconPulse 0.9s infinite" : "none",
          boxShadow: visualReferenceDragging
            ? "0 0 30px rgba(168,85,247,0.28)"
            : "none",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "18px",
            borderRadius: "6px",
            border: "2px solid rgba(255,255,255,0.9)",
            position: "relative",
            boxShadow: "0 0 18px rgba(168,85,247,0.35)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "4px",
              top: "4px",
              width: "5px",
              height: "5px",
              background: "white",
              borderRadius: "999px",
            }}
          />
        </div>
      </div>

      <p style={audioUploadLabel}>OPTIONAL VISUAL REFERENCE</p>

      <p
        style={{
          color: "rgba(255,255,255,0.62)",
          fontSize: "14px",
          marginTop: "8px",
          marginBottom: "18px",
        }}
      >
        Upload a portrait, product or mood image to guide identity, styling and cinematic direction.
      </p>
    </>
  )}

  <input
    id="visual-reference-upload"
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (!file) return;

      handleVisualReferenceUpload(file);
    }}
    style={{ display: "none" }}
  />

  {visualReferenceFile && (
    <div
      style={{
        marginTop: "10px",
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(168,85,247,0.22)",
        textAlign: "left",
      }}
    >
      <p
        style={{
          ...audioFileName,
          marginBottom: "10px",
        }}
      >
        Selected image: {visualReferenceFile.name}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        {[
          { id: "portrait", label: "Portrait" },
          { id: "product", label: "Product" },
          { id: "mood", label: "Mood" },
        ].map((referenceOption) => (
          <button
            key={referenceOption.id}
            type="button"
            className="premiumCopyAction"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVisualReferenceType(referenceOption.id);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border:
                visualReferenceType === referenceOption.id
                  ? "1px solid rgba(168,85,247,0.72)"
                  : "1px solid rgba(255,255,255,0.14)",
              background:
                visualReferenceType === referenceOption.id
                  ? "linear-gradient(180deg, rgba(168,85,247,0.30), rgba(76,29,149,0.30))"
                  : "rgba(255,255,255,0.055)",
              color: "#f5f3ff",
              fontSize: "12px",
              fontWeight: "850",
              cursor: "pointer",
            }}
          >
            {referenceOption.label}
          </button>
        ))}
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: "13px",
          lineHeight: "1.65",
          marginTop: "12px",
        }}
      >
        {visualReferenceType === "portrait" &&
          "Portrait reference active — the blueprint will preserve facial identity, styling direction and subject presence as closely as possible."}

        {visualReferenceType === "product" &&
          "Product reference active — shape, material and object identity will guide the blueprint."}

        {visualReferenceType === "mood" &&
          "Mood reference active — lighting, atmosphere and visual tone will guide the blueprint."}
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.48)",
          fontSize: "12px",
          lineHeight: "1.55",
          marginTop: "10px",
          marginBottom: "0",
        }}
      >
        This reference guides the blueprint. Final likeness depends on the AI video tool used.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          className="premiumCopyAction"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById("visual-reference-upload")?.click();
          }}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(168,85,247,0.36)",
            background:
              "linear-gradient(180deg, rgba(168,85,247,0.18), rgba(76,29,149,0.24))",
            color: "#f5f3ff",
            fontSize: "12px",
            fontWeight: "850",
            cursor: "pointer",
          }}
        >
          Change image
        </button>

        <button
          type="button"
          className="premiumCopyAction"
          onClick={clearVisualReference}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.055)",
            color: "rgba(255,255,255,0.78)",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Remove image
        </button>
      </div>
    </div>
  )}

  {visualReferenceError && (
    <p
      style={{
        color: "#fca5a5",
        fontSize: "13px",
        marginTop: "10px",
      }}
    >
      {visualReferenceError}
    </p>
  )}
</label>
</div>

<div
  style={{
    marginTop: "14px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(168,85,247,0.16)",
    color: "rgba(255,255,255,0.66)",
    fontSize: "13px",
    lineHeight: "1.65",
  }}
>
  <strong style={{ color: "#f5f3ff" }}>
    Use both together:
  </strong>{" "}
  Upload audio to guide mood, rhythm and pacing. Upload a visual reference to guide identity, product detail or atmosphere. FrameLab combines both references inside the cinematic blueprint and copy-ready AI video prompts.
</div>

  {moodSuggestions.length > 0 && (
    <div style={moodSuggestionRow}>
      {moodSuggestions.map((mood) => (
        <button
          key={mood}
          type="button"
style={moodSuggestionChip}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "0 0 28px rgba(168,85,247,0.22)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "0 0 18px rgba(168,85,247,0.08)";
}}
          onClick={() => {
            let recommendedMode = "Neo Tokyo";

            if (mood === "Night Drive") {
              recommendedMode = "Neo Tokyo";
            }

            if (mood === "Festival Atmosphere") {
              recommendedMode = "Chrome Dreams";
            }

            if (mood === "Cyberpulse") {
              recommendedMode = "Blade Runner";
            }

            if (mood === "Tokyo Motion") {
              recommendedMode = "Neo Tokyo";
            }

            if (mood === "Neon Energy") {
              recommendedMode = "Chrome Dreams";
            }

            setSelectedMode(recommendedMode);

            const hooksByMood = {
              "Neon Energy": "POV: the night turns your song into a neon movie.",
              "Night Drive": "A midnight drive for the track you cannot skip.",
              "Festival Atmosphere": "This is what your song feels like on the main stage.",
              Cyberpulse: "Your sound just entered cyberpunk mode.",
              "Tokyo Motion": "Tokyo never sleeps when this track starts.",
            };

            setGeneratedHook(
              hooksByMood[mood] || "Your song deserves a cinematic moment."
            );

            setPrompt(`
Mood direction: ${mood}

Visual style: ${recommendedMode}

Hook:
${hooksByMood[mood]}

Create a cinematic vertical reel that matches this music mood.

Include:
- dynamic camera movement
- cinematic lighting
- emotional pacing
- social media viral energy
- premium cinematic color grading
`);
          }}
        >
          {mood}
        </button>
      ))}
    </div>
  )}
</div>
<div
  style={{
    color: "#f8fafc",
    fontSize: "28px",
    fontWeight: "900",
    marginBottom: "10px",
  }}
>
Describe your cinematic vision
</div>

<div
  style={{
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.7",
    marginBottom: "18px",
  }}
>
Describe a world, story, character, product or atmosphere. FrameLab will transform it into a director-grade cinematic blueprint with shots, visual systems, pacing, voiceover and production direction.
</div>

<textarea
  className="cinematicTextarea"
  placeholder="A luxury fashion campaign in Neo Tokyo during neon rain. Slow cinematic camera movement, reflective streets, emotional narration, premium visual atmosphere..."
  value={prompt}
  onChange={(e) => {
    setPrompt(e.target.value);
  }}
  style={textareaStyle}
/>

<div className="directorModeRow" style={modeRow}>
  {directorModes.map((mode, index) => (
<button
  key={index}
  className="directorModeButton"
  onClick={() => {

if (mode.premium && userPlan !== "pro") {
  router.push("/pricing?reason=premium-director");
    return;
  }

  setSelectedMode(mode.name);
if (!prompt.trim()) {
  setPrompt(mode.prompt);
}
}}

style={{
  ...modeButton,

  opacity:
    mode.premium && userPlan !== "pro"
      ? 0.55
      : 1,

  filter:
    mode.premium && userPlan !== "pro"
      ? "grayscale(0.15)"
      : "none",

  background:
    selectedMode === mode.name
      ? `linear-gradient(135deg, ${mode.accent}55 0%, ${mode.accent}22 100%)`
      : "rgba(124,58,237,0.12)",

  transform:
    selectedMode === mode.name
      ? "translateY(-2px)"
      : "translateY(0px)",

  boxShadow:
    selectedMode === mode.name
      ? `0 0 0 1px ${mode.accent}, 0 0 26px ${mode.accent}45`
      : "0 0 0px transparent",

  outline:
    selectedMode === mode.name
      ? `1px solid ${mode.accent}`
      : "1px solid transparent",

  outlineOffset: "-1px",

  transition: "all 0.22s ease",
}}
onMouseEnter={(e) => {
  if (selectedMode !== mode.name) {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 0 18px rgba(168,85,247,0.12)";
  }
}}
onMouseLeave={(e) => {
  if (selectedMode !== mode.name) {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow =
      "0 0 0px transparent";
  }
}}
    >
<div
  style={{
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "0 8px",
    boxSizing: "border-box",
  }}
>
  <div
    style={{
      fontWeight: "800",
      fontSize: "15px",
      lineHeight: "1.12",
      maxWidth: "220px",
      textAlign: "center",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "none",
    }}
  >
    {mode.name}
  </div>

  <div
    style={{
      fontSize: "11px",
      opacity: 0.75,
      textAlign: "center",
      maxWidth: "220px",
      lineHeight: "1.22",
      wordBreak: "normal",
      overflowWrap: "normal",
      hyphens: "none",
    }}
  >
    {mode.specialty}
  </div>

  {mode.premium && (
    <div
      style={{
        fontSize: "9px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#f5d0fe",
        opacity: 0.75,
      }}
    >
      PRO
    </div>
  )}
</div>
    </button>
  ))}
</div>

<div style={buttonRow}>
  <button
onClick={() => {
  setSaved(false);
  handleGenerate();
}}
disabled={generating || saving}
style={{
  ...generateButton,
  opacity: generating ? 0.75 : 1,
  cursor: generating ? "not-allowed" : "pointer",
  transform: generating ? "scale(0.98)" : "scale(1)",
}}
onMouseEnter={(e) => {
  if (!generating) {
    e.currentTarget.style.transform =
      "translateY(-2px) scale(1.01)";
    e.currentTarget.style.boxShadow =
      "0 22px 86px rgba(168,85,247,0.56), 0 0 130px rgba(168,85,247,0.24)";
  }
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform =
    generating ? "scale(0.98)" : "scale(1)";
  e.currentTarget.style.boxShadow =
    "0 18px 60px rgba(168,85,247,0.34)";
}}
  >
{generating
  ? "Generating Cinematic Blueprint..."
  : generated
  ? "Regenerate Blueprint"
  : "Generate Cinematic Blueprint"}
      </button>

<button
  onClick={handleSaveToHistory}
disabled={saving}
style={{
  ...saveButton,
  opacity: saved || generating ? 0.6 : 1,
  cursor: saved || generating ? "not-allowed" : "pointer",
  transform: "scale(1)",
}}
onMouseEnter={(e) => {
  if (!saved && !generating) {
    e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
    e.currentTarget.style.boxShadow = "0 0 32px rgba(168,85,247,0.22)";
    e.currentTarget.style.borderColor = "rgba(168,85,247,0.45)";
  }
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "scale(1)";
  e.currentTarget.style.boxShadow = "none";
  e.currentTarget.style.borderColor = "rgba(168,85,247,0.22)";
}}
>
{saving
  ? "Saving Blueprint..."
  : saved
  ? "Blueprint Saved ✓"
  : "Save Blueprint"}
      </button>
</div>
</div>

{generating && (
  <div style={loadingBox}>
    <div style={spinner}></div>

    <p style={loadingText}>
      {selectedMode} Director System is crafting your cinematic blueprint...
    </p>
<div style={loadingBar}>
  <div style={loadingProgress}></div>
</div>
  </div>
)}

{generated && (
  <div
    style={{
      marginTop: "32px",
      marginBottom: "32px",
      padding: "28px",
      borderRadius: "28px",
      animation: "fadeUp 0.45s ease-out",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(88,28,135,0.28))",
      border: "1px solid rgba(168,85,247,0.25)",
      boxShadow: "0 0 60px rgba(168,85,247,0.14)",
    }}
  >

<h2 style={{ fontSize: "28px", marginBottom: "14px" }}>
  Cinematic Blueprint Ready
</h2>

<p style={{ color: "#cbd5e1", lineHeight: 1.7, marginBottom: "22px" }}>
  Your concept has been transformed into a director-grade cinematic blueprint using{" "}
  <strong>{selectedMode}</strong> visual language.
</p>

<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(180deg, rgba(168,85,247,0.13), rgba(15,23,42,0.72))",
    border: "1px solid rgba(196,181,253,0.24)",
    boxShadow: "0 20px 70px rgba(124,58,237,0.16)",
  }}
>
  <div
    style={{
      fontSize: "11px",
      color: "#c4b5fd",
      letterSpacing: "2.4px",
      fontWeight: "900",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    How to use this blueprint
  </div>

  <div
    style={{
      color: "white",
      fontSize: "22px",
      lineHeight: "1.25",
      fontWeight: "900",
      marginBottom: "10px",
    }}
  >
    Start here if you are new to cinematic blueprints.
  </div>

  <p
    style={{
      color: "rgba(255,255,255,0.72)",
      fontSize: "14px",
      lineHeight: "1.75",
      marginBottom: "18px",
      maxWidth: "860px",
    }}
  >
    This is your production map. You do not need to use everything at once.
    Work shot by shot, copy only what you need, and build the reel step by step.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
    }}
  >
    {[
      {
        step: "01",
        title: "Read the idea",
        text: "Check the source idea, director system and creative promise first.",
      },
      {
        step: "02",
        title: "Use Shot Overview",
        text: "Scan the 6 shots to understand the sequence before producing anything.",
      },
      {
        step: "03",
        title: "Open one shot",
        text: "Click a shot card to inspect camera, motion, lighting and director notes.",
      },
      {
        step: "04",
        title: "Copy what you need",
        text: "Use the copy buttons beside Hook, Narration, Caption, Blueprint or individual shots.",
      },
      {
        step: "05",
        title: "Produce step by step",
        text: "Start with Shot 1, then continue shot by shot in your AI video tool.",
      },
    ].map((item) => (
      <div
        key={item.step}
        style={{
          padding: "16px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(168,85,247,0.16)",
        }}
      >
        <div
          style={{
            color: "#c084fc",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "2px",
            marginBottom: "8px",
          }}
        >
          STEP {item.step}
        </div>

        <div
          style={{
            color: "white",
            fontSize: "15px",
            fontWeight: "900",
            marginBottom: "6px",
          }}
        >
          {item.title}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.66)",
            fontSize: "13px",
            lineHeight: "1.55",
          }}
        >
          {item.text}
        </div>
      </div>
    ))}
  </div>
</div>
  {expandedPrompt && (
    <div
      style={{
        marginBottom: "24px",
        padding: "22px",
        borderRadius: "24px",
        background: "rgba(2,6,23,0.72)",
        border: "1px solid rgba(196,181,253,0.22)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          marginBottom: showFullBlueprint ? "16px" : 0,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#c4b5fd",
              letterSpacing: "2.4px",
              fontWeight: "900",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Full Production Blueprint
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.68)",
              fontSize: "13px",
              lineHeight: "1.6",
              maxWidth: "680px",
            }}
          >
            Complete director package for reference, export or advanced users.
            Keep it closed if you only need the quick copy blocks below.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setShowFullBlueprint((prev) => !prev)}
            className="premiumCopyAction"
            style={premiumSecondaryButton}
          >
            {showFullBlueprint ? "Hide Blueprint" : "Show Full Blueprint"}
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(expandedPrompt);
                setCopied(true);
                setCopyLabel("Copied ✓");

                setTimeout(() => {
                  setCopied(false);
                  setCopyLabel("Copy Blueprint");
                }, 1400);
              } catch (error) {
                setCopyLabel("Copy failed");

                setTimeout(() => {
                  setCopyLabel("Copy Blueprint");
                }, 1400);
              }
            }}
            className="premiumCopyAction"
            style={copied ? premiumCopyButtonCopied : premiumCopyButton}
          >
            {copyLabel}
          </button>
        </div>
      </div>

      {showFullBlueprint && (
        <pre
          style={{
            margin: 0,
            maxHeight: "68vh",
            overflowY: "auto",
            paddingRight: "14px",
            whiteSpace: "pre-wrap",
            color: "#e5e7eb",
            fontSize: "14px",
            lineHeight: "1.8",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          {expandedPrompt}
        </pre>
      )}
    </div>
  )}
{productionAssets && (
  <div
    style={{
      marginBottom: "22px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "14px",
    }}
  >
    <div
      style={{
        gridColumn: "1 / -1",
        padding: "28px",
        borderRadius: "28px",
        background:
          "linear-gradient(180deg, rgba(18,18,32,0.92), rgba(8,8,16,0.98))",
        border: "1px solid rgba(196,181,253,0.18)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.38), 0 0 60px rgba(124,58,237,0.14)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#c4b5fd",
            letterSpacing: "2.4px",
            fontWeight: "900",
            textTransform: "uppercase",
          }}
        >
          Director Blueprint
        </div>

        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(directorSummary || "");
            setAssetCopyLabel("director");
            setTimeout(() => setAssetCopyLabel(""), 1200);
          }}
          className="premiumCopyAction"
          style={assetCopyLabel === "director" ? premiumCopyButtonCopied : premiumCopyButton}
        >
          {assetCopyLabel === "director" ? "Copied ✓" : "Copy Direction"}
        </button>
      </div>

      <div
        style={{
          fontSize: "24px",
          lineHeight: "1.25",
          fontWeight: "900",
          color: "white",
          marginBottom: "18px",
          maxWidth: "820px",
        }}
      >
        Cinematic direction, emotional pacing and visual logic for this reel.
      </div>

      <div
        style={{
          color: "#d8ccff",
          fontSize: "16px",
          lineHeight: "1.9",
          whiteSpace: "pre-wrap",
          maxWidth: "920px",
        }}
      >
        {directorSummary}
      </div>
    </div>

    {[
      {
        key: "hook",
        label: "HOOK",
        copyLabel: "Copy Hook",
        value: productionAssets.hook,
        wide: true,
      },
      {
        key: "voiceover",
        label: "NARRATION SCRIPT",
        copyLabel: "Copy Narration",
        value: productionAssets.voiceover,
        wide: true,
      },
      {
        key: "music",
        label: "MUSIC",
        copyLabel: "Copy Music",
        value: productionAssets.music,
        wide: true,
      },
      {
        key: "caption",
        label: "CAPTION",
        copyLabel: "Copy Caption",
        value: productionAssets.caption,
        wide: true,
      },
    ].map((item) => (
      <div
        key={item.key}
        style={{
          gridColumn: item.wide ? "1 / -1" : undefined,
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(168,85,247,0.14)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#c4b5fd",
              letterSpacing: "1.5px",
              fontWeight: "800",
            }}
          >
            {item.label}
          </div>

          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(item.value || "");
              setAssetCopyLabel(item.key);
              setTimeout(() => setAssetCopyLabel(""), 1200);
            }}
            className="premiumCopyAction"
            style={assetCopyLabel === item.key ? premiumCopyButtonCopied : premiumCopyButton}
          >
            {assetCopyLabel === item.key ? "Copied ✓" : item.copyLabel}
          </button>
        </div>

        <div
          style={{
            lineHeight: item.key === "voiceover" ? 1.8 : 1.6,
            color: item.key === "voiceover" ? "#e2e8f0" : "inherit",
            whiteSpace: item.key === "voiceover" ? "pre-wrap" : "normal",
          }}
        >
          {item.value}
        </div>
      </div>
    ))}
  </div>
)}
<div
  style={{
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(2,6,23,0.55)",
    border: "1px solid rgba(148,163,184,0.16)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      marginBottom: "12px",
    }}
  >
    <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
      SHOT OVERVIEW
    </p>
  </div>

  {generatedShots.length > 0 && (
    <div
      style={{
        marginTop: "22px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "18px",
      }}
    >
      {generatedShots.map((shot, index) => (
        <div
          key={index}
          onClick={() => setSelectedShot(index)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow =
              "0 18px 60px rgba(168,85,247,0.22)";
            e.currentTarget.style.border = "1px solid rgba(168,85,247,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 0 30px rgba(168,85,247,0.08)";
            e.currentTarget.style.border =
              selectedShot === index
                ? "1px solid rgba(168,85,247,0.75)"
                : "1px solid rgba(168,85,247,0.12)";
          }}
          style={{
            transition: "all 0.3s ease",
            boxShadow: "0 0 30px rgba(168,85,247,0.08)",
            cursor: "pointer",
            padding: "20px",
            borderRadius: "20px",
            minHeight: "260px",
            display: "flex",
            flexDirection: "column",
            background:
              selectedShot === index
                ? "linear-gradient(180deg, rgba(168,85,247,0.16), rgba(255,255,255,0.04))"
                : "rgba(255,255,255,0.03)",
            border:
              selectedShot === index
                ? "1px solid rgba(168,85,247,0.75)"
                : "1px solid rgba(168,85,247,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div style={shotLabel}>
              SHOT {String(index + 1).padStart(2, "0")}
            </div>

            <div
              style={{
                color: "rgba(196,181,253,0.82)",
                fontSize: "10px",
                fontWeight: "800",
                letterSpacing: "1.4px",
                textTransform: "uppercase",
              }}
            >
              {shot.sequenceRole || "Blueprint"}
            </div>
          </div>

          <div
            style={{
              color: "white",
              fontSize: "20px",
              lineHeight: "1.2",
              fontWeight: "900",
              marginBottom: "10px",
            }}
          >
            {shot.title}
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "14px",
            }}
          >
            {shot.emotion}
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.76)",
              fontSize: "13px",
              lineHeight: "1.65",
              marginBottom: "16px",
            }}
          >
            {shot.description?.length > 190
              ? `${shot.description.slice(0, 190)}...`
              : shot.description}
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "auto",
            }}
          >
            <div>
              <div style={shotLabel}>CAMERA</div>
              <div style={shotValue}>{shot.camera}</div>
            </div>

            <div>
              <div style={shotLabel}>MOTION</div>
              <div style={shotValue}>{shot.movement}</div>
            </div>

            <div>
              <div style={shotLabel}>LIGHTING</div>
              <div style={shotValue}>{shot.lighting}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(168,85,247,0.14)",
              color: "#c4b5fd",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Inspect Shot →
          </div>
        </div>
      ))}
    </div>
  )}
{selectedShot !== null && generatedShots[selectedShot] && (
  <div
    style={{
      marginTop: "24px",
      padding: "22px",
      borderRadius: "22px",
      background: "rgba(15,23,42,0.72)",
      border: "1px solid rgba(168,85,247,0.28)",
      boxShadow: "0 0 50px rgba(168,85,247,0.12)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "14px",
        marginBottom: "18px",
        flexWrap: "wrap",
      }}
    >
      <div style={shotLabel}>SHOT INSPECTOR</div>

      <button
        type="button"
        onClick={async () => {
          const textToCopy = generatedShots[selectedShot]?.directorNotes;

          if (!textToCopy) {
            alert("No director notes found.");
            return;
          }

          await navigator.clipboard.writeText(textToCopy);
          setShotCopyLabel("Copied ✓");

          setTimeout(() => {
            setShotCopyLabel("Copy Director Notes");
          }, 1200);
        }}
        className="premiumCopyAction"
        style={shotCopyLabel === "Copied ✓" ? premiumCopyButtonCopied : premiumCopyButton}
      >
        {shotCopyLabel}
      </button>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "18px",
        alignItems: "start",
      }}
    >
      <div
        style={{
          padding: "20px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(168,85,247,0.14)",
        }}
      >
        <div style={shotLabel}>
          SHOT {String(selectedShot + 1).padStart(2, "0")}
        </div>

        <div
          style={{
            color: "white",
            fontSize: "26px",
            lineHeight: "1.15",
            fontWeight: "900",
            marginBottom: "6px",
          }}
        >
          {generatedShots[selectedShot].title}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.58)",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "18px",
          }}
        >
          {generatedShots[selectedShot].emotion}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.82)",
            fontSize: "15px",
            lineHeight: "1.8",
            fontWeight: "500",
            marginBottom: "22px",
          }}
        >
          {generatedShots[selectedShot].description}
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={shotLabel}>CAMERA</div>
            <div style={shotValue}>{generatedShots[selectedShot].camera}</div>
          </div>

          <div>
            <div style={shotLabel}>MOTION</div>
            <div style={shotValue}>{generatedShots[selectedShot].movement}</div>
          </div>

          <div>
            <div style={shotLabel}>LIGHTING</div>
            <div style={shotValue}>{generatedShots[selectedShot].lighting}</div>
          </div>
        </div>

        <div style={shotLabel}>DIRECTOR NOTES</div>

        <div
          style={{
            color: "rgba(255,255,255,0.82)",
            fontSize: "14px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
          }}
        >
          {generatedShots[selectedShot].directorNotes}
        </div>
      </div>

      <div
        style={{
          padding: "20px",
          borderRadius: "20px",
          background: "rgba(2,6,23,0.48)",
          border: "1px solid rgba(168,85,247,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={shotLabel}>VIDEO GENERATION PROMPT</div>

          <button
            type="button"
            onClick={async () => {
              const textToCopy = generatedShots[selectedShot]?.shotPrompt;

              if (!textToCopy) {
                alert("No AI video prompt found.");
                return;
              }

              await navigator.clipboard.writeText(textToCopy);
              setShotPromptCopyLabel("Copied ✓");

              setTimeout(() => {
                setShotPromptCopyLabel("Copy AI Video Prompt");
              }, 1200);
            }}
            className="premiumCopyAction"
            style={shotPromptCopyLabel === "Copied ✓" ? premiumCopyButtonCopied : premiumCopyButton}
          >
            {shotPromptCopyLabel}
          </button>
        </div>

        <div
          style={{
            color: "#cbd5e1",
            fontSize: "14px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
          }}
        >
          {generatedShots[selectedShot].shotPrompt}
        </div>
      </div>
    </div>
  </div>
)}
{/* Production Blueprint hidden for premium sequence-first layout */}
</div>
  </div>
)}
</div>
  </Layout>
);
}
