const { gemini } = require("./_gemini");
// Re-teach one Class 10 concept through a different approach (analogy / Indian real-life example / step-by-step).
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { concept, desc, misconception, approach, lang } = req.body || {};
  const how = { analogy: "one vivid everyday analogy", india: "one concrete real-life example from Indian daily life (trains, ration shop, ceiling fan, mobile charger, etc.)", steps: "3-4 short numbered steps a student can follow on paper" }[approach] || "one vivid analogy";
  const L = { hinglish: "Hinglish (Hindi in Roman script mixed with English)", hi: "Hindi (Devanagari script)" }[lang] || "English";
  const prompt = `Re-teach this CBSE Class 10 physics concept to a student who did not get it the first time, using ${how}.
Concept: ${concept} — ${desc}
${misconception ? `The student currently believes: "${misconception}". Address that belief directly, without shaming.` : ""}
Max 70 words. Physically correct. Write in ${L}. End with one short self-check question (no answer).`;
  try { res.status(200).json(await gemini([{ text: prompt }], '{"title": string, "explanation": string, "check": string}')); }
  catch (e) { res.status(502).json({ error: String(e.message) }); }
};
