export const directorStyles = {
  "Blade Runner": `
neon noir atmosphere,
rain soaked streets,
futuristic dystopian mood,
cinematic shadows,
dark ambient lighting,
`,

  A24: `
indie cinematic realism,
soft natural lighting,
emotional atmosphere,
film grain texture,
art house aesthetic,
`,

  "Neo Tokyo": `
cyberpunk atmosphere,
purple blue neon glow,
rain reflections,
futuristic Tokyo streets,
anime cinematic energy,
`,

  "Chrome Dreams": `
chrome reflections,
luxury futuristic design,
high fashion cinematic visuals,
sleek metallic lighting,
premium sci-fi atmosphere,
`,

  "Sacred Geometry": `
symmetrical composition,
spiritual futuristic visuals,
geometric light patterns,
ethereal atmosphere,
cosmic cinematic energy,
`,
};
export function buildCinematicPrompt(prompt, selectedMode) {
  return `
Cinematic ${prompt || "Untitled cinematic vision"},

${directorStyles[selectedMode]}

directed in ${selectedMode} style,
ultra realistic,
volumetric lighting,
cinematic color grading,
smooth camera movement,
high detail,
atmospheric storytelling,
epic composition,
film grain,
8k,
dramatic lighting
`;
}
export function buildGeneratedShots(selectedMode) {
  return [
    "Opening shot with slow floating drone movement",
    "Atmospheric scene using neon reflections and rain glow",
    "Main cinematic moment with high-energy cinematic rhythm",
    `Final hero shot in ${selectedMode} style`,
  ];
}