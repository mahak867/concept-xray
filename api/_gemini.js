// Shared Gemini caller (server-side; key never reaches the browser)
const MODELS = [process.env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"].filter(Boolean);
async function gemini(parts, schemaHint) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no key");
  let lastErr;
  for (const MODEL of MODELS) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      systemInstruction: { parts: [{ text: "You are a careful CBSE Class 10 physics teacher. Reply ONLY with JSON matching: " + schemaHint }] },
    }),
  });
  if (r.status === 404 || r.status === 429 || r.status >= 500) { lastErr = new Error(`gemini ${r.status} (${MODEL})`); continue; }
  if (!r.ok) throw new Error("gemini " + r.status);
  const j = await r.json();
  const out = JSON.parse(j.candidates[0].content.parts[0].text);
  return Object.assign(out, { _model: MODEL });
  }
  throw lastErr;
}
module.exports = { gemini };
