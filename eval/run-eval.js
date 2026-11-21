// Evaluates the offline misconception engine on hand-labelled student reasoning.
global.window = global; require("../data.js");
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
require("../engine.js");
const file = process.argv[2] || "labelled.json"; const rows = require("./" + file);
let rOnly = 0, rN = 0;
let correct = 0, tp = 0, fp = 0, fn = 0; const misses = [];
for (const [qid, ch, text, gold] of rows) {
  const q = XR.questionById[qid];
  const pred = XR.engine.localDiagnose(q, ch, text).misconception || "null";
  const pr = XR.engine.localDiagnose(q, -1, text).misconception || "null"; if (gold !== "null") { rN++; if (pr === gold) rOnly++; }
  if (pred === gold) correct++; else misses.push({ qid, text, gold, pred });
  if (gold !== "null") { if (pred === gold) tp++; else fn++; if (pred !== "null" && pred !== gold) fp++; }
  else if (pred !== "null") fp++;
}
const out = { n: rows.length, accuracy: correct / rows.length, precision: tp / (tp + fp), recall: tp / (tp + fn), reasoning_only_recall: rOnly / rN, misses };
console.log(JSON.stringify(out, null, 2));
require("fs").writeFileSync(__dirname + "/results-" + file, JSON.stringify(out, null, 2));
