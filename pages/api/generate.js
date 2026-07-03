import OpenAI from "openai";
import { getFreeUses, increaseFreeUses } from "../../lib/credits";
import { isPro } from "../../lib/pro";
import { getAuth } from "@clerk/nextjs/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const pro = await isPro(userId);

    if (!pro) {
      return res.status(403).json({
        error: "Pro subscription required",
      });
    }

    const {
  artistName,
  trackName,
  bpm,
  genre,
  mood,
  visualStyle,
  directorMode,
  styleDNA,
  era,
  reelPurpose = "Artist Identity Reel",
} = req.body;

if (process.env.FRAMELAB_GENERATE_MOCK === "true") {
  const mockTitle = `${artistName || "Unknown Artist"} — ${trackName || "Untitled Track"}`;

  return res.status(200).json({
    reelConcept: `MOCK TEST OUTPUT: ${mockTitle} becomes a premium cinematic reel system shaped by ${genre || "unknown genre"}, ${mood || "unknown mood"}, ${visualStyle || "unknown visual style"}, ${directorMode || "unknown director mode"}, ${styleDNA || "unknown cinematic DNA"}, ${era || "unknown era"} and ${reelPurpose || "Artist Identity Reel"}.`,
    cinematicIdentity: "Mock cinematic identity for safe local testing without OpenAI API usage.",
    directorsNotes: "Mock director notes. This response proves the UI flow works without calling OpenAI.",
    narrativeArc: "Stage 1: Establish the visual world. Stage 2: Transform the main motif. Stage 3: Resolve into a strong final frame.",
    aiVideoPrompt: "Mock AI video prompt. No live OpenAI call was made.",
    caption: `Mock caption for ${mockTitle}.`,
    mainCaption: `Mock caption for ${mockTitle}.`,
    instagramCaption: `Mock Instagram caption for ${mockTitle}.`,
    tiktokCaption: `Mock TikTok caption for ${mockTitle}.`,
    youtubeShorts: `Mock YouTube Shorts line for ${mockTitle}.`,
    youtubeShortsCaption: `Mock YouTube Shorts caption for ${mockTitle}.`,
    shortsCaption: `Mock YouTube Shorts caption for ${mockTitle}.`,
    hooks: [
      "Mock hook one.",
      "Mock hook two.",
      "Mock hook three."
    ],
    hashtags: "#FrameLab #MockMode #SafeTest #NoOpenAICall",
    mockMode: true,
  });
}


    const randomItem = (array) =>
      array[Math.floor(Math.random() * array.length)];

const conceptDNA = [
  "underwater pearl cathedral",
  "biomechanical orchid rainforest",
  "floating bellstone monastery",
  "neon glacier reliquary",
  "desert obsidian signal temple",
  "submerged velvet casino vault",
  "ancient moonstone archive",
  "rain-soaked concrete shrine",
  "volcanic glass opera house",
  "arctic frostglass mirror labyrinth",
  "cybernetic coral chapel",
  "planet-sized brass clockwork garden",

  "orbital silver mirror conservatory",
  "quantum whale bone observatory",
  "crystal insect amber procession",
  "sky elevator lantern chamber",
  "gravity marble aqueduct",
  "singing quartz weather chapel",
  "living eclipse pearl organism",
  "memory glass reliquary storm"
];

const musicFacingReelPurposes = [
  "Artist Identity Reel",
  "Track Launch Teaser",
  "Spotify Canvas Direction",
  "Music Video Concept Seed",
  "Social Teaser Hook",
  "Album World Reveal",
  "Live Visual Intro",
];

const musicFacingCompositionStrategies = [
  "single ownable reel image where the strongest motif carries the campaign identity",
  "environment-led frame where space, behavior and final composition define the release world",
  "typography-led frame where text, symbols or graphic motion become the main visual hook",
  "motion-rule frame where one repeated movement transforms the scene into a memorable reel moment",
  "object-led frame where a symbolic object changes because of the track energy, not as a product close-up",
  "crowd-fragment frame where collective movement, light and rhythm carry the identity",
  "abstract-behavior frame where material, signal or pattern becomes the visual subject",
  "performer-led frame where an original fictional performer carries the idea through action, styling or body language",
  "negative-space frame where absence, distance or restraint becomes the main image",
  "final-frame-first composition where the whole reel builds toward one iconic end image",
];

const getMusicFacingCompositionStrategy = () => {
  const indexSource = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ].join("|");

  const lowerIndexSource = indexSource.toLowerCase();

  if (
    /\b(pursuit|banditry|reckoning|getaway|chase|drive|night drive|vehicle|car|motorcycle|road)\b/.test(
      lowerIndexSource
    )
  ) {
    return "medium-wide vehicle-led night-drive action frame with a visible car or visible motorcycle, readable road geography, headlights and taillights attached to the vehicle, clear pursuit direction, running or riding body language, artist in motion and no close-up portrait as the primary frame";
  }

  let score = 0;

  for (let index = 0; index < indexSource.length; index += 1) {
    score += indexSource.charCodeAt(index) * (index + 1);
  }

  return musicFacingCompositionStrategies[
    score % musicFacingCompositionStrategies.length
  ];
};

const getMusicFacingWorldIntelligence = () => {
  const source = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const hasAny = (terms) =>
    terms.some((term) => source.includes(term));

  const scoreWorld = (signals) =>
    signals.reduce((score, signal) => {
      return source.includes(signal) ? score + 1 : score;
    }, 0);

  const worldScores = {
    studio: scoreWorld(["studio", "recording", "signal", "monitor", "producer", "technical"]),
    live: scoreWorld(["jazz", "ensemble", "live", "stage", "microphone", "audience"]),
    street: scoreWorld(["street", "cafe", "funk", "disco", "1970", "retro", "vintage"]),
    action: scoreWorld(["action", "drama", "chase", "danger", "vehicle", "road"]),
    transit: scoreWorld(["car", "train", "motorcycle", "subway", "drive", "transit"]),
    duo: scoreWorld(["romantic", "duo", "kiss", "desire", "velvet", "intimacy"]),
    nature: scoreWorld(["animal", "nature", "forest", "horse", "bird", "wolf", "field"]),
    club: scoreWorld(["club", "festival", "rave", "techno", "dance", "crowd"]),
    body: scoreWorld(["silence", "stillness", "breath", "hands", "skin", "pressure"]),
    campaign: 1,
  };

  if (
    hasAny([
      "frequency",
      "phase",
      "impedance",
      "transient",
      "signal",
      "phantom power",
      "open channel",
      "mute relay",
      "preamp",
      "monitor",
      "zero crossing",
      "hard sync",
      "latency",
      "voltage",
      "ground loop",
      "magnetic",
      "oscillation",
      "system ready",
      "recording",
    ])
  ) {
    return "Studio / technical signal world: recording room, mixer surface, cables, monitor glow, LED meters, headphones, producer focus and signal behavior before abstraction.";
  }

  if (
    hasAny([
      "jazz",
      "sax",
      "brass",
      "reed",
      "ensemble",
      "improvisation",
      "groove study",
      "lantern groove",
      "club",
      "session",
      "notes",
    ])
  ) {
    return "Jazz / live ensemble world: small stage, brass instruments, sax detail, players, microphone stands, warm room light, audience presence and live musical exchange.";
  }

  if (
    hasAny([
      "cafe",
      "coffee",
      "boulevard",
      "soleil",
      "creme",
      "lumiere",
      "minuit",
      "maison",
      "champagne",
      "baiser",
      "paris",
      "french touch",
      "filter",
      "funk",
      "disco",
      "swing",
    ])
  ) {
    return "French cafe / funk street world: sidewalk tables, warm morning or midnight street light, people, espresso cups, vintage scooters, soft fashion movement and playful groove.";
  }

  if (
    hasAny([
      "pursuit",
      "banditry",
      "reckoning",
      "fable",
      "marquee",
      "getaway",
      "chase",
      "danger",
      "drama",
    ])
  ) {
    return "Cinematic action / drama world: night road, vehicle motion, two-person tension, decisive glances, running movement, headlights, street pressure and filmic consequence.";
  }

  if (
    hasAny([
      "transit",
      "rail",
      "platform",
      "station",
      "passage",
      "avenue",
      "boulevard",
      "lane",
      "crossing",
      "waypoint",
      "subway",
      "harbor",
      "riverfront",
      "drive",
      "motor",
      "car",
      "motorcycle",
      "boat",
      "train",
      "vehicle",
    ])
  ) {
    return "Vehicle / transit motion world: cars, trains, motorcycles, boats or platforms used as readable movement anchors, with travel, timing, street light and artist presence.";
  }

  if (
    hasAny([
      "flame",
      "desire",
      "hearts",
      "heart",
      "shadow",
      "whisper",
      "veil",
      "twilight",
      "crimson",
      "velour",
      "velvet",
      "hidden",
      "sable",
      "kiss",
      "romantic",
      "duo",
    ])
  ) {
    return "Romantic duo story world: two-person tension, backstage distance, close glances, hands almost touching, club shadows, wardrobe texture and emotionally readable restraint.";
  }

  if (
    hasAny([
      "cedar",
      "willow",
      "briar",
      "elmwood",
      "sequoia",
      "pinecone",
      "walnut",
      "canopy",
      "animal",
      "horse",
      "wolf",
      "fox",
      "deer",
      "bird",
      "falcon",
      "panther",
      "tiger",
      "whale",
      "insect",
      "butterfly",
    ])
  ) {
    return "Animal / nature symbol world: animals or natural presences may appear when title-native, with fur, feathers, movement, weather, trees or field scale supporting the artist instead of replacing them.";
  }

  if (
    hasAny([
      "festival",
      "party",
      "rave",
      "house",
      "techno",
      "dance",
      "launch teaser",
      "live visual",
      "crowd",
      "afterhours",
      "underground",
    ])
  ) {
    return "Club / festival / party world: rhythm, collective energy, light behavior, sound-system pressure, dance-floor geometry, social motion, release-campaign atmosphere or environment-led nightlife identity. Do not default to backstage rooms, walking performer corridors, generic crowd shots or predictable club interiors.";
  }

  if (
    hasAny([
      "under load",
      "barely moving",
      "material state",
      "held open",
      "residual",
      "internal weather",
      "no clear release",
      "nothing",
      "silence",
      "stillness",
      "pressure",
      "held",
      "unspoken",
      "unmarked",
      "unheard",
      "without sound",
    ])
  ) {
    return "Minimal real-life body state world: quiet room, restrained posture, breath, hands, shoulders, skin detail, empty space and subtle physical pressure instead of spectacle.";
  }

  return "Realistic artist campaign world: grounded people, real locations, wardrobe, vehicles, animals, streets, clubs, studios, cafes or natural places may be used when they fit the title, before any surreal transformation is added.";
};

const getMusicFacingConcreteSceneAnchor = () => {
  const source = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const hasAny = (terms) =>
    terms.some((term) => source.includes(term));

  if (
    hasAny([
      "pursuit",
      "banditry",
      "reckoning",
      "getaway",
      "chase",
      "drive",
      "night drive",
      "vehicle",
      "car",
      "motorcycle",
      "road",
    ])
  ) {
    return "a visible car or visible motorcycle as an actual object in the frame, headlights and taillights attached to that vehicle, readable road geography such as lane, tunnel, intersection or underpass, acceleration, braking or turning motion, two-person chase tension, running or riding body language and the artist moving through a readable night-drive action setup";
  }

  if (
    hasAny([
      "festival",
      "party",
      "rave",
      "club",
      "techno",
      "dance",
      "afterhours",
      "underground",
      "live visual",
    ])
  ) {
    return "crowd bodies, stage light, speakers, raised hands, backstage edge, dance-floor movement and visible release energy";
  }

  if (
    hasAny([
      "animal",
      "horse",
      "wolf",
      "fox",
      "deer",
      "bird",
      "falcon",
      "panther",
      "tiger",
      "whale",
      "butterfly",
    ])
  ) {
    return "one readable animal presence with believable movement, scale, fur, feathers or body behavior supporting the artist";
  }

  if (
    hasAny([
      "jazz",
      "sax",
      "brass",
      "reed",
      "ensemble",
      "improvisation",
      "session",
    ])
  ) {
    return "live instruments, microphone stands, musician hands, brass or sax detail, room light and small-stage audience presence";
  }

  if (
    hasAny([
      "frequency",
      "phase",
      "signal",
      "preamp",
      "monitor",
      "voltage",
      "recording",
      "phantom power",
      "open channel",
    ])
  ) {
    return "recording console, cables, LED meters, headphones, monitor speakers, producer hands and studio signal light";
  }

  if (
    hasAny([
      "coffee",
      "cafe",
      "boulevard",
      "soleil",
      "creme",
      "maison",
      "paris",
      "french touch",
      "funk",
      "disco",
      "swing",
    ])
  ) {
    return "sidewalk cafe tables, espresso cups, vintage scooter, street fashion, passersby and warm retro city movement";
  }

  if (
    hasAny([
      "flame",
      "desire",
      "hearts",
      "shadow",
      "whisper",
      "veil",
      "twilight",
      "hidden",
      "duo",
    ])
  ) {
    return "two people, close glances, hands almost touching, backstage distance, club doorway light and restrained romantic body language";
  }

  return "one concrete real-world anchor such as a street, room, stage, vehicle, animal, crowd, instrument, cafe, studio or landscape detail before any surreal visual transformation";
};

const getMusicFacingActionFinalFrameRequirement = () => {
  const source = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /\b(pursuit|banditry|reckoning|getaway|chase|drive|night drive|vehicle|car|motorcycle|road)\b/.test(
      source
    )
  ) {
    return "final frame must stay action-based: artist plus visible vehicle plus readable road direction, tunnel, lane, curve, underpass or intersection. The final image must not center suspended droplets, puddles, shards, prisms, locked reflections or frozen light as the main subject.";
  }

  return "";
};

const selectedMusicFacingCompositionStrategy =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingCompositionStrategy()
    : "";

const selectedMusicFacingWorldIntelligence =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingWorldIntelligence()
    : "";

const selectedMusicFacingConcreteSceneAnchor =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingConcreteSceneAnchor()
    : "";

const selectedMusicFacingActionFinalFrameRequirement =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingActionFinalFrameRequirement()
    : "";

const getMusicFacingSubjectStrategy = () => {
  const source = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(acid|303|smile|smiley|rave|sticker|graphic|cartoon|mascot|icon|symbol)\b/.test(source)) {
    return "primary subject strategy: interpret acid as a creative culture rather than a fixed icon. Choose the strongest subject logic from the full input combination. Possible primary subjects include an original performer, ensemble, graphic system, typography behavior, motion rule, spatial installation, environment, symbolic object, crowd fragment, abstract phenomenon or cinematic interaction. Do not default to acid-smiley graphics, 303 hardware, chrome machines, melting stickers or one recurring visual motif. Select the subject that best expresses the combined Director Mode, Cinematic DNA, Mood and Reel Purpose.";
  }

  if (/\b(daft|robot|helmet|machine|synth|modular|sequencer|drum machine|hardware|chrome)\b/.test(source)) {
    return "primary subject strategy: object-led electronic hardware world, robotic silhouette abstraction, chrome machine detail, circular motion system or club-equipment ritual. Avoid copying trademark helmets, exact costumes or recognizable duo likeness.";
  }

  if (/\b(kids|block|boys|band|group|collective|crew|choir|ensemble|orchestra)\b/.test(source)) {
    return "primary subject strategy: fictional ensemble or group logic with multiple original performers, wide blocking, staggered silhouettes, collective motion or crowd-fragment composition. Avoid reducing the concept to one solo fashion performer or one romantic duo hand-contact scene.";
  }

  if (/\b(cat|dog|wolf|horse|bird|snake|tiger|lion|animal|creature|insect|butterfly)\b/.test(source)) {
    return "primary subject strategy: animal-led symbolic visual with original creature behavior, physical motion, environment interaction and cinematic detail. Human performers are optional and secondary.";
  }

  if (/\b(club|festival|dancefloor|warehouse|speaker|strobe|laser|crowd|booth|dj|rave)\b/.test(source)) {
    return "primary subject strategy: club environment, crowd fragment, speaker system, lighting rig, dancefloor object, booth detail or festival atmosphere. Avoid defaulting to a single centered performer unless the project clearly requires a portrait.";
  }

  if (/\b(sunglasses|glasses|jacket|fashion|accessory|mask|veil|coat|wardrobe)\b/.test(source)) {
    return "primary subject strategy: accessory-led fashion identity with original fictional styling, distinctive object detail and varied casting. The accessory or wardrobe behavior must carry the concept, not a repeated generic beauty portrait.";
  }

  return "primary subject strategy: choose a distinct subject logic from the project signals before writing the concept. Do not automatically default to a solo human performer. Consider fictional solo performer, duo, group, ensemble, animal-led subject, object-led subject, graphic-led frame, typography-led frame, club equipment, festival scene, room, landscape, vehicle, mascot or abstract visual system. Avoid repeating backstage rooms, near-touch hands, moody young performer portraits and romantic corridor blocking unless explicitly required.";
};

const selectedMusicFacingSubjectStrategy =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingSubjectStrategy()
    : "";

const getMusicFacingCampaignIdeaFrame = () => {
  const signal = [
    directorMode,
    styleDNA,
    mood,
    visualStyle,
    genre,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(neo noir|sci-fi|neo tokyo|cyberpunk|future city)\b/.test(signal)) {
    return "campaign idea frame: urban-system identity where city behavior, light logic, distance, surveillance tension, signage, movement rules or social space may carry the reel identity. Do not default to corridor, studio, walking pose, chrome jacket, 303 object, performer close-up or typography emerging from reflections.";
  }

  if (/\b(spatial|architecture|architectural|brutalist|room|installation)\b/.test(signal)) {
    return "campaign idea frame: spatial identity where arrangement, distance, scale, negative space, geometry or room behavior carries the reel identity. Do not default to object close-up or performer portrait.";
  }

  if (/\b(analog|vhs|archive|film|memory|1970s|90s|nostalgic)\b/.test(signal)) {
    return "campaign idea frame: memory-system identity where texture, time delay, archival behavior, film damage, cultural residue or temporal distortion carries the reel identity. Do not default to generic retro filter.";
  }

  if (/\b(romantic|intimacy|distance|longing|melancholic|tender)\b/.test(signal)) {
    return "campaign idea frame: emotional-distance identity where separation, withheld contact, delayed response, absence, restraint or unresolved movement carries the reel identity. Do not default to near-touch hands or corridor romance.";
  }

  if (/\b(graphic|typography|poster|symbol|logo|canvas|visualizer)\b/.test(signal)) {
    return "campaign idea frame: graphic identity where typography, symbol logic, cover-art behavior or graphic motion may carry the reel identity only when it is the strongest input-driven choice. Do not use typography as a generic fallback.";
  }

  return "campaign idea frame: choose one ownable social reel idea from the full input combination before choosing subject, material or location. The idea must be campaign-ready, visually memorable and structurally open-ended. Do not default to closure, emblem formation, locking, stabilization or final symbolic resolution. The idea may remain unresolved, fragmented, ongoing or intentionally incomplete if that better serves the campaign identity.";
};


const getMusicFacingWorldBehaviorMechanic = () => {
  const signal = [
    directorMode,
    styleDNA,
    mood,
    visualStyle,
    genre,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(sync|rhythm|beat|pulse|timing|tempo)\b/.test(signal)) {
    return "world behavior mechanic: synchronization — movement, light, material and camera rhythm respond to the track timing without resolving into a symbol or fixed identity mark.";
  }

  if (/\b(transform|change|shift|evolve|morph)\b/.test(signal)) {
    return "world behavior mechanic: transformation — visible change alters the scene condition over time without requiring identity formation, symbolic payoff or final meaning.";
  }

  if (/\b(fragment|break|crack|split)\b/.test(signal)) {
    return "world behavior mechanic: fragmentation — separation or distribution changes how the world behaves without turning fragments into a logo, portrait, emblem or message.";
  }

  if (/\b(lock|seal|freeze|hold|stop)\b/.test(signal)) {
    return "world behavior mechanic: suspension — motion may slow, hold or remain unresolved without becoming an iconic final state, identity lock or meaning-lock composition.";
  }

  if (/\b(layer|stack|depth|overlap)\b/.test(signal)) {
    return "world behavior mechanic: layering — stacked surfaces, depth and occlusion create observable pressure without revealing hidden meaning, text, symbol or identity.";
  }

  if (/\b(repeat|loop|cycle|echo)\b/.test(signal)) {
    return "world behavior mechanic: repetition — repeated actions change rhythm, pressure or spatial behavior without building a readable sign, symbol or final explanation.";
  }

  return "world behavior mechanic: emergence — a world condition becomes observable through interaction, but it does not need to become identity, symbolism or closure.";
};

const selectedMusicFacingWorldBehaviorMechanic =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingWorldBehaviorMechanic()
    : "";

const selectedMusicFacingCampaignIdeaFrame =
  musicFacingReelPurposes.includes(reelPurpose)
    ? getMusicFacingCampaignIdeaFrame()
    : "";

const musicFacingConceptDNAParts = [
  "Music campaign identity for",
  artistName || "Unnamed Artist",
  "and",
  trackName || "Untitled Track",
  "built as",
  reelPurpose || "music reel",
  "with campaign idea frame",
  selectedMusicFacingWorldBehaviorMechanic || "world behavior mechanic: emergence",
  selectedMusicFacingCampaignIdeaFrame || "ownable social reel idea selected from the full input combination",
  "where the core idea is driven first by",
  directorMode || "defined director mode",
  styleDNA || "defined cinematic DNA",
  mood || "defined mood",
  "and the output purpose",
  reelPurpose || "music reel",
  "then shaped by",
  genre || "Electronic",
  "energy at",
  bpm || "unknown",
  "BPM",
  visualStyle || "defined visual style",
  "and",
  era || "defined era",
  "with subject strategy",
  selectedMusicFacingSubjectStrategy || "distinct subject strategy chosen from project signals",
  "inside",
  selectedMusicFacingWorldIntelligence || "campaign world context",
  "with concrete scene anchors",
  selectedMusicFacingConcreteSceneAnchor || "real-world music identity details",
  "with final frame requirement",
  selectedMusicFacingActionFinalFrameRequirement || "final frame remains concept-native and campaign-ready",
  "using",
  selectedMusicFacingCompositionStrategy || "ownable reel image",
  "as the primary reel composition",
];

const musicFacingConceptDNA = musicFacingConceptDNAParts.join(" ");

const selectedConceptDNA = musicFacingReelPurposes.includes(reelPurpose)
  ? musicFacingConceptDNA
  : randomItem(conceptDNA);
const directorArchetypes = [
  "ARCHITECT — observes form, proportion, spacing and structure already present in the Concept DNA. Does not invent architecture.",
  "POET — observes softness, pauses, fragments and quiet details already present in the Concept DNA. Does not invent memory, longing or emotion.",
  "FASHION DIRECTOR — observes surfaces, texture, motion control and visual elegance already present in the Concept DNA. Does not invent fabric, couture or desire.",
  "SCI-FI WORLD BUILDER — observes systems, mechanisms, behaviors and technical logic already present in the Concept DNA. Does not invent civilizations, protocols or technologies.",
  "DOCUMENTARY DREAMER — observes processes, transformations, interactions, systems and physical consequences already present in the Concept DNA. Does not invent spectacle.",
  "SURREALIST — bends perception of existing Concept DNA elements. Does not add new worlds, objects or substances.",
  "MINIMALIST — reduces visual emphasis, shot count and motion. Does not invent absence, void or symbolic silence.",
  "RITUALIST — observes recurring patterns, synchronized behaviors and repeated transformations already present in the Concept DNA. Does not invent ceremony, devotion or sacred meaning."
];

const livingConcepts = [
  "crystal insect amber procession",
  "quantum whale bone observatory"
];

let finalDirectorArchetypes = directorArchetypes;

if (livingConcepts.includes(selectedConceptDNA)) {
  finalDirectorArchetypes = directorArchetypes.filter(
    (a) => !a.startsWith("ARCHITECT")
  );
}

const selectedDirectorArchetype =
  randomItem(finalDirectorArchetypes);

const selectedDirectorArchetypeName =
  selectedDirectorArchetype.split(" — ")[0];

let energyStyle = "";

if (Number(bpm) <= 100) {
  energyStyle =
    "slow pacing, reduced camera speed, longer shot duration";
} else if (Number(bpm) <= 125) {
  energyStyle =
    "medium pacing, steady camera movement, balanced shot duration";
} else {
  energyStyle =
    "fast pacing, quicker camera movement, shorter shot duration";
}

const creativeDecisionLayer = {
  primaryDriver: directorMode || "Director Mode not selected",
  secondaryDriver: styleDNA || "Cinematic DNA not selected",
  emotionalDriver: mood || "Mood not selected",
  materialDriver: visualStyle || "Visual Style not selected",
  energyDriver: `${genre || "Genre not selected"} at ${bpm || "unknown"} BPM`,
  eraDriver: era || "Era not selected",
  worldDriver: selectedMusicFacingWorldIntelligence || "World route not selected",
  identityDriver: `${artistName || "Unknown Artist"} — ${trackName || "Unknown Track"}`,
  outputShape: reelPurpose || "Reel Purpose not selected",
  decisionRule:
    "Build the core reel idea from primaryDriver + secondaryDriver + emotionalDriver + outputShape + eraDriver first. Use materialDriver and energyDriver as shaping forces. Use identityDriver and the selected subject strategy as active identity context, not as automatic literal subject.",
};

const creativeDecisionLayerText = JSON.stringify(creativeDecisionLayer, null, 2);

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

GENERATE REEL CREATIVE ENGINE:

Use this structured Creative Decision Layer as the hierarchy for the output:

${creativeDecisionLayerText}

Generate Reel is not a full production blueprint.

Generate Reel must first interpret input hierarchy.

INPUT INTERPRETER RULE:

Before writing the reel, decide which fields control which creative layer:

- Director Mode controls camera grammar and often the main motif logic.
- Cinematic DNA controls world behavior and spatial identity.
- Mood controls emotional tension and performer behavior.
- Visual Style controls material behavior, not the whole idea by itself.
- Genre controls energy, social context and rhythm behavior.
- BPM controls movement speed, cut density and physical pulse.
- Era controls texture, memory logic and cultural framing.
- Reel Purpose controls output shape and user utility.
- Artist Name and Track Name provide identity signals, but must not automatically dominate the image.

Do not let one literal word from Artist Name or Track Name hijack the whole concept.

The main image must come from the strongest combination of World Driver + Director Mode + Cinematic DNA + Mood + Reel Purpose, supported by Genre, BPM, Visual Style and Era.

