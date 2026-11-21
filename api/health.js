// ?deep=1 lists the Gemini models this key can use (names only, no secrets)
module.exports = async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!(req.query && req.query.deep)) return res.status(200).json({ ai: !!key });
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key } });
    const j = await r.json();
    res.status(200).json({ status: r.status, models: (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent")).map(m => m.name.replace("models/", "")), error: j.error && j.error.message });
  } catch (e) { res.status(200).json({ error: String(e) }); }
};
