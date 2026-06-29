export default async function handler(req, res) {
  return res.status(410).json({
    error: "Thumbnail generation is disabled.",
    message:
      "FrameLab currently does not generate thumbnails. This route is intentionally disabled to prevent API costs during testing and launch preparation.",
  });
}