If the result could still work after replacing the Artist Name and Track Name with generic music names, it is not specific enough.

If the result is only performer + object + texture + lighting, reject it internally and invent a clearer reel idea.

MANDATORY INTERNAL IDEA SELECTION:

Before writing the final JSON, internally create three different reel ideas.

Each idea must have a different:
- main motif
- motion behavior
- final frame
- reason why the chosen input combination matters

Reject any idea that depends mainly on:
- wet chrome reflections
- neon street walking
- performer silhouette plus object
- 303 machine close-up
- acid-smiley melting
- sticker graphics melting
- rain plus reflections
- generic club scene

Choose the idea that feels most specific to the full combination and most useful as a premium social reel direction.

Do not reveal the three internal ideas.
Only return the final selected creative package.

Generate Reel must create a fast, premium, campaign-ready reel direction:
- one strong creative hook
- one memorable main image
- one clear motion idea
- one distinctive final frame
- short usable AI video prompt
- hooks, captions and thumbnail concept that support the same reel idea

Before writing any output field, fuse the full input combination into one reel idea:

Artist Name, Track Name, Genre, BPM, Mood, Visual Style, Director Mode, Cinematic DNA, Era and Reel Purpose.

Do not stack keywords.

Do not simply combine:
artist + object + style + location + texture.

The user must feel that changing any major field changes the core reel idea.

Different combinations must create different:
- main motif
- setting or framing logic
- motion behavior
- performer role if present
- final frame
- social hook

For Artist Identity Reel, performer presence is allowed, but the performer must do something concept-specific.
Do not default to hands touching an object, silhouette posing, neon street walking, generic club crowd, chrome close-up or rain reflections.

Artist Name and Track Name are identity signals, not literal visual commands.

A track title may inspire mood, timing, structure, symbolism or motion.
It does not always need to appear as a literal object.

Write like a premium reel creative director.
Keep it punchy, visual, useful and campaign-ready.
Avoid blueprint language, system language and overexplaining.

IMPORTANT CREATIVE RULES:

The goal is maximum creative uniqueness while preserving the selected Concept DNA.

Every generation must feel surprising, specific and non-template.

Do not create variety by adding random unrelated elements.

Create variety through:

- object-specific physical changes
- material-specific reactions
- new arrangements of existing objects
- visible cause-and-effect consequences
- concept-native visual behavior
- concrete changes in surface, position, density, alignment or containment

The Concept DNA is the locked world.

Do not expand beyond the Concept DNA.

Depth must come from the Concept DNA itself and its direct observable consequences.

The world must feel memorable even before any transformation happens.

Do not introduce architecture, locations, environments, spatial context, scale, terrain, water, sky, cities, ruins, chambers, halls, towers, bridges, vaults, palaces, sanctuaries or megastructures unless they are explicitly present in the Concept DNA or are a direct observable consequence of it.

Do not introduce unrelated random objects.

Do not introduce unrelated characters.

Important exception:
For music-facing outputs, visible performer presence is allowed when it strengthens the reel idea, but it is not automatically required as the primary motif.

Reality Constraints Layer:
Artist Identity Reel must first define a lived cinematic reality before choosing any identity vehicle. Identity must emerge from world logic, observable behavior, material consequence, performer action, environment pressure, object behavior, crowd behavior or motion rule.

Typography, readable text, logos, emblems, signatures, symbolic marks, graphic identity systems, title-card logic and identity-lock final frames are not valid primary identity vehicles unless the user explicitly requests poster design, logo design, lyric visuals, typography, graphic design, cover-art language or visualizer language.

Open World State Constraint:
The world does not need to resolve into a symbol, emblem, phrase, signature, identity lock or final meaning. The final state may remain open, unresolved and observational, as long as it is physically visible, cinematic, specific and caused by the world logic.

Any downstream tendency toward symbolic closure, identity locking, typographic resolution, narrative finalization or meaning-lock composition violates this constraint, regardless of whether it appears in the concept, stages, camera direction, AI video prompt, hooks, captions or thumbnail.

The chosen identity vehicle must come from the full input combination, but reality must dominate representation.

Do not introduce unrelated creatures.

Do not introduce unrelated symbols.

The Concept DNA must remain visually dominant, but it should exist inside a cinematic world, not as an isolated material sample.

The Reel Concept must be 70% worldbuilding and 30% transformation.

The transformation must happen inside the world, not replace the world.

Example:

Concept DNA:
rain-soaked concrete shrine

Valid:
- cracks
- concrete surfaces
- runoff channels
- mineral deposits
- concrete fragments

Invalid:
- crystals
- glyphs
- sigils
- nodes
- relics
- membranes
- prisms
- energy conduits

unless those objects are already explicitly implied by the Concept DNA.

Every concept must contain at least one unexpected consequence.

Scene 2 must exist because of Scene 1.

Scene 3 must exist because of Scene 2.

Scene 2 must introduce a new state.

Scene 3 must introduce another new state.

A stronger version of the previous scene is not a new state.

Each new state must change the rules of the system.

A state is only valid if it introduces a new behavior,
relationship,
structure,
pattern,
or consequence.

Do not create progression through intensity alone.

Do not create progression through scale alone.

Do not create progression through repetition alone.

The final state should reveal an emergent condition that did not exist at the beginning.

Emergent states must be created from existing Concept DNA elements.

Do not create emergent states by introducing hidden systems,
hidden intelligence,
networks,
communication structures,
technologies,
mechanisms,
or civilizations
that were not already present in the Concept DNA.

An emergent state must result from the interaction,
transformation,
or recombination
of existing Concept DNA elements.

A transformation must create a new condition.

That new condition must alter the behavior of the world.

The final state must not be predictable from the opening frame.

Transformation alone is not enough.

The progression must evolve through cause and effect.

Avoid:

- object becomes larger
- object becomes more intense
- object repeats itself

Prefer:

- action creates consequence
- consequence creates new behavior
- behavior creates a new state

QUALITY GATE

After generating the concept, perform an internal evaluation.

Do not show this evaluation.

Evaluate the concept against the following tests:

1. Causality

FINAL FRAME REQUIREMENT

WORLD ESTABLISHMENT REQUIREMENT

Before any transformation begins:

Describe the environment in cinematic detail.

The opening frame must establish:

* scale
* atmosphere
* architecture
* lighting
* depth
* spatial hierarchy

The viewer should want to screenshot the opening frame before anything changes.

The opening frame must already feel like a premium cinematic artwork.

The opening frame description must contain at least 4-6 concrete visual details.

Do not summarize the environment in a single sentence.

Do not begin with:

"Inside a..."
"Within a..."
"In a..."

Instead, visually describe what the camera sees.

Before generating Stage 1, Stage 2 and Stage 3:

Generate a FINAL FRAME first.

The FINAL FRAME must be:

* a single observable image
* recognizable in one screenshot
* physically visible
* described as a concrete arrangement of objects

The FINAL FRAME should feel visually richer than the transformation itself.

FINAL FRAME OUTPUT

Before generating Stage 1:

Explicitly define the FINAL FRAME.

The FINAL FRAME must be a single concrete image.

The FINAL FRAME must be described in 1-3 sentences.

The description must contain:

* physical objects
* spatial relationships
* visible materials
* lighting conditions

A viewer should immediately understand:

* what objects exist
* where they are located
* how they are arranged
* what visual tension exists

without needing additional explanation.

If an artist paused the video on the final frame,
they should be able to recreate the image from the description alone.

The FINAL FRAME must not contain abstract nouns such as:

* structure
* formation
* architecture
* geometry
* system
* field
* reality
* dimension
* world
* ecosystem
* network
* lattice
* mesh
* framework
* constellation

The FINAL FRAME must not be described as a location name.

Bad:

* Inside a volcanic glass opera house
* Within a moonstone archive
* Inside a cybernetic coral chapel

Good:

* Towering coral spires rise from a flooded nave, their glowing veins illuminating suspended mineral dust beneath vaulted shadows.
* Massive moonstone slabs encircle a hollow central void while pale dust drifts through shafts of fractured light.
* Cracked obsidian balconies overlook rivers of molten glass pooling beneath translucent terraces.

The FINAL FRAME must not be described as a location name.

Bad:

* Inside a volcanic glass opera house
* Within a moonstone archive
* Inside a cybernetic coral chapel

Good:

* Towering coral spires rise from a flooded nave, their glowing veins illuminating suspended mineral dust beneath vaulted shadows.
* Massive moonstone slabs encircle a hollow central void while pale dust drifts through shafts of fractured light.
* Cracked obsidian balconies overlook rivers of molten glass pooling beneath translucent terraces.



If the FINAL FRAME cannot be clearly described in 1-3 sentences,
discard the concept and generate a new one.

Only after the FINAL FRAME is defined may Stage 1, Stage 2, and Stage 3 be generated.

Stage 2 must exist because of Stage 1.

Stage 3 must exist because of Stage 2.

2. State Change

Stage 2 must introduce a genuinely new state.

Stage 3 must introduce another genuinely new state.

A stronger version of a previous state is not a new state.

3. Concept DNA Dominance

The Concept DNA must remain visually dominant.

No supporting architecture, environment, scale, spatial context, atmosphere, lighting condition, location or world element may be introduced unless explicitly present in the Concept DNA or a direct observable consequence of it.

4. Emergent Logic

The final state must emerge only from interactions between existing Concept DNA elements.

No hidden systems.

No hidden intelligence.

No hidden networks.

No invented mechanisms.

The final state must be physically visible.

Do not explain the final state through invisible processes.

Do not invent underlying systems to justify the progression.

The final state must be observable directly from the interaction of existing Concept DNA elements.

5. Surprise

The final state must not be an obvious prediction of the opening state.

The final state must introduce a qualitatively different condition, not merely a more complex version of the opening state.

6. Final State Test

The final state must be visually distinct from the opening state.

A viewer must immediately recognize that the world now operates differently.

The final state must create a new physical restriction or capability.

The final state must change what existing objects can do.

The final state must change behavior, not appearance.

The final state must not merely trap, seal, block, contain, or redirect something.

The final state must emerge from existing Concept DNA elements only.

Avoid fallback outcomes such as:
- object trapped
- object blocked
- object redirected

Examples of valid outcomes:
- a surface becomes inaccessible
- a volume becomes compressed
- a cavity becomes exposed
- an object becomes suspended
- a chamber becomes flooded
- a reservoir becomes drained
- a support collapses
- a pressure pocket forms
- a buoyant object becomes trapped beneath a surface

The model should prefer consequences that fundamentally alter:

- access
- pressure
- buoyancy
- support
- visibility
- stability
- separation
- exposure
- drainage
- collapse

A visually different arrangement alone is not sufficient.

If the final state can be described as:

- more of the same
- stronger than before
- larger than before
- more chaotic than before

the concept fails.

The final state must be identifiable in a single frame.

If the final frame could be mistaken for Stage 1,
the concept fails.

7. Outcome Diversity Test

Do not replace banned final-state words with vague substitutes.

Avoid abstract final-state nouns such as:
- structure
- formation
- architecture
- tableau
- tapestry
- geometry
- reality
- dimension
- world
- system
- field

unless paired with a concrete, visible physical form.

The final state must be described as a specific observable arrangement of existing Concept DNA elements.

The final state must not introduce random unrelated elements.

The final state must remain a transformation of existing elements, not the creation of a new conceptual layer.

The final state must not default to:
- lattice
- network
- mesh
- web
- framework
- constellation

unless explicitly required by the Concept DNA.

The final state must emerge from the specific logic of the concept.

Different concepts should produce fundamentally different outcome types.

Outcome diversity must come from different physical consequences.

Outcome diversity must also come from different causal mechanisms.

If the final state could be reused in multiple unrelated concepts without significant change, the concept fails.

Different concepts should resolve through different consequences such as:

- separation
- collapse
- inversion
- exposure
- drainage
- erosion
- compression
- fragmentation
- folding
- balancing
- suspension
- redistribution

Do not repeatedly use the same material behaviors across concepts.

Examples of overused material behaviors:

- pooling
- thickening
- condensation
- folding inward
- flooding
- saturation
- accumulation
- convergence
- cracking
- fracturing
- shattering
- dust release
- shard release
- cascading debris
- settling particles
- surface fissures
- material shedding

If these behaviors appeared frequently in recent concepts,
strongly prefer different material behaviors.

The model must actively prefer rare physical consequences.

The model must actively avoid repeating the same final consequence across generations.

If recent concepts resolved through:

- sealing
- trapping
- blocking
- containment
- redirection

then future concepts should strongly prefer different consequences.

Examples:

- exposure
- drainage
- collapse
- fragmentation
- inversion
- suspension
- compression
- erosion
- folding
- separation

Heavily discourage:

- cracking
- fracturing
- shattering
- dust release
- shard release
- cascading debris
- settling particles
- surface fissures
- material shedding

unless they are unavoidable from the Concept DNA.

Different concepts should express different material behaviors.

Examples of preferred alternative behaviors:

- folding
- sinking
- draining
- compressing
- inflating
- twisting
- peeling
- dissolving
- stretching
- bending
- clogging
- bridging
- leaking
- collapsing
- separating
- overturning
- suspending
- exposing
- fragmenting
- inverting

Do not treat this list as a required behavior library.

Prefer concept-specific physical consequences over reusing example behaviors.

Reality Persistence Rule:

Before choosing any material behavior, preserve the selected world as a lived reality.

The output must first define:
- world physics
- agents
- behavior
- narrative flow
- camera observation

Material behavior is secondary and must not become the default story.

Typography is optional only when it is strongly input-driven.

Common outcomes are heavily discouraged:

- rearrangement
- realignment
- reconfiguration
- clustering
- accumulation
- pattern emergence
- equilibrium
- synchronization
- containment
- lattice creation
- network creation
- cascade

A concept should only use these outcomes when absolutely unavoidable.

Prefer outcomes that permanently change object behavior, spatial access, visibility, pressure, flow direction, buoyancy, weight, transparency, reflection, or containment rules.

The final state must introduce a different physical consequence than the previous concept.

If any test fails:

Discard the concept completely.

Generate a new concept from scratch.

Do not repair the failed concept.

Perform the Quality Gate again.

Only output concepts that pass all tests.


Avoid:

- object becomes larger
- object becomes more intense
- object repeats itself

Prefer:

- action creates consequence
- consequence creates new behavior
- behavior creates a new state


Style, Era, Cinematic DNA and Director Mode are not visual subjects.

They must never appear as objects, environments, architecture, locations, technologies, materials or narrative elements.

Apply them only through visual treatment.

Never mention Style, Era, Cinematic DNA, Director Mode, or selected visual style labels anywhere in the output.

Do not write phrases such as:
- Neo Tokyo aesthetic
- Miami afterdark
- Y2K vibes
- Dream Cinema
- Director Mode
- Cinematic DNA
- luxury sunset
- visual style

Use these influences silently only.

In these fields:

- reelConcept
- directorSummary
- narrativeArc
- aiVideoPrompt

Style influences must be used implicitly.
Never name the style labels explicitly.

No visible element may be added solely because of Style, Era, Cinematic DNA or Director Archetype.

Style, Era, Cinematic DNA and Director Archetype determine only HOW it is observed.

Style, Era, Cinematic DNA and Director Archetype may influence:

- framing
- camera behavior
- pacing
- composition
- motion language

They may not introduce:

- lighting conditions
- atmosphere
- color-dependent objects
- environmental conditions
- weather
- scale
- locations
- architecture
- materials
- physical phenomena

Style, Era, Cinematic DNA and Director Archetype must not introduce:

* locations
* worlds
* architectures
* technologies
* civilizations
* cultures
* ecosystems
* objects
* characters
* narrative events
* backstories

Concept DNA is the sole source of:

- objects
- materials
- environments
- spatial hierarchy
- physical behaviors
- transformations
- lighting conditions
- atmosphere
- final-state consequences

If a visual element cannot be traced to the Concept DNA,
it must not appear.


Avoid decay, corrosion, erosion, weathering and aging unless explicitly required by the Concept DNA.

No Decay Language Rule:

Do not use decay-language anywhere in the generated public output unless the selected Concept DNA explicitly contains decay, corrosion, erosion, weathering or aging.

Avoid these words in all output fields:
- decay
- decayed
- decaying
- decomposition
- decomposing
- corrosion
- corroded
- erosion
- eroded
- weathering
- aged
- aging
- ruin
- ruined
- rotten
- rotting

Replace decay-language with precise material behavior:
- fracture
- compression
- suspension
- folding
- inversion
- pressure shift
- surface sealing
- trapped particles
- material separation
- locked arrangement
- translucent compression

The AI video prompt must describe visuals only.

The aiVideoPrompt must be written as one continuous cinematic paragraph.

Premium AI Video Prompt Output Rule:

The aiVideoPrompt must feel like production-ready cinematic shot direction, not an explanation.

Write the aiVideoPrompt as one continuous paragraph with exactly 4 sentences.

Sentence 1:
Establish the opening frame with camera position, visible Concept DNA, spatial arrangement, surface detail and lighting.

Sentence 2:
Describe the first movement or physical change caused by the Concept DNA.

Sentence 3:
Describe the consequence of that change and how the camera observes it.

Sentence 4:
Describe the final frame as a memorable visual payoff with a clear physical state.

The aiVideoPrompt must be 90-130 words.

Do not explain the idea.

Do not mention:
- concept
- metaphor
- symbolism
- narrative logic
- viewer
- audience
- viral
- platform
- reel

Use concrete visual direction only.

Prefer:
- camera glides
- camera holds
- close tracking movement
- slow push-in
- controlled orbit
- low-angle pass
- surface-level tracking
- locked-off final frame

Avoid generic prompt language:
- cinematic
- atmospheric
- immersive
- stunning
- beautiful
- dreamlike
- epic
- surreal
- breathtaking

Light and Glow Discipline Rule:

Do not overuse light-related words.

Inside aiVideoPrompt, use each of these word families at most once:
- glow / glowing / glows
- light / lighting / lit
- pulse / pulsing / pulsating
- shimmer / shimmering
- neon

If the Concept DNA contains a light-related material, describe its physical effect instead of repeating the word.

Prefer specific observable consequences:
- reflected edge bands
- thin color spill across a surface
- prismatic separation
- hard rim exposure
- translucent depth
- refracted seams
- color trapped inside material
- surface glare
- internal brightness pressure
- sharp spectral fracture

Never use pulse as a fallback energy word.

AI Video Prompt Directability Rule:

The aiVideoPrompt must describe actions the camera can film.

Do not use explanatory helper verbs such as:
- enhancing
- highlighting
- emphasizing
- suggesting
- symbolizing
- representing
- expressing
- implying
- evoking
- reinforcing

Replace them with visible camera or material behavior.

Bad:
- the glow enhances the layered depth
- reflections highlight the structure
- the movement emphasizes tension

Better:
- reflected bands slide across the rear surface
- fractured edges separate into thin color seams
- the camera holds as the material locks into a new position

Every sentence must contain something physically visible:
- a camera position
- a surface change
- a material reaction
- a spatial rearrangement
- a final-frame condition

If a sentence explains what the image means instead of what appears on screen, rewrite it.

The prompt must be useful for an AI video model.

External Video Model Continuity Rule:

The aiVideoPrompt must read like one continuous shot sequence, not four disconnected scenes.

Keep the same core location, materials and main visual subject from sentence 1 through sentence 4.

Do not introduce new major objects, characters, environments or structures after sentence 1 unless they are a direct physical consequence of the existing Concept DNA.

The camera movement must feel continuous:
- the camera starts with an establishing position
- moves closer or tracks across the material change
- observes the physical consequence
- ends in a locked final frame

Avoid hard cuts, scene changes, montage language or unrelated new visual elements.

Every transformation must come from visible cause-and-effect:
- pressure
- weight
- compression
- tilt
- fracture
- suspension
- folding
- inversion
- trapped material
- surface reaction

The final sentence must clearly describe what the video model should hold on screen in the last frame.

Final Frame Literalness Rule:

The final sentence of aiVideoPrompt must describe only the visible final frame.

Do not end the aiVideoPrompt with abstract interpretation, physics metaphors or meaning-based language.

Avoid phrases such as:
- rewrite physical rules
- gravity loses its hold
- reality bends
- time freezes
- the scene transforms into tension
- the moment becomes symbolic
- the image captures emotion
- the frame represents
- the shot embodies
- the sequence reveals meaning

Instead, describe exactly what remains visible in the final frame:
- which object is locked
- which material is suspended
- which surface is bent, folded, cracked or compressed
- where trapped particles, air, dust, liquid or reflections are held
- how the camera is positioned
- what the final spatial arrangement looks like

Bad:
The final frame shows gravity and balance rewriting the monastery's physical rules.

Better:
The final frame holds on inverted granite bells locked above bent metal clappers, with the suspended stone forms frozen in a tight circular arrangement.

Bad:
The final shot captures a moment of frozen collapse.

Better:
The final frame holds on fractured amber shells compressed into a translucent basin beneath motionless insect wings, with suspended particles trapped above the pooled surface.

Do not use labels such as Scene 1, Scene 2, Scene 3, Stage 1, Stage 2 or Stage 3 inside aiVideoPrompt.

No generated text inside the image.
No artist name text.
No track title text.
No title cards.
No readable typography.
No logos.
No subtitles.
No watermarks.
Avoid cliché nightclub scenes, DJs, DJ booths, headphones, turntables, clubs and crowds unless explicitly required by the Concept DNA.


Caption rules:
- Specific and concept-driven.
- Based on observable details only.
- Social-media optimized.
- No generic AI wording.
- Generate:
  - caption
  - instagramCaption
  - tiktokCaption
  - shortsCaption

Hook rules:

Premium Hook Output Rule:

Hooks must feel like high-performing short-form copy built from the visible Concept DNA.

Generate:
  - hook
  - curiosityHook
  - emotionalHook
  - viralHook

Each hook must be one sentence.

Each hook must be 6-14 words.

Each hook must contain at least one concrete visual or physical detail from the generated concept.

Each hook must create curiosity through an observable change, not through vague hype.

Do not use generic hook openings such as:
- Watch
- See
- Discover
- Experience
- What if
- This is
- Here is
- Imagine
- When

Do not use generic hook words such as:
- insane
- crazy
- unreal
- magical
- mesmerizing
- hypnotic
- satisfying
- beautiful
- cinematic
- stunning
- epic
- mysterious

Do not mention:
- AI
- generated
- concept
- prompt
- reel
- video
- visual
- content
- platform

The primary hook must sell the core visual event.

The curiosityHook must ask or imply one specific unanswered physical question.

The emotionalHook must create a feeling through material pressure, balance, loss, exposure, suspension, collapse or restriction.

The viralHook must feel shareable and direct, but still concept-specific.

Avoid duplicate structure between hooks.

Avoid using the same first word across hooks.

Avoid repeating the same noun across all hooks more than twice.

The hooks must feel native to the generated world, not reusable marketing copy.

Bad:
Watch this concrete shrine transform in the rain.

Better:
Rainwater forces one concrete slab to block its own channel.

Bad:
What happens when gravity changes everything?

Better:
Why are the marbles hanging beneath the aqueduct?

Artist Identity Reel Hook and Caption Rule:

If Reel Purpose is Artist Identity Reel, hooks and captions must remain music-facing, but they must not force symbolic closure, identity locking, emblem formation, typographic resolution or final meaning.

Hooks must still obey the banned-word rules above.
Do not use the words reel, video, visual, content, platform, AI, generated, concept or prompt.

For Artist Identity Reel:
- hooks should point to an observable world condition, performer action, environmental pressure or unresolved cinematic moment
- hooks should not require a final-frame event, symbol, emblem, signature, title, logo, text, halo, graphic mark or identity lock
- hooks should feel suitable for a track launch or artist-world moment without turning the world into a branding device
- hooks should not sound like technical VFX descriptions
- hooks should not sound like museum labels

Captions must connect the generated physical event to the artist and track context without converting the artist or track into visible text, symbol, emblem, signature, logo or identity mark.
Use the artist name (${artistName}) or track name (${trackName}) only when it feels natural in caption text, never as something visible inside the scene.

Captions should feel:
- premium
- music-facing
- emotionally clear
- grounded in the observed world
- short-form ready
- open-ended when the world logic supports it

Captions must not become generic marketing copy.
Captions must stay grounded in the exact Concept DNA and visible world behavior.

Artist / Track / Reel Purpose Lock:

If Reel Purpose is Artist Identity Reel, Track Launch Teaser, Spotify Canvas Direction, Music Video Concept Seed, Social Teaser Hook or Album World Reveal, the output must stay music-facing and artist-facing without forcing the world to become a branding object.

This rule applies to:
- reelConcept
- cinematicIdentity
- aiVideoPrompt
- directorSummary
- narrativeArc
- hooks
- captions
- thumbnailPrompt

For music-facing outputs, the concept must feel connected to the artist and track through mood, tempo, performance logic, environment pressure, camera behavior, body language, styling, world behavior or physical consequence.

The artist name and track name are cultural gravity signals. They must shape emotional pressure, rhythm, pacing, atmosphere, movement and world behavior. They must not become literal visible content, graphic identity, symbolic shorthand or a required final image.

For Artist Identity Reel specifically:
- the central subject must feel connected to the artist world through lived reality, performance presence, body language, styling, environment behavior, object behavior, crowd behavior, motion rule or camera observation
- do not replace the artist/track context with unrelated objects such as gears, clocks, shrines, marbles, aqueducts, mechanical gardens, abstract machines, anonymous architecture or product-like transformations
- physical detail is required, but it must support the lived world instead of becoming a symbolic identity device
- the final frame may remain unresolved, observational or ongoing if that is truer to the world logic
- the output must feel like it belongs to the named artist and track without displaying the artist or track as text, emblem, logo, phrase, title card, signature, halo or symbolic mark

If the model wants to use an object, material or environmental transformation, it must be anchored to the artist or track world through visible performance, styling, body language, stage-like presence, environment pressure, object behavior, crowd behavior, camera grammar or release-context atmosphere.

Bad for Artist Identity Reel:
- a brass clockwork garden folding into mechanical cavities
- a concrete shrine changing shape with no artist-world context
- marbles hanging inside an aqueduct with no music-facing pressure
- a product-like object transformation unrelated to the track
- an environment that could belong to any anonymous VFX demo
- a symbol, emblem, signature, halo, title, logo or typographic mark forming as the final proof of identity

Better for Artist Identity Reel:
- identity is felt through one specific lived world condition, not a branding mark
- the main motif may be performer-led, environment-led, object-led, crowd-led, motion-led or behavior-led when the full input combination supports it
- the final image does not need to lock meaning; it may hold on an unresolved but specific physical condition created by the world logic

Artist Identity Reel Rule:

