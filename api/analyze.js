const { gemini } = require("./_gemini");
module.exports = async (req, res) => {
  if (req.method === "GET") {
    // self-test: one fixed held-out example, so the live AI can be checked from a browser
    req.body = { question: "Two identical bulbs are in series. The ammeter before bulb 1 reads 0.5 A. What does an ammeter between the bulbs read?", options: ["0.25 A", "0.5 A", "1.0 A", "0 A"], chosen: "(hidden)", correct: "0.5 A", reasoning: "after passing through a bulb the current reduces", taxonomy: [{ id: "M_CUR_USED", label: "Believes current is used up along a circuit" }, { id: "M_OHM_INV", label: "Inverts Ohm's law" }, { id: "M_SER_V", label: "Thinks voltage is the same across series resistors" }] };
  } else if (req.method !== "POST") return res.status(405).end();
  req.body = req.body || {};
  const { question, options, chosen, correct, reasoning, image, taxonomy } = req.body;
  const prompt = `A student answered a physics question incorrectly. Diagnose the MISCONCEPTION from their REASONING (and handwritten working if an image is attached), not just the final answer.
Question: ${question}
Options: ${JSON.stringify(options)}
Student chose: ${chosen}   Correct: ${correct}
Student's reasoning: "${(reasoning || "").slice(0, 600)}"
Misconception taxonomy (pick the single best id, or null if it is just a calculation slip): ${JSON.stringify(taxonomy)}
Rules: quote the exact words (or transcribed handwriting) that reveal the error as "evidence". If there is no reasoning, base it on the chosen option and lower confidence. Be encouraging and concise (max 2 sentences per field). Never just restate the answer.
Write "explanation" and "fix_hint" in ${({hinglish:"Hinglish (Hindi in Roman script mixed with English)",hi:"Hindi (Devanagari script)"})[req.body.lang]||"English"}. Keep ids and evidence quotes exactly as given.`;
  const parts = [{ text: prompt }];
  if (image?.data) parts.push({ inlineData: { mimeType: image.mime || "image/jpeg", data: image.data } });
  try {
    const out = await gemini(parts, '{"misconception_id": string|null, "label": string, "evidence": string, "transcribed_reasoning": string|null, "explanation": string, "fix_hint": string, "confidence": number 0-1}');
    res.status(200).json(out);
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};
