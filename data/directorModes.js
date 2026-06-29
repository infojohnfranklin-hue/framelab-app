export const directorModes = [
  {
    name: "Neo Noir Sci-Fi",
    premium: true,
    category: "Atmospheric Sci-Fi",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/blade-runner.jpg",
    prompt:
      "neo noir science fiction atmosphere, rain reflections, dark cinematic city light, slow tension",
    description:
      "A grounded sci-fi direction built around rain, reflections, shadow, atmosphere and slow visual tension.",
    mood: "Dark Futuristic",
    cameraStyle: "Slow cinematic tracking shots with atmospheric lighting",
    accent: "#7c3aed",
    avatar: "◢",
    specialty: "Atmospheric Sci-Fi Worldbuilding",
    bestFor: [
      "dark electronic music",
      "cinematic techno",
      "melancholic house",
      "futuristic artist branding",
    ],
    avoid: [
      "generic neon overload",
      "random flying vehicles",
      "unmotivated cyberpunk props",
      "cartoon sci-fi exaggeration",
    ],
    insight:
      "Specialized in dark futuristic pacing, reflective surfaces, rain atmospheres and dystopian visual storytelling.",
    shotLogic:
      "Builds tension through slow establishing shots, reflective surfaces, silhouettes, atmosphere and controlled reveals.",
    outputInfluence: {
      promptBias: "adds noir atmosphere, reflective surfaces and slow tension",
      pacingBias: "slow reveal before transformation",
      framingBias: "low-angle or wide atmospheric frames",
      textureBias: "wet surfaces, glass, smoke, shadow and reflected light",
      transitionBias: "reveals through haze, rain, shadow or reflection",
    },
    visualRules: {
      pacing: "slow noir pacing",
      framing: "low angle cinematic framing",
      motion: "slow atmospheric tracking movement",
      lightingStyle: "neon rain reflections",
      composition: "dark dystopian composition",
    },
    shots: [
      {
        title: "Atmospheric Establishing",
        description:
          "A dark futuristic environment emerges through rain, shadow and reflected light, establishing scale and visual pressure before any action begins.",
        camera: "Slow noir tracking shot",
        lens: "35mm anamorphic",
        lighting: "Neon rain reflections",
        duration: "5s",
        movement: "Slow atmospheric reveal",
      },
      {
        title: "Reflective Tension",
        description:
          "The camera moves across wet surfaces, glass, smoke or metallic edges, letting the environment reveal its hidden structure through reflection.",
        camera: "Rain-soaked detail dolly",
        lens: "50mm noir prime",
        lighting: "Dark ambient shadows",
        duration: "4s",
        movement: "Smooth noir glide",
      },
      {
        title: "Final Shadow",
        description:
          "The sequence resolves into a dark, memorable image where light, smoke and reflection compress the world into a single cinematic final frame.",
        camera: "Slow atmospheric pullback",
        lens: "Vintage sci-fi lens",
        lighting: "Dystopian backlight",
        duration: "6s",
        movement: "Epic closing pullback",
      },
    ],
  },

  {
    name: "Indie Realism",
    premium: false,
    category: "Emotional Realism",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/a24.jpg",
    prompt:
      "emotional indie realism, natural cinematic light, soft grain, intimate framing",
    description:
      "A grounded cinematic direction focused on natural light, emotional pauses, subtle movement and quiet realism.",
    mood: "Emotional Realism",
    cameraStyle: "Handheld emotional framing with intimate cinematic movement",
    accent: "#f59e0b",
    avatar: "◉",
    specialty: "Emotional Storytelling",
    bestFor: [
      "intimate songs",
      "singer-songwriter visuals",
      "emotional electronic music",
      "human-centered campaigns",
    ],
    avoid: [
      "overdesigned fantasy",
      "random symbolic objects",
      "melodramatic acting",
      "fake cinematic sadness",
    ],
    insight:
      "Focused on emotional realism, intimate framing, natural light and quiet cinematic tension.",
    shotLogic:
      "Uses quiet close-ups, natural light, pauses, texture and subtle motion to make the concept feel emotionally real.",
    outputInfluence: {
      promptBias: "grounds the visual idea in natural detail and emotional realism",
      pacingBias: "slow, patient, human-feeling progression",
      framingBias: "intimate close-ups and observational frames",
      textureBias: "soft grain, natural skin tones, imperfect surfaces",
      transitionBias: "changes through pauses, light shifts or small physical gestures",
    },
    visualRules: {
      pacing: "slow emotional pacing",
      framing: "intimate close framing",
      motion: "subtle handheld movement",
      lightingStyle: "soft natural realism",
      composition: "human-centered composition",
    },
    shots: [
      {
        title: "Quiet Establishing",
        description:
          "A soft, grounded opening frame uses natural light, muted texture and emotional stillness to establish a real cinematic atmosphere.",
        camera: "Observational wide frame",
        lens: "35mm natural lens",
        lighting: "Soft natural daylight",
        duration: "5s",
        movement: "Still cinematic hold",
      },
      {
        title: "Human Detail",
        description:
          "The camera moves closer to a meaningful surface, gesture or object, letting emotion emerge through small visual evidence.",
        camera: "Handheld emotional framing",
        lens: "50mm cinematic prime",
        lighting: "Window light atmosphere",
        duration: "4s",
        movement: "Subtle handheld movement",
      },
      {
        title: "Quiet Resolution",
        description:
          "The final frame holds on a fragile image where the emotional consequence of the visual transformation feels calm and real.",
        camera: "Quiet cinematic hold",
        lens: "Soft indie cinema lens",
        lighting: "Soft grainy daylight",
        duration: "6s",
        movement: "Still emotional ending",
      },
    ],
  },

  {
    name: "Cyberpunk Motion",
    premium: false,
    category: "Kinetic Futurism",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/neo-tokyo.jpg",
    prompt:
      "kinetic cyberpunk motion, futuristic city energy, neon reflections, high-speed cinematic rhythm",
    description:
      "A fast, energetic futuristic direction built around motion, speed, light trails and digital urban rhythm.",
    mood: "Cyberpunk Energy",
    cameraStyle:
      "Fast cinematic movement with neon reflections and anime-inspired pacing",
    accent: "#06b6d4",
    avatar: "✦",
    specialty: "Kinetic Futuristic Motion",
    bestFor: [
      "fast electronic tracks",
      "hyperpop visuals",
      "high-energy DJ promos",
      "futuristic social reels",
    ],
    avoid: [
      "slow static scenes",
      "random anime clichés",
      "unreadable chaos",
      "neon without structure",
    ],
    insight:
      "Optimized for neon reflections, kinetic movement and futuristic city rhythm.",
    shotLogic:
      "Combines fast motion, light rhythm, city energy and dynamic camera movement for immediate social impact.",
    outputInfluence: {
      promptBias: "adds kinetic futuristic motion and high-energy visual rhythm",
      pacingBias: "faster cuts, quicker reveals and beat-driven motion",
      framingBias: "dynamic angles and energetic tracking frames",
      textureBias: "neon reflections, digital glow, wet surfaces and light trails",
      transitionBias: "motion-blur transitions, speed ramps and light-pulse reveals",
    },
    visualRules: {
      pacing: "fast cyberpunk pacing",
      framing: "dynamic kinetic framing",
      motion: "kinetic side tracking movement",
      lightingStyle: "high contrast neon lighting",
      composition: "futuristic asymmetrical composition",
    },
    shots: [
      {
        title: "Vertical Energy",
        description:
          "The opening frame reveals a dense futuristic environment layered with vertical light, motion, signage and fast-moving reflections.",
        camera: "Aerial neon drift",
        lens: "24mm anamorphic",
        lighting: "Blue neon reflections",
        duration: "5s",
        movement: "Floating cinematic movement",
      },
      {
        title: "Velocity Rush",
        description:
          "The camera accelerates through the visual system as lights, surfaces and movement sync into a high-speed cinematic rhythm.",
        camera: "Fast side tracking movement",
        lens: "35mm action lens",
        lighting: "High contrast city glow",
        duration: "4s",
        movement: "Kinetic cyberpunk pacing",
      },
      {
        title: "Signal Release",
        description:
          "The sequence resolves into a wide futuristic image where speed, light and atmosphere settle into a clean final frame.",
        camera: "Wide atmospheric reveal",
        lens: "28mm cinematic wide",
        lighting: "Golden futuristic sunrise",
        duration: "6s",
        movement: "Epic closing pullback",
      },
    ],
  },

  {
    name: "Luxury Sci-Fi",
    premium: true,
    category: "Premium Futurism",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/chrome-dreams.jpg",
    prompt:
      "luxury science fiction, chrome reflections, polished surfaces, premium futuristic design",
    description:
      "A premium sci-fi direction built around elegance, reflection, precision, luxury materials and controlled movement.",
    mood: "Luxury Sci-Fi",
    cameraStyle:
      "Smooth premium cinematic camera movement with reflective lighting",
    accent: "#94a3b8",
    avatar: "⬡",
    specialty: "Luxury Sci-Fi Aesthetics",
    bestFor: [
      "premium electronic music",
      "brand visuals",
      "high-end artist launches",
      "luxury futuristic concepts",
    ],
    avoid: [
      "cheap chrome clichés",
      "overcrowded futuristic cities",
      "random robot imagery",
      "plastic-looking sci-fi",
    ],
    insight:
      "Designed for reflective surfaces, elegant cinematic motion and premium sci-fi design language.",
    shotLogic:
      "Creates premium visual flow with smooth camera movement, polished reflections and elegant reveal shots.",
    outputInfluence: {
      promptBias: "adds premium futurism, reflective surfaces and luxury restraint",
      pacingBias: "smooth, controlled, polished progression",
      framingBias: "commercial luxury framing and clean reveal shots",
      textureBias: "chrome, glass, polished metal, soft reflections",
      transitionBias: "surface reflections, light sweeps and controlled object reveals",
    },
    visualRules: {
      pacing: "smooth premium pacing",
      framing: "luxury commercial framing",
      motion: "polished glide movement",
      lightingStyle: "chrome reflective lighting",
      composition: "clean futuristic composition",
    },
    shots: [
      {
        title: "Reflective Establishing",
        description:
          "A polished futuristic environment emerges through chrome reflections, clean geometry and controlled premium light.",
        camera: "Wide luxury establishing shot",
        lens: "70mm luxury scope",
        lighting: "Chrome reflections",
        duration: "5s",
        movement: "Slow cinematic dolly",
      },
      {
        title: "Precision Detail",
        description:
          "Microscopic reflections glide across engineered metallic surfaces, exposing geometric precision and immaculate design perfection.",
        camera: "Slow reflective orbit",
        lens: "85mm fashion lens",
        lighting: "Luxury studio glow",
        duration: "4s",
        movement: "Elegant orbit movement",
      },
      {
        title: "Premium Release",
        description:
          "The camera retreats as the reflective system settles into a clean final image of controlled futuristic elegance.",
        camera: "Premium glide movement",
        lens: "Clean commercial lens",
        lighting: "Premium rim light",
        duration: "6s",
        movement: "Elegant final pullback",
      },
    ],
  },

  {
    name: "Symmetry Cinema",
    premium: true,
    category: "Geometric Visual Design",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/sacred-geometry.jpg",
    prompt:
      "symmetrical cinematic composition, geometric visual rhythm, centered framing, luminous structure",
    description:
      "A geometric direction built around symmetry, centered frames, visual order and controlled spatial rhythm.",
    mood: "Cosmic Structure",
    cameraStyle: "Floating symmetrical camera movement with ethereal pacing",
    accent: "#e879f9",
    avatar: "✺",
    specialty: "Mystical Visual Symmetry",
    bestFor: [
      "ambient music",
      "spiritual electronic visuals",
      "cinematic concept reels",
      "symbolic brand worlds",
    ],
    avoid: [
      "random mystical symbols",
      "generic spiritual clichés",
      "unexplained magic",
      "visual clutter",
    ],
    insight:
      "Built around symmetry, visual order, centered composition and slow geometric atmosphere.",
    shotLogic:
      "Uses centered composition, floating motion, symmetry and geometric rhythm to create visual gravity.",
    outputInfluence: {
      promptBias: "adds centered geometry, symmetry and ordered visual rhythm",
      pacingBias: "slow, balanced, ritual-like progression",
      framingBias: "centered frames and symmetrical layouts",
      textureBias: "light patterns, reflective geometry, clean visual structure",
      transitionBias: "geometric alignment, rotation, expansion or folding",
    },
    visualRules: {
      pacing: "slow symmetrical pacing",
      framing: "centered symmetrical framing",
      motion: "floating geometric movement",
      lightingStyle: "ethereal structured lighting",
      composition: "balanced symmetrical composition",
    },
    shots: [
      {
        title: "First Alignment",
        description:
          "A centered frame establishes symmetry, depth and geometric order before the visual system begins to move.",
        camera: "Floating symmetrical movement",
        lens: "35mm symmetrical lens",
        lighting: "Ethereal glow",
        duration: "5s",
        movement: "Balanced floating motion",
      },
      {
        title: "Geometric Shift",
        description:
          "The composition changes through alignment, rotation or folding while remaining clean, centered and visually controlled.",
        camera: "Centered geometric push-in",
        lens: "50mm structured prime",
        lighting: "Patterned light",
        duration: "4s",
        movement: "Slow symmetrical shift",
      },
      {
        title: "Resolved Pattern",
        description:
          "The final image settles into a strong symmetrical arrangement with clear visual order and cinematic stillness.",
        camera: "Balanced final composition",
        lens: "Geometric cinematic lens",
        lighting: "Structured highlights",
        duration: "6s",
        movement: "Slow resolving pullback",
      },
    ],
  },

  {
    name: "Spatial Architecture",
    premium: true,
    category: "Spatial Cinema",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/architect.jpg",
    prompt:
      "architectural storytelling, spatial tension, geometry, compression and release",
    description:
      "Architecture-driven visual narratives built around structure, scale, spatial pressure and transformation.",
    mood: "Architectural Tension",
    cameraStyle:
      "Measured camera movement emphasizing geometry, compression and spatial rhythm",
    accent: "#c4b5fd",
    avatar: "▣",
    specialty: "Spatial Narrative Design",
    bestFor: [
      "minimal electronic music",
      "cinematic brand systems",
      "installation-like concepts",
      "structure-driven visuals",
    ],
    avoid: [
      "decorative architecture only",
      "random buildings",
      "empty scale without consequence",
      "unmotivated megastructures",
    ],
    insight:
      "Focuses on structure, geometry, volume, compression and release rather than decorative atmosphere.",
    shotLogic:
      "Scene 1 establishes structure, Scene 2 compresses structure, Scene 3 resolves tension within the same structure.",
    outputInfluence: {
      promptBias: "adds spatial hierarchy, structure and architectural consequence",
      pacingBias: "measured, structural progression",
      framingBias: "geometry, mass, void and spatial depth",
      textureBias: "concrete, stone, metal, light volumes and shadow planes",
      transitionBias: "compression, opening, folding or spatial reveal",
    },
    visualRules: {
      pacing: "measured architectural pacing",
      framing: "geometric spatial framing",
      motion: "contained structural movement",
      lightingStyle: "volume-defining light",
      composition: "mass and void balance",
    },
    shots: [
      {
        title: "Spatial Establishment",
        description:
          "A precise architectural frame establishes volume, structure, negative space and material hierarchy.",
        camera: "Static measured wide shot",
        lens: "35mm architectural lens",
        lighting: "Volume-defining light",
        duration: "5s",
        movement: "Minimal controlled movement",
      },
      {
        title: "Compression",
        description:
          "The frame tightens around corridors, planes or stacked forms as spatial pressure becomes visually dominant.",
        camera: "Slow controlled push",
        lens: "50mm spatial lens",
        lighting: "Directional structural light",
        duration: "4s",
        movement: "Measured inward movement",
      },
      {
        title: "Release",
        description:
          "The camera opens the structure into a resolved composition where mass, void and rhythm become balanced.",
        camera: "Wide resolving pullback",
        lens: "28mm spatial wide",
        lighting: "Clean atmospheric reveal",
        duration: "6s",
        movement: "Slow release movement",
      },
    ],
  },

  {
    name: "Monumental Minimalism",
    premium: true,
    category: "Epic Minimalism",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/desert-monument.jpg",
    prompt:
      "vast scale, monumental silence, negative space, sculptural cinematic atmosphere",
    description:
      "A minimal epic direction shaped by scale, silence, negative space and visual weight.",
    mood: "Vast Minimal",
    cameraStyle: "Wide slow camera movement with monumental scale",
    accent: "#d97706",
    avatar: "▲",
    specialty: "Scale and Isolation",
    bestFor: [
      "slow atmospheric music",
      "epic electronic intros",
      "minimal luxury visuals",
      "monumental artist branding",
    ],
    avoid: [
      "empty frames without meaning",
      "random deserts",
      "scale without subject",
      "overly decorative monuments",
    ],
    insight:
      "Uses distance, empty space, shadow and monumental framing to create cinematic weight.",
    shotLogic:
      "Establishes vast scale first, then introduces pressure through distance, light, shadow and material exposure.",
    outputInfluence: {
      promptBias: "adds scale, silence, negative space and visual monumentality",
      pacingBias: "slow, spacious, epic",
      framingBias: "wide frames and controlled negative space",
      textureBias: "stone, sand, dust, shadow, heat, matte surfaces",
      transitionBias: "slow reveal through distance, light or environmental exposure",
    },
    visualRules: {
      pacing: "slow monumental pacing",
      framing: "vast negative-space framing",
      motion: "slow horizon drift",
      lightingStyle: "hard light and long shadows",
      composition: "monumental isolation",
    },
    shots: [
      {
        title: "Scale Establishing",
        description:
          "A vast environment opens with strong negative space, distant structure and visible atmospheric pressure.",
        camera: "Extreme wide frame",
        lens: "70mm compression lens",
        lighting: "Hard directional light",
        duration: "5s",
        movement: "Slow horizon drift",
      },
      {
        title: "Material Shadow",
        description:
          "A single large form casts a long shadow across surface texture while the camera reveals its mass slowly.",
        camera: "Low monumental angle",
        lens: "35mm epic lens",
        lighting: "Long shadow contrast",
        duration: "4s",
        movement: "Slow lateral move",
      },
      {
        title: "Silent Distance",
        description:
          "The camera pulls away until the structure becomes part of the landscape, leaving scale and silence dominant.",
        camera: "Epic pullback",
        lens: "50mm scope lens",
        lighting: "Fading gold light",
        duration: "6s",
        movement: "Slow expanding pullback",
      },
    ],
  },

  {
    name: "Submerged Noir",
    premium: true,
    category: "Submerged Cinema",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/ocean-noir.jpg",
    prompt:
      "submerged cinematic world, dark water, refracted light, slow underwater motion",
    description:
      "A submerged noir direction built around water pressure, refraction, depth, darkness and slow floating movement.",
    mood: "Submerged Mystery",
    cameraStyle: "Slow floating camera movement with pressure and refraction",
    accent: "#0ea5e9",
    avatar: "◒",
    specialty: "Underwater Atmosphere",
    bestFor: [
      "moody electronic music",
      "ambient releases",
      "oceanic visual concepts",
      "dreamlike dark reels",
    ],
    avoid: [
      "random sea creatures",
      "generic underwater fantasy",
      "unmotivated mermaid imagery",
      "flat blue filters",
    ],
    insight:
      "Creates mystery through refraction, slow drift, liquid pressure and limited visibility.",
    shotLogic:
      "Begins with submerged space, then reveals motion through particles, refraction and pressure shifts.",
    outputInfluence: {
      promptBias: "adds submerged atmosphere, pressure and refracted visual depth",
      pacingBias: "slow floating progression",
      framingBias: "layered depth and obscured silhouettes",
      textureBias: "water distortion, particles, caustics and dark gradients",
      transitionBias: "dissolves, refractions, floating reveals and pressure shifts",
    },
    visualRules: {
      pacing: "slow submerged pacing",
      framing: "fluid layered framing",
      motion: "floating underwater drift",
      lightingStyle: "refracted aquatic light",
      composition: "depth and pressure layering",
    },
    shots: [
      {
        title: "Submerged Establishing",
        description:
          "Dark water surrounds the frame as suspended particles drift through faint beams of refracted light.",
        camera: "Floating underwater wide",
        lens: "35mm aquatic lens",
        lighting: "Soft refracted light",
        duration: "5s",
        movement: "Slow liquid drift",
      },
      {
        title: "Pressure Detail",
        description:
          "Surface textures bend and distort through water movement as shadows ripple across submerged material.",
        camera: "Close refractive detail",
        lens: "85mm macro lens",
        lighting: "Water-caustic reflections",
        duration: "4s",
        movement: "Gentle parallax drift",
      },
      {
        title: "Depth Pullback",
        description:
          "The camera retreats into darker water, revealing layered depth and the full submerged atmosphere.",
        camera: "Slow underwater pullback",
        lens: "50mm noir lens",
        lighting: "Fading blue-green light",
        duration: "6s",
        movement: "Deep floating retreat",
      },
    ],
  },

  {
    name: "Editorial Fashion Film",
    premium: true,
    category: "Luxury Editorial",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/editorial-fashion.jpg",
    prompt:
      "high fashion editorial cinema, controlled movement, sculptural light, premium visual styling",
    description:
      "A luxury editorial direction built around controlled movement, surface discipline, sculptural light and refined styling.",
    mood: "Elegant Controlled",
    cameraStyle: "Precise editorial camera movement with sculptural lighting",
    accent: "#f0abfc",
    avatar: "◆",
    specialty: "Premium Visual Styling",
    bestFor: [
      "fashion-like artist visuals",
      "premium DJ branding",
      "luxury reels",
      "clean product-style music concepts",
    ],
    avoid: [
      "random fashion models",
      "empty luxury clichés",
      "overly glossy plastic look",
      "style without concept consequence",
    ],
    insight:
      "Uses restraint, surface control, elegant framing and premium commercial pacing.",
    shotLogic:
      "Treats every frame as a premium editorial composition with controlled reveal and material emphasis.",
    outputInfluence: {
      promptBias: "adds controlled styling, premium materials and editorial restraint",
      pacingBias: "precise, polished, elegant",
      framingBias: "fashion-film framing and clean silhouettes",
      textureBias: "fabric, glass, skin light, polished material, controlled shadow",
      transitionBias: "controlled reveal, material sweep or clean cut",
    },
    visualRules: {
      pacing: "controlled editorial pacing",
      framing: "high fashion framing",
      motion: "precise elegant movement",
      lightingStyle: "sculptural studio light",
      composition: "premium editorial balance",
    },
    shots: [
      {
        title: "Material Entrance",
        description:
          "A controlled opening frame reveals texture, silhouette and surface detail under sculptural light.",
        camera: "Editorial push-in",
        lens: "70mm fashion lens",
        lighting: "Soft sculptural key light",
        duration: "4s",
        movement: "Precise controlled push",
      },
      {
        title: "Luxury Detail",
        description:
          "The camera isolates surface, movement and material behavior with clean editorial precision.",
        camera: "Detail tracking shot",
        lens: "85mm fashion prime",
        lighting: "Premium highlight control",
        duration: "4s",
        movement: "Polished micro movement",
      },
      {
        title: "Final Frame",
        description:
          "The composition resolves into a clean luxury image with controlled space, surface and light.",
        camera: "Centered editorial frame",
        lens: "50mm premium lens",
        lighting: "Elegant rim light",
        duration: "5s",
        movement: "Minimal final hold",
      },
    ],
  },

  {
    name: "Analog Memory",
    premium: true,
    category: "Distorted Archive",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/analog-horror.jpg",
    prompt:
      "analog tape texture, distorted memory, unsettling stillness, degraded cinematic atmosphere",
    description:
      "An analog archive direction shaped by tape texture, memory distortion, degraded signal and quiet unease.",
    mood: "Unsettling Nostalgia",
    cameraStyle: "Static degraded framing with slow tension and analog imperfections",
    accent: "#84cc16",
    avatar: "▧",
    specialty: "Analog Tension",
    bestFor: [
      "retro electronic music",
      "dark nostalgic visuals",
      "archive-inspired reels",
      "experimental release campaigns",
    ],
    avoid: [
      "cheap horror jump scares",
      "random monsters",
      "overused VHS glitches",
      "illegible visual noise",
    ],
    insight:
      "Builds unease through imperfect signal, stillness, degraded texture and subtle visual disturbance.",
    shotLogic:
      "Creates tension through static framing first, then introduces small distortions and delayed visual shifts.",
    outputInfluence: {
      promptBias: "adds analog imperfection, archive texture and memory distortion",
      pacingBias: "slow, static, uneasy",
      framingBias: "locked-off archival frames and negative space",
      textureBias: "grain, tape noise, scan lines, dim practical light",
      transitionBias: "signal flicker, frame tearing, tape degradation",
    },
    visualRules: {
      pacing: "slow uneasy pacing",
      framing: "static archival framing",
      motion: "minimal disturbed movement",
      lightingStyle: "degraded low-light texture",
      composition: "unsettling negative space",
    },
    shots: [
      {
        title: "Tape Establishing",
        description:
          "A static frame holds too long as grain, signal noise and faint distortion begin to corrupt the image.",
        camera: "Locked-off archival frame",
        lens: "Old video lens",
        lighting: "Dim practical light",
        duration: "5s",
        movement: "No visible movement",
      },
      {
        title: "Signal Shift",
        description:
          "Subtle image tearing and flicker alter the frame while the visual system remains almost still.",
        camera: "Static degraded shot",
        lens: "Analog compression lens",
        lighting: "Low fluorescent light",
        duration: "4s",
        movement: "Micro distortion",
      },
      {
        title: "Memory Failure",
        description:
          "The image collapses into warped texture and shadow before cutting into a final unstable stillness.",
        camera: "Fixed corrupted frame",
        lens: "Tape-decay lens",
        lighting: "Fading analog glow",
        duration: "6s",
        movement: "Signal breakdown",
      },
    ],
  },

  {
    name: "Surreal Dream Cinema",
    premium: true,
    category: "Surreal Cinema",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/dream-logic.jpg",
    prompt:
      "surreal cinematic dream logic, impossible transitions, soft atmosphere, symbolic visual motion",
    description:
      "A surreal direction where transitions feel emotional, fluid, strange and physically impossible.",
    mood: "Surreal Softness",
    cameraStyle: "Floating dreamlike camera movement with impossible transitions",
    accent: "#a78bfa",
    avatar: "◌",
    specialty: "Surreal Transitions",
    bestFor: [
      "dreamy electronic music",
      "experimental visuals",
      "soft surreal reels",
      "emotional abstract concepts",
    ],
    avoid: [
      "random nonsense imagery",
      "unmotivated symbolism",
      "generic fantasy worlds",
      "visual chaos without cause",
    ],
    insight:
      "Transforms scenes through soft impossible movement, visual metaphor and atmospheric continuity.",
    shotLogic:
      "Uses dreamlike cause-and-effect where one visual state melts into the next without hard cuts.",
    outputInfluence: {
      promptBias: "adds surreal transitions, dreamlike movement and soft impossible shifts",
      pacingBias: "fluid, gentle, strange",
      framingBias: "centered surreal compositions and floating perspectives",
      textureBias: "haze, diffusion, soft edges, liquid surfaces, unusual shadows",
      transitionBias: "melting, folding, floating, dissolving or impossible movement",
    },
    visualRules: {
      pacing: "soft dream pacing",
      framing: "surreal centered framing",
      motion: "floating impossible movement",
      lightingStyle: "hazy atmospheric glow",
      composition: "symbolic visual balance",
    },
    shots: [
      {
        title: "Soft Opening",
        description:
          "The scene begins with gentle atmosphere, softened edges and a frame that feels slightly impossible.",
        camera: "Floating dream frame",
        lens: "Soft diffusion lens",
        lighting: "Hazy glow",
        duration: "5s",
        movement: "Slow floating entry",
      },
      {
        title: "Impossible Shift",
        description:
          "One visual state bends into another through a fluid transition that feels physical but dreamlike.",
        camera: "Surreal transition move",
        lens: "50mm soft lens",
        lighting: "Diffuse atmospheric light",
        duration: "4s",
        movement: "Liquid visual transition",
      },
      {
        title: "Dream Resolution",
        description:
          "The final frame settles into a quiet surreal image where the transformation feels complete but unexplained.",
        camera: "Soft final hold",
        lens: "70mm dream lens",
        lighting: "Muted glow",
        duration: "6s",
        movement: "Gentle stillness",
      },
    ],
  },

  {
    name: "Poetic Documentary",
    premium: false,
    category: "Poetic Observation",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/documentary-dreamer.jpg",
    prompt:
      "poetic documentary realism, observed process, natural detail, cinematic transformation",
    description:
      "A poetic observational direction focused on real processes, physical details and grounded transformation.",
    mood: "Quiet Observation",
    cameraStyle:
      "Patient documentary camera movement with poetic attention to physical change",
    accent: "#22c55e",
    avatar: "◍",
    specialty: "Observed Transformation",
    bestFor: [
      "organic house",
      "ambient music",
      "process-based concepts",
      "natural material visuals",
    ],
    avoid: [
      "fake spectacle",
      "random cinematic effects",
      "overwritten symbolism",
      "unmotivated fantasy",
    ],
    insight:
      "Finds cinematic beauty in real movement, physical process and observable cause-and-effect.",
    shotLogic:
      "Observes the system first, then follows small physical changes until they reveal a new state.",
    outputInfluence: {
      promptBias: "grounds the visual in observation, process and real physical change",
      pacingBias: "patient and process-driven",
      framingBias: "documentary detail and observational wide frames",
      textureBias: "natural materials, surface changes, physical traces",
      transitionBias: "cause-and-effect transformation rather than cinematic trick",
    },
    visualRules: {
      pacing: "patient observational pacing",
      framing: "documentary detail framing",
      motion: "natural following movement",
      lightingStyle: "available light realism",
      composition: "process-focused composition",
    },
    shots: [
      {
        title: "Observed System",
        description:
          "The camera studies the existing system without exaggeration, letting material, surface and motion define the frame.",
        camera: "Patient observational frame",
        lens: "35mm documentary lens",
        lighting: "Natural available light",
        duration: "5s",
        movement: "Slow observational hold",
      },
      {
        title: "Physical Change",
        description:
          "A small physical shift becomes visible and the camera follows it with quiet precision.",
        camera: "Natural tracking shot",
        lens: "50mm documentary lens",
        lighting: "Soft practical light",
        duration: "4s",
        movement: "Gentle following movement",
      },
      {
        title: "New Condition",
        description:
          "The process resolves into a changed state that feels discovered rather than invented.",
        camera: "Wide observational resolve",
        lens: "35mm realistic lens",
        lighting: "Grounded cinematic light",
        duration: "6s",
        movement: "Slow natural pullback",
      },
    ],
  },

  {
    name: "Minimal Ritual Cinema",
    premium: true,
    category: "Controlled Ceremony",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/minimal-ritual.jpg",
    prompt:
      "minimal ritual cinema, repeated motion, restrained composition, quiet ceremonial atmosphere",
    description:
      "A restrained cinematic direction built from repetition, pause, controlled motion and visual discipline.",
    mood: "Restrained Ceremony",
    cameraStyle: "Minimal controlled camera movement with repeated visual rhythm",
    accent: "#f43f5e",
    avatar: "●",
    specialty: "Repetition and Restraint",
    bestFor: [
      "minimal techno",
      "ritual-like concepts",
      "repetitive visual systems",
      "clean symbolic reels",
    ],
    avoid: [
      "empty ritual clichés",
      "random religious imagery",
      "overexplaining symbolism",
      "motion without consequence",
    ],
    insight:
      "Creates premium tension through repetition, pause, restraint and controlled visual progression.",
    shotLogic:
      "Introduces one repeated action, observes its consequence, then resolves through a precise final arrangement.",
    outputInfluence: {
      promptBias: "adds repetition, restraint and controlled ceremonial rhythm",
      pacingBias: "slow, repeated, intentional",
      framingBias: "minimal centered frames and disciplined spacing",
      textureBias: "dark surfaces, controlled light, repeated marks or motion traces",
      transitionBias: "repetition creates visible consequence",
    },
    visualRules: {
      pacing: "restrained ritual pacing",
      framing: "minimal centered framing",
      motion: "controlled repeated movement",
      lightingStyle: "low ceremonial light",
      composition: "disciplined visual order",
    },
    shots: [
      {
        title: "First Gesture",
        description:
          "A single controlled movement begins in a restrained frame, establishing rhythm and intent.",
        camera: "Minimal centered shot",
        lens: "50mm restrained lens",
        lighting: "Low focused light",
        duration: "5s",
        movement: "Controlled minimal motion",
      },
      {
        title: "Repeated Consequence",
        description:
          "The repeated action creates a visible change in spacing, texture or alignment.",
        camera: "Measured tracking frame",
        lens: "70mm ritual lens",
        lighting: "Soft directional contrast",
        duration: "4s",
        movement: "Precise repeated movement",
      },
      {
        title: "Final Arrangement",
        description:
          "The sequence resolves into a clean final composition where the repeated action has altered the system.",
        camera: "Static final composition",
        lens: "35mm minimal lens",
        lighting: "Controlled final glow",
        duration: "6s",
        movement: "Still visual hold",
      },
    ],
  },

  {
    name: "Gloss Music Video",
    premium: false,
    category: "Commercial Motion",
    creator: "FrameLab Originals",
    version: "2.0",
    thumbnail: "/directors/music-video-gloss.jpg",
    prompt:
      "premium music video energy, glossy motion, rhythmic camera movement, social-first cinematic pacing",
    description:
      "A polished music-video direction with rhythmic camera movement, clean hooks and social-first pacing.",
    mood: "Glossy Energy",
    cameraStyle:
      "Rhythmic camera motion with polished transitions and performance-ready pacing",
    accent: "#ec4899",
    avatar: "✷",
    specialty: "Rhythmic Reel Energy",
    bestFor: [
      "dance tracks",
      "DJ releases",
      "club-ready visuals",
      "performance marketing reels",
    ],
    avoid: [
      "generic club lights",
      "random dancing filler",
      "cheap music-video clichés",
      "overly fast unreadable edits",
    ],
    insight:
      "Designed for polished music visuals, social pacing, rhythmic motion and instantly readable shots.",
    shotLogic:
      "Builds from a strong opening visual, adds rhythmic movement, then ends on a clean replayable final frame.",
    outputInfluence: {
      promptBias: "adds glossy motion, beat energy and platform-ready composition",
      pacingBias: "rhythmic, direct, social-first",
      framingBias: "clean hook frames and strong final loop images",
      textureBias: "gloss, highlights, polished surfaces and controlled color",
      transitionBias: "beat-matched movement, whip-like reveals and loopable endings",
    },
    visualRules: {
      pacing: "rhythmic social pacing",
      framing: "music-video framing",
      motion: "glossy beat-driven movement",
      lightingStyle: "polished highlight lighting",
      composition: "high-impact social composition",
    },
    shots: [
      {
        title: "Instant Hook",
        description:
          "The first frame presents a bold readable image designed to catch attention instantly.",
        camera: "Clean opening push",
        lens: "35mm social lens",
        lighting: "Polished highlight glow",
        duration: "3s",
        movement: "Quick cinematic push",
      },
      {
        title: "Rhythm Move",
        description:
          "The camera moves with musical timing as surfaces, light and motion sync into a polished sequence.",
        camera: "Beat-driven tracking",
        lens: "50mm music video lens",
        lighting: "Glossy contrast light",
        duration: "4s",
        movement: "Rhythmic glide",
      },
      {
        title: "Replay Frame",
        description:
          "The sequence ends on a strong clean image that feels loopable and platform-ready.",
        camera: "Centered final frame",
        lens: "70mm polished lens",
        lighting: "Clean rim highlight",
        duration: "4s",
        movement: "Loop-ready settle",
      },
    ],
  },
];