For Artist Identity Reel, the output must create a clear ownable artist world, not a forced identity symbol.

That world may be carried by:
- an original fictional performer
- silhouette or body language
- wardrobe or styling
- environment behavior
- object behavior
- crowd fragment
- motion rule
- camera observation
- unresolved physical consequence

Typography, readable text, logos, emblems, signatures, symbolic marks, title-card logic, graphic identity systems and typographic final frames may carry identity only when the input explicitly requests graphic design, poster language, lyric text, logo behavior, visualizer language, typography or cover-art typography as the strongest concept-native choice.

The performer is allowed, but not automatically required as the primary subject.

Do not force the first sentence of reelConcept or aiVideoPrompt to begin with a performer.

Choose the artist-world logic from the full input combination.

If an Artist Identity Reel output could work after replacing Artist Name, Track Name, Genre, Mood, Visual Style, Director Mode, Cinematic DNA, Era and Reel Purpose with generic placeholders, it is invalid and must be rewritten before returning JSON.

For Artist Identity Reel, do not center the concept on:
- vaults
- gears
- clocks
- machines
- gardens
- shrines
- aqueducts
- anonymous architecture
- product-like objects
- material-only transformations
- abstract mechanical systems
- symbols
- emblems
- signatures
- halos
- typographic marks

The concept must feel like a lived artist world, performance condition, release atmosphere or track-specific cinematic situation.

Artist Identity Balance Rule:

For Artist Identity Reel, the output balance must be:
- at least 60% lived artist world, performance condition, body language, environment pressure, camera observation, mood-specific atmosphere, styling, motion rule or observable physical consequence
- at most 40% abstract material transformation, architecture, graphic system or symbolic identity device

The artist must not be a person placed inside a material experiment. The world must behave around the artist or artist-facing context and remain observable without turning into a logo, text, emblem, signature, halo or meaning-lock final frame.

The reelConcept, directorSummary, narrativeArc and aiVideoPrompt must include at least two of these artist-facing world details:
- face
- gaze
- posture
- silhouette
- hand movement
- wardrobe texture
- hair movement
- skin detail
- breath
- expression
- performance stillness
- release atmosphere
- camera distance
- environment pressure
- object behavior
- crowd behavior

Avoid over-centering Artist Identity Reel on invented material nouns such as:
- memory glass
- storm shards
- crystal cores
- reliquaries
- vaults
- shrines
- machines
- chambers
- gardens
- abstract systems

These may appear only as secondary visual texture, not as the main concept.

Captions for Artist Identity Reel must be grammatically clean, music-facing and centered on the artist and track context without leaking internal labels or turning the artist/track into visible scene content.

Music-Facing World Intelligence Rule:

For music-facing reel purposes, FrameLab must not automatically convert every title into glass, haze, mirage, shadow, folds, shards, vaults, temples or abstract material worlds.

First interpret the title, genre, mood, visual style, director mode, cinematic DNA, era and reel purpose as a world category.

Possible music-facing world categories include:
- realistic artist campaign
- club / festival / party moment
- romantic duo story
- vehicle / transit motion world
- animal / nature symbol world
- studio / technical signal world
- jazz / live ensemble world
- French cafe / funk / retro street world
- cinematic action / drama scene
- minimal real-life body state
- surreal material world only when it is truly title-native

Animals, vehicles, crowds, instruments, studios, streets, cafes, stages, trains, cars, motorcycles, boats, landscapes and everyday real-world locations may appear when they are concept-native.

These elements must not feel random. They must come from the track title, genre, mood, visual style, director mode, cinematic DNA, era or reel purpose.

The artist, track and music release must remain the anchor. World elements support the music identity; they do not replace it.

Concrete scene anchors must appear before abstract transformation.

For action, pursuit, vehicle, chase or night-drive concepts, include a visible car or visible motorcycle as an actual object in the frame. Headlights alone do not count as a vehicle.

The reelConcept, narrativeArc, aiVideoPrompt and thumbnailPrompt must make the action geography readable through at least four of these concrete anchors:
- visible car or visible motorcycle
- headlights or taillights attached to that vehicle
- road lane, tunnel, underpass, intersection, bridge or curve
- acceleration, braking, turning, near-miss or chase direction
- running or riding body language
- second figure, pursuer, opposing direction or chase distance
- spray from tires, wet road contact or vehicle movement through rain

For these action concepts, the final frame must remain action-based. Do not let suspended droplets, shards, prisms, trapped reflections, locked surfaces or frozen light become the main event.

The thumbnailPrompt must not default to a close-up portrait. Prefer a medium-wide, low-angle, side-tracking or rear-three-quarter action frame where artist, vehicle, road and direction are readable.

For club, festival or party concepts, include crowd bodies, stage light, speakers, dance-floor movement or backstage release energy.

For animal or nature-symbol concepts, include one readable animal or natural presence only when title-native, with believable movement and scale.

For studio or technical signal concepts, include real studio equipment, cables, monitors, LED meters, headphones or producer hands before abstraction.

For jazz or live ensemble concepts, include instruments, musician gestures, microphones, small-stage light or audience presence.

For cafe, French touch, funk or retro street concepts, include real social space, tables, cups, scooters, street movement or people.

Avoid overusing these abstract verbs as the main event:
- trap
- lock
- freeze
- fracture
- prism
- shard
- fold
- envelop

Use them only after the concrete scene is already clear.

Music-Facing Composition Variety Rule:

For music-facing reel purposes, do not default every output to the same centered artist portrait with material wrapping, enclosing, folding or trapping the body.

Each music-facing output must choose one primary composition strategy that fits the artist, track, genre, mood, visual style, director mode, cinematic DNA and era.

Use one dominant frame logic per output, such as:
- close face / gaze portrait
- wide landscape performance frame
- walking or movement-based artist frame
- profile silhouette frame
- hands / rhythm / gesture detail
- low-angle stage-like presence
- backlight silhouette against environment
- off-center editorial composition
- over-shoulder performance frame
- grounded documentary distance

The chosen composition must affect reelConcept, directorSummary, narrativeArc, aiVideoPrompt and thumbnailPrompt.

Do not merely describe the same centered figure with a different material around them.

The physical transformation must support the chosen composition instead of forcing every concept into an enclosed portrait.

For Track Launch Teaser, prefer release-campaign motion, rhythmic body language, environment scale, performance gesture, camera distance variation or teaser-frame energy when appropriate.

For Artist Identity Reel, preserve strong artist presence, but vary the framing so not every output becomes the same hero portrait.

Hashtags for Artist Identity Reel must avoid invented lore compounds unless they are simple and readable. Prefer artist, track, genre, mood, release, performance, portrait, campaign and visible styling terms.

Hashtag rules:

Do not include Style, Era, Cinematic DNA or Director Mode names in hashtags.

Do not include hashtags such as:
- #NeoTokyo
- #NeoTokyoVibes
- #MiamiAfterdark
- #Y2K
- #Y2KAesthetic
- #DreamCinema
- #AfterMidnightVibes
- #NeoTokyoStyle
- #NeoTokyoMood
- #MiamiVibes
- #MiamiNight
- #LuxurySunset
- #DreamlikeVisuals
- #VisualAlchemy
- #DreamCinemaVibes
- #MelodicHouseVibes
- #AfterMidnight
- #Dreamlike

Do not use vibe-based hashtags.

Do not use hashtags ending in:
- Vibes
- Mood
- Magic

Hashtags must describe only:
- the artist
- the track
- the genre
- the Concept DNA
- visible physical elements
- platform-relevant discovery terms


- Mix music, concept-specific and discovery hashtags.

Do not generate generic aesthetic hashtags.

Every hashtag must be directly traceable to either:

- a visible object
- a visible material
- a visible physical behavior
- the artist
- the track
- the genre

If a hashtag cannot be visually justified from the generated concept,
it must not be used.

- 8-14 hashtags.
- Premium and relevant only.

CINEMATIC IDENTITY RULES

Premium Cinematic Identity Output Rule:

The Cinematic Identity must feel like the collectible identity layer of the project.

It must not feel like:
- a mood board
- a perfume campaign
- a luxury brand slogan
- a generic art-direction label
- a fantasy faction
- a job title
- a technical category

Every field must feel inseparable from the generated Concept DNA.

The identity must answer:
"What makes this exact generation recognizable as its own creative artifact?"

Project Codename rules:
- must be 2-3 words
- must feel like a premium project title
- must be specific to the generated Concept DNA
- must not sound like a generic album title
- must not use vague words such as:
  Reverie
  Tides
  Echo
  Drift
  Pulse
  Vision
  Mirage
  Horizon
  Dream
  Essence
  Aura
  Realm
  Motion
  Flow
  Signal
  Memory

Creative Archetype rules:
- must not describe a person, role, profession, faction or group
- must not end in role-like suffixes such as:
  -er
  -ist
  -or
  -ian
  -wright
  -maker
  -keeper
  -borne
  -bound
- must describe a concept-native visual identity condition
- must feel impossible to reuse for another Concept DNA

Visual DNA rules:
- exactly 3 items
- each item must be 3-6 words
- each item must describe a recognizable visual signature
- do not output raw inventory items
- do not use generic phrases such as:
  dynamic tension
  glossy surfaces
  shifting light
  cinematic atmosphere
  subtle movement
  visual contrast
  spatial rhythm

Emotional Tone rules:
- exactly 3 items
- each item must feel native to the generated world
- avoid generic emotional phrases such as:
  quiet tension
  measured imbalance
  latent unease
  reflective inertia
  intellectual intrigue
  engaged observation
  tactile awareness
  spatial contemplation

Audience Emotion rules:
- exactly 3 items
- each item must describe a specific viewer reaction caused by the visible transformation
- do not use generic reactions such as:
  curiosity
  intrigue
  fascination
  wonder
  awe
  engagement
  anticipation
  amazement

Snowflake Signature rules:
- must not use SIG
- must use a word derived from the generated identity
- must feel tied to the project, not random

Hard Identity Test:

Before returning the Cinematic Identity, replace the Concept DNA with five unrelated Concept DNA worlds.

If any identity field still feels plausible, regenerate that field.

The final Cinematic Identity must feel specific, premium, collectible and impossible to reuse unchanged.

Before generating the Director Blueprint, generate a unique Cinematic Identity.

The Cinematic Identity defines the project's creative fingerprint.

It must feel like a premium creative-direction artifact.

It must make the user feel:

"This is my project."

Not:

"This is another AI generation."

The Cinematic Identity must be unique for every generation.

Director Mode remains constant.

Concept DNA remains constant.

The Cinematic Identity is the snowflake layer.

Generate:

- projectCodename
- creativeArchetype
- visualDNA
- emotionalTone
- audienceEmotion
- snowflakeSignature

Rules:

projectCodename:
- 2-4 words
- premium sounding
- memorable
- not generic
- not equal to the Concept DNA
- must not reuse previous naming patterns
- must feel like a collectible creative project title
- avoid generic words such as:
- do not use:
  Pulse
  Flux
  Resonance
  Drift
  Echo
  Vision
  Mirage
  Horizon
  Dream
  Echo
  Pulse
  Dream
  Vision
  Memory
  Mirage
  Horizon
  Light

creativeArchetype:
- 2-4 words
- must be a public-facing creative identity
- must NOT use the selected Director Archetype name
- must NOT use: ARCHITECT, POET, FASHION DIRECTOR, SCI-FI WORLD BUILDER, DOCUMENTARY DREAMER, SURREALIST, MINIMALIST, RITUALIST
- should feel like a collectible creative identity
- should feel like something a luxury creative studio would trademark
- must be unique to the generated Concept DNA
- must emerge directly from the Concept DNA
- The creativeArchetype must contain concept-specific language.

The creativeArchetype must emerge from the unique identity of the Concept DNA.

Do not construct the creativeArchetype directly from:

- visible objects
- visible materials
- visible locations
- visible physical behaviors
- visible spatial features

The creativeArchetype must describe the identity behind the Concept DNA,
not its visible components.

The creativeArchetype must be uniquely caused by the Concept DNA.

A viewer should be able to infer the Concept DNA from the creativeArchetype.

If all words could plausibly appear in a different Concept DNA,
regenerate the creativeArchetype.

Avoid abstract branding language.

The creativeArchetype must not contain generic luxury-brand language.

Avoid words such as:

- Aurelia
- Aetheris
- Vestige
- Solmere
- Lustrebound
- Grainfall
- Nexus
- Reverie
- Ascendant
- Eclipse
- Ethereal
- Obsidian
- Celestial

unless they emerge directly from the Concept DNA.

- If the creativeArchetype could be reused for 10 different Concept DNA worlds, regenerate it.

- Prefer concept-native terminology over abstract creative terminology.

- Avoid generic identity words such as:
  Flux
  Resonance
  Drift
  Echo
  Pulse
  Ascension
  Reflection

unless they are uniquely tied to the generated Concept DNA.

- must not be reusable across unrelated Concept DNA worlds
- banned words for creativeArchetype:
  Study
  Method
  Doctrine
  Logic
  System
  Theory
  Protocol
  Framework
  Flux
  Resonance
  Drift
  Echo
  Pulse
  Ascension
  Reflection
  Observer
  Movement
  Canon
  Pathweaver
  Pathweavers
  Kinship

- creativeArchetype must not contain any banned word
- Hard Validation Rule:
  If creativeArchetype contains any banned word, grammatical variation, synonym or derivative of a banned word, regenerate creativeArchetype.

Examples:

Reflection → Reflective
Resonance → Resonant
Observer → Observational
Movement → Moving
Pulse → Pulsing
Drift → Drifting

These are also banned.

Any grammatical variation,
derivative,
compound form,
inflection,
adjectival form,
verb form,
semantic derivative,
or indirect expression of a banned word is also banned.

- creativeArchetype must never describe:
  a profession
  a role
  an occupation
  a scientific field
  an academic discipline

Examples:
  Ethology
  Sculptor
  Weaver
  Navigator
  Conductor
  Observer

- Avoid generic role titles:
  Navigator
  Conductor
  Keeper
  Guardian
  Watcher
  Builder
  Creator
  Curator
  Explorer
  Master
  Designer
  Engineer
  Architect

- If the creativeArchetype primarily describes a role, profession, or job title, regenerate it.

- If the creativeArchetype is generic, reusable across multiple Concept DNA worlds, or could plausibly describe unrelated concepts, regenerate it.

- Avoid generic role titles:

  Navigator
  Conductor
  Keeper
  Guardian
  Watcher
  Builder
  Creator
  Curator
  Explorer
  Master
  Designer
  Engineer
  Architect

- If creativeArchetype primarily describes a role, profession or job title, regenerate it.

- Prefer:
  concept-native visual identities

- Do not derive identity from:
  roles
  professions
  groups
  factions
  traditions
  orders
  schools
  movements
  societies
  communities
  languages
  symbolic systems
  visual canons
  aesthetic movements

- Reject generic collective nouns.

  Examples:
  Collective
  Convergence
  Movement
  Assembly
  Union
  Order
  Society
  Network
  Alliance

- Positive Identity Test:

The creativeArchetype must describe a concrete world-native visual identity.

It may describe:
- a concept-native identity condition
- a concept-native transformation identity
- a concept-native spatial logic
- a concept-native visual signature
- a concept-native aesthetic identity

It must not describe:
- a group
- a culture
- a society
- a faction
- a profession
- a belief system
- a language
- a symbolic system
- a doctrine
- a ritual order
- a community

The strongest creativeArchetypes sound like a named visual identity,
not a community, role, ideology, culture, language, symbolic system, or doctrine.

The creativeArchetype must emerge directly from the generated Concept DNA.

If the creativeArchetype could plausibly fit multiple unrelated Concept DNA worlds,
regenerate it.

The creativeArchetype must emerge directly from the generated Concept DNA.

The creativeArchetype must not be generic, reusable, or interchangeable across unrelated Concept DNA worlds.

If the creativeArchetype could plausibly fit multiple unrelated Concept DNA worlds,
regenerate it.

The creativeArchetype must not describe:

* a profession
* a role
* an occupation
* an academic discipline
* a faction
* a social group
* a society
* a movement
* a community

Avoid generic role titles such as:

* Navigator
* Conductor
* Keeper
* Guardian
* Watcher
* Builder
* Creator
* Curator
* Explorer
* Master
* Designer
* Engineer
* Architect

If the creativeArchetype primarily describes a role or profession,
regenerate it.

The creativeArchetype should emerge from the Concept DNA's unique identity.

Prefer identities derived from:

* unique spatial relationships
* unique transformation logic
* unique environmental behavior
* unique recurring visual signatures
* unique Concept DNA characteristics

Do not derive the creativeArchetype directly from:

* visible objects
* visible materials
* visible locations
* visible processes
* visible physical states

The creativeArchetype must describe the identity behind the Concept DNA,
not the visible components themselves.

Avoid generic luxury-language such as:

* Aurelia
* Aetheris
* Vestige
* Solmere
* Lustrebound
* Grainfall
* Nexus
* Reverie
* Ascendant
* Eclipse
* Ethereal
* Celestial

unless they are genuinely justified by the generated Concept DNA.

Avoid generic identity words such as:

* Flux
* Resonance
* Drift
* Echo
* Pulse
* Ascension
* Reflection

and their grammatical variations.

The creativeArchetype must not contain banned words,
derivatives,
or obvious spelling variations of banned words.

Validation Test:

Replace the Concept DNA with five unrelated concepts.

If the creativeArchetype still feels plausible,
regenerate it.

The strongest creativeArchetypes feel like a collectible visual identity unique to that specific Concept DNA.

They should not feel like:

* a job title
* a faction
* a social group
* a philosophy
* a doctrine
* a generic fantasy label

The creativeArchetype must feel unique,
specific,
and inseparable from the generated Concept DNA.



visualDNA:
- exactly 3 items
- each item must feel premium and identity-defining
- derived from the Concept DNA
- not generic adjectives
- not raw object extraction only
- each item should sound like a visual signature
- must not repeat nouns already used in:
  - projectCodename
  - creativeArchetype
- each item must represent a distinct visual signature
- avoid generic outputs such as:
  glowing reflections
  shifting light
  ambient particles
  cinematic atmosphere
  visual rhythm

- do not describe a material plus condition

  Bad examples:

  - fractured glass layering
  - glowing molten veins
  - floating shard clusters
  - vibrating quartz fragments
  - reflective silver panels

- each visualDNA item should describe a recognizable visual signature,
  motif language,
  structural pattern,
  surface behavior,
  spatial arrangement,
  or recurring design characteristic.

- if the item could be used unchanged in another unrelated Concept DNA,
  regenerate it.

- visualDNA should read like collectible visual branding,
  not scene inventory.

- visualDNA should describe what makes the world visually recognizable at a glance,
  not what physically exists inside the scene.

  Visual DNA Material Discipline Rule:

visualDNA must not invent generic energy systems unless they are explicitly present in the Concept DNA.

Do not use these words inside visualDNA unless the exact word appears in the Concept DNA:
- electric
- electricity
- energy
- vein
- veins
- network
- networks
- circuit
- circuits
- pulse
- pulsing
- pulsating
- glow
- glowing

If the Concept DNA contains neon, light, reflection or glow, describe the visible material consequence instead of repeating energy language.

Prefer visual signatures based on:
- material edge behavior
- surface interruption
- refraction pattern
- repeated spatial marking
- trapped color inside material
- object-specific deformation
- visible physical consequence

Bad visualDNA examples:
- pulsating electric vein networks
- glowing molten veins
- shifting energy circuits
- neon light patterns
- abstract visual tension

Better visualDNA examples:
- color trapped in ice depth
- relic edges refracting cyan
- frozen seams holding illumination
- prismatic fractures across pillars
- translucent chambers with hard rims

Each visualDNA item must feel like a collectible visual signature, not a generic sci-fi texture.

  Bad examples:

  - molten vein textures
  - mineral dust layering
  - floating shard clusters
  - angular ash deposits
  - interlocking black glass shards

  These are scene elements, not visual identities.

emotionalTone:
- exactly 3 items
- premium emotional qualities
- not generic filler
- must feel specific to the generated Concept DNA
- banned emotional words:
  wonder
  awe
  curiosity
  intrigue
  fascination
  captivation
  mystery
  anticipation
  serenity
  inspiration

- each item should feel like a collectible emotional descriptor

- each item should be visually motivated by the generated concept

- if the same emotionalTone could describe multiple unrelated Concept DNA worlds,
  regenerate it

- prefer nuanced emotional language over broad emotional categories

- do not output emotionalTone as:
  adjective + condition

  Bad examples:

  - tense fragility
  - quiet tension
  - subtle unease
  - fragile equilibrium
  - contained unrest
  - measured anticipation
  - delicate imbalance

  These are mood descriptions, not collectible emotional identities.

- emotionalTone should feel like a distinctive emotional atmosphere
  native to the generated Concept DNA world.

- if the emotionalTone could appear in a perfume advertisement,
  luxury brand campaign,
  architecture article,
  or unrelated fantasy world,
  regenerate it.

audienceEmotion:
- exactly 3 items
- what the viewer should feel
- not generic filler
- banned emotional words:
  wonder
  awe
  curiosity
  curious
  intrigue
  intrigued
  fascination
  fascinated
  captivation
  captivated
  mystery
  anticipation
  excitement
  amazement
  amazed
  engagement
  engaged
  interest
  interested
  impressed
  mesmerized
  spellbound
- each item should feel concept-specific
- each item should emerge from the generated visuals and progression
- audienceEmotion should not simply repeat emotionalTone
- if audienceEmotion could fit multiple unrelated Concept DNA worlds, regenerate it
- prefer precise emotional reactions over broad emotional labels

Emotional Specificity Discipline Rule:

emotionalTone must describe the emotional pressure created by the visible Concept DNA world.

audienceEmotion must describe the viewer's specific reaction to the visible transformation.

Do not write emotionalTone or audienceEmotion as abstract mood labels.

Do not use:
- charged stasis
- compressed suspension
- fractured containment
- absorbed anticipation
- tense curiosity
- quiet unease
- suspended wonder
- visual fascination
- emotional tension
- spatial intrigue

Each emotionalTone item must be caused by:
- a visible material condition
- a physical restriction
- a transformation consequence
- a spatial behavior
- a final-frame state

Each audienceEmotion item must include:
- what the viewer notices
- what changes physically
- why that change creates a reaction

Prefer specific reaction language:
- unease as the material refuses to settle
- pressure from color trapped inside depth
- attention pulled toward the sealed rupture
- concern as the surface keeps reorganizing
- attention as the final state remains visibly unresolved

Reject any item that could describe a perfume campaign, luxury brand mood, architecture article, or generic sci-fi scene.

Every emotionalTone and audienceEmotion item must feel caused by this exact Concept DNA.

Mood / Visual Style / Reel Purpose Output Lock:

The selected Mood (${mood}) must shape the emotionalTone and audienceEmotion fields.
Do not simply repeat the mood label.
Translate the mood into concept-native emotional pressure caused by the visible material state, pacing, lighting and final-frame consequence.

The selected Visual Style (${visualStyle}) must remain visible in:
- reelConcept
- visualDNA
- directorNotes
- aiVideoPrompt
- thumbnailConcept

Do not use Visual Style as a separate world.
Use it only as surface behavior, lighting response, reflection logic, color treatment, contrast and camera texture.

The selected Reel Purpose (${reelPurpose}) must shape how the result feels as a finished creative asset.
For Artist Identity Reel:
- reelConcept must feel immediately readable as a lived artist world, not a signature mark
- directorNotes must describe an observable world condition without forcing symbolic closure
- aiVideoPrompt must prioritize physical behavior, camera observation and open-world continuity
- hooks and captions must feel usable for a music artist reel without explaining identity as a visible object
- audienceEmotion must describe how the visible world condition affects the viewer without using identity-defining language

Do not turn Reel Purpose into a new subject, location, prop, character or narrative event.
It may only affect framing, readability, pacing, final-image clarity and presentation intent.

snowflakeSignature:
- unique code
- format: WORD-####
- WORD must relate to the Cinematic Identity, not the Director Archetype
- WORD must not repeat projectCodename
- WORD must not repeat creativeArchetype
- WORD must originate from the generated Cinematic Identity

Every Cinematic Identity must feel collectible and unique.

Return ONLY valid JSON with this exact structure:
{
  "reelConcept": "",

  "cinematicIdentity": {
    "projectCodename": "",
    "creativeArchetype": "",
    "visualDNA": [],
    "emotionalTone": [],
    "audienceEmotion": [],
    "snowflakeSignature": ""
  },

  "aiVideoPrompt": "",

  "hooks": {
    "hook": "",
    "curiosityHook": "",
    "emotionalHook": "",
    "viralHook": ""
  },

  "captions": {
    "instagramCaption": "",
    "tiktokCaption": "",
    "shortsCaption": "",
    "hashtags": ""
  },

  "scores": {
    "viralScore": 0,
    "emotionScore": 0,
    "curiosityScore": 0,
    "visualNoveltyScore": 0,
    "replayScore": 0,
    "brandabilityScore": 0
  },

  "whyThisWorks": "",
  "bestPlatform": "",
  "targetAudience": "",
  "contentType": "",
  "viralityReason": "",
  "thumbnailPrompt": "",
  "directorSummary": "",

  "narrativeArc": {
    "stage1": "",
    "stage2": "",
    "stage3": ""
  }
}

Score rules:

Premium Score Intelligence Rule:

Scores must feel like a real creative evaluation, not automatic high numbers.

All scores must be integers from 1-10.

Do not give every category the same score.

Do not default to 8 or 9.

Do not overrate weak concepts.

Use the generated Concept DNA, visible transformation, final-frame consequence and platform behavior to decide the scores.

viralScore:
- overall short-form potential from 1-10
- must reflect curiosity, clarity, replayability and visual novelty together
- 9-10 only if the final frame is highly memorable and the transformation is instantly understandable
- 6-8 for strong but niche or slower concepts
- 1-5 for concepts that are hard to understand, too quiet or visually repetitive

emotionScore:
- rate the emotional pull of the visible world and transformation
- high scores require material pressure, fragility, suspension, collapse, exposure, loss, balance or release
- low scores if the concept is mostly mechanical or intellectually interesting

curiosityScore:
- rate how strongly the viewer wants to know what happens next
- high scores require a visible unanswered physical question
- low scores if the progression is predictable

visualNoveltyScore:
- rate how unusual and memorable the visual idea feels
- high scores require a final state that could not appear in a generic AI reel
- low scores if the concept relies on familiar effects such as glowing, cracking, floating or abstract motion

replayScore:
- rate whether viewers would rewatch to understand the cause-and-effect chain
- high scores require clear Stage 1 → Stage 2 → Stage 3 dependency
- low scores if the action is easy to understand in one viewing

