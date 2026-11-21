const { gemini } = require("./_gemini");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { question, options, chosen, correct, reasoning, image, taxonomy } = req.body || {};
  const prompt = `A student answered a physics question incorrectly. Diagnose the MISCONCEPTION from their REASONING (and handwritten working if an image is attached), not just the final answer.
Question: ${question}
Options: ${JSON.stringify(options)}
Student chose: ${chosen}   Correct: ${correct}
Student's reasoning: "${(reasoning || "").slice(0, 600)}"
Misconception taxonomy (pick the single best id, or null if it is just a calculation slip): ${JSON.stringify(taxonomy)}
Rules: quote the exact words (or transcribed handwriting) that reveal the error as "evidence". If there is no reasoning, base it on the chosen option and lower confidence. Be encouraging and concise (max 2 sentences per field). Never just restate the answer.`;
  const parts = [{ text: prompt }];
  if (image?.data) parts.push({ inlineData: { mimeType: image.mime || "image/jpeg", data: image.data } });
  try {
    const out = await gemini(parts, '{"misconception_id": string|null, "label": string, "evidence": string, "transcribed_reasoning": string|null, "explanation": string, "fix_hint": string, "confidence": number 0-1}');
    res.status(200).json(out);
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};
