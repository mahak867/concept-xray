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
    ({ home: renderHome, diagnostic: renderDiagnostic, map: renderMap, practice: renderPractice, review: renderReview, teacher: renderTeacher }[v] || (() => {}))();
  }

  // ---------------- AI pill ----------------
  E.checkAI().then(live => {
    const p = $("#aiPill");
    p.className = "pill " + (live ? "live" : "local");
    p.textContent = live ? "● Gemini live" : "● Offline engine";
    p.title = live ? "Reasoning is analysed by Gemini 2.5 Flash." : "No API key found: using the built-in rule engine (same taxonomy). Add GEMINI_API_KEY to go live.";
  });

  // ---------------- HOME ----------------
  function renderHome() {
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
        <label for="reason">How did you get it? <small>— one line is enough. This is what the X-Ray reads. English or Hinglish is fine.</small></label>
        <textarea id="reason" placeholder="e.g. “I used V = IR so I = 6/3…”"></textarea>
        <div class="upload"><label>📷 Add photo of your working<input type="file" accept="image/*" id="photo" hidden></label><span id="photoName">Optional · read by Gemini Vision</span></div>
      </div>
      <div class="field" id="confField"><label>How sure are you?</label>
        <div class="conf" id="conf"><button data-c="1">Guessing</button><button data-c="2" class="sel">Fairly sure</button><button data-c="3">Certain</button></div></div>
      <div class="qfoot"><span class="hint" id="qhint">Pick an option to continue</span><button class="btn primary" id="submitBtn" disabled>Check &amp; X-Ray my reasoning</button></div>
      <div id="result"></div>`;
  }

  function wireQuestion(q, onSubmit) {
    ui.sel = null; ui.conf = 2; ui.image = null; ui.answered = false; ui.current = q;
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
      const diag = correct ? null : await E.diagnose(q, ui.sel, reasoning, ui.image);
      const res = E.record(S, q, ui.sel, ui.conf, diag); save();
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
        <div class="xrow"><span>Model</span>${delta}</div></div></div>`;
    }
    const rc = E.rootCause(S, q.concept);
    return `<div class="xray" id="xray"><div class="xh"><b>Reasoning X-Ray</b><span class="chip ${diag.source === "gemini" ? "ai" : ""}" style="background:#ffffff22;color:#fff">${diag.source === "gemini" ? "Gemini 2.5 Flash" : "Offline rule engine"}</span></div><div class="xb">
      <div class="xrow"><span>Diagnosis</span><div><b>${esc(diag.label)}</b>${diag.misconception ? ` <span class="chip">${diag.misconception.replace(/_/g, "-")}</span>` : ""}</div></div>
      <div class="xrow"><span>Evidence</span><div>${diag.transcribed ? `<div class="hint">Read from photo: “${esc(diag.transcribed)}”</div>` : ""}<span class="evidence">${esc(diag.evidence)}</span></div></div>
      <div class="xrow"><span>Confidence</span><div>${pct(diag.confidence)}<span class="meter"><i style="width:${pct(diag.confidence)}"></i></span>${diag.fromReasoning ? "" : ` <span class="hint">· answer-only (no reasoning given)</span>`}</div></div>
      <div class="xrow"><span>What's off</span><div>${esc(diag.explanation)}</div></div>
      <div class="xrow"><span>The fix</span><div>${esc(diag.fix)}</div></div>
      <div class="xrow"><span>Model</span>${delta}</div>
      ${rc ? `<div class="xrow"><span>Root cause</span><div>Prerequisite <b>${esc(XR.conceptById[rc].name)}</b> is at ${pct(S.mastery[rc])}. Practice will rebuild it first.</div></div>` : ""}
    </div></div>`;
  }

  function masteryList(highlight) {
    return `<div class="mlist">${XR.CONCEPTS.map(c => `<div class="mrow ${c.id === highlight ? "flash" : ""}"><span>${esc(c.short)}</span><div class="bar"><i style="width:${pct(S.mastery[c.id])};background:${col(S.mastery[c.id])}"></i></div><b>${pct(S.mastery[c.id])}</b></div>`).join("")}</div>`;
  }

  // ---------------- DIAGNOSTIC ----------------
  const DIAG = XR.QUESTIONS.filter(q => q.diag);
  function renderDiagnostic() {
    const i = S.diagIndex;
    if (i >= DIAG.length) {
      S.diagnosticDone = true; save();
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
    ui.trace = [
      ["Read learner model", `Weakest concept: ${XR.conceptById[[...XR.CONCEPTS].sort((a, b) => S.mastery[a.id] - S.mastery[b.id])[0].id].short}`],
      ["Check prerequisites", pick.reason.type === "root" ? pick.reason.text : "No weaker prerequisite found"],
      ["Calibrate difficulty", `Mastery ${pct(S.mastery[pick.target])} → ${DIFF[pick.diff]} (aim ≈ 70% success)`],
      ["Target misconception", lastMis ? XR.MISCONCEPTIONS[lastMis].label : "None active on this concept"],
      ["Select question", q.generated ? "Freshly generated by Gemini" : `From the calibrated bank (#${q.id})`],
    ];
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
  function sidePractice(hl) {
    $("#practiceSide").innerHTML = `<h3>Agent decision trace</h3><p class="sub">The tutor's reasoning for this question, step by step.</p>
      <ol style="padding-left:18px;margin:0 0 18px;font-size:13px;display:grid;gap:8px">${ui.trace.map(([a, b]) => `<li><b>${esc(a)}</b><br><span style="color:var(--ink2)">${esc(b)}</span></li>`).join("")}</ol>
      <h3>Learner model</h3><p class="sub">XP ${S.xp} · streak ${S.streak}</p>${masteryList(hl)}`;
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
    $("#reviewTable").innerHTML = `<table><thead><tr><th>Concept</th><th>Mastery</th><th>Status</th><th>Interval</th><th>Ease factor</th><th>Successful reviews</th><th></th></tr></thead><tbody>${rows.map(({ c, k, p }) => {
      const st = k.due == null ? ["new", "Not started"] : k.due <= S.day ? ["due", "Due now"] : k.due - S.day <= 2 ? ["soon", `In ${k.due - S.day}d`] : ["later", `In ${k.due - S.day}d`];
      return `<tr><td><b>${esc(c.name)}</b></td><td><div class="bar" style="width:110px;display:inline-block;vertical-align:middle"><i style="width:${pct(p)};background:${col(p)}"></i></div> ${pct(p)}</td><td><span class="tag ${st[0]}">${st[1]}</span></td><td>${k.interval ? k.interval + " d" : "—"}</td><td>${k.ef.toFixed(2)}</td><td>${k.reps}</td><td>${k.due != null && k.due <= S.day ? `<button class="btn sm accent" data-rev="${c.id}">Review</button>` : ""}</td></tr>`;
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
    $("#insight").innerHTML = t ? `<div class="insight"><div class="ic">!</div><div><h3>Suggested action for tomorrow's class</h3>
      <p style="margin:6px 0 10px">${t[1].length} of ${rows.length} students show <b>“${esc(XR.MISCONCEPTIONS[t[0]].label)}”</b>. Spend 10 minutes on it in class instead of re-teaching the whole chapter. Suggested explanation: ${esc(XR.MISCONCEPTIONS[t[0]].fix)}</p>
      <button class="btn accent" id="assignBtn">Assign a 5-question remedial set to these ${t[1].length} students</button></div></div>` : "";
    const ab = $("#assignBtn"); if (ab) ab.onclick = () => { ab.disabled = true; ab.textContent = `✓ Assigned to ${t[1].length} students · due Monday`; toast("Remedial set assigned"); };
  }
  $("#exportBtn").onclick = () => {
    const rows = classRows();
    const csv = ["Student," + XR.CONCEPTS.map(c => c.name).join(","), ...rows.map(r => r.name + "," + XR.CONCEPTS.map(c => Math.round(r.mastery[c.id] * 100)).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "class-10b-mastery.csv"; a.click();
  };

  // ---------------- video modal ----------------
  function openVideo() { const m = $("#videoModal"); m.hidden = false; const v = $("#demoVideo"); v.currentTime = 0; v.play().catch(() => {}); }
  XR.openVideo = openVideo;
  $("#videoBtn").onclick = openVideo;
  $("#vmClose").onclick = () => { $("#videoModal").hidden = true; $("#demoVideo").pause(); };

  XR.resetLearner = () => { S = E.freshState(); save(); ui.recent = []; };
  XR.render = render;
  go(location.hash.slice(1) || "home");
})();