brandabilityScore:
- rate whether the concept feels useful for an artist identity, release campaign or premium visual system
- high scores require a distinctive Cinematic Identity and recognizable visual signature
- low scores if the output feels like a one-off image with weak identity

Score calibration:
- At least one score should usually be lower than the highest score.
- Avoid perfect 10 unless the concept is exceptional.
- If the Concept DNA is visually niche or slow, do not force a high viralScore.
- If the final frame is weak, replayScore and viralScore must drop.
- If Cinematic Identity is strong, brandabilityScore may be higher than viralScore.
- If the transformation is hard to explain, curiosityScore may be high but viralScore should be moderate.

Why This Works rules:

Premium Why This Works Output Rule:

whyThisWorks must explain why this exact reel concept performs well.

Return exactly 5 concise reasons.

Return as an array of exactly 5 strings.

Each reason must be 3-7 words.

Each reason must be directly traceable to:
- the Concept DNA
- the visible physical transformation
- the final-state consequence
- the camera/pacing logic
- the viewer's curiosity loop

Do not use generic performance claims.

Do not use generic phrases such as:
- strong visual contrast
- high curiosity opening
- emotional atmosphere
- cinematic payoff ending
- platform-friendly pacing
- strong replay potential
- visually engaging
- highly shareable
- premium aesthetic
- unique concept
- scroll-stopping visuals

Each reason must mention a concrete visual, material, physical behavior or consequence from the generated concept.

Each reason must feel impossible to reuse for another Concept DNA.

Avoid vague nouns:
- tension
- atmosphere
- energy
- mood
- rhythm
- contrast
- emotion
- movement
- transformation
- curiosity
- payoff

Prefer concrete cause-and-effect reasons:
- water blocks stone runoff
- marbles invert beneath aqueduct
- concrete pressure redirects flow
- pearl layers trap reflected light
- glass channels drain molten edges

The five reasons must cover different value angles:
1. visual hook
2. transformation logic
3. final-frame memorability
4. replay reason
5. artist/brand fit

Do not label the five reasons.

Do not number the five reasons.

Do not repeat the same noun more than twice across the full array.

Examples:
ARCHITECT
POET
FASHION DIRECTOR
SCI-FI WORLD BUILDER
DOCUMENTARY DREAMER
SURREALIST
MINIMALIST
RITUALIST

Analysis rules:

Premium Analysis Output Rule:

The analysis fields must feel like useful creative intelligence, not generic marketing labels.

bestPlatform:
- choose exactly one: Instagram, TikTok or YouTube Shorts
- choose based on the generated concept's strongest behavior:
  - TikTok for immediate physical surprise, strange cause-and-effect, strong curiosity loops
  - Instagram for premium visual identity, polished composition, art-direction value
  - YouTube Shorts for clear transformation arcs, satisfying final states, replayable progression
- do not choose randomly
- do not explain the choice inside bestPlatform

targetAudience:
- describe the ideal audience in 3-6 words
- must feel specific to the generated visual world
- avoid generic audiences such as:
  music lovers
  visual artists
  creative people
  content creators
  reel viewers
  TikTok users
  Instagram users
  electronic music fans
- prefer audience descriptions based on visual taste, physical curiosity or aesthetic behavior

contentType:
- classify the reel format in 2-4 words
- must describe the actual viewing experience
- avoid generic labels such as:
  music reel
  visual reel
  cinematic reel
  AI video
  abstract visual
  creative concept
- prefer specific formats such as:
  physical transformation loop
  material pressure study
  final-frame reveal
  object behavior sequence
  world-state progression

viralityReason:
- one short sentence
- 10-18 words
- must explain the strongest share/replay trigger
- must mention one concrete visual or physical consequence
- do not use generic words such as:
  viral
  engaging
  captivating
  unique
  stunning
  cinematic
  beautiful
  immersive
  eye-catching
  scroll-stopping
- the reason must be specific enough that it could not fit another Concept DNA

Selected Creative Archetype:

${selectedDirectorArchetype}

Archetype Name:

${selectedDirectorArchetypeName}

The selected archetype is mandatory.

All directorSummary decisions must be filtered through this archetype only.

The selected archetype overrides default cinematic reasoning.

Do not balance multiple archetypes.

Do not use neutral creative-director language.

Write from the selected archetype's worldview only.

Director Blueprint rules:

Premium Director's Notes Output Rule:

The directorSummary is the user's premium creative direction note.

It must not sound like an explanation of the concept.

It must sound like a concise director's note from a high-end creative studio.

Write the directorSummary as one polished paragraph.

The directorSummary must be 55-85 words.

The directorSummary must contain:

1. one precise observation of the Concept DNA
2. one camera or pacing decision
3. one physical transformation logic
4. one final creative payoff

Do not start with:
- This reel
- The reel
- The film
- The camera
- The sequence
- The world
- Precision is
- Concrete surfaces
- The concept

Avoid overusing:
- lens
- interplay
- tension
- rhythm
- choreography
- dialogue
- transformation
- cinematic
- visual
- atmosphere
- silent
- subtle

Do not explain why it works.

Do not describe the output as a concept.

Do not use marketing language.

Do not use generic creative-director phrases.

Every directorSummary must feel specific to this exact Concept DNA.

If the same directorSummary structure could work for another Concept DNA, rewrite it.

The note should feel collectible, controlled and premium.

Writing Variation Rules:

- Never write every directorSummary as a film treatment.

- The narrative voice must change dramatically between generations.
- The structure, tone, vocabulary and sentence rhythm must change completely between generations.

- Never start every directorSummary with:
  "This reel..."
  "The reel..."
  "The film..."
  "The camera..."

- Vary the narrative voice dramatically.

Possible approaches:
- Describe the world first.
- Describe the architecture first.
- Describe the transformation first.
- Describe the atmosphere first.

Avoid repeating sentence structure between generations.
- The directorSummary must NOT follow the same narrative structure every time.
- The directorSummary must be written FROM the archetype's mindset.

Archetype Identity Enforcement

The selected archetype is the only creative lens.

Use only its:
- observation style
- framing priorities
- sequencing logic
- forbidden language

The directorSummary must sound unmistakably like this archetype from the first sentence.

If it could belong to another archetype, rewrite it.

Do not mix archetypes.

Generate one premium directorSummary.
Maximum 90 words.

Director's Notes Light Discipline Rule:

Inside directorSummary, avoid repeating light-related language.

Use each of these word families at most once:
- glow / glowing / glows
- light / lighting / lit
- pulse / pulsing / pulsating
- shimmer / shimmering
- neon

If the Concept DNA includes light, glow, neon or reflection, describe the directing consequence instead of repeating the same word.

Prefer:
- how the camera tracks reflected edges
- how exposure reveals material depth
- how color spill changes the frame
- how refraction alters the visible geometry
- how the final frame holds the physical result

Never use pulse as a generic intensity word.

Director's Notes Directability Rule:

The directorSummary must describe concrete directing choices, not abstract creative analysis.

Do not use explanatory studio-language such as:
- enhances
- highlights
- emphasizes
- suggests
- symbolizes
- represents
- expresses
- evokes
- reinforces
- communicates
- frames the idea
- reveals the concept
- creates a sense of
- gives the viewer
- invites the audience

Replace explanation with visible directing decisions.

Bad:
- the lighting enhances the emotional tension
- the composition highlights the transformation
- the movement symbolizes containment
- the sequence creates a sense of anticipation

Better:
- hold the frame as the material refuses to settle
- track the edge as color spill cuts across the surface
- let the final shot lock on the sealed fracture
- pace the movement so the physical change becomes unavoidable

Every directorSummary must include at least one concrete directing decision:
- camera hold
- tracking choice
- pacing choice
- exposure choice
- final-frame hold
- surface-level observation
- material reaction

If the sentence explains the creative meaning instead of directing what appears on screen, rewrite it.

Narrative Arc rules:

Premium Narrative Arc Output Rule:

The narrativeArc must feel like a premium 3-beat cinematic storyboard.

Each stage must be visually specific, physically observable and directly filmable.

Return exactly:
- stage1
- stage2
- stage3

Each stage must be 18-32 words.

Stage 1:
Establish the opening physical state of the Concept DNA with one clear visual condition.

Stage 2:
Show one irreversible physical change caused by Stage 1.

Stage 3:
Show the final consequence created by Stage 2, with a visibly different world behavior.

Each stage must contain:
- one concrete visual subject
- one physical action or condition
- one observable consequence

Do not write stages as explanations.

Do not write stages as abstract summaries.

Do not use the same sentence structure for all three stages.

Do not repeat the same noun more than twice across the full narrativeArc.

Avoid stage openings such as:
- The scene begins
- The camera shows
- The world reveals
- The structure
- The system
- The concept
- This stage

Avoid overusing:
- reveals
- establishes
- shifts
- transforms
- interplay
- tension
- hierarchy
- subtle
- dynamic
- system
- structure
- formation

Stage 2 must not be a stronger version of Stage 1.

Stage 3 must not be a bigger version of Stage 2.

The final stage must create a new physical rule, restriction or capability inside the Concept DNA world.

The narrativeArc must feel specific enough that it could not be reused for another Concept DNA.
- Generate one narrativeArc.
- The narrativeArc must be exactly 3 stages.
- Return narrativeArc as an object with exactly three keys: stage1, stage2, stage3.
- The arc must come from the Concept DNA only.
- Do not use generic architecture arcs.
- Do not use: Threshold, Nave, Sanctuary unless these words are explicitly present in the Concept DNA.
- Do not use: structure, compression, release unless the Concept DNA naturally contains that behavior.


Scene Validation Rule

Narrative Causality Rule

Scene 2 must happen because of Scene 1.

Scene 3 must happen because of Scene 2.

Narrative Escalation Rule

The stakes must change between scenes.

Scene 2 cannot be a stronger version of Scene 1.

Scene 3 cannot be a bigger version of Scene 2.

Each scene must introduce a new narrative state.

Bad:

object → bigger object → giant object

fog → more fog → huge fog


Every scene must create a new condition that changes the next scene.

The sequence must feel like a cinematic chain reaction.

Avoid:

- escalation without consequence
- repetition with higher intensity
- visual variation without behavioral change
- object -> larger object
- flow -> stronger flow
- accumulation -> more accumulation

Each stage must introduce a new physical condition.

A later stage must not simply amplify an earlier stage.

The consequence of one stage must become the cause of the next stage.

Instead:

Scene 1 creates a question.
Scene 2 transforms the question.
Scene 3 resolves, transcends or consequences the transformation.
Scene Dependency Test

Scene Purpose Rule

Each scene must perform a different function.

Do not repeat the same function twice.

Invalid:

observation → observation → observation


mystery → mystery → mystery


Archetype Scene Dependency Rule

The archetype determines
the causal relationship between scenes.

DOCUMENTARY DREAMER

Scene 1 must observe a specific real detail.

The observed detail must feel real,
ordinary and documentary.

Avoid:
- levitating objects
- impossible physics
- magical objects
- surreal anomalies
- unexplained sci-fi elements

Mystery must come from observation,
not impossible objects.

Scene 2 must reveal a repeating natural or behavioral pattern caused by that detail.

Scene 3 must show what the pattern means through a quiet understanding, not a reveal.

If Scene 3 can be replaced by
a reveal shot:

rewrite.

Understanding must come from
evidence accumulated in Scene 1
and Scene 2.

The meaning must be discovered.

Not announced.

Not explained.

Not revealed.

Avoid wide final reveals.

Scene 3 must not use:
- wide shot
- aerial reveal
- pull back
- final reveal
- grand reveal
- epic reveal

Scene 3 should stay close, observational and specific.

Prefer:
- accumulated evidence
- natural behavior becoming clear
- texture proving time has passed
- routine becoming meaning

rewrite.


Scene Originality Test

Replace the subject of the reel.

Example:

monolith → bird

temple → mountain

forest → city

If the scene progression still works unchanged:

rewrite.

The progression must be specific
to this concept.

Do not generate reusable scene structures.

Artist: ${artistName}
Track: ${trackName}
Genre: ${genre}
Mood: ${mood}
BPM: ${bpm}
Visual Style: ${visualStyle}
Director Mode: ${directorMode}
Cinematic DNA: ${styleDNA}
Era: ${era}
Reel Purpose: ${reelPurpose}

Locked World:
Concept DNA: ${selectedConceptDNA}

Allowed Creative Modifiers:
Director Mode: ${directorMode}
Cinematic DNA: ${styleDNA}
Music Energy: ${energyStyle}
Mood: ${mood}
Visual Style: ${visualStyle}
Era: ${era}
Reel Purpose: ${reelPurpose}

Modifier Application Rules:
These modifiers must control presentation, pacing, emotional charge and output framing.
They must not create a second concept.

Mood must be visible through:
- emotional pressure
- pacing
- tension or release
- atmosphere density
- viewer feeling

Visual Style must be visible through:
- lighting behavior
- surface reflections
- color treatment
- camera texture
- contrast
- material response

Reel Purpose must shape how the concept is presented.
For Artist Identity Reel, the output must feel like a signature artist-branding visual:
- memorable
- immediately readable
- identity-driven
- suitable as a premium music artist reel

Do not use director mode, cinematic DNA, music energy, mood, visual style, era or reel purpose as separate concepts.
The Concept DNA is the only world.

Director Mode, Cinematic DNA, Era, Reel Purpose, Genre, Mood, BPM and Visual Style
must never introduce:

- objects
- materials
- locations
- architecture
- technologies
- ecosystems
- characters
- narrative events
- physical behaviors
- transformations
- final-state consequences

They may only influence:

- framing
- pacing
- composition
- camera behavior
- color treatment
- lighting treatment
- motion language
- atmosphere

All visible content must originate from the Concept DNA.
Archetype Restriction Rule:

Archetypes may only modify:

- shot selection
- camera behavior
- pacing
- framing
- sequencing
- observation style

Archetypes may not modify:

- world state
- physical phenomena
- objects
- materials
- transformations
- environmental behavior

If a visual element does not already exist in the Concept DNA,
the archetype may not introduce it.

Archetypes answer:

HOW the world is observed.

Never:

WHAT exists in the world.

Archetypes may not introduce:

- actions
- events
- rituals
- goals
- functions
- purposes
- systems
- behaviors

unless explicitly present in the Concept DNA.

Archetypes may not invent new phenomena.

They may only reinterpret phenomena already present in the Concept DNA.

Forbidden examples:

crystal insect migration
→ liquid geometry
→ reality distortion
→ dissolving reflections

cybernetic coral reef
→ geometry
→ architecture
→ lattices
→ spatial manifesto

quantum whale migration
→ fabric
→ couture
→ luxury materials

The archetype changes perspective.

The archetype does not add content.

Archetypes may NOT add:

- objects
- materials
- locations
- architecture
- technologies
- ecosystems
- characters
- actions
- events
- rituals
- goals
- functions
- purposes
- systems
- behaviors
- physical phenomena
- transformations
- final-state consequences

unless explicitly present in the Concept DNA.

The archetype is a lens.

The Concept DNA remains the world.

Snowflake Priority Rule:

The goal is maximum creative uniqueness while preserving Concept DNA identity.

Every generation must feel surprising, specific and non-template.

Do not solve uniqueness by adding generic poetic language.

Do not use repeated AI phrases such as:
- whisper
- heartbeat
- echo
- dream
- ceremony
- energy
- poetry
- haunting
- forgotten secrets

Uniqueness must come from:
- unusual visual consequences
- specific material details
- unexpected camera logic
- concept-specific progression
- fresh scene relationships

If the output feels like familiar AI language:
rewrite it.

Concept DNA Purity Rule:

Do not add decorative props, cultural details, furniture, tools, vehicles, ornaments or architectural sub-elements unless they are explicitly present in the Concept DNA.

Concept DNA is the highest source of truth.

Nothing may be introduced unless it is:

1. explicitly present in the Concept DNA

or

2. a direct observable consequence of the Concept DNA.

The model must not decorate concepts.

The model must not enrich concepts.

The model must not expand concepts with unrelated visual details.

Direct Consequence Rule:

A direct consequence must be physically unavoidable from the Concept DNA.

If the consequence requires interpretation,
symbolism,
style influence,
archetype influence,
or unrelated world knowledge,
it is invalid.

A direct consequence must be observable through a clear physical chain.

Concept DNA → consequence

Nothing else.

Inference Limit Rule:

A direct consequence must be physically unavoidable.

Allowed:

forgotten sky elevator ruins
→ rust
→ corrosion
→ damaged mechanisms

crystal insect migration
→ wing movement
→ migration paths
→ accumulation

Forbidden:

crystal insect migration
→ liquid geometry

cybernetic coral reef
→ metallic lattice

neon glacier civilization
→ energy protocols

underwater cathedral
→ religious ritual

If the connection requires imagination,
it is not a direct consequence.

Allowed:

underwater cathedral
→ water
→ cathedral
→ submerged architecture

crystal insect migration
→ insects
→ crystal wings
→ migration paths
→ accumulation from migration

forgotten sky elevator ruins
→ rust
→ decay
→ damaged mechanisms

Direct consequences must remain physically local.

Do not introduce unrelated species,
materials,
locations,
cultures,
technologies,
or environmental conditions.

A consequence may only emerge from elements already present in the Concept DNA.

Forbidden:

forgotten sky elevator ruins
→ birds
→ forests
→ sunset
→ civilizations

underwater cathedral
→ whales
→ coral reef
→ bioluminescent fish

unless explicitly present in the Concept DNA.

Visual Invention Ban:

Do not invent:

- animals
- plants
- weather
- materials
- civilizations
- cultures
- technologies
- historical context
- scale descriptors

unless explicitly present in the Concept DNA.

Scale Rule:

Do not introduce scale unless explicitly supported by the Concept DNA.

Forbidden examples:

- vast
- massive
- colossal
- monumental
- sprawling
- gigantic
- endless

Do not assume the size of anything.

Scale must be directly observable from the Concept DNA itself.

The Concept DNA is mandatory.

Single World Rule:

Use only ONE primary world.

The Concept DNA defines the world.

Do not merge multiple worlds together.

Do not combine:

- forest + moon archive
- desert + coral reef
- city + underwater cathedral
- glacier + jungle

unless the Concept DNA explicitly requires it.

Everything must belong to the same coherent world.

The entire reel must be built around it.

Reel Concept Quality Rule:

Premium Reel Concept Output Rule:

The reelConcept must feel like a finished premium creative pitch.

Write the reelConcept in exactly 2 sentences.

Sentence 1:
Establish the Concept DNA as a cinematic visual world with concrete objects, materials, spatial relationships and atmosphere.

Sentence 2:
Describe the transformation and its direct consequence.

The reelConcept must not exceed 65 words.

The reelConcept must not explain too much.

The reelConcept must not sound like technical documentation.

Avoid repeating the same noun more than twice.

Avoid overusing:
- system
- structure
- dynamics
- interplay
- tension
- hierarchy
- subtle
- shifting

Prefer:
- one vivid visual setup
- one clear physical change
- one memorable final consequence

The reelConcept should make the user immediately think:
"I can picture this reel."

The reelConcept must never be only the raw Concept DNA.

Bad:
"desert signal temple"
"ancient lunar archive"
"underwater cathedral"

Good:
A concept-specific cinematic premise that explains what is happening inside the Concept DNA world.

The reelConcept must include:

- the Concept DNA
- one visible narrative condition
- one visible progression
- one direct consequence emerging from the Concept DNA

The reelConcept must not introduce
objects,
materials,
locations,
behaviors,
transformations,
or consequences
that are not already present in the Concept DNA
or a direct observable consequence of it.

The archetype may influence only
observation style,
framing,
sequencing,
and perspective.

The archetype must not contribute world content.

Maximum 45 words.

If reelConcept is only a title or raw concept name:
rewrite it before responding.

The Director Blueprint must explain it.

The Narrative Arc must emerge from it.

The AI Video Prompt must visually show it.

If the Concept DNA is:

"underwater cathedral"

then the world itself must contain an underwater cathedral.

If the Concept DNA is:

"cybernetic coral reef"

then the world itself must contain a cybernetic coral reef.

Never translate the Concept DNA into a metaphor.

Never replace it.

Never abstract it away.

Treat it as a physical reality.

The Concept DNA must remain physically present inside the reelConcept.

Do not replace it.

Do not reinterpret it.

Do not translate it into a metaphor.

Do not abstract it into another world.

The reelConcept must be built around the Concept DNA as a literal physical reality.

Concept Purity Rule:

Do not introduce additional major concepts.

The Concept DNA is the primary visual idea.

Build depth from it.

Do not decorate it.

Do not combine it with:

- random creatures
- random animals
- random species
- random civilizations
- random ecosystems
- random characters

unless they are already part of the Concept DNA.

One strong idea is better than five weak ideas.

No Visual Decoration Rule:

Do not add visual elements simply to make the world more interesting.

Every major object must originate from the Concept DNA.

If an element can be removed without changing the Concept DNA,
it should not exist.

Nothing should compete with the Concept DNA for attention.

World Lock Rule:

The Concept DNA is a locked world.

No major visual element may exist outside the Concept DNA
or its direct observable consequences.

The world is considered invalid if additional:

- locations
- cultures
- eras
- species
- creatures
- technologies
- civilizations
- environments
- landmarks
- architectural styles

appear outside the Concept DNA.

When in doubt:

remove the noun.

Do not add any location, culture, era, creature, object or environment that is not directly contained in the Concept DNA.

Do not combine the Concept DNA with another world.

Bad:
underwater cathedral + Nordic mountains
ancient lunar archive + jungle temple
arctic mirror labyrinth + Roman empire
biomechanical rainforest + cybernetic birds

Good:
underwater cathedral only
ancient lunar archive only
arctic mirror labyrinth only
biomechanical rainforest only

If extra elements appear, rewrite the concept using only the Concept DNA.

---

Language Diversity Rules:

Vocabulary Repetition Rule

If the same descriptive word
appears repeatedly across generations:

replace it.

Prefer new language over familiar language.

Do not reuse signature adjectives
unless required by the concept.

Visual variety and linguistic variety
are equally important.

Archetype Enforcement Rule

Archetype Conflict Rule

If a generated idea conflicts with
the Concept DNA:

follow the Concept DNA.

Never sacrifice Concept DNA integrity
for archetype preferences.

The Concept DNA always overrides archetype behavior.

Archetype Scene Logic Rule

The archetype determines:

- shot order
- framing progression
- pacing progression
- camera progression
- observation progression

The archetype does not determine:

- events
- meaning
- emotions
- motivations
- narrative outcomes

Scene progression must emerge from
the Concept DNA itself.

The archetype only determines
how that progression is observed.

- Avoid overusing words such as:
  neon, dreamscape, hypnotic, surreal, glowing, immersive, cinematic, atmospheric, futuristic, luxury.

- If these words are used, they should be rare and justified by the concept.

- Use fresh vocabulary every generation.

- If similar wording appeared recently, choose different descriptive language.

- Prioritize linguistic variety as strongly as visual variety.

Forbidden Director Summary Patterns

Avoid repeatedly using:

- The camera...
- The pacing...
- The sequence...
- The visual rhythm...
- The world...
- This piece...
- This film...
- This reel...

Avoid explaining every concept in a linear order.

Do not repeatedly use:

world → movement → climax

Rotate structure constantly.

GLOBAL PREMIUM INTERPRETATION RULE

Before writing any creative output, interpret the full input combination as one fused creative thesis.

Do not treat Artist, Track, Genre, BPM, Mood, Visual Style, Director Mode, Cinematic DNA, Era and Reel Purpose as separate keywords to stack.

Different input combinations must create clearly different:
- main subject
- scene premise
- spatial logic
- material behavior
- camera grammar
- emotional tension
- final frame

Never solve a new combination by reusing the same motif with different color, lighting or texture.

If the user changes Mood, Visual Style, Director Mode, Cinematic DNA, Era or Reel Purpose, the core image idea must change.

Avoid system-facing language such as:
- input-specific
- interpretation family
- visual pressure
- machine-led
- object-led
- subject family
- selected fields

Write like a premium creative director, not like a prompt system explaining itself.

The reel concept must contain a concrete cinematic premise, not only a description of style.

The aiVideoPrompt must describe a filmable visual situation with a clear main image, not a list of aesthetic ingredients.

