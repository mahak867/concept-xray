// Concept X-Ray — learner model (BKT), spaced repetition (SM-2),
// misconception engine (Gemini + local fallback), question selection, synthetic class.

(function () {
  const BKT = { p0: 0.3, learn: 0.12, slip: 0.1, guess: 0.22 };
  const DIFF_GUESS = { 1: 0.28, 2: 0.22, 3: 0.15 }; // harder questions are harder to guess
  const DIFF_SLIP = { 1: 0.06, 2: 0.1, 3: 0.16 };
  const STORE_KEY = "concept-xray-v1";

  // ---------- storage (safe) ----------
  const store = {
    load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; } },
    save(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {} },
    clear() { try { localStorage.removeItem(STORE_KEY); } catch {} },
  };

  function freshState() {
    const mastery = {}, cards = {}, history = {};
    XR.CONCEPTS.forEach(c => {
      mastery[c.id] = BKT.p0;
      history[c.id] = [];
      cards[c.id] = { ef: 2.5, interval: 0, reps: 0, due: null };
    });
    return { name: "Aarav", day: 0, mastery, cards, history, attempts: [], misconceptions: {}, diagnosticDone: false, diagIndex: 0, xp: 0, streak: 0 };
  }

  // ---------- BKT ----------
  function bktUpdate(pL, correct, diff) {
    const s = DIFF_SLIP[diff] ?? BKT.slip, g = DIFF_GUESS[diff] ?? BKT.guess;
    const post = correct
      ? (pL * (1 - s)) / (pL * (1 - s) + (1 - pL) * g)
      : (pL * s) / (pL * s + (1 - pL) * (1 - g));
    return Math.min(0.99, Math.max(0.01, post + (1 - post) * BKT.learn * (correct ? 1 : 0.3)));
  }

  // ---------- SM-2 ----------
  function sm2(card, quality, day) {
    const c = { ...card };
    if (quality < 3) { c.reps = 0; c.interval = 1; }
    else {
      c.reps += 1;
      c.interval = c.reps === 1 ? quality - 2 : c.reps === 2 ? 6 : Math.round(c.interval * c.ef);
    }
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    c.due = day + c.interval;
    return c;
  }

  function qualityFrom(correct, confidence) {
    // confidence: 1 (guess) .. 3 (sure)
    if (!correct) return confidence === 3 ? 0 : 1; // confidently wrong is the worst signal
    return confidence === 1 ? 3 : confidence === 2 ? 4 : 5;
  }

  // ---------- local misconception engine ----------
  function localDiagnose(q, chosen, reasoning) {
    const text = (reasoning || "").trim();
    const hits = [];
    for (const [id, m] of Object.entries(XR.MISCONCEPTIONS)) {
      const matched = m.rx.find(r => r.test(text));
      if (matched) hits.push({ id, evidence: (text.match(matched) || [""])[0], score: m.concept === q.concept ? 2 : 1 });
    }
    hits.sort((a, b) => b.score - a.score);
    const fromReasoning = hits[0];
    const fromOption = q.mis[chosen];
    const id = fromReasoning?.id || fromOption || null;
    if (!id) {
      return { source: "local", misconception: null, label: "Calculation slip", confidence: 0.45,
        evidence: text ? "No known misconception pattern in the reasoning." : "No reasoning given — only the final answer was available.",
        explanation: "Your answer is wrong, but your reasoning doesn't match a known conceptual error. It looks like an arithmetic or reading slip.",
        fix: q.explain, fromReasoning: false };
    }
    const m = XR.MISCONCEPTIONS[id];
    return { source: "local", misconception: id, label: m.label, confidence: fromReasoning ? (fromOption === id ? 0.93 : 0.8) : 0.6,
      evidence: fromReasoning ? `“${fromReasoning.evidence}”` : `Chose option ${"ABCD"[chosen]}, a known trap for this error.`,
      explanation: fromReasoning
        ? `Your written reasoning shows the pattern: ${m.label.toLowerCase()}.`
        : `Your final answer is the typical result of: ${m.label.toLowerCase()}. Add your reasoning next time for a sharper diagnosis.`,
      fix: m.fix, fromReasoning: !!fromReasoning };
  }

  // ---------- AI client (Gemini via /api, local fallback) ----------
  const AI = { live: false, checked: false };
  async function withTimeout(p, ms) { return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]); }
  async function checkAI() {
    if (/[?&]demo=1/.test(location.search)) { AI.live = false; AI.demo = true; AI.checked = true; return false; }
    try {
      const r = await withTimeout(fetch("/api/health"), 3000);
      const j = await r.json(); AI.live = !!j.ai;
    } catch { AI.live = false; }
    AI.checked = true; return AI.live;
  }

  async function diagnose(q, chosen, reasoning, image) {
    const local = localDiagnose(q, chosen, reasoning);
    if (!AI.live) return local;
    try {
      const r = await withTimeout(fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text, options: q.options, chosen: q.options[chosen], correct: q.options[q.answer], reasoning, image, lang: XR.lang,
          taxonomy: Object.entries(XR.MISCONCEPTIONS).map(([id, m]) => ({ id, label: m.label })),
        }),
      }), 15000);
      if (!r.ok) throw new Error("bad");
      const j = await r.json();
      const m = XR.MISCONCEPTIONS[j.misconception_id];
      return { source: "gemini", misconception: m ? j.misconception_id : null, label: m ? m.label : (j.label || "Calculation slip"),
        confidence: j.confidence ?? 0.8, evidence: j.evidence || "", explanation: j.explanation || "", fix: j.fix_hint || m?.fix || q.explain,
        transcribed: j.transcribed_reasoning, fromReasoning: true };
    } catch { return local; }
  }

  async function generateQuestion(conceptId, diff, misconceptionId) {
    if (AI.live) {
      try {
        const c = XR.conceptById[conceptId];
        const r = await withTimeout(fetch("/api/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: c.name, description: c.desc, difficulty: diff, lang: XR.lang, misconception: misconceptionId ? XR.MISCONCEPTIONS[misconceptionId].label : null }),
        }), 15000);
        const j = await r.json();
        if (j.text && j.options?.length === 4) {
          return { id: "g" + Date.now(), concept: conceptId, diff, text: j.text, options: j.options, answer: j.answer,
            mis: misconceptionId && j.trap_option != null ? { [j.trap_option]: misconceptionId } : {}, explain: j.explain, generated: true, source: "gemini" };
        }
      } catch {}
    }
    return null;
  }

  // ---------- adaptive selection ----------
  function targetDifficulty(p) { return p < 0.4 ? 1 : p < 0.7 ? 2 : 3; }

  function rootCause(state, conceptId) {
    // walk prerequisites; return weakest prerequisite below threshold
    const seen = new Set(); let best = null;
    (function walk(id) {
      XR.prereqsOf(id).forEach(p => {
        if (seen.has(p)) return; seen.add(p);
        if (state.mastery[p] < 0.5 && (!best || state.mastery[p] < state.mastery[best])) best = p;
        walk(p);
      });
    })(conceptId);
    return best;
  }

  function pickNext(state, recentIds = []) {
    // weakest concept that has questions; prefer root cause first
    const ranked = XR.CONCEPTS.map(c => c.id).sort((a, b) => state.mastery[a] - state.mastery[b]);
    let target = ranked[0];
    const rc = rootCause(state, target);
    const reason = rc
      ? { type: "root", text: `${XR.conceptById[target].short} is weak, but its prerequisite ${XR.conceptById[rc].short} is weaker — fixing the root cause first.` }
      : { type: "weak", text: `${XR.conceptById[target].short} is your weakest concept (${Math.round(state.mastery[target] * 100)}% mastery).` };
    if (rc) target = rc;
    const diff = targetDifficulty(state.mastery[target]);
    const pool = XR.QUESTIONS.filter(q => q.concept === target && !recentIds.includes(q.id));
    const byDiff = pool.sort((a, b) => Math.abs(a.diff - diff) - Math.abs(b.diff - diff));
    const q = byDiff[0] || XR.QUESTIONS.filter(q => q.concept === target)[0];
    return { q, target, diff, reason };
  }

  // ---------- record an answer ----------
  function record(state, q, chosen, confidence, diag, hintsUsed = 0) {
    const correct = chosen === q.answer;
    const before = state.mastery[q.concept];
    // hints weaken the evidence of a correct answer (OATutor-style): 1 hint = treat as one level easier, 3 = barely counts
    let after = bktUpdate(before, correct, Math.max(1, q.diff - hintsUsed));
    if (correct && hintsUsed >= 3) after = before + (after - before) * 0.25;
    state.mastery[q.concept] = after;
    // small evidence spill to prerequisites when correct on a hard question
    if (correct && q.diff === 3) XR.prereqsOf(q.concept).forEach(p => { state.mastery[p] = Math.min(0.99, state.mastery[p] + 0.04); });
    state.history[q.concept].push(after);
    state.cards[q.concept] = sm2(state.cards[q.concept], qualityFrom(correct, confidence), state.day);
    if (diag) state.misconceptions[diag.misconception] = (state.misconceptions[diag.misconception] || 0) + 1;
    // misconception lifecycle: active -> fixed after 2 consecutive correct, hint-free answers on that concept
    state.misState = state.misState || {};
    if (diag?.misconception) state.misState[diag.misconception] = { status: "active", streak: 0, flaggedDay: state.day, evidence: diag.evidence };
    let fixedNow = null;
    Object.entries(state.misState).forEach(([id, m]) => {
      if (m.status !== "active" || XR.MISCONCEPTIONS[id].concept !== q.concept || id === diag?.misconception) return;
      if (correct && hintsUsed === 0) { m.streak++; if (m.streak >= 2) { m.status = "fixed"; m.fixedDay = state.day; fixedNow = id; } }
      else m.streak = 0;
    });
    state.hints = (state.hints || 0) + hintsUsed;
    state.attempts.push({ qid: q.id, concept: q.concept, chosen, correct, confidence, before, after, day: state.day, mis: diag?.misconception || null, t: Date.now() });
    state.xp += correct ? 10 * q.diff : 2;
    state.streak = correct ? state.streak + 1 : 0;
    return { correct, before, after, fixedNow };
  }

  // FSRS-style recall probability: R = (1 + t / (9 S))^-1, using the SM-2 interval as a stability proxy
  function recall(card, day) {
    if (card.due == null) return null;
    const S = Math.max(0.5, card.interval), t = Math.max(0, day - (card.due - card.interval));
    return Math.pow(1 + t / (9 * S), -1);
  }

  // ---------- synthetic class (seeded) ----------
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  const NAMES = ["Aditi","Rahul","Priya","Karthik","Sneha","Arjun","Divya","Vikram","Meera","Rohan","Ananya","Siddharth","Kavya","Harish","Lakshmi","Nikhil","Pooja","Surya","Ishaan","Nandini","Gautham","Fathima","Rithvik","Swetha","Manoj","Deepika","Yash","Keerthana","Abdul","Tanvi"];
  function syntheticClass() {
    const r = rng(42);
    // class-wide difficulty profile: parallel, lenspower, signconv & heating are the hard ones
    const hard = { parallel: -0.25, lenspower: -0.22, signconv: -0.2, heating: -0.15, mirror: -0.12, current: -0.08 };
    return NAMES.map((name, i) => {
      const ability = 0.35 + r() * 0.45;
      const mastery = {}; const mis = {};
      XR.CONCEPTS.forEach(c => { mastery[c.id] = Math.min(0.97, Math.max(0.05, ability + (hard[c.id] || 0.05) + (r() - 0.5) * 0.35)); });
      Object.entries(XR.MISCONCEPTIONS).forEach(([id, m]) => { if (mastery[m.concept] < 0.4 && r() < 0.5) mis[id] = 1 + Math.floor(r() * 3); });
      return { name, mastery, mis, lastActive: Math.floor(r() * 6) };
    });
  }

  XR.engine = { recall, store, freshState, bktUpdate, sm2, qualityFrom, localDiagnose, diagnose, generateQuestion, checkAI, AI, pickNext, rootCause, record, targetDifficulty, syntheticClass };
})();
