// Shared Gemini caller (server-side; key never reaches the browser)
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
async function gemini(parts, schemaHint) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no key");
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      systemInstruction: { parts: [{ text: "You are a careful CBSE Class 10 physics teacher. Reply ONLY with JSON matching: " + schemaHint }] },
    }),
  });
  if (!r.ok) throw new Error("gemini " + r.status);
  const j = await r.json();
  return JSON.parse(j.candidates[0].content.parts[0].text);
}
module.exports = { gemini };