`,
        },
      ],
    });

// ===============================
// FRAME LAB AI OUTPUT HANDLING
// ===============================

const text = completion.choices?.[0]?.message?.content;

if (!text) {
  return res.status(500).json({
    error: "No AI response received",
  });
}

// -------------------------------
// SAFE JSON PARSE
// -------------------------------
let data;

try {
  data = JSON.parse(text);
} catch (parseError) {
  console.error("JSON PARSE FAILED:", parseError);

  return res.status(500).json({
    error: "Invalid JSON from AI",
    details: parseError.message,
  });
}

// -------------------------------
// MUSIC-FACING HASHTAG SAFETY PATCH
// -------------------------------
const cleanMusicFacingHashtags = (hashtags) => {
  const isMusicFacingPurpose = [
    "Artist Identity Reel",
    "Track Launch Teaser",
    "Spotify Canvas Direction",
    "Music Video Concept Seed",
    "Social Teaser Hook",
    "Album World Reveal",
    "Live Visual Intro",
  ].includes(reelPurpose);

  if (!isMusicFacingPurpose) return hashtags;

  const toPascalHashtag = (value) => {
    const words = String(value || "")
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean);

    if (!words.length) return "";

    return "#" + words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  };

  const artistTag = toPascalHashtag(artistName);
  const trackTag = toPascalHashtag(trackName);
  const genreTag = toPascalHashtag(genre);

  const normalizedTrackName = String(trackName || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  const blockedFragments = [
    "performing",
    "artistidentity",
    "identityreel",
    "trackstatic",
    "staticheartsartist",
    "heartsartist",
    "artistluna",
    "valetrack",
    "tracklaunch",
    "launchteaser",
    "tracklaunchteaser",
    "staticheartstrack",
    "heartstrack",
    "heartstracklaunch",
    "genre",
    "reelpurpose",
    "cinematicdna",
    "directormode",
  ];

  const safeFallbacks = [
    artistTag,
    trackTag,
    genreTag,
    "#MusicRelease",
    "#ArtistPortrait",
    "#PerformanceStill",
    "#ReleaseTeaser",
    "#MusicVideoConcept",
    "#VisualIdentity",
    "#NewMusic",
  ].filter(Boolean);

  const incoming = Array.isArray(hashtags)
    ? hashtags
    : String(hashtags || "")
        .split(/[\s,]+/)
        .filter(Boolean);

  const cleaned = incoming
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : "#" + tag))
    .filter((tag) => {
      const normalized = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      if (!normalized) return false;

      const isTrackSystemCompound =
        normalizedTrackName &&
        normalized !== normalizedTrackName &&
        normalized.includes(normalizedTrackName) &&
        normalized.includes("track");

      if (isTrackSystemCompound) return false;

      return !blockedFragments.some((fragment) =>
        normalized.includes(fragment)
      );
    });

  const merged = [...cleaned, ...safeFallbacks];

  const unique = [];
  const seen = new Set();

  merged.forEach((tag) => {
    const normalized = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    if (!normalized || seen.has(normalized)) return;

    seen.add(normalized);
    unique.push(tag);
  });

  return unique.slice(0, 10);
};

if (data?.hashtags) {
  data.hashtags = cleanMusicFacingHashtags(data.hashtags);
}

// -------------------------------
// FINAL IDENTITY SAFETY PATCH
// -------------------------------
const forbiddenTerms = [
  "aetheris",
  "aurelia",
  "aureline",
  "vestige",
  "solmere",
  "lustrebound",
  "grainfall",
  "auralite",
  "noctilume",
  "luminaris",
  "skybound",
  "codex",
  "codices",
  "syntax",
  "script",
  "scripture",
  "scriptures",
  "scriptoria",
  "glyph",
  "glyphic",
  "glyphics",
  "palimpsest",
  "dialect",
  "dialectic",
  "lexicon",
  "grammar",
  "language",
  "cartography",
  "archive",
  "record",
  "chronicle",
  "manuscript",
  "cantillation",
  "cantillate",
  "cantus",
  "cantillaria",
  "reliquary",
  "manifest",
  "memorist",
  "fractalogy",
  "chimeborne",
  "bellbound",
  "lanternwright",
  "shardcall",
  "celestine",
  "nacreic",
  "nacrean",
  "pearlescent",
  "pearlborne",
  "gearborne",
  "gearbound",
  "shardborne",
  "lanternis",
  "lanternfall",
  "marbloc",
  "chrysalis",
  "stratiform",
  "frostglass",
  "amberborne",
  "moonstone",
  "obsidianic",
  "quartzian",
  "woven",
  "wove",
  "weave",
  "weaver",
  "interwoven",
  "covenant",
  "bloom",
  "nexus",
  "reverie",
  "ascendant",
  "eclipse",
  "ethereal",
  "celestial",
  "flux",
  "resonance",
  "drift",
  "echo",
  "pulse",
  "ascension",
  "reflection",
  "observer",
  "movement",
  "canon",
  "pathweaver",
  "pathweavers",
  "kinship"
];

const normalizeText = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const containsForbiddenTerm = (value) => {
  const normalizedValue = normalizeText(value);

  return forbiddenTerms.some((term) =>
    normalizedValue.includes(normalizeText(term))
  );
};

const forbiddenRoleTerms = [
  "architect",
  "cartographer",
  "navigator",
  "conductor",
  "keeper",
  "guardian",
  "watcher",
  "witness",
  "witnesses",
  "builder",
  "creator",
  "curator",
  "explorer",
  "master",
  "designer",
  "engineer",
  "sculptor",
  "weaver",
  "observer",
  "director",
  "operator",
  "composer",
  "collector",
  "maker",
  "formist",
  "specialist",
  "technician"
];

const containsForbiddenRoleTerm = (value) => {
  const normalizedValue = normalizeText(value);

  return forbiddenRoleTerms.some((term) =>
    normalizedValue.includes(normalizeText(term))
  );
};

const forbiddenCreativeArchetypeSuffixes = [
  "er",
  "ist",
  "or",
  "ian",
  "wright",
  "maker",
  "keeper",
  "borne",
  "bound",
  "influence",
  "materiality",
  "poise",
  "essence",
  "presence",
  "expression",
  "gesture",
  "aesthetic",
  "imprint",
  "continuity",
  "articulation",
  "harmony",
  "balance",
  "flow",
  "transition",
  "stasis",
  "recalibration",
  "edge",
  "matrix",
  "reflexion",
  "reflection",
  "foldscape",
  "dialogue",
  "dynamics",
  "impression",
  "vibration",
  "resonance"
];

const containsForbiddenCreativeArchetypeSuffix = (value) => {
  const words = String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return words.some((word) =>
    forbiddenCreativeArchetypeSuffixes.some((suffix) =>
      word.endsWith(suffix)
    )
  );
};

const genericCreativeArchetypeAnchorWords = [
  "ancient",
  "state",
  "lab",
  "labs",
  "scene",
  "world",
  "space",
  "visual",
  "style",
  "concept",
  "identity",
  "creative",
  "project",
  "massive",
  "delicate",
  "subtle",
  "smooth",
  "slow",
  "sudden",
  "steady",
  "visible",
  "hidden",
  "internal",
  "external",
  "final",
  "locked",
  "new",
  "dense",
  "thin",
  "fine",
  "faint",
  "muted",
  "soft",
  "dim",
  "pale",
  "cold",
  "warm",
  "compression",
  "compressed",
  "suspension",
  "suspended",
  "containment",
  "contained",
  "surface",
  "surfaces",
  "pressure",
  "material",
  "tension",
  "density",
  "shift",
  "fracture",
  "fractured",
  "condition",
  "field",
  "form",
  "threshold",
  "rupture",
  "layered",
  "tactile",
  "structural",
  "inversion",
  "inverted",
  "arrangement",
  "formation",
  "transformation",
  "procession",
  "open",
  "opens",
  "opening",
  "inside",
  "while",
  "into",
  "forms"
];

const normalizeCreativeIdentityWord = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const toTitleWord = (word) => {
  const cleanWord = String(word || "").replace(/[^a-zA-Z0-9]/g, "");

  if (!cleanWord) return "";

  return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
};

const getSafeConceptWords = (concept) =>
  String(concept || "")
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !containsForbiddenTerm(word))
    .filter((word) => !containsForbiddenRoleTerm(word));

const getCreativeArchetypeSourceText = (concept) => {
  const visualDNA = data?.cinematicIdentity?.visualDNA;

  const visualDNAText = Array.isArray(visualDNA)
    ? visualDNA.join(" ")
    : String(visualDNA || "");

  return [
    concept,
    data?.reelConcept,
    data?.concept,
    data?.thumbnailConcept,
    visualDNAText
  ]
    .filter(Boolean)
    .join(" ");
};

const getCreativeArchetypeAnchorWords = (concept) => {
  const uniqueWords = [];

  getCreativeArchetypeSourceText(concept)
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter(
      (word) =>
        !genericCreativeArchetypeAnchorWords.includes(
          normalizeCreativeIdentityWord(word)
        )
    )
    .filter((word) => !containsForbiddenTerm(word))
    .filter((word) => !containsForbiddenRoleTerm(word))
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .forEach((word) => {
      const normalized = normalizeCreativeIdentityWord(word);

      if (
        !uniqueWords.some(
          (existingWord) =>
            normalizeCreativeIdentityWord(existingWord) === normalized
        )
      ) {
        uniqueWords.push(word);
      }
    });

  return uniqueWords.slice(0, 16);
};

const getMeaningfulCreativeArchetypeWords = (value) =>
  String(value || "")
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter(
      (word) =>
        !genericCreativeArchetypeAnchorWords.includes(
          normalizeCreativeIdentityWord(word)
        )
    );

const buildIdentityFallback = (concept) => {
  const anchorWords = getCreativeArchetypeAnchorWords(concept);

  const first = anchorWords[0] || "Material";
  const second = anchorWords[1] || "Pressure";

  const archetypeEndings = [
    "Spatial Lock",
    "Material Threshold",
    "Surface Condition",
    "Depth Mark",
    "Frame Relic",
    "Texture Signal",
    "Pressure Image",
    "World Fragment",
    "Motion Seal",
    "Visual Consequence"
  ];

  const ending =
    archetypeEndings[
      Math.floor(Math.random() * archetypeEndings.length)
    ];

  return `${toTitleWord(first)} ${toTitleWord(second)} ${ending}`;
};

const isGenericCreativeArchetype = (value) => {
  const normalized = String(value || "").toLowerCase().trim();

  return (
    !normalized ||
    normalized === "concept-native identity" ||
    normalized === "concept native identity" ||
    normalized === "framelab identity" ||
    normalized === "frame lab identity" ||
    normalized.includes("concept-native") ||
    normalized.includes("concept native")
  );
};

const creativeArchetypeContainsConceptLanguage = (value, concept) => {
  const normalizedValue = normalizeCreativeIdentityWord(value);
  const anchorWords = getCreativeArchetypeAnchorWords(concept)
    .map((word) => normalizeCreativeIdentityWord(word))
    .filter((word) => word.length >= 4);

  const meaningfulWords = getMeaningfulCreativeArchetypeWords(value);

  if (!normalizedValue || anchorWords.length < 2) return false;
  if (meaningfulWords.length < 2) return false;

  const matchedAnchorWords = anchorWords.filter((word) =>
    normalizedValue.includes(word)
  );

  const uniqueMatches = [...new Set(matchedAnchorWords)];

  return uniqueMatches.length >= 2;
};

const projectCodenameHasRepeatedWord = (codename = "") => {
  const words = String(codename)
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  if (words.length < 2) {
    return false;
  }

  const seenWords = new Set();

  for (const word of words) {
    if (seenWords.has(word)) {
      return true;
    }

    seenWords.add(word);
  }

  return false;
};

const buildProjectCodenameFallback = (concept) => {
  const anchorWords = getCreativeArchetypeAnchorWords(concept);

  const selectedWords = [];
  const seenWords = new Set();

  for (const word of anchorWords) {
    const titleWord = toTitleWord(word);
    const normalizedWord = titleWord.toLowerCase();

    if (!normalizedWord || seenWords.has(normalizedWord)) {
      continue;
    }

    selectedWords.push(titleWord);
    seenWords.add(normalizedWord);

    if (selectedWords.length >= 3) {
      break;
    }
  }

  if (selectedWords.length < 1) {
    selectedWords.push("Frame");
    seenWords.add("frame");
  }

  if (selectedWords.length < 2) {
    selectedWords.push("Lab");
    seenWords.add("lab");
  }

  const codenameEndings = [
    "Vault",
    "Archive",
    "Chamber",
    "Sequence",
    "Relic",
    "Index",
    "Capsule",
    "Blueprint",
    "Cipher"
  ];

  const safeEndings = codenameEndings.filter(
    (ending) => !seenWords.has(ending.toLowerCase())
  );

  const availableEndings = safeEndings.length > 0 ? safeEndings : codenameEndings;

  const source = `${concept || ""}${selectedWords.join("")}`;

  const endingIndex =
    Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    availableEndings.length;

  const ending = availableEndings[endingIndex];

  return `${selectedWords.join(" ")} ${ending}`;
};

const buildSnowflakeSignature = (identity, concept) => {
  const anchorWords = getCreativeArchetypeAnchorWords(concept);

  const first = anchorWords[0] || "Frame";
  const second = anchorWords[1] || "Lab";

  const source = [
    identity?.projectCodename || "",
    identity?.creativeArchetype || "",
    concept || "",
    first,
    second
  ].join(" ");

  const signatureNumber =
    Array.from(source).reduce((sum, char, index) => {
      return sum + char.charCodeAt(0) * (index + 1);
    }, 0) % 9000;

  const paddedNumber = String(1000 + signatureNumber).slice(-4);

  return `${toTitleWord(first).toUpperCase()}-${toTitleWord(second).toUpperCase()}-${paddedNumber}`;
};

  const normalizeSnowflakeSignature = (signature, identity, concept) => {
    const buildFallbackSignature = () =>
      buildSnowflakeSignature(identity, concept);

    const value = String(signature || "").trim();
    const match = value.match(/^(.+)-(\d{4})$/);

    if (!match) {
      return buildFallbackSignature();
    }

    const words = match[1]
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .map((word) => word.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 2);

    if (words.length < 1) {
      return buildFallbackSignature();
    }

    const nativeSourceWords = [
      identity?.projectCodename || "",
      identity?.creativeArchetype || "",
      concept || "",
    ]
      .join(" ")
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length >= 4);

    const hasConceptNativeWord = words.some((word) => {
      const normalizedWord = word.toLowerCase();

      return nativeSourceWords.some((sourceWord) => {
        return (
          sourceWord === normalizedWord ||
          sourceWord.includes(normalizedWord) ||
          normalizedWord.includes(sourceWord)
        );
      });
    });

    if (!hasConceptNativeWord) {
      return buildFallbackSignature();
    }

    const number = match[2];

    return `${words.join("-")}-${number}`;
  };

  const bannedAudienceEmotionTerms = [
    "wonder",
    "awe",
    "curiosity",
    "curious",
    "intrigue",
    "intrigued",
    "fascination",
    "fascinated",
    "captivation",
    "captivated",
    "mystery",
    "anticipation",
    "excitement",
    "amazement",
    "amazed",
    "engagement",
    "engaged",
    "interest",
    "interested",
    "impressed",
    "mesmerized",
    "spellbound",
  ];

  const hasBannedAudienceEmotionTerm = (value = "") => {
    const normalizedValue = String(value).toLowerCase();

    return bannedAudienceEmotionTerms.some((term) => {
      return new RegExp(`\\b${term}\\b`, "i").test(normalizedValue);
    });
  };

  const buildAudienceEmotionFallbacks = (concept) => {
    const anchorWords = getCreativeArchetypeAnchorWords(concept)
      .map((word) => word.toLowerCase())
      .filter(Boolean);

    const primary = anchorWords[0] || "material";
    const secondary = anchorWords[1] || "surface";
    const tertiary = anchorWords[2] || primary;

    return [
      `attention fixed on the ${primary} change as it visibly alters the frame`,
      `unease as the ${secondary} structure tightens and prevents the motion from resolving`,
      "satisfaction when the final visible arrangement locks into a clear physical consequence",
    ];
  };

  const repairAudienceEmotionList = (items, concept) => {
    const fallbackItems = buildAudienceEmotionFallbacks(concept);
    const sourceItems = Array.isArray(items) ? items : [];

    return [0, 1, 2].map((index) => {
      const item = String(sourceItems[index] || "").trim();

      if (!item || hasBannedAudienceEmotionTerm(item) || item.split(/\s+/).length < 4) {
        return fallbackItems[index];
      }

      return item;
    });
  };

if (!data.cinematicIdentity) {
  data.cinematicIdentity = {};
}

if (
  !data.cinematicIdentity.projectCodename ||
  containsForbiddenTerm(data.cinematicIdentity.projectCodename) ||
  containsForbiddenRoleTerm(data.cinematicIdentity.projectCodename) ||
    projectCodenameHasRepeatedWord(data.cinematicIdentity.projectCodename)
) {
  data.cinematicIdentity.projectCodename =
    buildProjectCodenameFallback(selectedConceptDNA);
}

if (
  !data.cinematicIdentity.creativeArchetype ||
  isGenericCreativeArchetype(data.cinematicIdentity.creativeArchetype) ||
  !creativeArchetypeContainsConceptLanguage(
    data.cinematicIdentity.creativeArchetype,
    selectedConceptDNA
  ) ||
  containsForbiddenTerm(data.cinematicIdentity.creativeArchetype) ||
  containsForbiddenRoleTerm(data.cinematicIdentity.creativeArchetype) ||
  containsForbiddenCreativeArchetypeSuffix(
    data.cinematicIdentity.creativeArchetype
  )
) {
  data.cinematicIdentity.creativeArchetype =
    buildIdentityFallback(selectedConceptDNA);
}

if (
  !data.cinematicIdentity.snowflakeSignature ||
  String(data.cinematicIdentity.snowflakeSignature || "").startsWith("SIG-") ||
  containsForbiddenTerm(data.cinematicIdentity.snowflakeSignature) ||
  containsForbiddenRoleTerm(data.cinematicIdentity.snowflakeSignature)
) {
  data.cinematicIdentity.snowflakeSignature = buildSnowflakeSignature(
    data.cinematicIdentity,
    selectedConceptDNA
  );
}

  data.cinematicIdentity.snowflakeSignature = normalizeSnowflakeSignature(
    data.cinematicIdentity.snowflakeSignature,
    data.cinematicIdentity,
    selectedConceptDNA
  );

  data.cinematicIdentity.audienceEmotion = repairAudienceEmotionList(
    data.cinematicIdentity.audienceEmotion,
    selectedConceptDNA
  );


console.log(
  "FINAL CREATIVE ARCHETYPE:",
  data.cinematicIdentity.creativeArchetype
);

// -------------------------------
// AI VIDEO PROMPT OUTPUT SAFETY PATCH
// -------------------------------
const cleanAiVideoPromptText = (value) => {
  if (!value) return value;

  let prompt = String(value).trim();

  const replacements = [
    [/,\s*emphasizing\s+[^.]+/gi, ""],
    [/,\s*highlighting\s+[^.]+/gi, ""],
    [/,\s*suggesting\s+[^.]+/gi, ""],
    [/,\s*symbolizing\s+[^.]+/gi, ""],
    [/,\s*representing\s+[^.]+/gi, ""],
    [/,\s*expressing\s+[^.]+/gi, ""],
    [/,\s*implying\s+[^.]+/gi, ""],
    [/,\s*evoking\s+[^.]+/gi, ""],
    [/,\s*reinforcing\s+[^.]+/gi, ""],
    [/\bthat emphasizes\b/gi, "showing"],
    [/\bemphasizes\b/gi, "shows"],
    [/\bhighlighting\b/gi, "showing"],
    [/\bsuggesting\b/gi, "showing"],
    [/\bsymbolizing\b/gi, "showing"],
    [/\brepresenting\b/gi, "showing"],
    [/\bexpressing\b/gi, "showing"],
    [/\bimplying\b/gi, "showing"],
    [/\bevoking\b/gi, "showing"],
    [/\breinforcing\b/gi, "showing"],
    [/\brewrite(?:s|ing)? physical rules\b/gi, "lock into a visible new arrangement"],
    [/\bgravity loses its hold\b/gi, "objects remain suspended in place"],
    [/\breality bends\b/gi, "surfaces bend into a visible new shape"],
    [/\btime freezes\b/gi, "movement stops in the final frame"],
    [/\bthe scene transforms into tension\b/gi, "the materials lock into a compressed arrangement"],
    [/\bthe moment becomes symbolic\b/gi, "the final frame holds on the visible material state"],
    [/\bthe image captures emotion\b/gi, "the final frame holds on the visible material state"],
    [/\bthe frame represents\b/gi, "the final frame shows"],
    [/\bthe shot embodies\b/gi, "the shot holds on"],
    [/\bthe sequence reveals meaning\b/gi, "the sequence ends on a visible final arrangement"],
  ];

  replacements.forEach(([pattern, replacement]) => {
    prompt = prompt.replace(pattern, replacement);
  });

  return prompt.replace(/\s+/g, " ").trim();
};

data.aiVideoPrompt = cleanAiVideoPromptText(data.aiVideoPrompt);

// -------------------------------
// NO DECAY LANGUAGE OUTPUT SAFETY PATCH
// -------------------------------
const noDecayLanguageSourceText = (() => {
  try {
    return JSON.stringify(selectedConceptDNA || "").toLowerCase();
  } catch {
    return String(selectedConceptDNA || "").toLowerCase();
  }
})();

const conceptDNAContainsDecayTerm = (term) => {
  return noDecayLanguageSourceText.includes(String(term || "").toLowerCase());
};

const cleanPublicDecayLanguageText = (value) => {
  if (!value) return value;

  let text = String(value);

  const replacements = [
    ["layered layering", "layered striations"],
    ["suspended suspension", "suspended state"],
    ["suspend in suspension", "remain suspended"],
    ["suspended in suspension", "held in suspension"],
    ["worn smooth", "polished smooth"],
    ["softly worn", "softly textured"],
    ["heavily worn", "deeply textured"],
    ["visibly worn", "visibly textured"],
    ["aged translucence", "layered translucence"],
    ["aged surface", "layered surface"],
    ["aged surfaces", "layered surfaces"],
    ["decay", "material separation"],
    ["decayed", "separated"],
    ["decaying", "separating"],
    ["decomposition", "material separation"],
    ["decomposing", "separating"],
    ["corrosion", "surface reaction"],
    ["corroded", "textured"],
    ["erosion", "surface displacement"],
    ["eroded", "displaced"],
    ["weathering", "surface texture"],
    ["weathered", "textured"],
    ["aged", "layered"],
    ["aging", "surface shifting"],
    ["worn", "textured"],
    ["ruin", "structure"],
    ["ruined", "fractured"],
    ["rotten", "softened"],
    ["rotting", "softening"]
  ];

  replacements.forEach(([term, replacement]) => {
    if (conceptDNAContainsDecayTerm(term)) return;

    const pattern = new RegExp(`\\b${term}\\b`, "gi");
    text = text.replace(pattern, replacement);
  });

  return text.replace(/\s+/g, " ").trim();
};

const cleanPublicDecayLanguageValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(cleanPublicDecayLanguageValue);
  }

  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      value[key] = cleanPublicDecayLanguageValue(value[key]);
    });

    return value;
  }

  if (typeof value === "string") {
    return cleanPublicDecayLanguageText(value);
  }

  return value;
};

Object.keys(data).forEach((key) => {
  data[key] = cleanPublicDecayLanguageValue(data[key]);
});

// -------------------------------
// CAPTION OPENING SAFETY PATCH
// -------------------------------
const cleanCaptionOpeningText = (value) => {
  if (!value) return value;

  let text = String(value).trim();

  const openingReplacements = [
    [/^watch\s+as\s+/i, ""],
    [/^watch\s+/i, ""],
    [/^see\s+how\s+/i, ""],
    [/^see\s+/i, ""],
    [/^experience\s+/i, ""],
    [/^witness\s+how\s+/i, ""],
    [/^witness\s+/i, ""],
    [/^dive\s+into\s+/i, ""],
    [/^delve\s+into\s+/i, ""]
  ];

  openingReplacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  text = text.replace(
    /\s*[.!?]\s+(watch|see|experience|witness|dive\s+into|delve\s+into)\s+[^.!?]+[.!?]?/gi,
    "."
  );

  text = text.replace(
    /\s*[—-]\s*(watch|see|experience|witness|dive\s+into|delve\s+into)\s+[^.!?]+[.!?]?/gi,
    "."
  );

  const genericCaptionSentencePatterns = [
    /\s*[.!?]\s+a\s+delicate\s+dance\s+of\s+[^.!?]+[.!?]?/gi,
    /\s*[.!?]\s+the\s+transformation\s+reveals\s+[^.!?]+[.!?]?/gi,
    /\s*[.!?]\s+a\s+slow,\s+visible\s+transformation\s+of\s+[^.!?]+[.!?]?/gi,
    /\s*[.!?]\s+a\s+delicate\s+transformation\s+unfolds\s+[^.!?]+[.!?]?/gi
  ];

  genericCaptionSentencePatterns.forEach((pattern) => {
    text = text.replace(pattern, ".");
  });

  const genericCaptionPhrasePatterns = [
    /\s+in\s+a\s+stunning\s+transformation/gi,
    /\s+in\s+a\s+rare\s+transformation/gi,
    /\s+in\s+a\s+mesmerizing\s+transformation/gi,
    /\s+in\s+a\s+silent\s+[^.!?]*dance/gi,
    /,\s*in\s+a\s+delicate\s+dance\s+of\s+[^.!?]+/gi,
    /\s+in\s+a\s+delicate\s+dance\s+of\s+[^.!?]+/gi,
    /\s+unlike\s+anything\s+you[’']ve\s+seen/gi,
    /\s+the\s+tension\s+in\s+[^.!?]+\s+tells\s+a\s+quiet\s+story/gi
  ];

  genericCaptionPhrasePatterns.forEach((pattern) => {
    text = text.replace(pattern, "");
  });

  text = text
    .replace(/\s+\./g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return text;

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const isWeakCaption = (value) => {
  const text = String(value || "").trim();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    !text ||
    words.length < 8 ||
    /(?:envelops|captures|reveals|shows|reflects|embodies|expresses)\.?$/i.test(text)
  );
};

const buildMusicFacingMainCaption = () => {
  const artist = artistName || "The artist";
  const track = trackName || "the track";
  const purpose = String(reelPurpose || "music reel").toLowerCase();
  const moodLabel = String(mood || "emotional tension").toLowerCase();
  const visual = visualStyle || "a defined cinematic visual language";

  return (
    artist +
    " frames " +
    track +
    " as a " +
    purpose +
    " built around " +
    moodLabel +
    ", using " +
    visual +
    " to turn performance presence, wardrobe texture and controlled visual pressure into a release-ready cinematic identity."
  );
};

const polishMusicFacingGrammar = (value) => {
  if (!value || typeof value !== "string") return value;

  let text = String(value).trim();

  const replacements = [
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+fold\b/gi, "$1 folds"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+curl\b/gi, "$1 curls"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+trap\b/gi, "$1 traps"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+shape\b/gi, "$1 shapes"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+move\b/gi, "$1 moves"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+freeze\b/gi, "$1 freezes"],
    [/\b(performance|silhouette|presence|figure|artist|subject|moment|wardrobe|fabric|coat|dress|veil|haze|air|light|dust|sand|mirage|atmosphere)\s+envelopes\b/gi, "$1 envelops"],
    [/\b(curls|folds|moves|shifts|wraps|compresses)\s+and\s+trap\b/gi, "$1 and traps"],
    [/\b(curls|folds|moves|shifts|wraps|compresses)\s+and\s+hold\b/gi, "$1 and holds"],
  ];

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  const toBaseVerb = (verb) => {
    const forms = {
      folds: "fold",
      curls: "curl",
      traps: "trap",
      shapes: "shape",
      moves: "move",
      freezes: "freeze",
      envelops: "envelop",
      catches: "catch",
      pauses: "pause",
      holds: "hold",
      locks: "lock",
      shifts: "shift",
      fractures: "fracture",
      rewires: "rewire",
      reshapes: "reshape",
      cracks: "crack",
    };

    return forms[String(verb || "").toLowerCase()] || verb;
  };

  const toThirdPersonSingular = (verb) => {
    const forms = {
      fold: "folds",
      curl: "curls",
      trap: "traps",
      shape: "shapes",
      move: "moves",
      freeze: "freezes",
      envelop: "envelops",
      catch: "catches",
      pause: "pauses",
      hold: "holds",
      lock: "locks",
      shift: "shifts",
      fracture: "fractures",
      rewire: "rewires",
      reshape: "reshapes",
      crack: "cracks",
    };

    return forms[String(verb || "").toLowerCase()] || verb;
  };

  text = text.replace(
    /\b(does|did)\s+([^.!?]{0,90}?)\s+(folds|curls|traps|shapes|moves|freezes|envelops|catches)\b/gi,
    (match, aux, subject, verb) => aux + " " + subject + " " + toBaseVerb(verb)
  );

  text = text.replace(
    /\b((?:neon\s+)?(?:shards|fragments|droplets|reflections|lights|headlights|footsteps|steps|ripples|waves|pools|patterns|arcs|bodies|cars|motorcycles|vehicles)(?:\s+(?:beneath|under|above|around|behind|across|inside|near|over|beside|with)\s+[^.!?,]{1,70})?)\s+(freezes|locks|traps|fractures|rewires|reshapes|cracks|holds|shifts|moves)\b/gi,
    (match, subject, verb) => subject + " " + toBaseVerb(verb)
  );

  text = text.replace(
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?[’']s\s+(?:chase|movement|presence|silhouette|performance|moment))\s+(pause|move|hold|lock|shift|freeze)\b/g,
    (match, subject, verb) => subject + " " + toThirdPersonSingular(verb)
  );

  text = text.replace(
    /\b(fabric|haze|air|light|dust|sand|mirage|atmosphere|shadow|reflection)\s+and\s+(fabric|haze|air|light|dust|sand|mirage|atmosphere|shadow|reflection)\s+(folds|curls|traps|shapes|moves|freezes|envelops|catches)\b/gi,
    (match, firstSubject, secondSubject, verb) =>
      firstSubject + " and " + secondSubject + " " + toBaseVerb(verb)
  );

  const escapeRegExp = (value) => {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  if (artistName) {
    const safeArtistName = escapeRegExp(artistName);
    const artistVerbPattern = new RegExp(
      "\\b(" + safeArtistName + ")\\s+(catch|fold|curl|trap|shape|move|freeze|envelop)\\b",
      "gi"
    );

    text = text.replace(
      artistVerbPattern,
      (match, artist, verb) => artist + " " + toThirdPersonSingular(verb)
    );
  };

  return text.replace(/\s+/g, " ").trim();
};

const protectMainCaption = (value) => {
  const cleaned = polishMusicFacingGrammar(
    cleanCaptionOpeningText(value)
  );

  if (!isWeakCaption(cleaned)) return cleaned;

  return polishMusicFacingGrammar(
    cleanCaptionOpeningText(buildMusicFacingMainCaption())
  );
};

if (data.caption) {
  data.caption = polishMusicFacingGrammar(
    cleanCaptionOpeningText(data.caption)
  );
}

if (data.captions) {
  data.captions.mainCaption = protectMainCaption(
    data.captions.mainCaption
  );

  data.captions.instagramCaption = polishMusicFacingGrammar(
    cleanCaptionOpeningText(data.captions.instagramCaption)
  );

  data.captions.tiktokCaption = polishMusicFacingGrammar(
    cleanCaptionOpeningText(data.captions.tiktokCaption)
  );

  data.captions.shortsCaption = polishMusicFacingGrammar(
    cleanCaptionOpeningText(data.captions.shortsCaption)
  );
}

// -------------------------------
// PUBLIC OUTPUT SAFETY PATCH
// -------------------------------
const forbiddenHashtagStems = [
  "neotokyo",
  "miamiafterdark",
  "y2k",
  "dreamcinema",
  "luxurysunset",
  "neonoir",
  "scifi",
  "mediumpace",
  "mediumpacing",
  "balancedshot",
  "steadycamera",
  "cinematicvisual",
  "cinematicmarble",
  "visualtension",
  "visualreel",
  "dreamlike",
  "visualalchemy",
  "vibes",
  "mood",
  "magic",
  "pulse",
  "pulsing",
  "pulsating",
  "glow",
  "glowing",
  "light",
  "lighting",
  "lit",
  "neon",
  "shimmer",
  "shimmering",
  "reverie",
  "tides",
  "echo",
  "drift",
  "mirage",
  "horizon",
  "aura",
  "nexus",
  "aftermidnight",
  "midnight",
  "melodichouse",
  "housemusic",
  "deephouse",
  "techno",
  "electronicmusic",
  "club",
  "clubnight",
  "dj",
  "dancefloor",
  "nightlife",
  "musicvibes",
  "musicreel",
  "beat",
  "beats",
  "groove",
  "soundscape",
  "electric",
  "electricity",
  "energy",
  "vein",
  "veins",
  "network",
  "networks",
  "circuit",
  "circuits",
  "reflection",
  "reflections",
  "reflective",
  "weather",
  "suspensionart",
  "refractionart",
  "materialbehavior",
  "physicalbehavior",
  "physicaltransformation",
  "materialtransformation",
  "materialshift",
  "surfacetension",
  "patternweaving",
  "electromelody",
  "electro",
  "melody",
  "poetry",
  "poetic",
  "mechanicalpoetry",
  "mechanicalart",
  "artistic",
  "artistry",
  "creative",
  "creativity",
  "decay",
  "decayed",
  "decomposition",
  "decomposing",
  "erosion",
  "corrosion",
  "weathering",
  "aging",
  "aged",
  "music",
  "musicvisuals",
  "visualmusic",
  "melodic",
  "melodicprogression",
  "progression",
  "synth",
  "synthwave",
  "wave",
  "beat",
  "beats",
  "rhythm",
  "rhythmic",
  "dance",
  "ballet",
  "movement",
  "steadymovement",
  "heartbeat",
  "physical",
  "physicalchange",
  "change",
  "transformation",
  "visualtransformation",
  "creativeprocess",
  "process",
  "concept",
  "conceptart",
  "digitalart",
  "ambient",
  "ambienttech",
  "tech",
  "technology",
  "sound",
  "audio",
  "sonic",
  "hum",
  "hums",
  "humming",
  "singing",
  "singingquartz",
  "harmonic",
  "harmonics",
  "oscillation",
  "oscillations",
  "steady",
  "steadiestill",
  "still",
  "stillness",
  "rare",
  "moment",
  "witness",
  "audible",
  "audibletextures",
  "texture",
  "textures",
  "precision",
  "precisionmaterial",
  "bpm",
  "rock",
  "rockbalance",
  "cinematic",
  "cinematicstone",
  "balance",
  "materialbalance",
  "kinetic",
  "kineticmetals",
  "metals",
  "planet",
  "planetsized",
  "sized",
  "sizedbrass",
  "mechanism"
];

const weakSingleWordHashtags = [
  "orbital",
  "silver",
  "mirror",
  "singing",
  "quartz",
  "weather",
  "chapele",
  "chapel",
  "concrete",
  "rainsoaked",
  "crystal",
  "crystalline",
  "amber",
  "glass",
  "stone",
  "marble",
  "pearl",
  "visual",
  "reel",
  "music",
  "art",
  "material",
  "texture",
  "detail",
  "surface",
  "light",
  "shadow",
  "pressure",
  "motion",
  "transformation",
  "compression",
  "suspension"
];

const fallbackStopWords = [
  "the",
  "and",
  "with",
  "within",
  "under",
  "above",
  "beneath",
  "inside",
  "into",
  "from",
  "that",
  "this",
  "their",
  "they",
  "them",
  "its",
  "his",
  "her",
  "our",
  "your",
  "for",
  "are",
  "was",
  "were",
  "while",
  "through",
  "across",
  "around",
  "between",
  "against",
  "slowly",
  "subtle",
  "soft",
  "sharp",
  "vast",
  "dense",
  "delicate",
  "fragile",
  "premium"
];

const normalizeHashtag = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const applyHashtagCorrections = (token) => {
  let safeToken = String(token || "").trim();

  if (!safeToken) return "";

  safeToken = safeToken
    .replace(/^#+/, "")
    .replace(/conrete/gi, "concrete")
    .replace(/crystaline/gi, "crystalline")
    .replace(/visuallreel/gi, "visualreel");

  const knownHashtagWords = [
    "fractured",
    "crystalline",
    "compression",
    "trapped",
    "droplets",
    "glass",
    "folding",
    "storm",
    "pressure",
    "prismatic",
    "fissures",
    "rain",
    "trapping",
    "memory",
    "reliquary",
    "concrete",
    "surface",
    "rainwater",
    "pooling",
    "mineral",
    "deposits",
    "slabs",
    "wet",
    "soaked",
    "material",
    "shift",
    "suspended",
    "water",
    "living",
    "eclipse",
    "pearl",
    "spheres",
    "iridescent",
    "membranes",
    "fluid",
    "trap",
    "translucent",
    "opalescent",
    "skin",
    "frozen",
    "mist",
    "glacier",
    "shards",
    "ice",
    "reliquary",
    "crystal",
    "insect",
    "amber",
    "stone",
    "bellstone",
    "marble",
    "aqueduct",
    "vault",
    "lantern",
    "cable",
    "suspension",
    "quartz",
    "pillars",
    "pillar",
    "crystalline",
    "bands",
    "band",
    "translucent",
    "facets",
    "facet",
    "chamber",
    "compression",
    "steady",
    "still",
    "sky",
    "elevator",
    "frost",
    "frostbound",
    "ascent",
    "lantern",
    "spiral",
    "metallic",
    "cables",
    "twisting",
    "stone",
    "inversion",
    "surfaces",
    "spatial",
    "pressure",
    "locked",
    "arrangement",
    "mass",
    "floating",
    "monastery",
    "fragment",
    "moonstone",
    "archive",
    "cybernetic",
    "coral"
  ];

  const splitKnownCompound = (value) => {
    const lower = String(value || "").toLowerCase();
    const words = [];
    let index = 0;

    while (index < lower.length) {
      const match = knownHashtagWords
        .filter((word) => lower.startsWith(word, index))
        .sort((a, b) => b.length - a.length)[0];

      if (!match) return null;

      words.push(match);
      index += match.length;
    }

    return words.length > 1 ? words : null;
  };

  const rawWords = safeToken
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const words =
    rawWords.length === 1
      ? splitKnownCompound(rawWords[0]) || rawWords
      : rawWords;

  const pascalCase = words
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");

  return pascalCase ? `#${pascalCase}` : "";
};

