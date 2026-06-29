export default async function handler(req, res) {
  return res.status(410).json({
    error: "Video generation is disabled.",
    message:
      "FrameLab currently does not generate videos. This route is intentionally disabled to prevent API costs during testing and launch preparation.",
  });
}