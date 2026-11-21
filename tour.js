// Concept X-Ray — guided "Start Demo" tour: spotlight + captions + live auto-play.
(function () {
  const E = XR.engine;
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const params = new URLSearchParams(location.search);
  const RECORD = params.has("record");

  async function typeInto(sel, text, speed = 28) {
    const el = $(sel); if (!el) return; el.focus(); el.value = "";
    for (const ch of text) { el.value += ch; await wait(speed); }
  }
  function click(sel) { const el = $(sel); if (el) el.click(); }

  // scripted answers for the rest of the diagnostic: [option, reasoning]
  const SCRIPT = {
    d2: [2, "I = V/R = 6/3 = 2 A"],
    d3: [0, "In parallel we just add them, 6 + 6 = 12 ohm total"],
    d4: [2, "R is proportional to length so it doubles"],
    d5: [1, "kWh is energy, kW is power"],
    d6: [1, "heat is directly proportional to current so double current gives double heat"],
    d7: [1, "glass is denser so it bends towards normal"],
    d8: [0, "P = 1/f = 1/25 = 0.04 dioptre"],
    d9: [1, "u = -30, f = -15, so v = -30 cm"],
    d10: [2, "I = 12/6 = 2 A, V = 2 x 4 = 8 V"],
  };
  async function fastForwardDiagnostic() {
    const S = XR.getState();
    const DIAG = XR.QUESTIONS.filter(q => q.diag);
    while (S.diagIndex < DIAG.length) {
      const q = DIAG[S.diagIndex]; const [ch, why] = SCRIPT[q.id] || [q.answer, ""];
      const diag = ch === q.answer ? null : await E.diagnose(q, ch, why);
      E.record(S, q, ch, 2, diag); S.diagIndex++;
    }
    E.store.save(S);
  }

  const STEPS = [
    { view: "home", target: "#sameCard", feat: "The problem, live", title: "Same answer, different reason",
      body: "Two students both answer 12 Ω. A marks-only app gives both the same red cross. Concept X-Ray reads their reasoning: Student A believes parallel resistors add, Student B just slipped adding fractions. Two diagnoses, two different plans.",
      how: "Each answer goes to Gemini with a 12-item misconception list. If Gemini is unavailable, the offline engine answers and the badge says so.",
      before: async () => { XR.resetLearner(); XR.go("home"); await wait(300); click("#pairBtn"); await wait(1800); },
      cap: "Same wrong answer, different reasons. Student A believes parallel resistors add; Student B made an arithmetic slip. Different plans.", ms: 16000 },
    { view: "diagnostic", target: "#diagPanel", feat: "Diagnostic test", title: "10 questions across both chapters",
      body: "Each question is tagged with a concept and a difficulty level. Wrong options are mapped to the misconception they usually reveal.",
      how: "Each answer collects three signals: the option chosen, one line of reasoning, and how confident the student is.",
      before: async () => { XR.resetLearner(); XR.go("diagnostic"); },
      cap: "The diagnostic covers both chapters. Each answer collects the option, a line of reasoning, and the student's confidence.", ms: 7700 },
    { view: "diagnostic", target: "#reasonField", feat: "Reasoning capture", title: "The student explains in one line",
      body: "Here the student picks 0.25 A and writes why. This line of reasoning is what gets diagnosed. Students can also attach a photo of their notebook working.",
      before: async () => { click('#opts .opt[data-i="0"]'); await wait(400); await typeInto("#reason", "The first bulb uses up some of the current to glow, so only half is left, 0.25 A."); click('#conf button[data-c="3"]'); },
      cap: "Our student picks 0.25 amps and explains: ‘the first bulb uses up some of the current.’ They're certain.", ms: 10300 },
    { view: "diagnostic", target: "#xray", feat: "Misconception detection", title: "The Reasoning X-Ray",
      body: "The answer is wrong, but the reasoning is what matters. The engine finds the misconception ‘current is used up’, quotes the exact words that show it, and gives a confidence score and a targeted fix.",
      how: "Gemini classifies the reasoning against a 12-item misconception list for this syllabus. If no API key is set, a built-in rule engine uses the same list, so the demo works offline.",
      before: async () => { click("#submitBtn"); await wait(1600); },
      cap: "The X-Ray reads the reasoning, not just the answer. It names the misconception, quotes the evidence, and gives the fix.", ms: 12900 },
    { view: "diagnostic", target: ".lab-box", feat: "Break the misconception", title: "Predict → Observe → Explain",
      body: "Telling a student the right answer rarely changes a wrong belief. Seeing their own prediction fail does. The student predicts 0.25 A, runs the circuit, sees all three ammeters read 0.50 A, then explains what changed.",
      how: "The explanation is re-diagnosed. If the misconception is gone, it counts as clean evidence toward closing it.",
      before: async () => { XR.openLab("M_CUR_USED", { closeLoop: true }); await wait(400); await typeInto("#labPred", "0.25", 60); click("#labGo"); await wait(2500); await typeInto("#labWhy", "The current is the same everywhere in a series loop. Bulbs use energy, not current.", 22); click("#labCheck"); await wait(1500); },
      cap: "Break the misconception: predict, run the experiment, see the prediction fail, explain. The tutor re-checks the explanation and closes the misconception.", ms: 17000 },
    { view: "diagnostic", target: "#xray .xact", feat: "Teach it another way", title: "Same lesson, a different approach",
      body: "If the first explanation didn't land, the student can ask for the same concept again as an analogy, a real-life Indian example, or step by step, in English, Hinglish or Hindi.",
      before: async () => { document.querySelector("#labModal")?.remove(); await wait(200); click('[data-way="india"]'); await wait(1200); },
      cap: "Teach it another way: the same Class 10 lesson as an analogy, an Indian real-life example, or step by step, in English, Hinglish or Hindi.", ms: 10000 },
    { view: "diagnostic", target: "#diagPanel", feat: "Diagnostic summary", title: "Ten answers later",
      body: "We fast-forward through the rest of the diagnostic. Three more misconceptions appear in the reasoning: adding parallel resistors, treating heat as linear in current, and using centimetres in lens power.",
      before: async () => { await fastForwardDiagnostic(); XR.render("diagnostic"); },
      cap: "After ten questions, the X-Ray has found four distinct misconceptions, each one backed by the student's own words.", ms: 9400 },
    { view: "map", target: "#graphWrap", feat: "Concept graph", title: "15 concepts, linked by prerequisite",
      body: "Each ring fills with mastery. Arrows show which concept must come before which. Dashed purple rings mark root-cause gaps: weak prerequisites that are holding up later concepts.",
      before: async () => { XR.ui.selectedNode = "parallel"; XR.go("map"); },
      cap: "The concept graph shows the whole syllabus. Dashed purple rings mark root causes: weak foundations behind later mistakes.", ms: 11100 },
    { view: "practice", target: "#whyBox", feat: "Targeted questions", title: "The next question is chosen for a reason",
      body: "The tutor picks the weakest concept, checks whether a prerequisite is even weaker, and sets the difficulty so the student succeeds about 70% of the time.",
      how: "With Gemini on, every third question is newly generated and aimed at the student's active misconception.",
      before: async () => { XR.go("practice"); await wait(600); },
      cap: "Practice targets the weakest concept, or its weaker prerequisite, at a difficulty matched to current mastery.", ms: 9400 },
    { view: "practice", target: "#practiceSide", feat: "Agent decision trace", title: "The agent, as tool calls",
      body: "Every step is a tool call: diagnose_reasoning → update_learner_model → schedule_review → find_root_cause → pick_target_concept → select or generate_question + verify_question. Each shows its input, output, time, and whether Gemini or the local engine ran it.",
      cap: "The agent shows its work as tool calls: diagnose, update the learner model, find the root cause, pick and verify the next question, schedule review.", ms: 8600 },
    { view: "practice", target: "#hintBox", feat: "Hint ladder", title: "Help before answers",
      body: "Stuck students get three levels of help: a nudge, a warning about the common trap, then the method. Each hint lowers the mastery credit, so the tutor never hands over marks. Students can also speak their reasoning instead of typing.",
      before: async () => { XR.go("practice"); await wait(500); click("#hintBtn"); await wait(700); click("#hintBtn"); },
      cap: "A three-level hint ladder: nudge, trap warning, then method. Each hint lowers the mastery credit, so answers are earned.", ms: 9500 },
    { view: "review", target: "#reviewTimeline", feat: "Spaced repetition", title: "A 15-day review plan",
      body: "Each concept is scheduled with the SM-2 algorithm, and the table shows the chance of remembering it today. Being confidently wrong resets a card hardest. Being correct and sure pushes the next review further out.",
      before: async () => { XR.go("review"); },
      cap: "SM-2 spaced repetition builds a review plan. Confident mistakes come back first, and mastered concepts are spaced out.", ms: 9400 },
    { view: "progress", target: "#progressBody", feat: "Proof of learning", title: "Did the student actually improve?",
      body: "After two correct, hint-free answers on Parallel, the ‘adds parallel resistors’ misconception closes as Fixed ✅. This page shows before vs now for every concept, the learning gain, and a one-page report for the teacher.",
      before: async () => { const S = XR.getState(); ["p6", "p8"].forEach(id => E.record(S, XR.questionById[id], XR.questionById[id].answer, 3, null, 0)); E.store.save(S); XR.go("progress"); },
      cap: "Proof of learning: two clean answers close a misconception as Fixed. The teacher gets a before-and-after report.", ms: 11000 },
    { view: "teacher", target: "#heatmap", feat: "Teacher dashboard", title: "Class-wide gaps at a glance",
      body: "31 students by 15 concepts. The live student is highlighted. The class-average row shows which concepts need class time.",
      before: async () => { XR.go("teacher"); },
      cap: "The teacher dashboard shows class-wide gaps: 31 students by 15 concepts, with the class average on the bottom row.", ms: 9400 },
    { view: "teacher", target: "#insight", feat: "Teacher action", title: "Agent drafts, teacher approves",
      body: "The agent spots a misconception shared across the class and drafts a 10-minute lesson fix plus a targeted assignment. Nothing reaches students until the teacher approves, edits or rejects it. Every decision is logged.",
      before: async () => { await wait(1500); click('[data-appr="approve"]'); await wait(600); },
      cap: "The agent drafts the remedial lesson; the teacher approves, edits or rejects it before anything is assigned.", ms: 9400 },
    { view: "lab", target: "#labBody", feat: "AI Lab", title: "We measure the AI instead of trusting it",
      body: "On student wording the system has never seen, offline keyword rules catch 28% of misconceptions. Gemini catches 78% (14 of 18), and the page lists the four it missed. Anyone can re-run the check live.",
      before: async () => { XR.go("lab"); },
      cap: "On unseen wording, rules catch 28% of misconceptions and Gemini catches 78%. This recording runs offline; Gemini is live at concept-xray.vercel.app.", ms: 11000 },
    { view: "teacher", target: ".top-actions", feat: "That's Concept X-Ray", title: "Fix the reason, not just the answer",
      body: "Live Gemini reasoning with an offline fallback, a real learner model, and a teacher loop. Replay this tour or watch the recorded demo any time.",
      cap: "Concept X-Ray: fix the reason, not just the answer.", ms: 7700 },
  ];

  let idx = 0, auto = true, timer = null, running = false;
  const card = $("#tourCard"), ring = $("#tourRing"), shade = $("#tourShade"), capEl = $("#caption");

  function place(el) {
    if (!el) { ring.style.cssText = "top:50%;left:50%;width:0;height:0"; card.style.top = "30%"; card.style.left = "calc(50% - 195px)"; return; }
    const r = el.getBoundingClientRect(), pad = 8, vw = innerWidth, vh = innerHeight;
    const top = Math.max(4, r.top - pad), h = Math.min(r.height + pad * 2, vh - top - 4);
    Object.assign(ring.style, { top: top + "px", left: Math.max(4, r.left - pad) + "px", width: Math.min(r.width + pad * 2, vw - 8) + "px", height: h + "px" });
    const cw = Math.min(390, vw - 24), ch = card.offsetHeight || 260;
    let t, l;
    if (r.right + 16 + cw < vw && r.width < vw * 0.6) { l = r.right + 16; t = Math.min(Math.max(12, r.top), vh - ch - 90); }
    else if (r.left - 16 - cw > 0 && r.width < vw * 0.6) { l = r.left - 16 - cw; t = Math.min(Math.max(12, r.top), vh - ch - 90); }
    else if (top + h + ch + 100 < vh) { t = top + h + 12; l = Math.min(Math.max(12, r.left), vw - cw - 12); }
    else if (top - ch - 12 > 60) { t = top - ch - 12; l = Math.min(Math.max(12, r.left), vw - cw - 12); }
    else { t = vh - ch - 90; l = vw - cw - 16; }
    card.style.top = t + "px"; card.style.left = l + "px";
  }

  async function show(i) {
    clearTimeout(timer);
    idx = Math.max(0, Math.min(STEPS.length - 1, i));
    const s = STEPS[idx];
    if (s.view && XR.ui.view !== s.view && !s.before) XR.go(s.view);
    if (s.before) await s.before();
    await wait(250);
    const el = document.querySelector(s.target);
    if (el) { el.scrollIntoView({ block: "center", behavior: "instant" }); await wait(80); }
    $("#tcStep").textContent = `${idx + 1} / ${STEPS.length}`;
    $("#tcBar").style.width = ((idx + 1) / STEPS.length) * 100 + "%";
    $("#tcFeat").textContent = s.feat; $("#tcTitle").textContent = s.title; $("#tcBody").textContent = s.body; $("#tcHow").textContent = s.how || "";
    $("#tcNext").textContent = idx === STEPS.length - 1 ? "Finish ✓" : "Next →";
    $("#tcPrev").disabled = idx === 0;
    capEl.textContent = s.cap; capEl.hidden = false;
    (window.__capLog = window.__capLog || []).push({ i: idx, t: Date.now(), cap: s.cap });
    place(el);
    if (auto) timer = setTimeout(() => idx < STEPS.length - 1 ? show(idx + 1) : end(), s.ms);
  }

  function start() {
    running = true; auto = true; $("#tcAuto").textContent = "⏸ Pause";
    shade.hidden = ring.hidden = card.hidden = false;
    if (RECORD) $("#tcVideo").style.display = "none";
    show(0);
  }
  function end() {
    clearTimeout(timer); running = false;
    shade.hidden = ring.hidden = card.hidden = capEl.hidden = true;
    window.__tourDone = true; (window.__capLog = window.__capLog || []).push({ end: true, t: Date.now() });
  }
  XR.startTour = start;

  $("#tourBtn").onclick = start; $("#tourBtn2").onclick = start;
  $("#tcNext").onclick = () => idx < STEPS.length - 1 ? show(idx + 1) : end();
  $("#tcPrev").onclick = () => show(idx - 1);
  $("#tcClose").onclick = end;
  $("#tcAuto").onclick = () => { auto = !auto; $("#tcAuto").textContent = auto ? "⏸ Pause" : "▶ Auto-play"; if (auto) show(idx); else clearTimeout(timer); };
  $("#tcVideo").onclick = () => { end(); XR.openVideo(); };
  shade.onclick = e => e.stopPropagation();
  addEventListener("resize", () => running && place(document.querySelector(STEPS[idx].target)));
  addEventListener("keydown", e => { if (!running) return; if (e.key === "ArrowRight") $("#tcNext").click(); if (e.key === "ArrowLeft") $("#tcPrev").click(); if (e.key === "Escape") end(); });

  XR.TOUR_STEPS = STEPS;
  if (RECORD) { document.body.classList.add("recording"); setTimeout(start, 1200); }
})();
