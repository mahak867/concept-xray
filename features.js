// Concept X-Ray — win-plan features:
// Break-the-Misconception lab (Predict → Observe → Explain), Same-answer-different-reason opener,
// "Teach it another way", agent tool-call trace, teacher approval, language toggle, WhatsApp report.
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = p => Math.round(p * 100) + "%";
  const E = () => XR.engine;
  const S = () => XR.getState();
  const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  // ---------------- language ----------------
  XR.lang = LS.get("cx-lang", "en");
  XR.LANG_NAME = { en: "English", hinglish: "Hinglish (Hindi in Roman script, mixed with English)", hi: "Hindi (Devanagari)" };

  // ---------------- agent tool-call trace ----------------
  XR.trace = [];
  XR.traceAdd = (tool, input, output, engine = "local", ms = 0) => { XR.trace.push({ tool, input, output, engine, ms, t: Date.now() }); XR.renderTrace && XR.renderTrace(); };
  XR.traceHTML = () => `<h3>Agent tool calls</h3><p class="sub">Every step the tutor took, in order. Tap a call to see its input and output.</p>
    <div class="tools">${XR.trace.slice(-9).map((c, i) => `<details class="tool" ${i === XR.trace.slice(-9).length - 1 ? "open" : ""}><summary><code>${esc(c.tool)}()</code><span class="eng ${c.engine}">${c.engine === "gemini" ? "Gemini" : c.engine === "cached" ? "cached live" : "local"}</span><span class="ms">${c.ms ? c.ms + " ms" : ""}</span></summary>
      <div class="io"><b>in</b> ${esc(c.input)}</div><div class="io"><b>out</b> ${esc(c.output)}</div></details>`).join("") || `<p class="hint">No calls yet.</p>`}</div>`;
  async function timed(fn) { const t = performance.now(); const r = await fn(); return [r, Math.round(performance.now() - t)]; }

  // ---------------- experiments (Predict → Observe → Explain) ----------------
  const EXP = {
    M_CUR_USED: {
      title: "Series circuit: is current used up?", concept: "current",
      ask: "Two identical bulbs in series. Ammeter A1 (before bulb 1) reads 0.50 A. Predict ammeter A2, between the bulbs.",
      unit: "A", truth: 0.5, keywords: /same|equal|constant|conserv|not used|doesn.?t get used|energy/i,
      svg(pred, run) {
        const r = run ? "0.50" : "?"; const b = run ? "#f5c542" : "#e8e1d2";
        return `<svg viewBox="0 0 520 200" class="expsvg"><rect x="40" y="40" width="440" height="120" rx="14" fill="none" stroke="#1c2433" stroke-width="3"/>
          ${run ? `<circle r="5" fill="#0f6e6e"><animateMotion dur="3s" repeatCount="indefinite" path="M40,40 H480 V160 H40 Z"/></circle><circle r="5" fill="#0f6e6e"><animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M40,40 H480 V160 H40 Z"/></circle><circle r="5" fill="#0f6e6e"><animateMotion dur="3s" begin="2s" repeatCount="indefinite" path="M40,40 H480 V160 H40 Z"/></circle>` : ""}
          <rect x="20" y="85" width="40" height="30" fill="#fffdf8" stroke="#1c2433" stroke-width="2"/><text x="40" y="105" text-anchor="middle" font-size="12" font-weight="700">6V</text>
          ${[["A1", 110, "0.50"], ["A2", 260, run ? "0.50" : (pred ?? "?")], ["A3", 410, r]].map(([n, x, v]) => `<circle cx="${x}" cy="40" r="22" fill="#fff" stroke="#0f6e6e" stroke-width="2.5"/><text x="${x}" y="37" text-anchor="middle" font-size="10" font-weight="700" fill="#0f6e6e">${n}</text><text x="${x}" y="50" text-anchor="middle" font-size="11" font-weight="700">${v}</text>`).join("")}
          <circle cx="185" cy="40" r="16" fill="${b}" stroke="#1c2433" stroke-width="2"/><circle cx="335" cy="40" r="16" fill="${b}" stroke="#1c2433" stroke-width="2"/>
          <text x="185" y="80" text-anchor="middle" font-size="11">bulb 1</text><text x="335" y="80" text-anchor="middle" font-size="11">bulb 2</text></svg>`;
      },
      observe: "All three ammeters read 0.50 A. The bulbs convert electrical energy to light and heat, but the charge flowing through them is not used up.",
    },
    M_PAR_ADD: {
      title: "Parallel resistors: do they add?", concept: "parallel",
      ask: "Four 6 Ω resistors will be connected in parallel. Predict the equivalent resistance R_eq in Ω.",
      unit: "Ω", truth: 1.5, keywords: /less|smaller|reciprocal|1\/r|more path|decrease|lower/i, slider: { min: 1, max: 4, label: "Resistors in parallel" },
      svg(pred, run, n = 4) {
        const req = 6 / n;
        return `<svg viewBox="0 0 520 220" class="expsvg"><line x1="60" y1="30" x2="60" y2="190" stroke="#1c2433" stroke-width="3"/><line x1="400" y1="30" x2="400" y2="190" stroke="#1c2433" stroke-width="3"/>
          ${Array.from({ length: n }, (_, i) => { const y = 40 + i * (150 / Math.max(1, n - 1 || 1)); const yy = n === 1 ? 110 : y; return `<line x1="60" y1="${yy}" x2="180" y2="${yy}" stroke="#1c2433" stroke-width="2"/><rect x="180" y="${yy - 10}" width="100" height="20" rx="4" fill="#fbefe1" stroke="#c9731b" stroke-width="2"/><text x="230" y="${yy + 5}" text-anchor="middle" font-size="11" font-weight="700">6 Ω</text><line x1="280" y1="${yy}" x2="400" y2="${yy}" stroke="#1c2433" stroke-width="2"/>`; }).join("")}
          <rect x="420" y="80" width="90" height="60" rx="10" fill="${run ? "#e0f0ee" : "#f1ece1"}" stroke="#0f6e6e" stroke-width="2"/><text x="465" y="102" text-anchor="middle" font-size="11">R_eq</text><text x="465" y="126" text-anchor="middle" font-size="18" font-weight="700" fill="#0f6e6e">${run ? req.toFixed(2) : "?"}</text></svg>`;
      },
      observe: "Each resistor you add gives the current another path, so R_eq drops: 6 → 3 → 2 → 1.5 Ω. It is always smaller than the smallest resistor. Adding them (24 Ω) goes the wrong way.",
    },
    M_LEN_INV: {
      title: "Wire length and thickness", concept: "resistivity",
      ask: "A copper wire is stretched to 2× its length (same thickness). Predict how many times its resistance changes (e.g. 0.5, 1, 2).",
      unit: "×", truth: 2, keywords: /longer|length|proportional|more|increase|double|obstacle|collision/i, slider: { min: 1, max: 4, label: "Length (× original)" },
      svg(pred, run, n = 2) {
        return `<svg viewBox="0 0 520 170" class="expsvg"><rect x="40" y="60" width="${80 * n}" height="22" rx="11" fill="#c9731b" opacity=".85"/>
          ${run ? Array.from({ length: 6 * n }, (_, i) => `<circle cx="${50 + (i * 80 * n) / (6 * n)}" cy="71" r="3" fill="#fff"><animate attributeName="cx" values="${50 + (i * 80 * n) / (6 * n)};${50 + (i * 80 * n) / (6 * n) + 12}" dur="${0.6 * n}s" repeatCount="indefinite"/></circle>`).join("") : ""}
          <text x="40" y="45" font-size="12">L × ${n}</text><text x="40" y="120" font-size="13">R = ρL / A  →  R × <tspan font-weight="700" fill="#0f6e6e">${run ? n : "?"}</tspan></text></svg>`;
      },
      observe: "R = ρL/A. Resistance grows in proportion to length: double the length, double the resistance. Electrons collide with more of the lattice along a longer path.",
    },
    M_POW_CM: {
      title: "Lens power: centimetres or metres?", concept: "lenspower",
      ask: "A convex lens has f = 25 cm. Predict its power in dioptres (D).",
      unit: "D", truth: 4, keywords: /metre|meter|0\.25|m\b|convert|si unit/i,
      svg(pred, run) {
        return `<svg viewBox="0 0 520 190" class="expsvg"><ellipse cx="260" cy="95" rx="16" ry="70" fill="#d8eef7" stroke="#0f6e6e" stroke-width="2.5"/>
          ${[55, 95, 135].map(y => `<line x1="40" y1="${y}" x2="260" y2="${y}" stroke="#e8a33d" stroke-width="2"/><line x1="260" y1="${y}" x2="${run ? 360 : 300}" y2="${run ? 95 : y}" stroke="#e8a33d" stroke-width="2"/>`).join("")}
          <circle cx="360" cy="95" r="4" fill="#d9534f"/><text x="352" y="120" font-size="11">F (25 cm)</text>
          <text x="40" y="180" font-size="12.5">${run ? "f in cm: P = 1/25 = 0.04 D (a lens that barely bends light ✗)   ·   f in m: P = 1/0.25 = <tspan font-weight=\"700\" fill=\"#0f6e6e\">+4 D ✓</tspan>" : "P = 1/f …"}</text></svg>`;
      },
      observe: "A 0.04 D lens would focus light 25 metres away, not 25 cm. P = 1/f only works with f in metres: 25 cm = 0.25 m, so P = +4 D. That matches a real +4 reading-glasses prescription.",
    },
  };
  XR.EXPERIMENTS = EXP;

  function closeModal() { $("#labModal")?.remove(); }
  XR.openLab = function (misId, opts = {}) {
    const X = EXP[misId]; if (!X) return;
    closeModal();
    const m = document.createElement("div"); m.id = "labModal";
    let n = X.slider ? (misId === "M_PAR_ADD" ? 4 : 2) : null, pred = null, phase = "predict";
    m.innerHTML = `<div class="lab-box"><div class="lab-head"><div><span class="eyebrow" style="margin:0">Break the misconception</span><h3>${esc(X.title)}</h3></div><button class="lab-x" aria-label="Close">✕</button></div>
      <ol class="lab-steps"><li class="on" data-s="predict">1 · Predict</li><li data-s="observe">2 · Observe</li><li data-s="explain">3 · Explain</li></ol>
      <p class="lab-ask">${esc(X.ask)}</p><div id="labSvg"></div>
      <div id="labCtl"></div><div id="labMsg"></div></div>`;
    document.body.appendChild(m);
    m.querySelector(".lab-x").onclick = closeModal;
    const step = s => { phase = s; m.querySelectorAll(".lab-steps li").forEach(li => li.classList.toggle("on", li.dataset.s === s)); m.querySelectorAll(".lab-steps li").forEach(li => li.classList.toggle("done", ["predict", "observe", "explain"].indexOf(li.dataset.s) < ["predict", "observe", "explain"].indexOf(s))); };
    const draw = run => { $("#labSvg").innerHTML = X.svg(pred, run, n ?? undefined); };
    draw(false);
    $("#labCtl").innerHTML = `<div class="lab-row"><label>Your prediction</label><input id="labPred" type="number" step="any" placeholder="${X.unit}"><span>${X.unit}</span><button class="btn primary" id="labGo">Run the experiment →</button></div>`;
    XR.traceAdd("open_experiment", misId, X.title);
    $("#labGo").onclick = () => {
      const v = parseFloat($("#labPred").value); if (isNaN(v)) { $("#labPred").focus(); return; }
      pred = v; step("observe"); draw(true);
      const right = Math.abs(v - X.truth) < 0.01 * Math.max(1, X.truth);
      XR.traceAdd("run_experiment", `prediction ${v} ${X.unit}`, `observed ${X.truth} ${X.unit} · prediction ${right ? "held" : "failed"}`);
      $("#labMsg").innerHTML = `<div class="lab-obs ${right ? "ok" : "bad"}"><b>${right ? "Your prediction held." : `You predicted ${v} ${X.unit}. The experiment shows ${X.truth} ${X.unit}.`}</b> ${esc(X.observe)}</div>
        ${X.slider ? `<div class="lab-row"><label>${X.slider.label}</label><input type="range" id="labSl" min="${X.slider.min}" max="${X.slider.max}" value="${n}"><b id="labN">${n}</b></div>` : ""}
        <div class="lab-row col"><label>3 · Explain in one line why ${right ? "it works" : "your prediction was off"}:</label><textarea id="labWhy" placeholder="e.g. “…”"></textarea><button class="btn primary" id="labCheck">Check my explanation</button></div>`;
      step("explain"); setTimeout(() => step("explain"), 10);
      if (X.slider) $("#labSl").oninput = e => { n = +e.target.value; $("#labN").textContent = n; draw(true); };
      $("#labCheck").onclick = () => checkExplain(misId, $("#labWhy").value, opts);
    };
    if (opts.autoplay) opts.autoplay({ m, X });
  };

  async function checkExplain(misId, text, opts) {
    const X = EXP[misId], btn = $("#labCheck"); if (!text.trim()) return;
    btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>Checking…`;
    const q = XR.QUESTIONS.find(q => q.concept === X.concept);
    let still, src = "local", ms = 0;
    if (E().AI.live) {
      try {
        const [j, t] = await timed(async () => (await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: X.ask, options: [], chosen: "(explanation after experiment)", correct: `${X.truth} ${X.unit}`, reasoning: text, lang: XR.lang, taxonomy: Object.entries(XR.MISCONCEPTIONS).map(([id, m]) => ({ id, label: m.label })) }) })).json());
        ms = t; still = j.misconception_id === misId; src = "gemini";
      } catch {}
    }
    if (src === "local") { const d = E().localDiagnose(q, -1, text); still = d.misconception === misId || !X.keywords.test(text); }
    XR.traceAdd("diagnose_reasoning", `explanation: “${text.slice(0, 60)}”`, still ? `${misId} still present` : `${misId} no longer present`, src, ms);
    let fixedNow = null;
    if (!still) {
      const pseudo = { id: "lab-" + misId, concept: X.concept, diff: 2, answer: 0, mis: {} };
      const r = E().record(S(), pseudo, 0, 3, null, 0); fixedNow = r.fixedNow;
      if (!fixedNow && opts.closeLoop) { const qq = XR.QUESTIONS.filter(x => x.concept === X.concept && !x.diag)[0]; fixedNow = E().record(S(), qq, qq.answer, 3, null, 0).fixedNow; }
      E().store.save(S());
      XR.traceAdd("update_learner_model", `${X.concept}: correct explanation, hint-free`, `${XR.conceptById[X.concept].short} → ${pct(S().mastery[X.concept])}${fixedNow ? " · " + misId + " FIXED" : ""}`);
    }
    const ms2 = S().misState?.[misId];
    $("#labMsg").insertAdjacentHTML("beforeend", `<div class="lab-obs ${still ? "bad" : "ok"}" id="labVerdict"><b>${still ? "Not yet." : fixedNow ? "✅ Misconception fixed." : "Your idea has changed."}</b> ${still ? "Your explanation still shows the old idea. Look at the readings again: what stayed the same?" : fixedNow ? "Two clean pieces of evidence in a row. The tutor has closed it in your learner model." : `That counts as one clean piece of evidence (${ms2?.streak ?? 1}/2). One more correct, hint-free answer on ${esc(XR.conceptById[X.concept].short)} closes it.`} <span class="eng ${src}">${src === "gemini" ? "checked by Gemini" : "checked offline"}</span></div>`);
    btn.textContent = still ? "Try again" : "Done"; btn.disabled = false;
    btn.onclick = still ? () => checkExplain(misId, $("#labWhy").value, opts) : closeModal;
    if (fixedNow) XR.toast && XR.toast(`✅ Misconception fixed: ${XR.MISCONCEPTIONS[misId].label}`);
  }

  // ---------------- teach it another way ----------------
  const LOCAL_WAYS = {
    current: { analogy: "Think of a closed loop of bicycle chain. Pedal it and every link moves at the same speed everywhere. No link is 'used up' at the back wheel. Charge in a circuit is the chain; the bulb is where the chain does work.", india: "A Chennai suburban train loop: the same number of passengers pass every station per minute in a closed loop. Stations (bulbs) don't eat passengers; they just do something with them.", steps: "1) Draw the loop. 2) Mark charge entering bulb 1 = charge leaving it. 3) Nothing piles up or disappears, so I₁ = I₂ = I₃." },
    parallel: { analogy: "Toll plaza: one open booth means a long queue. Open a second booth and cars get through faster. More booths in parallel means less total 'resistance' to traffic.", india: "A ration shop with one counter vs four counters. Same people, but four counters clear the line four times faster: R_eq = R/4.", steps: "1) Write 1/R = 1/R₁ + 1/R₂. 2) Add the fractions. 3) Flip the answer. 4) Sanity check: is it smaller than the smallest resistor?" },
    resistivity: { analogy: "A long, narrow corridor in a crowded school: the longer it is, the more people you bump into. Make it wider and it's easier.", india: "Long extension cords on a heater get warm: more length, more resistance, more heat lost in the wire.", steps: "1) R = ρL/A. 2) L doubles → R doubles. 3) A doubles → R halves." },
    lenspower: { analogy: "Power says how strongly a lens bends light. A short focal length bends hard (high power). Units must be metres, like a dioptre is 'per metre'.", india: "An optician's prescription of +2.00 means f = 0.5 m. Nobody wears a 0.04 D lens: it would do almost nothing.", steps: "1) Convert f to metres (25 cm → 0.25 m). 2) P = 1/f = 4. 3) Sign: convex +, concave −." },
  };
  XR.reteach = async function (concept, misId, approach, el) {
    el.innerHTML = `<div class="hint"><span class="spinner" style="border-color:var(--accent);border-right-color:transparent"></span> Re-teaching ${esc(XR.conceptById[concept].short)} another way…</div>`;
    let out = null, src = "local", ms = 0;
    if (E().AI.live) {
      try { const [j, t] = await timed(async () => (await fetch("/api/reteach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ concept: XR.conceptById[concept].name, desc: XR.conceptById[concept].desc, misconception: misId ? XR.MISCONCEPTIONS[misId].label : null, approach, lang: XR.lang }) })).json()); if (j.explanation) { out = j; src = "gemini"; ms = t; } } catch {}
    }
    if (!out) { const w = LOCAL_WAYS[concept]; out = { title: { analogy: "An analogy", india: "A real-life example", steps: "Step by step" }[approach], explanation: w ? w[approach] : XR.conceptById[concept].desc, check: "" }; }
    XR.traceAdd("reteach_concept", `${concept} · ${approach}`, out.title || approach, src, ms);
    el.innerHTML = `<div class="reteach"><b>${esc(out.title || "")}</b><p>${esc(out.explanation)}</p>${out.check ? `<p class="hint"><b>Quick check:</b> ${esc(out.check)}</p>` : ""}<span class="eng ${src}">${src === "gemini" ? "Gemini" : "built-in"}</span></div>`;
  };

  // action row under a wrong-answer X-Ray
  XR.actionsHTML = (q, diag) => `<div class="xact">${diag?.misconception && EXP[diag.misconception] ? `<button class="btn accent" data-lab="${diag.misconception}">🧪 Test your idea →</button>` : ""}
    <span class="hint">Teach it another way:</span>${["analogy", "india", "steps"].map(a => `<button class="btn sm ghost" data-way="${a}" data-c="${q.concept}" data-m="${diag?.misconception || ""}">${{ analogy: "Analogy", india: "Real-life (India)", steps: "Step by step" }[a]}</button>`).join("")}<div class="wayout"></div></div>`;
  document.addEventListener("click", e => {
    const l = e.target.closest("[data-lab]"); if (l) XR.openLab(l.dataset.lab);
    const w = e.target.closest("[data-way]"); if (w) XR.reteach(w.dataset.c, w.dataset.m || null, w.dataset.way, w.parentElement.querySelector(".wayout"));
  });

  // ---------------- same answer, different reason ----------------
  const PAIR = {
    qid: "d3", chosen: 0,
    a: { name: "Student A", text: "In parallel we just add them, 6 + 6 = 12 ohm." },
    b: { name: "Student B", text: "1/R = 1/6 + 1/6 = 2/12, so R = 12 ohm." },
  };
  const PLAN = {
    M_PAR_ADD: ["Open the parallel-resistor experiment (predict, then watch R_eq fall)", "3 targeted parallel questions, easy → medium", "Review parallel resistors tomorrow"],
    null: ["No concept gap: the method (1/R = 1/R₁ + 1/R₂) is right", "Fraction-addition drill: 1/6 + 1/6 = 2/6, then flip", "Mastery of Parallel stays the same"],
  };
  XR.runPair = async function () {
    const q = XR.questionById[PAIR.qid], btn = $("#pairBtn");
    btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>Analysing both…`;
    const one = async s => {
      let d = null, src = "local", ms = 0;
      if (E().AI.live) try { const [j, t] = await timed(async () => (await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.text, options: q.options, chosen: q.options[PAIR.chosen], correct: q.options[q.answer], reasoning: s.text, lang: XR.lang, taxonomy: Object.entries(XR.MISCONCEPTIONS).map(([id, m]) => ({ id, label: m.label })) }) })).json()); if (j.label) { d = { misconception: XR.MISCONCEPTIONS[j.misconception_id] ? j.misconception_id : null, label: XR.MISCONCEPTIONS[j.misconception_id]?.label || j.label, evidence: j.evidence, confidence: j.confidence ?? .8 }; src = "gemini"; ms = t; } } catch {}
      if (!d) { const l = E().localDiagnose(q, -1, s.text); d = { misconception: l.misconception, label: l.misconception ? l.label : "Arithmetic slip, not a concept gap", evidence: l.misconception ? l.evidence : "“2/12”: 1/6 + 1/6 was added as 2/12 instead of 2/6", confidence: l.misconception ? l.confidence : 0.7 }; }
      XR.traceAdd("diagnose_reasoning", `${s.name}: “${s.text}”`, d.label, src, ms);
      return { ...d, src };
    };
    const [A, B] = await Promise.all([one(PAIR.a), one(PAIR.b)]);
    const card = (s, d) => `<div class="pcol"><div class="pname">${s.name} chose <b>12 Ω</b></div><p class="ptext">“${esc(s.text)}”</p>
      <div class="pdiag ${d.misconception ? "bad" : "ok"}"><b>${esc(d.label)}</b><div class="evidence">${esc(d.evidence)}</div><div class="hint">Confidence ${pct(d.confidence)} · <span class="eng ${d.src}">${d.src === "gemini" ? "Gemini" : "offline engine"}</span></div></div>
      <ol class="pplan">${(PLAN[d.misconception] || PLAN.null).map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>`;
    $("#pairOut").innerHTML = card(PAIR.a, A) + card(PAIR.b, B);
    btn.textContent = "Run again"; btn.disabled = false;
  };

  // ---------------- teacher: agent drafts, teacher approves ----------------
  XR.teacherDraftHTML = (mis, names, total) => {
    const hist = LS.get("cx-approvals", []);
    const pending = !hist.some(h => h.mis === mis && h.day === S().day);
    return `<div class="insight"><div class="ic">AI</div><div style="flex:1"><h3>Agent draft · needs your approval</h3>
      <p style="margin:6px 0">${names.length} of ${total} students show <b>“${esc(XR.MISCONCEPTIONS[mis].label)}”</b>. The agent drafted:</p>
      <div class="draft"><b>10-minute lesson fix</b><p id="draftText">${esc(XR.MISCONCEPTIONS[mis].fix)} Then run the ${EXP[mis] ? "“" + esc(EXP[mis].title) + "” experiment" : "worked example"} with the class.</p>
      <b>Assignment</b><p>5 targeted questions on ${esc(XR.conceptById[XR.MISCONCEPTIONS[mis].concept].name)} for: ${esc(names.slice(0, 6).join(", "))}${names.length > 6 ? ` +${names.length - 6}` : ""}</p></div>
      ${pending ? `<div class="appr"><button class="btn accent" data-appr="approve">✓ Approve</button><button class="btn ghost" data-appr="edit">✎ Edit</button><button class="btn ghost" data-appr="reject">✕ Reject</button><span class="hint">Nothing is sent to students until you approve.</span></div>` : ""}
      <div class="hist"><b>Approval log</b>${hist.length ? hist.slice(-4).reverse().map(h => `<div>${h.status === "approved" ? "✓" : h.status === "rejected" ? "✕" : "✎"} ${esc(h.status)} · ${esc(XR.MISCONCEPTIONS[h.mis]?.label || h.mis)} · ${h.n} students · ${new Date(h.t).toLocaleTimeString()}</div>`).join("") : `<div class="hint">No decisions yet.</div>`}</div></div></div>`;
  };
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-appr]"); if (!a) return;
    const box = a.closest("#insight"), mis = box.dataset.mis, n = +box.dataset.n;
    if (a.dataset.appr === "edit") { const p = $("#draftText"); p.contentEditable = "true"; p.focus(); p.classList.add("editing"); a.textContent = "✓ Save & approve"; a.dataset.appr = "approve"; return; }
    const hist = LS.get("cx-approvals", []); hist.push({ mis, n, status: a.dataset.appr === "approve" ? "approved" : "rejected", day: S().day, t: Date.now(), text: $("#draftText")?.textContent });
    LS.set("cx-approvals", hist);
    XR.traceAdd("assign_remedial", `${mis} → ${n} students`, a.dataset.appr === "approve" ? "approved by teacher, assigned" : "rejected by teacher, nothing sent");
    XR.toast && XR.toast(a.dataset.appr === "approve" ? `Assigned to ${n} students` : "Draft rejected. Nothing was sent.");
    XR.render("teacher");
  });

  // ---------------- real feedback collection (no invented data) ----------------
  document.addEventListener("DOMContentLoaded", () => {});
  setTimeout(() => {
    const n = () => { const el = $("#fbN"); if (el) el.textContent = LS.get("cx-feedback", []).length; }; n();
    const send = $("#fbSend"); if (!send) return;
    send.onclick = () => { const e = { role: $("#fbRole").value, q1: $("#fbQ1").value.trim(), q2: $("#fbQ2").value.trim(), q3: $("#fbQ3").value.trim(), t: new Date().toISOString() }; if (!e.q1 && !e.q2 && !e.q3) return; const all = LS.get("cx-feedback", []); all.push(e); LS.set("cx-feedback", all); ["#fbQ1", "#fbQ2", "#fbQ3"].forEach(s => $(s).value = ""); n(); XR.toast && XR.toast("Thanks! Feedback saved."); };
    $("#fbExport").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(LS.get("cx-feedback", []), null, 2)], { type: "application/json" })); a.download = "concept-xray-feedback.json"; a.click(); };
  }, 0);

  // ---------------- Explain it back (teach-back / Feynman) ----------------
  XR.openTeachBack = function (concept) {
    const c = XR.conceptById[concept]; closeModal();
    const m = document.createElement("div"); m.id = "labModal";
    m.innerHTML = `<div class="lab-box"><div class="lab-head"><div><span class="eyebrow" style="margin:0">Explain it back</span><h3>Teach ${esc(c.name)} to a confused classmate</h3></div><button class="lab-x" aria-label="Close">✕</button></div>
      <p class="hint">If you can explain it simply, you understand it. Write 2–3 lines as if teaching a friend who missed the class. The tutor checks your explanation for wrong ideas and missing key points.</p>
      <textarea id="tbText" style="min-height:110px" placeholder="In my own words…"></textarea>
      <div class="lab-row"><button class="btn primary" id="tbCheck">Check my explanation</button><span class="hint" id="tbLen">0 words</span></div><div id="tbOut"></div></div>`;
    document.body.appendChild(m); m.querySelector(".lab-x").onclick = closeModal;
    $("#tbText").oninput = e => { $("#tbLen").textContent = e.target.value.trim().split(/\s+/).filter(Boolean).length + " words"; };
    $("#tbCheck").onclick = async () => {
      const text = $("#tbText").value.trim(); if (text.split(/\s+/).length < 6) { $("#tbOut").innerHTML = `<div class="lab-obs bad">Write at least one full sentence.</div>`; return; }
      const b = $("#tbCheck"); b.disabled = true; b.innerHTML = `<span class="spinner"></span>Checking…`;
      const q = XR.QUESTIONS.find(x => x.concept === concept);
      let mis = null, src = "local", ms = 0, note = "";
      if (E().AI.live) try { const [j, t] = await timed(async () => (await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "Explain the concept: " + c.name + " — " + c.desc, options: [], chosen: "(teach-back)", correct: c.desc, reasoning: text, lang: XR.lang, taxonomy: Object.entries(XR.MISCONCEPTIONS).map(([id, mm]) => ({ id, label: mm.label })) }) })).json()); mis = XR.MISCONCEPTIONS[j.misconception_id] ? j.misconception_id : null; note = j.fix_hint || ""; src = "gemini"; ms = t; } catch {}
      if (src === "local") mis = E().localDiagnose(q, -1, text).misconception;
      const keys = (c.desc.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w, i, a) => a.indexOf(w) === i);
      const hit = keys.filter(k => text.toLowerCase().includes(k));
      const pass = !mis && hit.length >= 2;
      XR.traceAdd("grade_teach_back", `${concept}: “${text.slice(0, 50)}…”`, mis ? `misconception ${mis}` : `${hit.length} key ideas used${pass ? " · counts as evidence" : ""}`, src, ms);
      let fixedNow = null;
      if (pass) { fixedNow = E().record(S(), { id: "tb-" + concept, concept, diff: 2, answer: 0, mis: {} }, 0, 3, null, 0).fixedNow; E().store.save(S()); }
      $("#tbOut").innerHTML = `<div class="lab-obs ${pass ? "ok" : "bad"}"><b>${mis ? "A wrong idea slipped in: " + esc(XR.MISCONCEPTIONS[mis].label) : pass ? (fixedNow ? "✅ Clear explanation, and a misconception is now fixed." : "Clear explanation. Counted as evidence of understanding.") : "Good start, but key ideas are missing."}</b>
        <div style="margin-top:6px">Key ideas you used: ${hit.length ? hit.map(k => `<span class="chip">${esc(k)}</span>`).join(" ") : "none yet"}${!pass && !mis ? `<br><span class="hint">Try including: ${keys.filter(k => !hit.includes(k)).slice(0, 4).map(esc).join(", ")}</span>` : ""}</div>
        ${note && mis ? `<div class="hint" style="margin-top:6px">${esc(note)}</div>` : ""} <span class="eng ${src}">${src === "gemini" ? "checked by Gemini" : "checked offline"}</span></div>`;
      b.disabled = false; b.textContent = "Check again";
      if (pass) XR.toast && XR.toast(`${c.short}: mastery ${pct(S().mastery[concept])}`);
    };
  };
  document.addEventListener("click", e => { const t = e.target.closest("[data-teachback]"); if (t) XR.openTeachBack(t.dataset.teachback); });

  // ---------------- class misconception trend (sample data) ----------------
  XR.trendHTML = (top, total) => {
    const hist = LS.get("cx-approvals", []);
    const days = 7, W = 520, H = 170, pad = 30, colors = ["#d9534f", "#c9731b", "#0f6e6e"];
    const series = top.slice(0, 3).map(([id, names], k) => {
      let seed = id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const now = names.length, pts = [];
      for (let d = 0; d < days; d++) pts.push(Math.max(1, Math.round(now * (0.75 + 0.35 * rnd() + (d / days) * 0.15))));
      pts[days - 1] = now;
      const approved = hist.some(h => h.mis === id && h.status === "approved");
      if (approved) pts.push(Math.max(1, Math.round(now * 0.55)));
      return { id, pts, approved, color: colors[k] };
    });
    const maxY = Math.max(...series.flatMap(s => s.pts), 1), n = days + 1;
    const x = i => pad + (i * (W - pad * 2)) / (n - 1), y = v => H - pad + 6 - (v / maxY) * (H - pad * 1.6);
    return `<h3>Misconception trend</h3><p class="sub">Students showing each of the top 3 misconceptions, last 7 days. <b>Sample data</b>. Approving a remedial draft adds a projected next-day point (dashed).</p>
      <svg viewBox="0 0 ${W} ${H}" class="trend">${[0, .5, 1].map(f => `<line x1="${pad}" x2="${W - pad}" y1="${y(maxY * f)}" y2="${y(maxY * f)}" stroke="#eee"/><text x="4" y="${y(maxY * f) + 4}" font-size="10" fill="#8a90a0">${Math.round(maxY * f)}</text>`).join("")}
      ${Array.from({ length: n }, (_, i) => `<text x="${x(i)}" y="${H - 4}" font-size="10" text-anchor="middle" fill="#8a90a0">${i < days ? (i === days - 1 ? "today" : "d-" + (days - 1 - i)) : "next"}</text>`).join("")}
      ${series.map(s => `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${s.pts.slice(0, days).map((v, i) => x(i) + "," + y(v)).join(" ")}"/>${s.approved ? `<line x1="${x(days - 1)}" y1="${y(s.pts[days - 1])}" x2="${x(days)}" y2="${y(s.pts[days])}" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="${x(days)}" cy="${y(s.pts[days])}" r="4" fill="${s.color}"/>` : ""}<circle cx="${x(days - 1)}" cy="${y(s.pts[days - 1])}" r="4" fill="${s.color}"/>`).join("")}</svg>
      <div class="legend">${series.map(s => `<span><i class="sw" style="background:${s.color}"></i>${esc(XR.MISCONCEPTIONS[s.id].label)}${s.approved ? " · remedial approved" : ""}</span>`).join("")}</div>`;
  };

  // ---------------- WhatsApp report ----------------
  XR.whatsappText = () => {
    const st = S(), base = st.baseline || st.mastery, ids = XR.CONCEPTS.map(c => c.id);
    const avg = o => Math.round(ids.reduce((a, i) => a + o[i], 0) / ids.length * 100);
    const ms = Object.entries(st.misState || {});
    const fixed = ms.filter(([, m]) => m.status === "fixed").map(([id]) => XR.MISCONCEPTIONS[id].label);
    const due = XR.CONCEPTS.filter(c => st.cards[c.id].due != null).sort((a, b) => st.cards[a.id].due - st.cards[b.id].due).slice(0, 3).map(c => `${c.short} (day ${st.cards[c.id].due})`);
    const L = { en: ["Concept X-Ray update", "Physics mastery", "Misconceptions fixed", "Still working on", "Next reviews"], hinglish: ["Concept X-Ray update", "Physics mastery", "Galat concepts jo theek hue", "Abhi kaam chal raha hai", "Agle revision"], hi: ["कॉन्सेप्ट एक्स-रे अपडेट", "भौतिकी में महारत", "ठीक हुई गलत धारणाएँ", "अभी सुधार जारी", "अगला रिवीजन"] }[XR.lang] || [];
    return `${L[0]} 📘\n${L[1]}: ${avg(base)}% → ${avg(st.mastery)}%\n✅ ${L[2]}: ${fixed.join("; ") || "—"}\n🔴 ${L[3]}: ${ms.filter(([, m]) => m.status === "active").length}\n📅 ${L[4]}: ${due.join(", ") || "—"}`;
  };
})();
