const { gemini } = require("./_gemini");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { concept, description, difficulty, misconception } = req.body || {};
  const prompt = `Write ONE original CBSE Class 10 physics multiple-choice question.
Concept: ${concept} — ${description}
Difficulty: ${["", "easy (one step)", "medium (two steps)", "hard (multi-step / conceptual trap)"][difficulty] || "medium"}
${misconception ? `It must include one distractor that a student holding this misconception would pick: "${misconception}". Give its index as trap_option.` : "trap_option may be null."}
Use realistic Indian context where natural. Numbers must work out cleanly. Exactly 4 options; verify the answer yourself before replying.`;
  try {
    const out = await gemini([{ text: prompt }], '{"text": string, "options": [4 strings], "answer": 0-3, "trap_option": 0-3|null, "explain": string}');
    // Verification pass: an independent call solves the question without seeing the key. Disagreement = discard.
    const check = await gemini([{ text: `Solve this Class 10 physics MCQ carefully. Question: ${out.text}\nOptions: ${JSON.stringify(out.options)}` }], '{"answer": 0-3, "working": string}');
    if (check.answer !== out.answer) return res.status(422).json({ error: "verification_failed" });
    res.status(200).json({ ...out, verified: true });
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};
