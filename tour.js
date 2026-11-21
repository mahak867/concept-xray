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
    { view: "home", target: ".hero-copy", feat: "The problem", title: "Marks show what's wrong, not why",
      body: "Two students write the same wrong answer for very different reasons. Generic AI tutors mark the answer and move on, so the misunderstanding comes back next week.",
      how: "Concept X-Ray is built for one syllabus: CBSE Class 10 Physics, Electricity and Light.",
      cap: "Two students give the same wrong answer, for different reasons. Marks show what's wrong. Concept X-Ray shows why.", ms: 11000 },
    { view: "home", target: "#compareCard", feat: "Our angle", title: "Grade the reasoning, not just the answer",
      body: "On the left, a typical tutor marks 12 Ω wrong. On the right, Concept X-Ray names the misconception, finds its root cause and tells the teacher how many classmates share it.",
      cap: "A generic tutor says ‘incorrect’. Concept X-Ray names the misconception, finds its root cause, and alerts the teacher.", ms: 10000 },
    { view: "home", target: "#pipeline", feat: "How it works", title: "A five-step agent loop",
      body: "Diagnose → read the reasoning → update the learner model → choose and calibrate the next question → schedule reviews and report to the teacher. Every step is shown in the app.",
      cap: "It runs as a loop: diagnose, read the reasoning, update the learner model, target the next question, then schedule and report.", ms: 10000 },
    { view: "diagnostic", target: "#diagPanel", feat: "Feature 1 · Diagnostic test", title: "10 questions across both chapters",
      body: "Each question is tagged with a concept and a difficulty level. Wrong options are mapped to the misconception they usually reveal.",
      how: "Each answer collects three signals: the option chosen, one line of reasoning, and how confident the student is.",
      before: async () => { XR.resetLearner(); XR.go("diagnostic"); },
      cap: "The diagnostic covers both chapters. Each answer collects the option, a line of reasoning, and the student's confidence.", ms: 9000 },
    { view: "diagnostic", target: "#reasonField", feat: "Feature 2 · Reasoning capture", title: "The student explains in one line",
      body: "Here the student picks 0.25 A and writes why. This line of reasoning is what gets diagnosed. Students can also attach a photo of their notebook working.",
      before: async () => { click('#opts .opt[data-i="0"]'); await wait(400); await typeInto("#reason", "The first bulb uses up some of the current to glow, so only half is left, 0.25 A."); click('#conf button[data-c="3"]'); },
      cap: "Our student picks 0.25 amps and explains: ‘the first bulb uses up some of the current.’ They're certain.", ms: 12000 },
    { view: "diagnostic", target: "#xray", feat: "Feature 3 · Misconception detection", title: "The Reasoning X-Ray",
      body: "The answer is wrong, but the reasoning is what matters. The engine finds the misconception ‘current is used up’, quotes the exact words that show it, and gives a confidence score and a targeted fix.",
      how: "Gemini classifies the reasoning against a 12-item misconception list for this syllabus. If no API key is set, a built-in rule engine uses the same list, so the demo works offline.",
      before: async () => { click("#submitBtn"); await wait(1600); },
      cap: "The X-Ray reads the reasoning, not just the answer. It names the misconception, quotes the evidence, and gives the fix.", ms: 15000 },
    { view: "diagnostic", target: "#diagSide", feat: "Feature 4 · Learner model", title: "Mastery updates after every answer",
      body: "Each concept has a mastery probability, updated with Bayesian Knowledge Tracing. An easy question answered correctly could be a guess, and a hard one missed could be a slip. BKT accounts for both.",
      cap: "The learner model updates after every answer, using Bayesian Knowledge Tracing to separate real understanding from lucky guesses.", ms: 11000 },
    { view: "diagnostic", target: "#diagPanel", feat: "Diagnostic summary", title: "Ten answers later",
      body: "We fast-forward through the rest of the diagnostic. Three more misconceptions appear in the reasoning: adding parallel resistors, treating heat as linear in current, and using centimetres in lens power.",
      before: async () => { await fastForwardDiagnostic(); XR.render("diagnostic"); },
      cap: "After ten questions, the X-Ray has found four distinct misconceptions, each one backed by the student's own words.", ms: 11000 },
    { view: "map", target: "#graphWrap", feat: "Feature 5 · Concept graph", title: "15 concepts, linked by prerequisite",
      body: "Each ring fills with mastery. Arrows show which concept must come before which. Dashed purple rings mark root-cause gaps: weak prerequisites that are holding up later concepts.",
      before: async () => { XR.ui.selectedNode = "parallel"; XR.go("map"); },
      cap: "The concept graph shows the whole syllabus. Dashed purple rings mark root causes: weak foundations behind later mistakes.", ms: 13000 },
    { view: "map", target: "#nodeDetail", feat: "Concept drill-down", title: "Everything about one concept",
      body: "Mastery trend, prerequisites, which misconceptions this student has shown on this concept, and the next spaced review. One click starts practice on this concept.",
      cap: "Click any concept to see its mastery trend, prerequisites, active misconceptions, and next review date.", ms: 10000 },
    { view: "practice", target: "#whyBox", feat: "Feature 6 · Targeted questions", title: "The next question is chosen for a reason",
      body: "The tutor picks the weakest concept, checks whether a prerequisite is even weaker, and sets the difficulty so the student succeeds about 70% of the time.",
      how: "With Gemini on, every third question is newly generated and aimed at the student's active misconception.",
      before: async () => { XR.go("practice"); await wait(600); },
      cap: "Practice targets the weakest concept, or its weaker prerequisite, at a difficulty matched to current mastery.", ms: 11000 },
    { view: "practice", target: "#practiceSide", feat: "Agent decision trace", title: "Every decision is explained",
      body: "This panel lists each step the tutor took to pick this question. Students and teachers can check its decisions instead of trusting a black box.",
      cap: "Every decision is shown in the trace, so teachers can check the AI's choices step by step.", ms: 10000 },
    { view: "practice", target: ".upload", feat: "Notebook photo input", title: "Photograph the working",
      body: "Many Indian students solve on paper. They can photograph their working, and Gemini Vision transcribes the handwriting before diagnosing it.",
      cap: "Students who work on paper can photograph their notebook. Gemini Vision reads the handwriting and diagnoses it.", ms: 9000 },
    { view: "review", target: "#reviewTimeline", feat: "Feature 7 · Spaced repetition", title: "A 15-day review plan",
      body: "Each concept is scheduled with the SM-2 algorithm. Being confidently wrong resets a card hardest. Being correct and sure pushes the next review further out.",
      before: async () => { XR.go("review"); },
      cap: "SM-2 spaced repetition builds a review plan. Confident mistakes come back first, and mastered concepts are spaced out.", ms: 11000 },
    { view: "teacher", target: "#heatmap", feat: "Feature 8 · Teacher dashboard", title: "Class-wide gaps at a glance",
      body: "31 students by 15 concepts. The live student is highlighted. The class-average row shows which concepts need class time.",
      before: async () => { XR.go("teacher"); },
      cap: "The teacher dashboard shows class-wide gaps: 31 students by 15 concepts, with the class average on the bottom row.", ms: 11000 },
    { view: "teacher", target: "#topMis", feat: "Shared misconceptions", title: "Which wrong ideas are spreading",
      body: "This is grouped by the misconceptions found in students' reasoning, not by wrong answers. It tells the teacher exactly what to re-explain.",
      cap: "Teachers see which wrong ideas are shared across the class, found from reasoning and not just scores.", ms: 10000 },
    { view: "teacher", target: "#insight", feat: "Teacher action", title: "From insight to action in one click",
      body: "The dashboard suggests a 10-minute fix for tomorrow's class and assigns a remedial set to exactly the students who need it.",
      before: async () => { await wait(1500); click("#assignBtn"); },
      cap: "One click assigns a remedial set to exactly the students who share the misconception.", ms: 11000 },
    { view: "teacher", target: ".top-actions", feat: "That's Concept X-Ray", title: "Fix the reason, not just the answer",
      body: "Live Gemini reasoning with an offline fallback, a real learner model, and a teacher loop. Replay this tour or watch the recorded demo any time.",
      cap: "Concept X-Ray: fix the reason, not just the answer.", ms: 9000 },
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
