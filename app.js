// Concept X-Ray — UI controller
(function () {
  const E = XR.engine;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = p => Math.round(p * 100) + "%";
  const col = p => p < 0.4 ? "var(--weak)" : p < 0.7 ? "var(--mid)" : "var(--good)";
  const DIFF = { 1: "Easy", 2: "Medium", 3: "Hard" };

  let S = E.store.load() || E.freshState();
  const save = () => E.store.save(S);
  const CLASS = E.syntheticClass();
  const ui = { view: "home", sel: null, conf: 2, image: null, answered: false, current: null, recent: [], trace: [], selectedNode: "parallel" };
  XR.ui = ui; XR.getState = () => S;

  XR.toast = msg => toast(msg);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2400); }

  // ---------------- navigation ----------------
  function go(view) {
    ui.view = view;
    $$(".tabs button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    render(view); window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  XR.go = go;
  $$(".tabs button").forEach(b => b.onclick = () => go(b.dataset.view));
  document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });

  function render(v) {
    ({ home: renderHome, diagnostic: renderDiagnostic, map: renderMap, practice: renderPractice, review: renderReview, progress: renderProgress, lab: renderLab, teacher: renderTeacher }[v] || (() => {}))();
  }

  // ---------------- AI pill ----------------
  E.checkAI().then(live => {
    const p = $("#aiPill");
    p.className = "pill " + (live ? "live" : "local");
    p.textContent = live ? "● Gemini live" : E.AI.demo ? "● Demo mode (offline)" : "● Offline engine";
    p.title = live ? "Reasoning is analysed by Gemini." : "No API key found: using the built-in rule engine (same taxonomy). Add GEMINI_API_KEY to go live.";
  });

  // ---------------- HOME ----------------
  function renderHome() {
    const pb = $("#pairBtn"); if (pb) pb.onclick = XR.runPair;
    const answered = S.attempts.length;
    const mastered = XR.CONCEPTS.filter(c => S.mastery[c.id] >= 0.7).length;
    const misCount = Object.keys(S.misconceptions).filter(k => k !== "null").length;
    $("#homeStats").innerHTML = [
      [answered, "answers analysed for this learner"],
      [`${mastered}/15`, "concepts mastered (≥70%)"],
      [misCount, "distinct misconceptions found"],
      [XR.QUESTIONS.length + "+", "calibrated questions, plus AI-generated ones"],
    ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join("");
  }

  // ---------------- QUESTION CARD (shared by diagnostic + practice) ----------------
  function questionCard(q, { mode, index, total, reason }) {
    const progress = mode === "diag" ? `<div class="progress"><i style="width:${(index / total) * 100}%"></i></div>` : "";
    return `
      ${progress}
      <div class="qhead">
        <div class="chips">
          <span class="chip">${mode === "diag" ? `Question ${index + 1} of ${total}` : "Targeted practice"}</span>
          <span class="chip">${esc(XR.conceptById[q.concept].name)}</span>
          <span class="chip d${q.diff}">${DIFF[q.diff]}</span>
          ${q.generated ? `<span class="chip ai">AI-generated</span>` : ""}
        </div>
        <span class="hint">${XR.conceptById[q.concept].chapter}</span>
      </div>
      ${reason ? `<div class="why" id="whyBox"><b>Why this question</b>${esc(reason)}</div>` : ""}
      <p class="qtext">${esc(q.text)}</p>
      <div class="opts" id="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${"ABCD"[i]}</span>${esc(o)}</button>`).join("")}</div>
      <div class="field" id="reasonField">
        <label for="reason">How did you get it? <small>— one line is enough. This is what the X-Ray reads. English or Hinglish is fine.</small> <button type="button" class="btn sm ghost" id="micBtn" title="Speak your reasoning (en-IN)">🎙 Speak</button></label>
        <textarea id="reason" placeholder="e.g. “I used V = IR so I = 6/3…”"></textarea>
        <div class="upload"><label>📷 Add photo of your working<input type="file" accept="image/*" id="photo" hidden></label><span id="photoName">Optional · read by Gemini Vision</span></div>
      </div>
      <div class="field" id="confField"><label>How sure are you?</label>
        <div class="conf" id="conf"><button data-c="1">Guessing</button><button data-c="2" class="sel">Fairly sure</button><button data-c="3">Certain</button></div></div>
      <div class="hints" id="hintBox"></div>
      <div class="qfoot"><span class="hint" id="qhint">Pick an option to continue</span><button class="btn ghost" id="hintBtn">💡 Hint 1 of 3</button><button class="btn primary" id="submitBtn" disabled>Check &amp; X-Ray my reasoning</button></div>
      <div id="result"></div>`;
  }

  function hintsFor(q) {
    const c = XR.conceptById[q.concept];
    const trap = Object.values(q.mis || {})[0];
    return [
      ["Nudge", `This tests <strong>${esc(c.name)}</strong>. ${esc(c.desc.split(". ")[0])}.`],
      ["Watch out", trap ? `A common trap here: ${esc(XR.MISCONCEPTIONS[trap].label.toLowerCase())}. ${esc(XR.MISCONCEPTIONS[trap].fix.split(". ")[0])}.` : `Write the formula first, then substitute values with units.`],
      ["Method", esc(q.explain)],
    ];
  }
  function wireQuestion(q, onSubmit) {
    ui.sel = null; ui.conf = 2; ui.image = null; ui.answered = false; ui.current = q; ui.hints = 0;
    const H = hintsFor(q);
    $("#hintBtn").onclick = () => {
      if (ui.answered || ui.hints >= 3) return;
      const [t, body] = H[ui.hints]; ui.hints++;
      $("#hintBox").insertAdjacentHTML("beforeend", `<div class="hintcard"><b>Hint ${ui.hints} · ${t}</b>${body}</div>`);
      $("#hintBtn").textContent = ui.hints < 3 ? `💡 Hint ${ui.hints + 1} of 3` : "No more hints";
      $("#hintBtn").disabled = ui.hints >= 3;
      $("#qhint").textContent = ui.hints === 3 ? "Method shown: a correct answer now counts as weak evidence" : `Hints used: ${ui.hints}, which slightly lowers the mastery credit`;
    };
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) $("#micBtn").style.display = "none";
    else $("#micBtn").onclick = () => {
      const r = new SR(); r.lang = "en-IN"; r.interimResults = false;
      $("#micBtn").textContent = "● Listening…";
      r.onresult = e => { $("#reason").value = ($("#reason").value + " " + e.results[0][0].transcript).trim(); };
      r.onend = () => { $("#micBtn").textContent = "🎙 Speak"; };
      r.start();
    };
    $$("#opts .opt").forEach(b => b.onclick = () => {
      if (ui.answered) return;
      ui.sel = +b.dataset.i; $$("#opts .opt").forEach(x => x.classList.toggle("sel", x === b));
      $("#submitBtn").disabled = false; $("#qhint").textContent = "Add your reasoning for a sharper diagnosis";
    });
    $$("#conf button").forEach(b => b.onclick = () => { ui.conf = +b.dataset.c; $$("#conf button").forEach(x => x.classList.toggle("sel", x === b)); });
    $("#photo").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { ui.image = { data: r.result.split(",")[1], mime: f.type }; $("#photoName").innerHTML = `<img src="${r.result}" alt="working"> ${esc(f.name)}`; };
      r.readAsDataURL(f);
    };
    $("#submitBtn").onclick = async () => {
      if (ui.sel == null || ui.answered) return;
      ui.answered = true;
      const btn = $("#submitBtn"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>Analysing reasoning…`;
      const reasoning = $("#reason").value;
      const correct = ui.sel === q.answer;
      const t0 = performance.now();
      const diag = correct ? null : await E.diagnose(q, ui.sel, reasoning, ui.image);
      XR.traceAdd("diagnose_reasoning", `“${(reasoning || "(none)").slice(0, 60)}” · chose ${"ABCD"[ui.sel]}`, correct ? "correct answer, no diagnosis needed" : `${diag.misconception || "slip"} · ${Math.round(diag.confidence * 100)}%`, diag?.source === "gemini" ? "gemini" : "local", correct ? 0 : Math.round(performance.now() - t0));
      const res = E.record(S, q, ui.sel, ui.conf, diag, ui.hints); save();
      XR.traceAdd("update_learner_model", `${q.concept}: ${correct ? "correct" : "wrong"}, conf ${ui.conf}, hints ${ui.hints}`, `BKT ${pct(res.before)} → ${pct(res.after)}${res.fixedNow ? " · " + res.fixedNow + " FIXED" : ""}`);
      XR.traceAdd("schedule_review", `${q.concept} quality`, `next review day ${S.cards[q.concept].due} (SM-2)`);
      if (res.fixedNow) toast(`✅ Misconception fixed: ${XR.MISCONCEPTIONS[res.fixedNow].label}`);
      $("#hintBtn") && $("#hintBtn").remove();
      $$("#opts .opt").forEach((b, i) => { if (i === q.answer) b.classList.add("right"); else if (i === ui.sel) b.classList.add("wrong"); });
      $("#result").innerHTML = xrayHTML(q, res, diag, reasoning);
      btn.remove(); $("#qhint").textContent = "";
      onSubmit(res, diag);
    };
  }
  XR.wireQuestion = wireQuestion;

  function xrayHTML(q, res, diag, reasoning) {
    const c = XR.conceptById[q.concept];
    const delta = `<div class="delta">${esc(c.short)} mastery <span>${pct(res.before)}</span><span class="arrow">→</span><span style="color:${col(res.after)}">${pct(res.after)}</span></div>`;
    if (res.correct) {
      return `<div class="xray ok" id="xray"><div class="xh"><b>✓ Correct</b><span>Learner model updated</span></div><div class="xb">
        <div class="xrow"><span>Why</span><div>${esc(q.explain)}</div></div>
        <div class="xrow"><span>Model</span>${delta}</div>
        ${res.fixedNow ? `<div class="xrow"><span>Closed loop</span><div><b style="color:var(--good)">✅ Fixed: ${esc(XR.MISCONCEPTIONS[res.fixedNow].label)}</b><br><span class="hint">Two correct, hint-free answers in a row on this concept since it was flagged.</span></div></div>` : ""}</div></div>`;
    }
    const rc = E.rootCause(S, q.concept);
    return `<div class="xray" id="xray"><div class="xh"><b>Reasoning X-Ray</b><span class="chip ${diag.source === "gemini" ? "ai" : ""}" style="background:#ffffff22;color:#fff">${diag.source === "gemini" ? "Gemini" : "Offline rule engine"}</span></div><div class="xb">
      <div class="xrow"><span>Diagnosis</span><div><b>${esc(diag.label)}</b>${diag.misconception ? ` <span class="chip">${diag.misconception.replace(/_/g, "-")}</span>` : ""}</div></div>
      <div class="xrow"><span>Evidence</span><div>${diag.transcribed ? `<div class="hint">Read from photo: “${esc(diag.transcribed)}”</div>` : ""}<span class="evidence">${esc(diag.evidence)}</span></div></div>
      <div class="xrow"><span>Confidence</span><div>${pct(diag.confidence)}<span class="meter"><i style="width:${pct(diag.confidence)}"></i></span>${diag.fromReasoning ? "" : ` <span class="hint">· answer-only (no reasoning given)</span>`}</div></div>
      <div class="xrow"><span>What's off</span><div>${esc(diag.explanation)}</div></div>
      <div class="xrow"><span>The fix</span><div>${esc(diag.fix)}</div></div>
      <div class="xrow"><span>Model</span>${delta}</div>
      ${rc ? `<div class="xrow"><span>Root cause</span><div>Prerequisite <b>${esc(XR.conceptById[rc].name)}</b> is at ${pct(S.mastery[rc])}. Practice will rebuild it first.</div></div>` : ""}
    </div>${XR.actionsHTML(q, diag)}</div>`;
  }

  function masteryList(highlight) {
    return `<div class="mlist">${XR.CONCEPTS.map(c => `<div class="mrow ${c.id === highlight ? "flash" : ""}"><span>${esc(c.short)}</span><div class="bar"><i style="width:${pct(S.mastery[c.id])};background:${col(S.mastery[c.id])}"></i></div><b>${pct(S.mastery[c.id])}</b></div>`).join("")}</div>`;
  }

  // ---------------- DIAGNOSTIC ----------------
  const DIAG = XR.QUESTIONS.filter(q => q.diag);
  function renderDiagnostic() {
    const i = S.diagIndex;
    if (i >= DIAG.length) {
      S.diagnosticDone = true; if (!S.baseline) S.baseline = { ...S.mastery }; save();
      const weak = XR.CONCEPTS.filter(c => S.mastery[c.id] < 0.4).map(c => c.short);
      const mis = Object.keys(S.misconceptions).filter(k => k !== "null");
      $("#diagPanel").innerHTML = `<div class="panel-head"><h2>Diagnostic complete</h2><p>The learner model now has a starting point for all 15 concepts.</p></div>
        <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin:0 0 18px">
          <div class="stat"><b>${S.attempts.filter(a => DIAG.some(d => d.id === a.qid) && a.correct).length}/10</b><span>correct</span></div>
          <div class="stat"><b>${weak.length}</b><span>weak concepts: ${esc(weak.join(", ") || "none")}</span></div>
          <div class="stat"><b>${mis.length}</b><span>misconceptions detected</span></div></div>
        ${mis.length ? `<h3>Misconceptions in your reasoning</h3><ul>${mis.map(m => `<li><b>${esc(XR.MISCONCEPTIONS[m].label)}</b> — ${esc(XR.MISCONCEPTIONS[m].fix)}</li>`).join("")}</ul>` : ""}
        <div class="hero-cta"><button class="btn primary" data-go="map">See my concept map</button><button class="btn ghost" data-go="practice">Start targeted practice</button><button class="btn ghost" id="redoDiag">Retake diagnostic</button></div>`;
      $("#redoDiag").onclick = () => { S = E.freshState(); save(); renderDiagnostic(); };
      $("#diagSide").innerHTML = `<h3>Learner model</h3><p class="sub">Probability of mastery, per concept (BKT).</p>${masteryList()}`;
      return;
    }
    const q = DIAG[i];
    $("#diagPanel").innerHTML = questionCard(q, { mode: "diag", index: i, total: DIAG.length });
    sideDiag();
    wireQuestion(q, () => {
      S.diagIndex++; save(); sideDiag(q.concept);
      const n = document.createElement("div"); n.className = "qfoot";
      n.innerHTML = `<span class="hint">Mastery updated for ${esc(XR.conceptById[q.concept].short)}</span><button class="btn primary" id="nextQ">${S.diagIndex >= DIAG.length ? "See results" : "Next question →"}</button>`;
      $("#diagPanel").appendChild(n); $("#nextQ").onclick = renderDiagnostic;
    });
  }
  function sideDiag(hl) {
    $("#diagSide").innerHTML = `<h3>Live learner model</h3><p class="sub">Every concept starts at 30%. Each answer moves its probability using Bayesian Knowledge Tracing (BKT), which accounts for lucky guesses and careless slips.</p>${masteryList(hl)}
      <p class="hint" style="margin-top:14px">Correct answers on <b>Hard</b> questions count more, because they are harder to guess.</p>`;
  }

  // ---------------- CONCEPT MAP ----------------
  function renderMap() {
    const svg = $("#graph");
    const roots = new Set();
    XR.CONCEPTS.forEach(c => { if (S.mastery[c.id] < 0.5) { const r = E.rootCause(S, c.id); if (r) roots.add(r); } });
    const edges = XR.EDGES.map(([a, b]) => {
      const A = XR.conceptById[a], B = XR.conceptById[b];
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, k = 40;
      return `<line x1="${A.x + ux * k}" y1="${A.y + uy * k}" x2="${B.x - ux * (k + 4)}" y2="${B.y - uy * (k + 4)}" stroke="#b9b0a0" stroke-width="2" marker-end="url(#arr)"/>`;
    }).join("");
    const nodes = XR.CONCEPTS.map(c => {
      const p = S.mastery[c.id], r = 30;
      const arc = 2 * Math.PI * (r + 6);
      return `<g class="node" data-id="${c.id}" transform="translate(${c.x},${c.y})">
        ${roots.has(c.id) ? `<circle r="${r + 12}" fill="none" stroke="var(--root)" stroke-width="2.5" stroke-dasharray="5 4"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite"/></circle>` : ""}
        <circle r="${r + 6}" fill="none" stroke="#ece6d9" stroke-width="5"/>
        <circle r="${r + 6}" fill="none" stroke="${col(p)}" stroke-width="5" stroke-dasharray="${arc * p} ${arc}" transform="rotate(-90)" stroke-linecap="round"/>
        <circle class="body" r="${r}" fill="${col(p)}" fill-opacity=".14" stroke="${col(p)}" stroke-width="${ui.selectedNode === c.id ? 4 : 2}"/>
        <text text-anchor="middle" y="5" font-size="14" font-weight="700" fill="var(--ink)" font-family="Inter">${pct(p)}</text>
        <text text-anchor="middle" y="${r + 24}" font-size="12.5" font-weight="600" fill="var(--ink2)" font-family="Inter">${esc(c.short)}</text></g>`;
    }).join("");
    svg.innerHTML = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b9b0a0"/></marker></defs>
      <text class="chapter-label" x="20" y="24">Chapter 12 · Electricity</text><text class="chapter-label" x="660" y="24">Chapter 10 · Light</text>
      <line x1="640" y1="10" x2="640" y2="440" stroke="#e4ddcf" stroke-dasharray="4 6"/>${edges}${nodes}`;
    $$("#graph .node").forEach(n => n.onclick = () => { ui.selectedNode = n.dataset.id; renderMap(); });
    nodeDetail(ui.selectedNode, roots);
  }
  function nodeDetail(id, roots) {
    const c = XR.conceptById[id], p = S.mastery[id], h = [0.3, ...S.history[id]];
    const pts = h.map((v, i) => `${(i / Math.max(1, h.length - 1)) * 280 + 10},${55 - v * 50}`).join(" ");
    const pre = XR.prereqsOf(id), post = XR.EDGES.filter(e => e[0] === id).map(e => e[1]);
    const mis = Object.entries(XR.MISCONCEPTIONS).filter(([, m]) => m.concept === id);
    const card = S.cards[id];
    $("#nodeDetail").innerHTML = `<p class="eyebrow" style="margin:0 0 4px">${c.chapter}</p><h3>${esc(c.name)}</h3>
      <p style="font-size:14px;color:var(--ink2)">${esc(c.desc)}</p>
      <div class="mrow"><span>Mastery</span><div class="bar"><i style="width:${pct(p)};background:${col(p)}"></i></div><b>${pct(p)}</b></div>
      <p class="sub" style="margin:14px 0 2px">Mastery over ${h.length - 1} answer${h.length === 2 ? "" : "s"}</p>
      <svg class="spark" viewBox="0 0 300 60"><line x1="10" x2="290" y1="${55 - 0.7 * 50}" y2="${55 - 0.7 * 50}" stroke="var(--good)" stroke-dasharray="3 4" opacity=".6"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5"/></svg>
      ${roots.has(id) ? `<div class="why" style="background:#f2e9f7;color:var(--root)"><b>Root-cause gap</b>A concept that depends on this one is weak, and this prerequisite is weaker. Fix this first.</div>` : ""}
      <p class="sub" style="margin:10px 0 4px">Needs first</p><div class="chips">${pre.map(x => `<span class="chip">${esc(XR.conceptById[x].short)} · ${pct(S.mastery[x])}</span>`).join("") || `<span class="hint">Foundation concept</span>`}</div>
      <p class="sub" style="margin:10px 0 4px">Unlocks</p><div class="chips">${post.map(x => `<span class="chip">${esc(XR.conceptById[x].short)}</span>`).join("") || `<span class="hint">—</span>`}</div>
      <p class="sub" style="margin:12px 0 4px">Known misconceptions tracked</p>${mis.map(([k, m]) => `<div style="font-size:13px;margin-bottom:4px">${S.misconceptions[k] ? "🔴" : "⚪"} ${esc(m.label)}</div>`).join("") || `<span class="hint">None catalogued</span>`}
      <p class="sub" style="margin:12px 0 4px">Next review</p><div style="font-size:14px">${card.due == null ? "Not yet scheduled" : card.due <= S.day ? "<b style='color:var(--weak)'>Due today</b>" : `Day ${card.due} (in ${card.due - S.day} day${card.due - S.day > 1 ? "s" : ""})`}</div>
      <button class="btn primary" style="width:100%;margin-top:16px" id="practiceThis">Practice ${esc(c.short)} now</button>`;
    $("#practiceThis").onclick = () => { ui.forceConcept = id; go("practice"); };
  }

  // ---------------- PRACTICE ----------------
  async function renderPractice() {
    let pick = E.pickNext(S, ui.recent);
    if (ui.forceConcept) {
      const t = ui.forceConcept; ui.forceConcept = null;
      const diff = E.targetDifficulty(S.mastery[t]);
      const q = XR.QUESTIONS.filter(q => q.concept === t && !ui.recent.includes(q.id)).sort((a, b) => Math.abs(a.diff - diff) - Math.abs(b.diff - diff))[0] || XR.QUESTIONS.find(q => q.concept === t);
      pick = { q, target: t, diff, reason: { type: "manual", text: `You chose ${XR.conceptById[t].short} from the concept map.` } };
    }
    const lastMis = [...S.attempts].reverse().find(a => a.mis && XR.MISCONCEPTIONS[a.mis]?.concept === pick.target)?.mis;
    let q = pick.q;
    // every 3rd practice question, ask Gemini for a fresh one aimed at the misconception
    if (E.AI.live && S.attempts.length % 3 === 2) {
      $("#practicePanel").innerHTML = `<div class="empty"><span class="spinner" style="border-color:var(--accent);border-right-color:transparent"></span> Generating a new ${DIFF[pick.diff].toLowerCase()} question on ${esc(XR.conceptById[pick.target].short)}…</div>`;
      q = (await E.generateQuestion(pick.target, pick.diff, lastMis)) || q;
    }
    const weakest = [...XR.CONCEPTS].sort((x, y) => S.mastery[x.id] - S.mastery[y.id])[0];
    XR.traceAdd("find_root_cause", `weakest: ${weakest.short} ${pct(S.mastery[weakest.id])}`, pick.reason.type === "root" ? pick.reason.text : "no weaker prerequisite");
    XR.traceAdd("pick_target_concept", `mastery ${pct(S.mastery[pick.target])}`, `${XR.conceptById[pick.target].short} · ${DIFF[pick.diff]} (aim ≈70% success)${lastMis ? " · targets " + lastMis : ""}`);
    XR.traceAdd(q.generated ? "generate_question + verify_question" : "select_question", `${pick.target} · ${DIFF[pick.diff]}`, q.generated ? "Gemini question, verified by a 2nd independent solve" : `calibrated bank #${q.id}`, q.generated ? "gemini" : "local");
    $("#practicePanel").innerHTML = questionCard(q, { mode: "practice", reason: pick.reason.text });
    sidePractice();
    wireQuestion(q, () => {
      ui.recent = [...ui.recent.slice(-6), q.id];
      sidePractice(q.concept);
      const n = document.createElement("div"); n.className = "qfoot";
      n.innerHTML = `<span class="hint">Next review for ${esc(XR.conceptById[q.concept].short)}: day ${S.cards[q.concept].due}</span><button class="btn primary" id="nextP">Next targeted question →</button>`;
      $("#practicePanel").appendChild(n); $("#nextP").onclick = renderPractice;
    });
  }
  XR.renderTrace = () => { const b = document.querySelector("#traceBox"); if (b) b.innerHTML = XR.traceHTML(); };
  function sidePractice(hl) {
    $("#practiceSide").innerHTML = `<div id="traceBox">${XR.traceHTML()}</div>
      <h3 style="margin-top:16px">Learner model</h3><p class="sub">XP ${S.xp} · streak ${S.streak}</p>${masteryList(hl)}`;
  }

  // ---------------- REVIEW ----------------
  function renderReview() {
    $("#dayNum").textContent = S.day;
    const days = Array.from({ length: 15 }, (_, i) => S.day + i);
    $("#reviewTimeline").innerHTML = days.map(d => {
      const due = XR.CONCEPTS.filter(c => { const k = S.cards[c.id]; return k.due != null && (d === S.day ? k.due <= d : k.due === d); });
      return `<div class="tday ${d === S.day ? "today" : ""}"><h6>${d === S.day ? "Today" : "Day " + d}</h6>${due.map(c => { const p = S.mastery[c.id]; return `<div class="card ${p < .4 ? "weak" : p < .7 ? "mid" : "good"}" title="${esc(c.name)}">${esc(c.short)}</div>`; }).join("")}</div>`;
    }).join("");
    const rows = XR.CONCEPTS.map(c => ({ c, k: S.cards[c.id], p: S.mastery[c.id] })).sort((a, b) => (a.k.due ?? 1e9) - (b.k.due ?? 1e9));
    $("#reviewTable").innerHTML = `<table><thead><tr><th>Concept</th><th>Mastery</th><th>Status</th><th>Interval</th><th>Ease factor</th><th>Successful reviews</th><th title="FSRS-style estimate of remembering it today">Recall today</th><th></th></tr></thead><tbody>${rows.map(({ c, k, p }) => {
      const st = k.due == null ? ["new", "Not started"] : k.due <= S.day ? ["due", "Due now"] : k.due - S.day <= 2 ? ["soon", `In ${k.due - S.day}d`] : ["later", `In ${k.due - S.day}d`];
      return `<tr><td><b>${esc(c.name)}</b></td><td><div class="bar" style="width:110px;display:inline-block;vertical-align:middle"><i style="width:${pct(p)};background:${col(p)}"></i></div> ${pct(p)}</td><td><span class="tag ${st[0]}">${st[1]}</span></td><td>${k.interval ? k.interval + " d" : "—"}</td><td>${k.ef.toFixed(2)}</td><td>${k.reps}</td><td>${(() => { const r = E.recall(k, S.day); return r == null ? "—" : `<b style="color:${col(r)}">${pct(r)}</b>`; })()}</td><td>${k.due != null && k.due <= S.day ? `<button class="btn sm accent" data-rev="${c.id}">Review</button>` : ""}</td></tr>`;
    }).join("")}</tbody></table>`;
    $$("[data-rev]").forEach(b => b.onclick = () => { ui.forceConcept = b.dataset.rev; go("practice"); });
  }
  $("#nextDay").onclick = () => { S.day++; save(); renderReview(); toast(`Day ${S.day}: ${XR.CONCEPTS.filter(c => S.cards[c.id].due != null && S.cards[c.id].due <= S.day).length} concepts due for review`); };

  // ---------------- TEACHER ----------------
  function classRows() { return [...CLASS, { name: "Aarav (live)", mastery: S.mastery, mis: S.misconceptions, me: true, lastActive: 0 }]; }
  function renderTeacher() {
    const rows = classRows();
    const avg = id => rows.reduce((s, r) => s + r.mastery[id], 0) / rows.length;
    const overall = XR.CONCEPTS.reduce((s, c) => s + avg(c.id), 0) / XR.CONCEPTS.length;
    const weakest = [...XR.CONCEPTS].sort((a, b) => avg(a.id) - avg(b.id));
    const atRisk = rows.map(r => ({ r, m: XR.CONCEPTS.reduce((s, c) => s + r.mastery[c.id], 0) / 15 })).sort((a, b) => a.m - b.m).slice(0, 6);
    const misAgg = {}; rows.forEach(r => Object.keys(r.mis || {}).forEach(k => { if (XR.MISCONCEPTIONS[k]) (misAgg[k] = misAgg[k] || []).push(r.name); }));
    const topMis = Object.entries(misAgg).sort((a, b) => b[1].length - a[1].length).slice(0, 5);

    $("#kpis").innerHTML = `
      <div class="kpi"><b>${pct(overall)}</b><span>average class mastery</span></div>
      <div class="kpi"><b>${esc(weakest[0].short)}</b><span>weakest concept · ${pct(avg(weakest[0].id))} average</span></div>
      <div class="kpi"><b>${topMis[0] ? topMis[0][1].length : 0}/${rows.length}</b><span>students share the top misconception</span></div>
      <div class="kpi"><b>${atRisk.filter(a => a.m < 0.4).length}</b><span>students below 40% <em>· need help today</em></span></div>`;

    const cols = `110px repeat(${XR.CONCEPTS.length}, minmax(22px,1fr))`;
    $("#heatmap").innerHTML = `<div class="hm" style="grid-template-columns:${cols}"><div></div>${XR.CONCEPTS.map(c => `<div class="h">${esc(c.short)}</div>`).join("")}
      ${rows.map(r => `<div class="n ${r.me ? "me" : ""}">${esc(r.name)}</div>${XR.CONCEPTS.map(c => `<div class="c" style="background:${col(r.mastery[c.id])};opacity:${0.35 + r.mastery[c.id] * 0.65}" title="${esc(r.name)} · ${esc(c.name)}: ${pct(r.mastery[c.id])}"></div>`).join("")}`).join("")}
      <div class="n avg">Class average</div>${XR.CONCEPTS.map(c => `<div class="c" style="background:${col(avg(c.id))};display:grid;place-items:center;color:#fff;font-size:9px;font-weight:700;height:20px">${Math.round(avg(c.id) * 100)}</div>`).join("")}</div>`;

    $("#topMis").innerHTML = `<h3>Shared misconceptions</h3><p class="sub">Found in students' written reasoning, not only from wrong answers.</p>${topMis.map(([k, names]) => `
      <div class="misrow"><div><b>${esc(XR.MISCONCEPTIONS[k].label)}</b><br><small>${esc(names.slice(0, 4).join(", "))}${names.length > 4 ? ` +${names.length - 4} more` : ""}</small></div><b>${names.length}</b>
      <div class="bar"><i style="width:${(names.length / rows.length) * 100}%;background:var(--amber)"></i></div></div>`).join("")}`;

    $("#atRisk").innerHTML = `<h3>Needs attention today</h3><p class="sub">Lowest overall mastery, with each student's weakest concept.</p>${atRisk.map(({ r, m }) => {
      const w = [...XR.CONCEPTS].sort((a, b) => r.mastery[a.id] - r.mastery[b.id])[0];
      return `<div class="riskrow"><span><b style="${r.me ? "color:var(--accent)" : ""}">${esc(r.name)}</b> · weakest: ${esc(w.short)}</span><span style="color:${col(m)};font-weight:700">${pct(m)}</span></div>`;
    }).join("")}`;

    const t = topMis[0];
    const ins = $("#insight"); if (t) { ins.dataset.mis = t[0]; ins.dataset.n = t[1].length; ins.innerHTML = XR.teacherDraftHTML(t[0], t[1], rows.length); } else ins.innerHTML = "";
  }
  $("#exportBtn").onclick = () => {
    const rows = classRows();
    const csv = ["Student," + XR.CONCEPTS.map(c => c.name).join(","), ...rows.map(r => r.name + "," + XR.CONCEPTS.map(c => Math.round(r.mastery[c.id] * 100)).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "class-10b-mastery.csv"; a.click();
  };

  // ---------------- PROGRESS (proof of learning) ----------------
  function renderProgress() {
    const base = S.baseline;
    if (!base) { $("#progressBody").innerHTML = `<div class="empty">Finish the diagnostic first. Your starting point is saved then, and this page shows how far you've come.</div><div style="text-align:center"><button class="btn primary" data-go="diagnostic">Start diagnostic</button></div>`; return; }
    const ids = XR.CONCEPTS.map(c => c.id);
    const avgB = ids.reduce((a, i) => a + base[i], 0) / ids.length, avgN = ids.reduce((a, i) => a + S.mastery[i], 0) / ids.length;
    const practice = S.attempts.filter(a => !XR.questionById[a.qid]?.diag);
    const acc = practice.length ? practice.filter(a => a.correct).length / practice.length : 0;
    const ms = Object.entries(S.misState || {});
    const fixed = ms.filter(([, m]) => m.status === "fixed"), active = ms.filter(([, m]) => m.status === "active");
    const masteredB = ids.filter(i => base[i] >= .7).length, masteredN = ids.filter(i => S.mastery[i] >= .7).length;
    $("#progressBody").innerHTML = `
      <div class="kpis">
        <div class="kpi"><b>${avgN >= avgB ? "+" : ""}${Math.round((avgN - avgB) * 100)} pts</b><span>average mastery gain (${pct(avgB)} → ${pct(avgN)})</span></div>
        <div class="kpi"><b>${masteredB} → ${masteredN}</b><span>concepts mastered (≥70%)</span></div>
        <div class="kpi"><b>${fixed.length}/${ms.length}</b><span>misconceptions fixed</span></div>
        <div class="kpi"><b>${practice.length ? pct(acc) : "—"}</b><span>practice accuracy · ${practice.length} answers · ${S.hints || 0} hints</span></div></div>
      <div class="grid2">
        <div class="panel"><h3>Before vs now, per concept</h3><p class="sub">Grey = after the diagnostic. Colour = now.</p>
          <div class="mlist">${XR.CONCEPTS.map(c => `<div class="mrow" style="grid-template-columns:96px 1fr 70px"><span>${esc(c.short)}</span><div class="bar" style="position:relative"><i style="position:absolute;width:${pct(base[c.id])};background:#cfc6b5"></i><i style="position:relative;width:${pct(S.mastery[c.id])};background:${col(S.mastery[c.id])};opacity:.85"></i></div><b>${Math.round(base[c.id] * 100)}→${Math.round(S.mastery[c.id] * 100)}</b></div>`).join("")}</div></div>
        <div class="col">
          <div class="panel"><h3>Misconceptions</h3><p class="sub">A misconception closes after two correct, hint-free answers in a row on its concept.</p>
            ${ms.length ? ms.map(([id, m]) => `<div class="riskrow"><span>${m.status === "fixed" ? "✅" : "🔴"} ${esc(XR.MISCONCEPTIONS[id].label)}<br><small class="hint">Evidence: ${esc(m.evidence || "—")}</small></span><span class="tag ${m.status === "fixed" ? "later" : "due"}">${m.status === "fixed" ? "Fixed" : `Active · ${m.streak}/2`}</span></div>`).join("") : `<p class="hint">None detected yet.</p>`}</div>
          <div class="panel"><h3>Share with your teacher</h3><p class="sub">A one-page report with these numbers and the evidence for each misconception.</p><button class="btn primary" id="dlReport">Download report</button> <a class="btn accent" id="waBtn" target="_blank" rel="noopener">Send on WhatsApp</a></div>
        </div></div>`;
    $("#waBtn").href = "https://wa.me/?text=" + encodeURIComponent(XR.whatsappText());
    $("#dlReport").onclick = () => {
      const rows = XR.CONCEPTS.map(c => `<tr><td>${c.name}</td><td>${pct(base[c.id])}</td><td>${pct(S.mastery[c.id])}</td></tr>`).join("");
      const mis = ms.map(([id, m]) => `<li><b>${XR.MISCONCEPTIONS[id].label}</b> — ${m.status}${m.evidence ? ` (evidence: ${esc(m.evidence)})` : ""}</li>`).join("");
      const html = `<!doctype html><meta charset="utf-8"><title>Concept X-Ray report</title><body style="font-family:sans-serif;max-width:720px;margin:30px auto"><h1>Concept X-Ray · Learning report</h1><p>Day ${S.day} · average mastery ${pct(avgB)} → ${pct(avgN)} · ${fixed.length} of ${ms.length} misconceptions fixed · ${practice.length} practice answers · ${S.hints || 0} hints used</p><h2>Concepts</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Concept</th><th>After diagnostic</th><th>Now</th></tr>${rows}</table><h2>Misconceptions</h2><ul>${mis || "<li>None detected</li>"}</ul><p style="color:#888">Mastery = Bayesian Knowledge Tracing estimate. Generated by Concept X-Ray.</p></body>`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = "concept-xray-report.html"; a.click();
    };
  }

  // ---------------- AI LAB (how the AI is checked) ----------------
  const OFFLINE = { dev: { n: 40, full: 1, text: 0.86 }, held: { n: 20, full: 1, text: 0.28 } };
  function renderLab() {
    $("#labBody").innerHTML = `
      <div class="grid2">
        <div class="panel"><h3>Offline rule engine (always available)</h3><p class="sub">Scored on hand-labelled student reasoning. “Text only” hides the chosen option, so only the written reasoning counts.</p>
          <table><thead><tr><th>Set</th><th>n</th><th>Full engine</th><th>Text only</th></tr></thead><tbody>
          <tr><td>Development (rules written on it)</td><td>${OFFLINE.dev.n}</td><td>${pct(OFFLINE.dev.full)}</td><td>${pct(OFFLINE.dev.text)}</td></tr>
          <tr><td><b>Held-out (never tuned on)</b></td><td>${OFFLINE.held.n}</td><td>${pct(OFFLINE.held.full)}</td><td><b style="color:var(--weak)">${pct(OFFLINE.held.text)}</b></td></tr>
          <tr><td>Held-out v2: Hinglish</td><td>10</td><td>—</td><td><b style="color:var(--weak)">50%</b></td></tr>
          <tr><td>Held-out v2: <i>correct</i> reasoning (false alarms)</td><td>10</td><td>—</td><td>1 false alarm</td></tr></tbody></table>
          <p class="hint" style="margin-top:10px">Keyword rules don't generalise to new wording. That's why the live product sends reasoning to Gemini, and keeps the rules only as an offline fallback.</p></div>
        <div class="panel"><h3>Gemini on the same held-out set</h3><p class="sub">Runs all 40 held-out responses (20 English, 10 Hinglish, 10 <i>correct</i> reasonings that should raise no flag) through the live <code>/api/analyze</code> endpoint, text only, and scores them here in your browser.</p>
          <button class="btn primary" id="runLab" ${E.AI.live ? "" : "disabled"}>${E.AI.live ? "Run the held-out check on Gemini" : "Gemini is offline on this copy"}</button>
          <div id="labOut" style="margin-top:12px"><div class="why" style="margin:0"><b>Last recorded run · 21 Nov 2026</b>Gemini recalled <strong style="font-size:18px">14 of 18</strong> misconceptions (<strong>78%</strong>) from text alone, vs 28% for the offline rules. Misses: “light goes faster inside glass”, “power = 1/25 D” and “the image shrinks when you walk away” (no misconception returned), and “magnification is v by u” (labelled as a sign-convention error instead of a mirror/lens mix-up). The prompt was not tuned on this set.</div></div></div></div>
      <div class="panel"><h3>Guardrails we check</h3><ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.8">
        <li>Every AI diagnosis must quote the student's own words as evidence, and shows a confidence score.</li>
        <li>Every AI-generated question is solved a second time by an independent Gemini call. It's discarded if the answers disagree.</li>
        <li>Hints come before the answer, and using them lowers the mastery credit, so the tutor never just hands over answers.</li>
        <li>If Gemini fails or times out, the offline engine answers instead, so a student is never left waiting.</li></ul></div>`;
    const b = $("#runLab"); if (!b) return;
    b.onclick = async () => {
      b.disabled = true;
      const rows = [...(await (await fetch("eval/heldout.json")).json()).map(r => [...r, "en"]), ...(await (await fetch("eval/heldout2.json")).json()).map((r, k) => [...r, k < 10 ? "hinglish" : "correct"])];
      const st = { en: [0, 0], hinglish: [0, 0], correct: [0, 0] }, out = []; let n = 0;
      for (let [qid, ch, text, gold, set] of rows) { if (gold === "null") set = "correct";
        const q = XR.questionById[qid]; n++;
        b.innerHTML = `<span class="spinner"></span>Checking ${n} of ${rows.length}…`;
        let pred = "error";
        try {
          const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.text, options: q.options, chosen: "(hidden)", correct: q.options[q.answer], reasoning: text, taxonomy: Object.entries(XR.MISCONCEPTIONS).map(([id, m]) => ({ id, label: m.label })) }) });
          pred = (await r.json()).misconception_id || "null";
        } catch {}
        const ok = pred === gold; st[set][1]++; if (set === "correct" ? pred !== "null" : ok) st[set][0]++;
        out.push(`<tr><td><span class="chip">${set}</span> “${esc(text)}”</td><td>${(set === "correct" ? pred === "null" : ok) ? "✅" : "❌"} ${esc(pred)}</td></tr>`);
        $("#labOut").innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">
          <div class="kpi"><b>${st.en[0]}/${st.en[1]}</b><span>English recall (rules: 28%)</span></div>
          <div class="kpi"><b>${st.hinglish[0]}/${st.hinglish[1]}</b><span>Hinglish recall (rules: 50%)</span></div>
          <div class="kpi"><b>${st.correct[0]}/${st.correct[1]}</b><span>false alarms on correct or slip reasoning (rules: 1/10 on v2)</span></div></div>
          <table><tbody>${out.join("")}</tbody></table>`;
      }
      b.textContent = "Run again"; b.disabled = false;
    };
  }

  // ---------------- video modal ----------------
  function openVideo() { const m = $("#videoModal"); m.hidden = false; const v = $("#demoVideo"); v.currentTime = 0; v.play().catch(() => {}); }
  XR.openVideo = openVideo;
  $("#videoBtn").onclick = openVideo;
  $("#vmClose").onclick = () => { $("#videoModal").hidden = true; $("#demoVideo").pause(); };

  XR.resetLearner = () => { S = E.freshState(); save(); ui.recent = []; };
  XR.render = render;
  go(location.hash.slice(1) || "home");
})();
