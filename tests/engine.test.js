// Engine tests: node tests/engine.test.js  (no dependencies)
global.window = global; global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
require("../data.js"); require("../engine.js");
const E = XR.engine; let pass = 0, fail = 0;
const t = (name, ok) => { ok ? pass++ : fail++; console.log(`${ok ? "✓" : "✗"} ${name}`); };

// BKT
t("BKT: correct answer raises mastery", E.bktUpdate(0.3, true, 2) > 0.3);
t("BKT: wrong answer lowers mastery", E.bktUpdate(0.3, false, 2) < 0.3);
t("BKT: hard correct counts more than easy correct", E.bktUpdate(0.3, true, 3) > E.bktUpdate(0.3, true, 1));
t("BKT: stays within (0,1)", [0.01, 0.5, 0.99].every(p => { const a = E.bktUpdate(p, true, 3), b = E.bktUpdate(p, false, 1); return a > 0 && a < 1 && b > 0 && b < 1; }));

// SM-2
const c0 = { ef: 2.5, interval: 0, reps: 0, due: null };
t("SM-2: confidently wrong resets to 1 day", E.sm2(c0, 0, 0).interval === 1);
t("SM-2: sure + correct schedules further than a guess", E.sm2(c0, 5, 0).interval > E.sm2(c0, 3, 0).interval);
t("SM-2: ease never drops below 1.3", E.sm2({ ...c0, ef: 1.3 }, 0, 0).ef >= 1.3);
t("Quality: confidently wrong is worst", E.qualityFrom(false, 3) < E.qualityFrom(false, 1));

// Recall probability (FSRS-style)
t("Recall: 100% on the review day it was set", Math.abs(E.recall({ interval: 3, due: 3 }, 0) - 1) < 1e-9);
t("Recall: decays with time", E.recall({ interval: 3, due: 3 }, 6) < E.recall({ interval: 3, due: 3 }, 3));

// Misconception engine (offline)
const q = XR.questionById;
t("Diagnose: 'uses up current' → M_CUR_USED", E.localDiagnose(q.d1, 0, "the bulb uses up current").misconception === "M_CUR_USED");
t("Diagnose: parallel add → M_PAR_ADD", E.localDiagnose(q.d3, 0, "in parallel we just add them").misconception === "M_PAR_ADD");
t("Diagnose: lens power in cm → M_POW_CM", E.localDiagnose(q.d8, 0, "P = 1/25 = 0.04").misconception === "M_POW_CM");
t("Diagnose: text-only mode ignores the chosen option", E.localDiagnose(q.d3, -1, "I multiplied wrongly").misconception === null);

// Learner model behaviour
const S = E.freshState();
S.mastery.charge = 0.2; S.mastery.current = 0.35;
t("Root cause: weak Current traces back to weaker Charge", E.rootCause(S, "current") === "charge");
t("Selection: easy question for low mastery", E.targetDifficulty(0.2) === 1 && E.targetDifficulty(0.9) === 3);
E.record(S, q.d1, 0, 3, { misconception: "M_CUR_USED", evidence: "x" });
t("Lifecycle: misconception flagged active", S.misState.M_CUR_USED.status === "active");
E.record(S, q.p3, 2, 2, null, 0); const r = E.record(S, q.p3, 2, 2, null, 0);
t("Lifecycle: fixed after 2 correct hint-free answers", r.fixedNow === "M_CUR_USED");
const S2 = E.freshState(); E.record(S2, q.d1, 0, 3, { misconception: "M_CUR_USED", evidence: "x" });
E.record(S2, q.p3, 2, 2, null, 1); E.record(S2, q.p3, 2, 2, null, 0);
t("Lifecycle: an answer that used a hint does not count toward fixed", S2.misState.M_CUR_USED.status === "active");
const a = E.freshState(), b = E.freshState();
E.record(a, q.p4, 1, 2, null, 0); E.record(b, q.p4, 1, 2, null, 3);
t("Hints: 3 hints give less mastery credit than none", b.mastery.ohm < a.mastery.ohm);

// Data integrity
t("Data: every question's answer index is valid", XR.QUESTIONS.every(x => x.answer >= 0 && x.answer < x.options.length));
t("Data: every misconception link points to a real misconception", XR.QUESTIONS.every(x => Object.values(x.mis).every(m => XR.MISCONCEPTIONS[m])));
t("Data: prerequisite graph has no unknown concepts", XR.EDGES.every(([u, v]) => XR.conceptById[u] && XR.conceptById[v]));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