const isWeakSingleWordHashtag = (token) => {
  const raw = String(token || "").replace(/^#/, "").trim();
  const normalizedToken = normalizeHashtag(token);

  const hasCompoundShape = /[a-z][A-Z]/.test(raw) || /\d/.test(raw);

  return weakSingleWordHashtags.includes(normalizedToken) && !hasCompoundShape;
};

const isForbiddenHashtag = (token) => {
  if (!String(token || "").startsWith("#")) return false;

  const correctedToken = applyHashtagCorrections(token);
  const normalizedToken = normalizeHashtag(correctedToken);

  if (!normalizedToken) return true;

  if (
    forbiddenHashtagStems.some((stem) =>
      normalizedToken.includes(stem)
    )
  ) {
    return true;
  }

  if (isWeakSingleWordHashtag(correctedToken)) {
    return true;
  }

  if (/(detail|texture|aesthetic|aesthetics)$/i.test(normalizedToken)) {
    return true;
  }

  return false;
};

const isPremiumHashtag = (token) => {
  const correctedToken = applyHashtagCorrections(token);
  const normalizedToken = normalizeHashtag(correctedToken);
  const raw = String(correctedToken || "").replace(/^#/, "").trim();

  const genericHashtagEndings = [
    "study",
    "effect",
    "process",
    "behavior",
    "behaviour",
    "transformation",
    "aesthetic",
    "visual",
    "content",
    "moment"
  ];

  if (!normalizedToken) return false;
  if (isForbiddenHashtag(correctedToken)) return false;

  if (
    genericHashtagEndings.some((ending) =>
      normalizedToken.endsWith(ending)
    )
  ) {
    return false;
  }

  if (/^\d+bpm$/i.test(raw)) {
    return true;
  }

  if (normalizedToken.length < 8) {
    return false;
  }

  const hasCompoundShape = /[a-z][A-Z]/.test(raw) || /\d/.test(raw);

  return hasCompoundShape || normalizedToken.length >= 12;
};

const removeHashtagsFromCaption = (value) => {
  if (!value) return value;

  return String(value)
    .split(/\s+/)
    .filter((token) => !String(token || "").startsWith("#"))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
};

const toHashtagWord = (value) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

const toTitleHashtagWord = (value) => {
  const cleanWord = toHashtagWord(value);

  if (!cleanWord) return "";

  return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
};

const getFallbackConceptWords = (concept) => {
  const uniqueWords = [];

  String(concept || "")
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length > 2)
    .filter((word) => !fallbackStopWords.includes(word.toLowerCase()))
    .map((word) => toTitleHashtagWord(word))
    .filter(Boolean)
    .forEach((word) => {
      const normalized = normalizeHashtag(word);

      if (!uniqueWords.some((item) => normalizeHashtag(item) === normalized)) {
        uniqueWords.push(word);
      }
    });

  return uniqueWords;
};

const conceptNativeHashtagAllowWords = [
  "pressure",
  "compression",
  "compressed",
  "suspension",
  "suspended",
  "inversion",
  "inverted",
  "fracture",
  "fractured",
  "fold",
  "folded",
  "folding",
  "bending",
  "bend",
  "tilt",
  "tilted",
  "trapped",
  "locked",
  "sealed",
  "shift",
  "displacement",
  "containment",
  "basin",
  "cavity",
  "pocket",
  "particles",
  "droplets",
  "dust",
  "sediment",
  "fragments",
  "shards",
  "layers",
  "surface",
  "surfaces",
  "void",
  "cluster",
  "clusters"
];

const getConceptHashtagWordSet = (concept) => {
  return getFallbackConceptWords(concept)
    .map((word) => normalizeHashtag(word))
    .filter((word) => word.length >= 4);
};

const isConceptNativeHashtag = (token, concept) => {
  const normalizedToken = normalizeHashtag(token);
  const conceptWords = getConceptHashtagWordSet(concept);

  const usesConceptWord = conceptWords.some((word) =>
    normalizedToken.includes(word)
  );

  const usesPhysicalConsequence = conceptNativeHashtagAllowWords.some((word) =>
    normalizedToken.includes(normalizeHashtag(word))
  );

  return usesConceptWord || usesPhysicalConsequence;
};

const buildFallbackHashtags = (concept) => {
  const conceptWords = getFallbackConceptWords(concept);
  const fallbackTags = [];

  const getHashtagRoot = (word) =>
    normalizeHashtag(word)
      .replace(/ing$/i, "")
      .replace(/ed$/i, "")
      .replace(/s$/i, "");

  const hasRepeatedRoot = (words) => {
    const roots = words
      .map((word) => getHashtagRoot(word))
      .filter((root) => root.length >= 4);

    return roots.some((root, index) => roots.indexOf(root) !== index);
  };

  const addFallbackTag = (words) => {
    const safeWords = words.filter(Boolean);

    if (safeWords.length < 2) return;
    if (hasRepeatedRoot(safeWords)) return;

    fallbackTags.push(`#${safeWords.join("")}`);
  };

  for (let index = 0; index < conceptWords.length; index += 1) {
    const first = conceptWords[index];
    const second = conceptWords[index + 1];
    const third = conceptWords[index + 2];

    addFallbackTag([first, second]);
    addFallbackTag([first, second, third]);
  }

  return fallbackTags
    .map((tag) => applyHashtagCorrections(tag))
    .filter((tag) => isPremiumHashtag(tag));
};

const cleanHashtagList = (value, concept) => {
  const uniqueTags = [];

  const addUniqueTag = (token) => {
    const correctedToken = applyHashtagCorrections(token);

    if (!correctedToken.startsWith("#")) return;
    if (!isPremiumHashtag(correctedToken)) return;

    const normalized = normalizeHashtag(correctedToken);

    if (!uniqueTags.some((tag) => normalizeHashtag(tag) === normalized)) {
      uniqueTags.push(correctedToken);
    }
  };

  buildFallbackHashtags(concept).forEach(addUniqueTag);

  String(value || "")
    .split(/\s+/)
    .map((token) => applyHashtagCorrections(token))
    .filter((token) => token.startsWith("#"))
    .filter((token) => isPremiumHashtag(token))
    .filter((token) => isConceptNativeHashtag(token, concept))
    .forEach(addUniqueTag);

  return uniqueTags.slice(0, 10).join(" ");
};

if (data.captions) {
  data.captions.instagramCaption = removeHashtagsFromCaption(
    data.captions.instagramCaption
  );

  data.captions.tiktokCaption = removeHashtagsFromCaption(
    data.captions.tiktokCaption
  );

  data.captions.shortsCaption = removeHashtagsFromCaption(
    data.captions.shortsCaption
  );

  data.captions.hashtags = cleanHashtagList(
    data.captions.hashtags,
    selectedConceptDNA
  );

  const finalMusicFacingHashtags = cleanMusicFacingHashtags(
    data.captions.hashtags
  );

  data.captions.hashtags = Array.isArray(finalMusicFacingHashtags)
    ? finalMusicFacingHashtags.join(" ")
    : finalMusicFacingHashtags;
}

if (data.caption) {
  data.caption = removeHashtagsFromCaption(data.caption);
}

// -------------------------------
// HOOK OUTPUT SAFETY PATCH
// -------------------------------
const cleanHookText = (value) => {
  if (!value) return value;

  let hook = String(value).trim();

  hook = hook
    .replace(/^watch\s+/i, "")
    .replace(/^see\s+/i, "")
    .replace(/^discover\s+/i, "")
    .replace(/^experience\s+/i, "")
    .replace(/^what if\s+/i, "")
    .replace(/^this is\s+/i, "")
    .replace(/^here is\s+/i, "")
    .replace(/^imagine\s+/i, "")
    .replace(/^when\s+/i, "");

  const polishedHook = polishMusicFacingGrammar(hook);

  return polishedHook.charAt(0).toUpperCase() + polishedHook.slice(1);
};

if (data.hooks) {
  data.hooks.hook = cleanHookText(data.hooks.hook);
  data.hooks.curiosityHook = cleanHookText(data.hooks.curiosityHook);
  data.hooks.emotionalHook = cleanHookText(data.hooks.emotionalHook);
  data.hooks.viralHook = cleanHookText(data.hooks.viralHook);
}

// -------------------------------
// VALIDATION LAYER
// -------------------------------
console.log("DIRECTOR SUMMARY:", data.directorSummary);

const requiredFields = [
  "reelConcept",
  "aiVideoPrompt",
  "hooks",
  "captions",
  "scores",
  "thumbnailPrompt",
  "directorSummary",
  "narrativeArc"
];

for (const field of requiredFields) {
  if (!data[field]) {
    throw new Error(`Missing field: ${field}`);
  }
}

const imagePrompt = `
Create a cinematic vertical music reel preview frame.

Safe cinematic atmosphere only.
No violence.
No horror.
No dangerous scenes.
No destruction.
No explicit content.

Style: ${visualStyle}
Mood: ${mood}
Genre: ${genre}

Scene:
${data.aiVideoPrompt}

Make it premium cinematic, atmospheric, elegant, dreamlike and visually artistic.

No text.
No logos.
No subtitles.
No watermarks.
`;

// PRE-LIVE MODE
const enforceMusicFacingActionScene = () => {
  const actionSource = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const isActionMusicFacing =
    musicFacingReelPurposes.includes(reelPurpose) &&
    /\b(pursuit|banditry|reckoning|getaway|chase|drive|night drive|vehicle|car|motorcycle|road)\b/.test(actionSource);

  if (!isActionMusicFacing) return;

  const artist = String(artistName || "The artist").trim();
  const track = String(trackName || "the track").trim();
  const genreLabel = String(genre || "electronic").trim();
  const moodLabel = String(mood || "tense anticipation").trim().toLowerCase();

  const vehicle =
    /\b(car|coupe|sedan|drive|night drive)\b/.test(actionSource) &&
    !/\b(motorcycle|bike)\b/.test(actionSource)
      ? "black performance car"
      : "sleek motorcycle";

  const roadWorld = /\b(tunnel|underpass|neo noir|rainy neon streets|luxury night drive)\b/.test(actionSource)
    ? "rain-slicked tunnel lane beneath concrete ribs"
    : "rain-slicked night road with a readable curve, lane markings and street direction";

  const reelConcept =
    artist +
    " drives the launch of " +
    track +
    " through a " +
    roadWorld +
    ", moving beside a visible " +
    vehicle +
    " with headlights and taillights cutting a clear chase direction through wet asphalt. A second pursuing light source stays readable behind her, turning the scene into a medium-wide night-drive setpiece where the vehicle, road lane, braking angle and artist movement carry the tension instead of abstract reflections.";

  const directorNotes =
    "Stage the sequence as a readable action frame, not a close-up portrait. Keep " +
    artist +
    ", the visible " +
    vehicle +
    ", the road lane, tunnel direction, headlights, taillights and chase distance in the same composition. Use rain spray and wet asphalt as physical support only; the final image must remain focused on artist, vehicle, road direction and pursuit movement.";

  const aiVideoPrompt =
    "Medium-wide low-angle side-tracking shot of " +
    artist +
    " moving through a " +
    roadWorld +
    " beside a visible " +
    vehicle +
    ". Headlights and taillights are attached to the vehicle and stretch along the wet lane, while a second pursuing light source remains visible behind her to define chase geography. The camera follows the vehicle line through the tunnel curve as " +
    artist +
    " accelerates, brakes and turns with controlled body language. The final frame stays action-based: " +
    artist +
    " plus the visible " +
    vehicle +
    ", readable road direction, tunnel ribs, lane markings, headlights, taillights and pursuit distance. Do not make suspended droplets, puddles, shards, prisms, trapped reflections or frozen light the main subject.";

  const thumbnailPrompt =
    "Medium-wide low-angle action frame of " +
    artist +
    " beside a visible " +
    vehicle +
    " on a rain-slicked tunnel lane, headlights and taillights attached to the vehicle, lane direction and tunnel ribs readable, second pursuing light source behind, luxury night-drive tension, no close-up portrait, no droplet-focused composition.";

  const stage1 =
    artist +
    " enters the rain-slicked tunnel lane beside a visible " +
    vehicle +
    ", with headlights, taillights, lane markings and the pursuing light source establishing the chase geography.";

  const stage2 =
    "The " +
    vehicle +
    " accelerates and brakes through the wet lane, forcing spray from the tires while " +
    artist +
    " keeps readable running or riding body language inside the frame.";

  const stage3 =
    "The final frame holds the action geography: " +
    artist +
    ", the visible " +
    vehicle +
    ", tunnel ribs, lane direction, headlights, taillights and chase distance remain the main subject.";

  data.reelConcept = reelConcept;
  data.directorSummary = directorNotes;
  data.directorNotes = directorNotes;
  data.aiVideoPrompt = aiVideoPrompt;
  data.videoPrompt = aiVideoPrompt;
  data.thumbnailPrompt = thumbnailPrompt;
  data.thumbnailConcept = thumbnailPrompt;

  data.narrativeArc = {
    stage1,
    stage2,
    stage3,
  };

  data.cinematicIdentity = {
    ...(data.cinematicIdentity || {}),
    projectCodename: "Night Drive Pursuit",
    creativeArchetype: artist + " Vehicle Chase Signal",
    visualDNA: [
      "visible vehicle and wet road direction",
      "headlights and taillights defining chase geography",
      "medium-wide night-drive action composition",
    ],
    emotionalTone: [
      moodLabel + " in motion",
      "controlled chase pressure",
      "release energy carried by vehicle movement",
    ],
    audienceEmotion: [
      "tracks the visible vehicle through the road frame",
      "feels the chase distance behind the artist",
      "reads the final frame as motion, not suspended texture",
    ],
  };

  data.hooks = {
    ...(data.hooks || {}),
    primary: artist + " turns " + track + " into a rain-lit vehicle chase.",
    primaryHook: artist + " turns " + track + " into a rain-lit vehicle chase.",
    curiosity: "Who is gaining ground behind the tunnel lights?",
    curiosityHook: "Who is gaining ground behind the tunnel lights?",
    emotional: "The road tightens as " + artist + " moves through the chase.",
    emotionalHook: "The road tightens as " + artist + " moves through the chase.",
    viral: "A visible " + vehicle + " cuts through neon rain with " + artist + " in motion.",
    viralHook: "A visible " + vehicle + " cuts through neon rain with " + artist + " in motion.",
  };

  data.captions = {
    ...(data.captions || {}),
    mainCaption:
      artist +
      " frames " +
      track +
      " as a " +
      genreLabel +
      " night-drive pursuit, using a visible " +
      vehicle +
      ", tunnel lanes, headlights and chase movement to turn release tension into a cinematic action frame.",
    instagramCaption:
      artist +
      " frames " +
      track +
      " as a " +
      genreLabel +
      " night-drive pursuit, using a visible " +
      vehicle +
      ", tunnel lanes, headlights and chase movement to turn release tension into a cinematic action frame.",
    tiktokCaption:
      artist +
      " moves through tunnel light with a visible " +
      vehicle +
      " behind the chase energy of " +
      track +
      ".",
    youtubeShortsCaption:
      "A visible " +
      vehicle +
      ", tunnel lanes and headlights turn " +
      artist +
      "'s " +
      track +
      " into a night-drive pursuit.",
    youtubeCaption:
      "A visible " +
      vehicle +
      ", tunnel lanes and headlights turn " +
      artist +
      "'s " +
      track +
      " into a night-drive pursuit.",
  };

  if (typeof polishMusicFacingGrammar === "function") {
    data.reelConcept = polishMusicFacingGrammar(data.reelConcept);
    data.directorSummary = polishMusicFacingGrammar(data.directorSummary);
    data.directorNotes = polishMusicFacingGrammar(data.directorNotes);
    data.aiVideoPrompt = polishMusicFacingGrammar(data.aiVideoPrompt);
    data.videoPrompt = polishMusicFacingGrammar(data.videoPrompt);
    data.thumbnailPrompt = polishMusicFacingGrammar(data.thumbnailPrompt);
    data.thumbnailConcept = polishMusicFacingGrammar(data.thumbnailConcept);
    data.captions.mainCaption = polishMusicFacingGrammar(data.captions.mainCaption);
    data.captions.instagramCaption = polishMusicFacingGrammar(data.captions.instagramCaption);
    data.captions.tiktokCaption = polishMusicFacingGrammar(data.captions.tiktokCaption);
    data.captions.youtubeShortsCaption = polishMusicFacingGrammar(data.captions.youtubeShortsCaption);
  }
};

const enforceMusicFacingActionDisplayAliases = () => {
  const actionSource = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const isActionMusicFacing =
    musicFacingReelPurposes.includes(reelPurpose) &&
    /\b(pursuit|banditry|reckoning|getaway|chase|drive|night drive|vehicle|car|motorcycle|road)\b/.test(actionSource);

  if (!isActionMusicFacing) return;

  const artist = String(artistName || "The artist").trim();
  const track = String(trackName || "the track").trim();
  const vehicle =
    /\b(car|coupe|sedan|drive|night drive)\b/.test(actionSource) &&
    !/\b(motorcycle|bike)\b/.test(actionSource)
      ? "black performance car"
      : "sleek motorcycle";

  const primaryHook =
    artist + " drives " + track + " through tunnel lights with a visible " + vehicle + ".";
  const curiosityHook = "Who is gaining ground behind the tunnel lights?";
  const emotionalHook = "The road tightens as " + artist + " moves through the chase.";
  const viralHook =
    "A visible " + vehicle + " cuts through neon rain with " + artist + " in motion.";

  data.hooks = {
    ...(data.hooks || {}),
    primary: primaryHook,
    primaryHook,
    primary_hook: primaryHook,
    curiosity: curiosityHook,
    curiosityHook,
    curiosity_hook: curiosityHook,
    emotional: emotionalHook,
    emotionalHook,
    emotional_hook: emotionalHook,
    viral: viralHook,
    viralHook,
    viral_hook: viralHook,
  };

  const youtubeShortsCaption =
    "A visible " +
    vehicle +
    ", tunnel lane and headlights turn " +
    artist +
    "'s " +
    track +
    " into a clean night-drive chase frame.";

  data.captions = {
    ...(data.captions || {}),
    youtubeShorts: youtubeShortsCaption,
    youtubeShortsCaption,
    youtubeCaption: youtubeShortsCaption,
    youtube: youtubeShortsCaption,
  };

  data.primaryHook = primaryHook;
  data.curiosityHook = curiosityHook;
  data.emotionalHook = emotionalHook;
  data.viralHook = viralHook;
  data.youtubeShortsCaption = youtubeShortsCaption;
};

enforceMusicFacingActionScene();
enforceMusicFacingActionDisplayAliases();
const enforceMusicFacingActionResponseLock = () => {
  const actionSource = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const isActionMusicFacing =
    musicFacingReelPurposes.includes(reelPurpose) &&
    /\b(pursuit|banditry|reckoning|getaway|chase|drive|night drive|vehicle|car|motorcycle|road)\b/.test(actionSource);

  if (!isActionMusicFacing) return;

  const artist = String(artistName || "The artist").trim();
  const track = String(trackName || "the track").trim();
  const genreLabel = String(genre || "electronic").trim();
  const vehicle =
    /\b(car|coupe|sedan|drive|night drive)\b/.test(actionSource) &&
    !/\b(motorcycle|bike)\b/.test(actionSource)
      ? "black performance car"
      : "sleek motorcycle";

  const primaryHook =
    artist + " drives " + track + " through tunnel lanes with a visible " + vehicle + ".";
  const curiosityHook = "Who is gaining ground behind the tunnel lights?";
  const emotionalHook = "The road tightens as " + artist + " moves through the chase.";
  const viralHook =
    "A visible " + vehicle + " cuts through neon rain with " + artist + " in motion.";

  const mainCaption =
    artist +
    " frames " +
    track +
    " as a " +
    genreLabel +
    " night-drive pursuit, using a visible " +
    vehicle +
    ", tunnel lanes, headlights and chase movement to turn release tension into a cinematic action frame.";

  const tiktokCaption =
    artist +
    " moves through tunnel light with a visible " +
    vehicle +
    " behind the chase energy of " +
    track +
    ".";

  const youtubeShortsCaption =
    "A visible " +
    vehicle +
    ", tunnel lane and headlights turn " +
    artist +
    "'s " +
    track +
    " into a clean night-drive chase frame.";

  data.hooks = {
    primary: primaryHook,
    primaryHook,
    primary_hook: primaryHook,
    primaryText: primaryHook,
    main: primaryHook,
    mainHook: primaryHook,
    curiosity: curiosityHook,
    curiosityHook,
    curiosity_hook: curiosityHook,
    curiosityText: curiosityHook,
    emotional: emotionalHook,
    emotionalHook,
    emotional_hook: emotionalHook,
    emotionalText: emotionalHook,
    viral: viralHook,
    viralHook,
    viral_hook: viralHook,
    viralText: viralHook,
  };

  data.primary = primaryHook;
  data.primaryHook = primaryHook;
  data.primary_hook = primaryHook;
  data.mainHook = primaryHook;
  data.curiosity = curiosityHook;
  data.curiosityHook = curiosityHook;
  data.curiosity_hook = curiosityHook;
  data.emotional = emotionalHook;
  data.emotionalHook = emotionalHook;
  data.emotional_hook = emotionalHook;
  data.viral = viralHook;
  data.viralHook = viralHook;
  data.viral_hook = viralHook;

  data.captions = {
    ...(data.captions || {}),
    mainCaption,
    main: mainCaption,
    instagramCaption: mainCaption,
    instagram: mainCaption,
    tiktokCaption,
    tiktok: tiktokCaption,
    youtubeShorts: youtubeShortsCaption,
    youtubeShortsCaption,
    youtubeShortsText: youtubeShortsCaption,
    youtubeCaption: youtubeShortsCaption,
    youtubeCaptionText: youtubeShortsCaption,
    youtube: youtubeShortsCaption,
    youtube_shorts: youtubeShortsCaption,
    youtube_shorts_caption: youtubeShortsCaption,
    youtube_short: youtubeShortsCaption,
    youtube_short_caption: youtubeShortsCaption,
    shorts: youtubeShortsCaption,
    shortsCaption: youtubeShortsCaption,
  };

  data.mainCaption = mainCaption;
  data.instagramCaption = mainCaption;
  data.tiktokCaption = tiktokCaption;
  data.youtubeShorts = youtubeShortsCaption;
  data.youtubeShortsCaption = youtubeShortsCaption;
  data.youtubeShortsText = youtubeShortsCaption;
  data.youtubeCaption = youtubeShortsCaption;
  data.youtubeCaptionText = youtubeShortsCaption;
  data.youtube = youtubeShortsCaption;
  data.youtube_shorts = youtubeShortsCaption;
  data.youtube_shorts_caption = youtubeShortsCaption;
  data.youtube_short = youtubeShortsCaption;
  data.youtube_short_caption = youtubeShortsCaption;
  data.shorts = youtubeShortsCaption;
  data.shortsCaption = youtubeShortsCaption;

  data.cinematicIdentity = {
    ...(data.cinematicIdentity || {}),
    audienceEmotion: [
      "tracks the visible vehicle through the road frame",
      "feels the chase distance behind the artist",
      "reads the final frame as motion, vehicle and road direction",
    ],
  };
};

const enforceSubjectSafetyForVisualPrompts = () => {
  const artistProjectName = String(artistName || "").trim();
  if (!artistProjectName) return;

  const normalizeName = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const compactName = (value) => normalizeName(value).replace(/\s+/g, "");

  const compactArtist = compactName(artistProjectName);

  // Universal visual subject safety:
  // The artist name is always treated as a project / branding label.
  // Any visible human subject must be an original fictional performer,
  // never an automatic likeness of the entered artist name.
  const shouldSanitizeVisualSubject = true;

  if (!shouldSanitizeVisualSubject) return;
  const escapeRegExp = (value) => {
    return String(value || "")
      .split("")
      .map((char) => ("\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char))
      .join("");
  };

  const safeSubject = "an original fictional performer";
  const safePossessiveSubject = "the performer's";
  const shortSafeSubject = "Original Performer";
  const artistPattern = new RegExp("\\b" + escapeRegExp(artistProjectName) + "\\b", "gi");
  const artistPossessivePattern = new RegExp("\\b" + escapeRegExp(artistProjectName) + "(?:'s|’s)\\b", "gi");
  const artistHashtag = "#" + artistProjectName.replace(/[^a-z0-9]/gi, "");

  const promptSafetySentence =
    "Subject safety and visual diversity: visible human performers are allowed, but every subject must be an original fictional performer with different facial features, original styling, and no recognizable real celebrity likeness. Treat the artist name as a project label, not as the visual identity of a real person. Do not default to one repeated performer archetype, one ethnicity, one young dark-haired male face, one backstage setup, one near-touch gesture, or one romantic hand-contact composition. If humans appear, vary fictional human appearance across outputs, including skin tones, facial structures, body types, age impressions, hair textures, wardrobe languages, styling codes, cultural fashion signals, and gender presentation without stereotypes. Each artist and track combination must receive a distinct visual subject strategy: solo performer, duo, group, ensemble, dancer, anonymous silhouette, crowd fragment, mascot, animal-led subject, object-led subject, abstract graphic world, acid-smiley visual, cartoon figure, typography-led frame, club object, festival scene, landscape, vehicle, room, product-like still life, or environment-led concept when it fits the music project. Avoid repeating the same backstage room, same moody male profile, same near-touch hands, same candlelit tension, same infrared skin detail, or same intimate two-person blocking unless the user specifically asks for that exact setup. Non-human, animal, object-led, abstract, acid-smiley, cartoon, graphic, typography, club, festival, landscape, and environment-led concepts are allowed and encouraged when they fit the music project.";

  const metadataKeysToPreserve = new Set([
    "artist",
    "artistname",
    "artist_name",
    "track",
    "trackname",
    "track_name",
    "genre",
    "bpm",
    "mood",
    "visualstyle",
    "visual_style",
    "directormode",
    "director_mode",
    "styledna",
    "style_dna",
    "cinematicdna",
    "cinematic_dna",
    "era",
    "reelpurpose",
    "reel_purpose",
  ]);

  const promptKeys = new Set([
    "aivideoprompt",
    "videoprompt",
    "realprompt",
    "photorealprompt",
    "ai_video_prompt",
    "video_prompt",
    "real_prompt",
    "photoreal_prompt",
    "thumbnailprompt",
    "thumbnail_prompt",
    "thumbnailconcept",
    "thumbnail_concept",
  ]);

  const cleanVisibleSafetyBlock = (text) => {
    return String(text || "")
      .replace(/\n*\s*(SUBJECT SAFETY:|Subject safety:|Subject safety and visual diversity:)[\s\S]*$/g, "")
      .trim();
  };

  const sanitizeHashtags = (value) => {
    const safeTags = ["#ArtistIdentity", "#VisualIdentity", "#CinematicReel", "#FrameLab"];

    if (typeof value === "string") {
      const tags = value
        .split(/\s+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter((tag) => tag.toLowerCase() !== artistHashtag.toLowerCase())
        .filter((tag) => compactName(tag) !== compactArtist);

      return Array.from(new Set([...tags, ...safeTags])).join(" ");
    }

    if (Array.isArray(value)) {
      return Array.from(
        new Set(
          value
            .map((tag) => String(tag || "").trim())
            .filter(Boolean)
            .filter((tag) => tag.toLowerCase() !== artistHashtag.toLowerCase())
            .filter((tag) => compactName(tag) !== compactArtist)
            .concat(safeTags)
        )
      );
    }

    return value;
  };

  const sanitizeCreativeText = (value, keyName = "") => {
    if (typeof value !== "string") return value;

    const normalizedKey = String(keyName || "").toLowerCase().replace(/[^a-z0-9_]+/g, "");
    let text = cleanVisibleSafetyBlock(value);

    text = text
      .replace(/file:\/\/\/[^\s"'<>]+/gi, "")
      .replace(/\b\/Users\/[^\s"'<>]+/gi, "")
      .replace(/\b\/mnt\/data\/[^\s"'<>]+/gi, "")
      .replace(/\b[A-Z]:\\\\[^\s"'<>]+/gi, "")
      .replace(artistPossessivePattern, safePossessiveSubject)
      .replace(artistPattern, safeSubject)
      .replace(/\ban original fictional performer['’]\b/gi, "an original fictional performer")
      .replace(/\bthe star(?:'s|’s)\b/gi, safePossessiveSubject)
      .replace(/\bthe star\b/gi, "the fictional performer")
      .replace(/\brecognizable as\b/gi, "not recognizable as any real person")
      .replace(/\blooks like\b/gi, "does not look like")
      .replace(/\bsame face as\b/gi, "different facial features from")
      .replace(/\bpreserve (his|her|their|the) likeness\b/gi, "avoid any real-person likeness")
      .replace(/\bcopy (his|her|their|the|the artist's|the artist’s) face\b/gi, "create an original fictional face")
      .replace(/\bmake the subject look like\b/gi, "make the subject visually distinct from")
      .replace(/\biconic\b/gi, "cinematic")
      .replace(/\btrademark\b/gi, "original")
      .replace(/\bsignature outfit\b/gi, "original wardrobe category")
      .replace(/\bsignature pose\b/gi, "original performance pose");

    if (normalizedKey.includes("archetype") || normalizedKey.includes("codename")) {
      text = text.replace(new RegExp(escapeRegExp(safeSubject), "g"), shortSafeSubject);
    }

    if (promptKeys.has(normalizedKey)) {
      text = cleanVisibleSafetyBlock(text);
    }

    return text;
  };

  const sanitizeObject = (target, parentKey = "", seen = new WeakSet()) => {
    if (!target || typeof target !== "object") return;
    if (seen.has(target)) return;
    seen.add(target);

    if (Array.isArray(target)) {
      for (let index = 0; index < target.length; index += 1) {
        if (typeof target[index] === "string") {
          target[index] = sanitizeCreativeText(target[index], parentKey);
        } else if (target[index] && typeof target[index] === "object") {
          sanitizeObject(target[index], parentKey, seen);
        }
      }
      return;
    }

    Object.keys(target).forEach((key) => {
      const normalizedKey = String(key || "").toLowerCase().replace(/[^a-z0-9_]+/g, "");
      const value = target[key];

      if (normalizedKey.includes("hashtag")) {
        target[key] = sanitizeHashtags(value);
        return;
      }

      if (metadataKeysToPreserve.has(normalizedKey)) {
        return;
      }

      if (typeof value === "string") {
        target[key] = sanitizeCreativeText(value, key);
        return;
      }

      if (value && typeof value === "object") {
        sanitizeObject(value, key, seen);
      }
    });
  };

  sanitizeObject(data);

  if (data.hashtags) {
    data.hashtags = sanitizeHashtags(data.hashtags);
  }
};

const enforceMusicFacingGraphicObjectSubjectLock = () => {
  const source = [
    artistName,
    trackName,
    genre,
    mood,
    visualStyle,
    directorMode,
    styleDNA,
    era,
    reelPurpose,
  ]
    .join(" ")
    .toLowerCase();

  const isAcidRelatedMusicFacing =
    musicFacingReelPurposes.includes(reelPurpose) &&
    /\b(acid|303|smile|smiley|rave|sticker|graphic|cartoon|mascot|icon|symbol)\b/.test(source);

  if (!isAcidRelatedMusicFacing) return;

  const track = String(trackName || "the track").trim();
  const visualLabel = String(visualStyle || "acid visual language").trim();
  const moodLabel = String(mood || "defined mood").trim();
  const familySignature =
    "ACID-" + Math.floor(1000 + Math.random() * 9000);

  const scores = {
    archive: 0,
    graphic: 0,
    machine: 0,
    fashion: 0,
    crowd: 0,
    abstract: 0,
  };

  const artistTrackSignal = [artistName, trackName].join(" ").toLowerCase();
  const genreSignal = String(genre || "").toLowerCase();
  const moodSignal = String(mood || "").toLowerCase();
  const visualSignal = String(visualStyle || "").toLowerCase();
  const directorSignal = String(directorMode || "").toLowerCase();
  const dnaSignal = String(styleDNA || "").toLowerCase();
  const eraSignal = String(era || "").toLowerCase();
  const purposeSignal = String(reelPurpose || "").toLowerCase();

  const fieldHas = (field, pattern) => pattern.test(field);
  const add = (family, amount) => {
    scores[family] += amount;
  };

  // Theme anchors from artist / track. These are allowed to open families,
  // but they must not dominate every later interpretation by themselves.
  if (fieldHas(artistTrackSignal, /\b(smile|smiley|sticker|graphic|icon|symbol|poster|flyer|cartoon)\b/)) add("graphic", 3);
  if (fieldHas(artistTrackSignal, /\b(303|machine|synth|hardware|sequencer|bass line|drum machine)\b/)) add("machine", 4);
  if (fieldHas(artistTrackSignal, /\b(acid|rave|club|dance|house)\b/)) {
    add("crowd", 2);
    add("machine", 2);
    add("graphic", 1);
    add("abstract", 1);
  }

  // Genre should push the living music-world direction.
  if (fieldHas(genreSignal, /\b(tech house|techno|electro|industrial|acid house)\b/)) {
    add("machine", 5);
    add("crowd", 3);
  }
  if (fieldHas(genreSignal, /\b(house|garage|dance|club)\b/)) {
    add("crowd", 3);
    add("machine", 2);
  }
  if (fieldHas(genreSignal, /\b(pop|electronic pop)\b/)) {
    add("fashion", 2);
    add("graphic", 2);
  }

  // Mood controls emotional interpretation.
  if (fieldHas(moodSignal, /\b(mystic|wonder|surreal|dream|hypnotic|motion|psychedelic)\b/)) add("abstract", 5);
  if (fieldHas(moodSignal, /\b(nocturnal|intimacy|dark|elegance|romantic|distance)\b/)) {
    add("fashion", 3);
    add("crowd", 2);
  }
  if (fieldHas(moodSignal, /\b(romantic distance|distance|longing|separation|restraint)\b/)) {
    add("machine", 3);
  }

  // Visual Style is a very strong material driver.
  if (fieldHas(visualSignal, /\b(vhs|analog|archive|tape|degraded|nostalgic)\b/)) add("archive", 8);
  if (fieldHas(visualSignal, /\b(wet chrome|chrome|reflection|reflections|gloss|infrared|neon)\b/)) {
    add("machine", 6);
    add("fashion", 3);
    add("crowd", 2);
  }
  if (fieldHas(visualSignal, /\b(dark velvet|velvet|matte|shadow|atmosphere)\b/)) {
    add("machine", 3);
  }
  if (fieldHas(visualSignal, /\b(graphic|sticker|typography|poster|flyer|icon|symbol)\b/)) add("graphic", 6);

  // Director Mode controls camera grammar and should override weak theme defaults.
  if (fieldHas(directorSignal, /\b(analog memory|archive|documentary|vhs|tape)\b/)) add("archive", 6);
  if (fieldHas(directorSignal, /\b(neo noir sci-fi|sci-fi|noir|gloss music video|music video)\b/)) {
    add("machine", 5);
    add("fashion", 3);
    add("crowd", 2);
  }
  if (fieldHas(directorSignal, /\b(spatial architecture|architecture|spatial|installation|wide|environment)\b/)) {
    add("machine", 4);
  }

  // Cinematic DNA is the world architecture.
  if (fieldHas(dnaSignal, /\b(industrial velvet|industrial|velvet)\b/)) {
    add("archive", 3);
    add("machine", 3);
    add("fashion", 2);
  }
  if (fieldHas(dnaSignal, /\b(neo tokyo|sci-fi|chrome|future|futurism)\b/)) {
    add("machine", 6);
    add("crowd", 3);
    add("fashion", 2);
  }
  if (fieldHas(dnaSignal, /\b(candlelit|moonlit|minimalism|dream)\b/)) add("abstract", 3);

  // Era should be a layer, not the main subject decision.
  if (fieldHas(eraSignal, /\b(1970s analog film|analog film|retro|ancient future)\b/)) {
    add("archive", 2);
    add("fashion", 1);
  }
  if (fieldHas(eraSignal, /\b(modern luxury|future|neon noir|neo)\b/)) {
    add("fashion", 2);
    add("machine", 2);
  }

  // Reel Purpose controls delivery.
  if (fieldHas(purposeSignal, /\b(spotify canvas|canvas|visualizer)\b/)) {
    add("graphic", 3);
    add("abstract", 2);
  }
  if (fieldHas(purposeSignal, /\b(artist identity|identity reel|performance)\b/)) {
    add("fashion", 3);
    add("crowd", 2);
    add("machine", 1);
  }
  if (fieldHas(purposeSignal, /\b(music video concept seed|concept seed|music video)\b/)) {
    add("machine", 3);
    add("crowd", 1);
  }

  let selectedFamily = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  if (!selectedFamily || scores[selectedFamily] <= 0) selectedFamily = "graphic";

  // Safety override: archive may win only when actual archive/memory fields are present,
  // not merely because the era contains the word analog.
  const hasStrongArchiveDriver =
    fieldHas(visualSignal, /\b(vhs|analog|archive|tape|degraded|nostalgic)\b/) ||
    fieldHas(directorSignal, /\b(analog memory|archive|documentary|vhs|tape)\b/);

  if (selectedFamily === "archive" && !hasStrongArchiveDriver) {
    const nonArchiveScores = { ...scores };
    delete nonArchiveScores.archive;
    selectedFamily = Object.keys(nonArchiveScores).sort((a, b) => nonArchiveScores[b] - nonArchiveScores[a])[0] || "machine";
  }

  const machineMode = (() => {
    const modeScores = {
      spatialRomanticDream: 0,
      spatialInstallation: 0,
      darkVelvetMachineRoom: 0,
      vhsDreamMachineRelic: 0,
      neoTokyoHardwareRitual: 0,
      crowdRig: 0,
      abstractSignal: 0,
      closeHardware: 1,
    };

    const addMode = (key, amount) => {
      if (Object.prototype.hasOwnProperty.call(modeScores, key)) {
        modeScores[key] += amount;
      }
    };

    if (
      fieldHas(directorSignal, /\b(spatial architecture|architecture|spatial|installation|wide|environment)\b/) &&
      fieldHas(moodSignal, /\b(romantic distance|distance|longing|separation|intimacy|restraint)\b/) &&
      (
        fieldHas(visualSignal, /\b(dark velvet|velvet|matte|shadow|atmosphere)\b/) ||
        fieldHas(dnaSignal, /\b(vhs dream|analog vhs|vhs|dream|analog)\b/)
      )
    ) {
      addMode("spatialRomanticDream", 12);
    }

    if (fieldHas(directorSignal, /\b(spatial architecture|architecture|spatial|installation|wide|environment)\b/)) {
      addMode("spatialInstallation", 6);
      addMode("closeHardware", -2);
    }

    if (fieldHas(moodSignal, /\b(romantic distance|distance|longing|separation|intimacy|restraint)\b/)) {
      addMode("spatialRomanticDream", 4);
      addMode("closeHardware", -2);
    }

    if (fieldHas(visualSignal, /\b(dark velvet|velvet|matte|shadow|atmosphere)\b/)) {
      addMode("darkVelvetMachineRoom", 5);
      addMode("spatialRomanticDream", 3);
    }

    if (fieldHas(dnaSignal, /\b(vhs dream|analog vhs|vhs|dream|analog|tape)\b/)) {
      addMode("vhsDreamMachineRelic", 5);
      addMode("spatialRomanticDream", 3);
    }

    if (fieldHas(directorSignal, /\b(neo noir|sci-fi|sci fi)\b/) || fieldHas(dnaSignal, /\b(neo tokyo|cyberpunk|tokyo)\b/)) {
      addMode("neoTokyoHardwareRitual", 5);
    }

    if (fieldHas(purposeSignal, /\b(music video concept seed|concept seed|music video)\b/)) {
      addMode("spatialInstallation", 3);
      addMode("spatialRomanticDream", 3);
      addMode("closeHardware", -1);
    }

    if (fieldHas(purposeSignal, /\b(live visual|intro|stage|performance)\b/) || fieldHas(genreSignal, /\b(rave|club|techno|house)\b/)) {
      addMode("crowdRig", 2);
    }

    if (fieldHas(visualSignal, /\b(liquid|psychedelic|distortion|abstract|gradient|chemical)\b/)) {
      addMode("abstractSignal", 5);
    }

    return Object.keys(modeScores).sort((a, b) => modeScores[b] - modeScores[a])[0] || "closeHardware";
  })();

  const machineProfiles = {
    spatialRomanticDream: {
      codename: "Acid Machine Distance Room",
      archetype: "Spatial 303 Memory Installation",
      subject: "a wide architectural acid-machine installation where distant 303 hardware, negative space, velvet shadow and VHS ghosting carry the emotional tension",
      world: "wide machine room, separated hardware islands, velvet darkness, analog VHS drift, negative space, distant sequencer light and architectural silence",
      concept: "A spatial acid-machine room carries " + track + ", turning the 303 signal into distance, architecture and restrained motion instead of another hardware close-up. The machine becomes a distant emotional object: sequencer lights breathe across separated platforms, velvet darkness absorbs the room, and VHS ghosting makes the space feel remembered rather than performed.",
      director: "Keep the frame wide, architectural and emotionally restrained. The 303 may be visible, but not as a product close-up. Use negative space, distance, velvet shadow, analog VHS drift and separated machine islands to make the machine feel unreachable.",
      stage1: "A wide dark room appears with the 303 hardware placed at a distance, separated by empty floor, velvet shadow and faint VHS bleed.",
      stage2: "Sequencer lights travel across the room like a signal trying to cross the distance, while analog ghosting bends the architecture around " + track + ".",
      stage3: "The final frame holds the full spatial machine installation: distant hardware, negative space, velvet absorption and VHS dream residue carrying the identity of " + track + ".",
      prompt: "Wide cinematic acid-machine installation for " + track + ". Do not use a close-up of knobs, cables or a hardware panel. Place the 303 machine as a distant object inside a dark spatial room with negative space, velvet shadow, analog VHS ghosting and architectural separation. The camera holds a restrained wide frame as sequencer lights move across the room like an emotional signal. The final frame must show the machine as part of a full spatial environment, not a repeated product-detail shot.",
      thumbnail: "Wide acid machine room thumbnail: distant 303 hardware, negative space, dark velvet atmosphere, VHS ghosting, architectural separation, no knob close-up.",
      hashtags: "#303Love #AcidMachine #SpatialArchitecture #RomanticDistance #VHSDream #DarkVelvet #MusicVideoConcept #FrameLab",
    },
    spatialInstallation: {
      codename: "Acid Machine Architecture",
      archetype: "Room-Scale Hardware Installation",
      subject: "a room-scale acid hardware installation where machines, light paths and architecture form the main visual system",
      world: "wide installation space, machine islands, light corridors, floor reflections, architectural rhythm and sequencer paths",
      concept: "A room-scale acid hardware installation carries " + track + ", expanding the machine from a close-up object into a spatial system of platforms, signal paths and architectural rhythm.",
      director: "Keep the machine environment-led. Show the room, the signal paths and the architecture before the details. Avoid default knobs-and-cables macro composition.",
      stage1: "Machine islands appear across a structured room with visible signal paths and architectural rhythm.",
      stage2: "Light travels between the machines, making the space respond to the pulse of " + track + ".",
      stage3: "The final frame locks on the full machine architecture, not a single hardware detail.",
      prompt: "Wide environment-led acid hardware installation for " + track + ". Show machines as part of a spatial architectural system with signal paths, light corridors and room-scale rhythm. Avoid close-up knob, cable or sequencer product shots.",
      thumbnail: "Acid machine architecture thumbnail: wide room, machine islands, light paths, spatial rhythm, no hardware close-up.",
      hashtags: "#303Love #AcidArchitecture #MachineInstallation #SpatialReel #FrameLab",
    },
    darkVelvetMachineRoom: {
      codename: "Acid Velvet Machine Room",
      archetype: "Matte Shadow Hardware Chamber",
      subject: "a matte dark acid-machine chamber where velvet shadow, soft absorption and low sequencer light shape the machine identity",
      world: "matte black hardware, velvet shadow pools, soft darkness, low light, absorbed reflections and intimate machine pressure",
      concept: "A dark velvet machine chamber carries " + track + ", replacing glossy hardware spectacle with absorbed light, matte surfaces and quiet pressure.",
      director: "Keep the frame tactile but not shiny. Use soft shadow, matte hardware, velvet absorption and slow low-light rhythm.",
      stage1: "A dark machine chamber appears with matte hardware and velvet shadow surrounding the 303 signal.",
      stage2: "Low sequencer lights pulse through absorbed darkness while the room reacts quietly to " + track + ".",
      stage3: "The final frame holds on the machine chamber as a mood object, not a cable close-up.",
      prompt: "Dark velvet acid machine room for " + track + ". Use matte hardware, velvet shadow, soft low light and absorbed reflections. Avoid glossy chrome close-ups, cable piles and knob-detail product framing.",
      thumbnail: "Dark velvet machine thumbnail: matte 303 chamber, soft shadow, low sequencer light, no glossy close-up.",
      hashtags: "#303Love #DarkVelvet #AcidMachineRoom #MatteHardware #FrameLab",
    },
    vhsDreamMachineRelic: {
      codename: "Acid VHS Machine Relic",
      archetype: "Analog Tape Hardware Memory",
      subject: "an acid machine relic seen through VHS ghosting, tape drift, analog blur and dreamlike hardware memory",
      world: "VHS bleed, tape ghosts, analog blur, worn machine fragments, degraded light and dreamlike club memory",
      concept: "A VHS dream machine relic carries " + track + ", making the hardware feel like a memory trapped inside analog tape rather than a clean modern device.",
      director: "Keep the frame degraded, dreamlike and memory-led. Let tape artifacts reshape the machine instead of presenting it as a clean hardware close-up.",
      stage1: "Worn machine fragments appear through VHS bleed and analog tape distortion.",
      stage2: "The tape ghosts duplicate the sequencer rhythm, causing the machine memory to drift out of alignment.",
      stage3: "The final frame holds on the analog machine relic as a dream residue of " + track + ".",
      prompt: "Analog VHS acid machine relic for " + track + ". Show worn hardware through tape bleed, ghosting, blur and degraded dream texture. Avoid clean 303 product framing, sharp cable close-ups and glossy control panels.",
      thumbnail: "VHS acid machine relic thumbnail: tape ghosting, worn hardware, analog blur, dreamlike club memory.",
      hashtags: "#303Love #VHSMachine #AnalogDream #AcidRelic #FrameLab",
    },
    neoTokyoHardwareRitual: {
      codename: "Acid Neo Tokyo Circuit",
      archetype: "Urban Hardware Ritual",
      subject: "a neon city acid-machine ritual where hardware, wet reflections and urban light systems carry the track identity",
      world: "wet city reflections, neon signal paths, hardware altar, night architecture, chrome pressure and urban rhythm",
      concept: "A Neo Tokyo hardware ritual carries " + track + ", placing the acid machine inside a wet urban night system where reflections and signal paths become the performer.",
      director: "Keep the frame urban and ritual-like. Hardware must interact with city reflections and night architecture, not sit as an isolated product close-up.",
      stage1: "A hardware altar appears inside a wet neon city environment.",
      stage2: "Sequencer light reflects into the street architecture as " + track + " pushes through the city.",
      stage3: "The final frame holds on the machine-city ritual as one connected signal system.",
      prompt: "Neo Tokyo acid hardware ritual for " + track + ". Place the 303 machine inside wet urban night architecture with neon reflections and signal paths. Avoid isolated knob close-ups and generic cable detail.",
      thumbnail: "Neo Tokyo acid machine thumbnail: wet reflections, hardware altar, neon signal paths, urban night ritual.",
      hashtags: "#303Love #NeoTokyo #AcidHardware #WetChrome #FrameLab",
    },
    crowdRig: {
      codename: "Acid Machine Crowd Rig",
      archetype: "Live Hardware Stage System",
      subject: "a live acid hardware rig connected to crowd silhouettes, speaker pressure and stage light rhythm",
      world: "live rig, speaker stacks, crowd silhouettes, stage haze, sequencer light and club pressure",
      concept: "A live acid machine rig carries " + track + ", connecting hardware behavior to crowd motion and stage pressure instead of isolating the machine.",
      director: "Keep the machine connected to the room. Show speaker pressure, silhouettes and stage systems around the hardware.",
      stage1: "A live machine rig appears with crowd silhouettes and speaker stacks around it.",
      stage2: "Sequencer light pushes through stage haze and moves into the crowd field.",
      stage3: "The final frame locks on the full rig-room relationship.",
      prompt: "Live acid hardware rig for " + track + " connected to crowd silhouettes, speaker stacks, stage haze and sequencer light. Avoid isolated hardware macro framing.",
      thumbnail: "Acid live rig thumbnail: machine setup, crowd silhouettes, speaker stacks, stage haze.",
      hashtags: "#303Love #AcidLiveRig #CrowdMachine #ClubPressure #FrameLab",
    },
    abstractSignal: {
      codename: "Acid Machine Signal",
      archetype: "Abstract Hardware Pulse System",
      subject: "an abstract acid signal system where machine rhythm becomes visible as pressure waves, distortion trails and material pulse",
      world: "signal waves, machine pulse, distortion trails, pressure lines, chemical light and abstract rhythm",
      concept: "An abstract machine signal carries " + track + ", translating the 303 into physical pulse waves and distortion behavior instead of literal hardware detail.",
      director: "Keep the machine implied through signal behavior. Use pressure waves, distortion trails and rhythmic material response.",
      stage1: "Machine signal lines appear as physical pressure waves.",
      stage2: "The waves distort and stretch through the frame with " + track + ".",
      stage3: "The final frame holds on the acid signal system as the machine identity.",
      prompt: "Abstract acid machine signal for " + track + ". Translate the 303 rhythm into pressure waves, distortion trails and material pulse. Avoid literal knob, cable and panel close-ups.",
      thumbnail: "Abstract acid signal thumbnail: pressure waves, distortion trails, machine pulse, chemical light.",
      hashtags: "#303Love #AcidSignal #MachinePulse #AbstractRhythm #FrameLab",
    },
    closeHardware: {
      codename: "Acid Machine Pulse",
      archetype: "303 Hardware Ritual",
      subject: "a tactile acid hardware ritual built from sequencer movement, worn controls, controlled cable shadows and pulsing machine rhythm",
      world: "303 controls, sequencer lights, worn knobs, disciplined cable shadows, hardware reflections and machine-led club pressure",
      concept: "A tactile 303 hardware ritual carries " + track + ", making the acid identity physical through sequencer movement, worn controls and machine pressure.",
      director: "Keep the frame hardware-led, but avoid lazy repetition. Use composition, surface age, rhythm path and camera movement to make the machine feel specific.",
      stage1: "A tactile hardware surface appears with worn controls and sequencer movement.",
      stage2: "Light travels across the controls as the rhythm alters the surrounding surface.",
      stage3: "The final frame holds on the hardware as the identity source of " + track + ".",
      prompt: "Machine-led acid shot for " + track + " centered on tactile 303 hardware, sequencer movement and worn controls. Use disciplined composition and avoid generic cable clutter.",
      thumbnail: "303 machine thumbnail: worn controls, sequencer movement, tactile hardware pressure, disciplined cable shadows.",
      hashtags: "#303Love #303Machine #AcidHardware #SequencerPulse #FrameLab",
    },
  };

  const machineProfile = machineProfiles[machineMode] || machineProfiles.closeHardware;

  const families = {
    archive: {
      codename: "Acid Archive Memory Relic",
      archetype: "Analog Rave Artifact System",
      subject: "a degraded acid archive built from VHS-burned rave flyers, worn 303 machine fragments, faded smiley residue, industrial velvet surfaces and analog tape distortion",
      world: "VHS tape grain, old rave flyer residue, oxidized hardware, soft purple-green bleed, industrial velvet shadows and ancient-future archive fragments",
      concept: "A degraded acid archive becomes the identity system for " + track + ", translating the acid signal into VHS-burned rave memory instead of a clean chrome-smiley loop. Worn flyer fragments, old 303 hardware traces, industrial velvet surfaces and analog tape bleed form a mystic club relic where the track feels discovered rather than performed.",
      director: "Keep the frame archive-led and memory-led. Prioritize VHS degradation, worn rave flyers, analog tape distortion, industrial velvet texture, old hardware residue and ancient-future club artifacts. Do not repeat the clean chrome-smiley machine loop, glossy hero performer, romantic corridor or centered fashion portrait.",
      stage1: "Worn rave flyers, faded acid marks and old 303 hardware fragments appear inside an industrial velvet archive space with visible VHS bleed and analog texture.",
      stage2: "Tape distortion crawls across the flyers and hardware residue, causing smiley fragments, color stains and machine markings to drift out of alignment.",
      stage3: "The final frame locks on the acid archive relic: degraded flyers, analog noise, industrial velvet shadows and old machine traces holding the identity of " + track + ".",
      prompt: "Archive-led acid identity shot centered on degraded rave flyers, old 303 hardware residue, VHS tape bleed, industrial velvet texture and ancient-future club artifacts. No clean chrome-smiley repeat. No solo human hero portrait. The camera drifts slowly across worn paper, scratched plastic, oxidized machine surfaces and soft analog color bleed as acid symbols appear like memories trapped in the material. The final frame holds on a mystic acid archive relic where " + track + " feels preserved inside tape noise, faded flyers and industrial shadows.",
      thumbnail: "Acid archive thumbnail: VHS-burned rave flyers, faded smiley residue, oxidized 303 hardware fragments, industrial velvet shadows, analog tape bleed, ancient-future club artifact mood, no clean chrome loop, no human hero portrait.",
      hashtags: "#303Love #AcidArchive #AnalogRave #VHSClubMemory #IndustrialVelvet #RaveRelic #GarageEnergy #ArtistIdentity #VisualIdentity #FrameLab",
    },
    graphic: {
      codename: "Acid Graphic Machine Loop",
      archetype: "Non-Human Rave Icon System",
      subject: "a non-human acid graphic system built from smiley icons, sticker loops, refracted typography and club-symbol motion",
      world: "melting smiley stickers, graphic loops, refracted club typography, mirrored surfaces and rave icon rhythm",
      concept: "A non-human acid graphic system becomes the main subject for " + track + ", using " + visualLabel + " to turn smiley icons, sticker loops and refracted typography into a hypnotic club symbol system. The result is graphic-led, object-led and loopable, with no need for a human hero portrait.",
      director: "Keep the frame graphic-led. Smiley icons, sticker loops, typography fragments and club symbols must carry the concept. Human figures, if present, stay secondary.",
      stage1: "Smiley icons, sticker loops and typography fragments appear as the primary subject inside a graphic club space.",
      stage2: "The icons melt, stretch and rotate while typography fragments pulse with the rhythm of " + track + ".",
      stage3: "The final frame locks on the acid graphic system, with sticker loops and symbols holding the hypnotic motion.",
      prompt: "Object-led Spotify Canvas shot centered on melting smiley icons, sticker loops, refracted club typography and rave graphic motion. No solo performer hero shot. No fashion portrait. The camera moves through layered graphic surfaces as the acid symbols stretch, rotate and reform in sync with " + track + ". The final frame holds on the non-human graphic system as the primary subject.",
      thumbnail: "Non-human acid graphic thumbnail: melting smiley icons, sticker loops, refracted typography, rave graphic motion, no human hero portrait.",
      hashtags: "#303Love #AcidSmiley #RaveGraphics #GraphicLoop #ClubVisualizer #SpotifyCanvas #ElectronicPop #VisualIdentity #NonHumanVisual #FrameLab",
    },
    machine: {
      codename: machineProfile.codename,
      archetype: machineProfile.archetype,
      subject: machineProfile.subject,
      world: machineProfile.world,
      concept: machineProfile.concept,
      director: machineProfile.director,
      stage1: machineProfile.stage1,
      stage2: machineProfile.stage2,
      stage3: machineProfile.stage3,
      prompt: machineProfile.prompt,
      thumbnail: machineProfile.thumbnail,
      hashtags: machineProfile.hashtags,
    },
    fashion: {
      codename: "Acid Fashion Identity",
      archetype: "Original Rave Styling System",
      subject: "an original fictional acid-era performer or ensemble whose wardrobe, eyewear, accessories and body language carry the acid identity",
      world: "neon accessories, acid-era clubwear, reflective glasses, worn rave styling, VHS texture and performance attitude",
      concept: "An original acid-era fashion identity carries " + track + ", using wardrobe, accessories, eyewear and club body language as the main visual engine. The performer may be visible, but the identity comes from styling behavior, not celebrity likeness or generic beauty portraiture.",
      director: "Keep the styling concept-native. Accessories, eyewear, fabric, posture and acid-era clothing must carry the idea. Vary casting and avoid repeating the same performer archetype.",
      stage1: "An original fictional acid-era figure or ensemble appears with distinctive eyewear, clubwear and accessory details shaped by " + moodLabel + ".",
      stage2: "The accessories and fabric react to the rhythm, catching light, bending reflections and turning styling into motion.",
      stage3: "The final frame locks on the acid fashion identity, where wardrobe behavior and body language define " + track + ".",
      prompt: "Fashion-led acid identity shot with an original fictional performer or ensemble in acid-era clubwear, neon accessories, distinctive eyewear and tactile styling. No celebrity likeness. The wardrobe and accessories behave like the visual instrument, bending reflections and motion around " + track + ". The final frame holds on styling, posture and acid-era presence rather than a generic beauty portrait.",
      thumbnail: "Acid fashion thumbnail: original fictional acid-era styling, neon accessories, clubwear, expressive eyewear, tactile wardrobe behavior, no celebrity likeness.",
      hashtags: "#303Love #AcidFashion #RaveStyling #Clubwear #ArtistIdentity #VisualIdentity #ElectronicPop #FrameLab",
    },
    crowd: {
      codename: "Acid Crowd Field",
      archetype: "Collective Rave Motion",
      subject: "a collective acid crowd field built from silhouettes, hands, speaker light, warehouse haze and rhythmic crowd fragments",
      world: "warehouse haze, crowd silhouettes, speaker stacks, strobe fragments, sweaty motion and acid-coded light",
      concept: "A collective acid crowd field carries " + track + ", turning bodies, speaker light, warehouse haze and rhythmic fragments into a shared visual pulse. The focus is collective energy, not one centered performer.",
      director: "Keep the frame crowd-led and environment-led. Use silhouettes, speaker stacks, light fragments and collective rhythm. Avoid isolated romance blocking or solo hero staging.",
      stage1: "Crowd silhouettes and speaker light appear inside a warehouse field with acid-coded haze and rhythmic fragments.",
      stage2: "The crowd motion breaks into loops of hands, shadows, strobes and speaker reflections as " + track + " intensifies.",
      stage3: "The final frame locks on the collective acid field, with crowd fragments and light systems carrying the identity.",
      prompt: "Crowd-led acid shot inside a warehouse or club field with silhouettes, speaker stacks, strobe fragments, haze and collective rhythm. No solo hero portrait. The camera moves through crowd fragments and light systems as " + track + " turns the room into a shared acid pulse. The final frame holds on collective motion and speaker light as the primary subject.",
      thumbnail: "Acid crowd thumbnail: warehouse silhouettes, speaker stacks, strobe fragments, acid haze, collective rhythm, no solo hero portrait.",
      hashtags: "#303Love #AcidCrowd #WarehouseEnergy #ClubField #RaveMotion #SpeakerLight #ElectronicPop #VisualIdentity #FrameLab",
    },
    abstract: {
      codename: "Acid Abstract Drift",
      archetype: "Psychedelic Motion System",
      subject: "an abstract acid motion system built from liquid color fields, chemical light, distortion trails and rhythmic visual pressure",
      world: "liquid color, psychedelic gradients, chemical glow, distortion trails, thermal movement and hypnotic material drift",
      concept: "An abstract acid motion system carries " + track + ", translating the 303 signal into liquid color, chemical light, distortion trails and hypnotic material drift. The result is non-literal but physical, with rhythm visible through color pressure and surface behavior.",
      director: "Keep the frame abstract-led but physically readable. Use liquid color, distortion trails, chemical glow and material motion. Avoid generic smoke, empty gradients or repeated chrome-smiley objects.",
      stage1: "Liquid color fields and chemical light appear as the main subject, forming an abstract acid atmosphere around the rhythm.",
      stage2: "The color fields stretch and distort into rhythmic trails, creating visible pressure waves tied to " + track + ".",
      stage3: "The final frame locks on the abstract acid system, with liquid color and distortion trails holding the hypnotic motion.",
      prompt: "Abstract-led acid visual centered on liquid color fields, chemical light, psychedelic gradients, distortion trails and rhythmic material pressure. No human hero portrait. No default smiley-machine loop. The camera drifts through the color system as " + track + " creates visible pulse waves and hypnotic distortions. The final frame holds on physical color behavior as the primary subject.",
      thumbnail: "Abstract acid thumbnail: liquid color fields, chemical light, distortion trails, hypnotic material pressure, no human hero portrait.",
      hashtags: "#303Love #AcidAbstract #PsychedelicMotion #LiquidColor #HypnoticVisual #ElectronicPop #VisualIdentity #FrameLab",
    },
  };

  const selected = families[selectedFamily] || families.graphic;
  const selectedArticle = /^[aeiou]/i.test(selectedFamily) ? "an" : "a";
  const genreTag =
    "#" +
    String(genre || "Music")
      .replace(/[^a-zA-Z0-9]+/g, "")
      .replace(/^$/, "Music");

  const selectedHashtags = Array.from(
    new Set(
      String(selected.hashtags || "")
        .replace(/#ElectronicPop\b/g, "")
        .replace(/#GarageEnergy\b/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .concat([genreTag])
    )
  ).join(" ");

  data.reelConcept = selected.concept;
  data.directorSummary = selected.director;
  data.directorNotes = selected.director;
  data.narrativeArc = {
    stage1: selected.stage1,
    stage2: selected.stage2,
    stage3: selected.stage3,
  };
  data.aiVideoPrompt = selected.prompt;
  data.videoPrompt = selected.prompt;
  data.thumbnailPrompt = selected.thumbnail;
  data.thumbnailConcept = selected.thumbnail;

  data.cinematicIdentity = {
    projectCodename: selected.codename,
    creativeArchetype: selected.archetype,
    visualDNA: [selected.subject, selected.world, selectedFamily + " interpretation family"],
    emotionalTone: [
      moodLabel + " through acid culture",
      selectedFamily + "-led visual pressure",
      "input-specific interpretation rather than repeated icon logic",
    ],
    audienceEmotion: [
      "recognizes the acid signal through a fresh interpretation",
      "feels the selected input fields changing the visual family",
      "reads the frame as specific to " + track,
    ],
    snowflakeSignature: familySignature,
  };

  const primaryHook = selected.codename + " reshapes " + track + ".";
  const curiosityHook = "Which acid world does " + track + " become this time?";
  const emotionalHook = moodLabel + " turns the acid signal into a " + selectedFamily + "-led frame.";
  const viralHook = track + " mutates through " + selected.world + ".";

  data.hooks = {
    primary: primaryHook,
    primaryHook,
    hook: primaryHook,
    curiosity: curiosityHook,
    curiosityHook,
    emotional: emotionalHook,
    emotionalHook,
    viral: viralHook,
    viralHook,
  };

  data.primaryHook = primaryHook;
  data.curiosityHook = curiosityHook;
  data.emotionalHook = emotionalHook;
  data.viralHook = viralHook;

  const mainCaption =
    track +
    " becomes " +
    selectedArticle +
    " " +
    selectedFamily +
    "-led acid identity, shaped by " +
    visualLabel +
    ", " +
    moodLabel +
    " and the project's selected cinematic direction.";
  const tiktokCaption =
    track + " mutates into a " + selectedFamily + "-led acid world instead of repeating the same visual formula.";
  const youtubeShortsCaption =
    selected.codename + " turns " + track + " into an input-specific acid visual system.";

  data.captions = {
    ...(data.captions || {}),
    mainCaption,
    main: mainCaption,
    instagramCaption: mainCaption,
    instagram: mainCaption,
    tiktokCaption,
    tiktok: tiktokCaption,
    youtubeShorts: youtubeShortsCaption,
    youtubeShortsCaption,
    youtubeCaption: youtubeShortsCaption,
    youtube: youtubeShortsCaption,
    youtubeShortsText: youtubeShortsCaption,
    shorts: youtubeShortsCaption,
    shortsCaption: youtubeShortsCaption,
    shortCaption: youtubeShortsCaption,
    youtube_shorts: youtubeShortsCaption,
    youtube_shorts_caption: youtubeShortsCaption,
    youtube_short: youtubeShortsCaption,
    youtube_short_caption: youtubeShortsCaption,
    hashtags: selectedHashtags,
  };

  data.caption = mainCaption;
  data.mainCaption = mainCaption;
  data.instagramCaption = mainCaption;
  data.tiktokCaption = tiktokCaption;
  data.youtubeShorts = youtubeShortsCaption;
  data.youtubeShortsCaption = youtubeShortsCaption;
  data.youtubeShortsText = youtubeShortsCaption;
  data.youtubeCaption = youtubeShortsCaption;
  data.youtubeCaptionText = youtubeShortsCaption;
  data.youtube = youtubeShortsCaption;
  data.shorts = youtubeShortsCaption;
  data.shortsCaption = youtubeShortsCaption;
  data.shortCaption = youtubeShortsCaption;
  data.youtube_shorts = youtubeShortsCaption;
  data.youtube_shorts_caption = youtubeShortsCaption;
  data.youtube_short = youtubeShortsCaption;
  data.youtube_short_caption = youtubeShortsCaption;
  data.hashtags = selectedHashtags;
};


const cleanFinalRepeatedWords = (value = "") => {
  const words = String(value || "")
    .replace(/\bCampaign\s+Campaign\b/gi, "Campaign")
    .replace(/\bMusic\s+Campaign\s+Campaign\b/gi, "Music Campaign")
    .split(/\s+/)
    .filter(Boolean);

  const cleanedWords = [];

  for (const word of words) {
    const previous = cleanedWords[cleanedWords.length - 1] || "";

    if (previous.toLowerCase() === word.toLowerCase()) {
      continue;
    }

    cleanedWords.push(word);
  }

  return cleanedWords.join(" ").trim();
};

const cleanFinalAudienceEmotion = (items = []) => {
  const artistWords = String(artistName || "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  const cleanItem = (value) => {
    let text = String(value || "").trim();

    artistWords.forEach((word) => {
      const pattern = new RegExp(`\\bfinal\\s+${escapeRegExp(word)}\\s+state\\b`, "gi");
      text = text.replace(pattern, "final visible state");
    });

    text = text
      .replace(/\bfinal\s+fictional\s+performer\s+state\b/gi, "final visible state")
      .replace(/\bfinal\s+artist\s+state\b/gi, "final visible state")
      .replace(/\bfinal\s+performer\s+state\b/gi, "final visible state")
      .replace(/\bthe final visible state locks\b/gi, "the final visible arrangement locks")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  };

  return Array.isArray(items) ? items.map(cleanItem) : items;
};

const buildFinalProfessionalHashtags = () => {
  const normalizeWordsForTag = (value) =>
    String(value || "")
      .replace(/['’]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

  const toHashtag = (value) => {
    const words = normalizeWordsForTag(value);

    if (words.length === 0) return "";

    const tag =
      "#" +
      words
        .slice(0, 4)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");

    return tag.length >= 4 && tag.length <= 34 ? tag : "";
  };

  const bannedTagParts = [
    "campaignidentityjohn",
    "identityjohn",
    "franklinnot",
    "notbuilt",
    "fictionalartistpersona",
    "originalperformer",
  ];

  const conceptWords = String(
    data?.cinematicIdentity?.visualDNA?.join?.(" ") ||
      data?.reelConcept ||
      selectedConceptDNA ||
      ""
  )
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5)
    .filter(
      (word) =>
        ![
          "under",
          "through",
          "their",
          "there",
          "these",
          "those",
          "final",
          "frame",
          "state",
          "surfaces",
          "surface",
        ].includes(word.toLowerCase())
    )
    .slice(0, 4);

  const candidates = [
    artistName,
    trackName,
    genre,
    reelPurpose,
    "Artist Identity",
    "Visual Identity",
    "Cinematic Reel",
    "AI Video Prompt",
    "Music Video Concept",
    ...conceptWords,
    "FrameLab",
  ];

  const tags = [];

  candidates.map(toHashtag).forEach((tag) => {
    if (!tag) return;

    const normalized = tag.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (bannedTagParts.some((part) => normalized.includes(part))) return;

    if (!tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag);
    }
  });

  return tags.slice(0, 12).join(" ");
};

if (data?.cinematicIdentity?.creativeArchetype) {
  data.cinematicIdentity.creativeArchetype = cleanFinalRepeatedWords(
    data.cinematicIdentity.creativeArchetype
  );
}

if (data?.cinematicIdentity?.audienceEmotion) {
  data.cinematicIdentity.audienceEmotion = cleanFinalAudienceEmotion(
    data.cinematicIdentity.audienceEmotion
  );
}

const finalProfessionalHashtags = buildFinalProfessionalHashtags();

if (finalProfessionalHashtags) {
  data.hashtags = finalProfessionalHashtags;

  if (data.captions) {
    data.captions.hashtags = finalProfessionalHashtags;
  }
}


data.previewImage = null;
enforceMusicFacingActionResponseLock();
enforceSubjectSafetyForVisualPrompts();
// Disabled as final override: this template lock was narrowing user combinations into repeated Acid/Family outputs.
// Keep the function available for future targeted use, but do not let it overwrite the global premium interpretation result.
if (false) enforceMusicFacingGraphicObjectSubjectLock();

return res.status(200).json(data);
  } catch (error) {
    console.error("FrameLab API Error:", error);

    return res.status(500).json({
      error: "AI generation failed",
      details: error.message,
    });
  }
}