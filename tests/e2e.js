// End-to-end test of every user flow (needs `npm run dev` running). Run: node tests/e2e.js
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:3000/";
(async () => {
  const b = await chromium.launch(); let pass = 0, fail = 0;
  const t = async (name, fn) => { try { await fn(); pass++; console.log("✓ " + name); } catch (e) { fail++; console.log("✗ " + name + " — " + e.message.split("\n").slice(0,3).join(" ")); } };
  for (const [w, h, tag] of [[1280, 860, "desktop"], [390, 844, "phone"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
    p.on("pageerror", e => errs.push(e.message)); p.setDefaultTimeout(8000);
    await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload();
    const ok = async c => { if (!(await c)) throw new Error("assertion failed"); };
    await t(`${tag}: same-answer opener gives two different diagnoses`, async () => { await p.click("#pairBtn"); await p.waitForSelector(".pdiag.bad"); await ok(await p.locator(".pdiag.ok").count() === 1); });
    await t(`${tag}: judge strip opens the experiment`, async () => { await p.click("[data-jlab]"); await p.waitForSelector(".lab-box"); await p.click(".lab-x"); });
    await t(`${tag}: diagnostic → X-Ray names the misconception`, async () => { await p.click('[data-view="diagnostic"]'); await p.click('#opts .opt[data-i="0"]'); await p.fill("#reason", "the first bulb uses up current"); await p.click("#submitBtn"); await p.waitForSelector("#xray"); await ok((await p.textContent("#xray")).includes("used up")); });
    await t(`${tag}: teach it another way`, async () => { await p.click('[data-way="analogy"]'); await p.waitForSelector(".reteach"); });
    await t(`${tag}: experiment predict → observe → explain → fixed`, async () => { await p.click("[data-lab]"); await p.fill("#labPred", "0.25"); await p.click("#labGo"); await p.fill("#labWhy", "current is the same everywhere in series, bulbs use energy not current"); await p.click("#labCheck"); await p.waitForSelector("#labVerdict"); await ok((await p.textContent("#labVerdict")).match(/changed|fixed/i)); await p.click(".lab-x"); });
    await t(`${tag}: concept map + detail + explain it back`, async () => { await p.click('[data-view="map"]'); await p.waitForSelector("#graph .node"); await p.click("[data-teachback]"); await p.fill("#tbText", "In parallel each resistor gets the same voltage and the current divides so the total is smaller."); await p.click("#tbCheck"); await p.waitForSelector("#tbOut .lab-obs"); await p.click(".lab-x"); });
    await t(`${tag}: practice shows session strip, primer, tool calls`, async () => { await p.click('[data-view="practice"]'); await p.waitForSelector(".session"); await p.waitForSelector("#practicePanel .primer"); await ok(await p.locator(".tool").count() > 0); });
    await t(`${tag}: hint ladder gives 3 hints`, async () => { for (let i = 0; i < 3; i++) await p.click("#hintBtn"); await ok(await p.locator(".hintcard").count() === 3); });
    await t(`${tag}: review plan + simulate day`, async () => { await p.click('[data-view="review"]'); await p.click("#nextDay"); await ok((await p.textContent("#dayNum")) === "1"); });
    await t(`${tag}: progress page + WhatsApp link`, async () => { await p.click('[data-view="progress"]'); await p.waitForSelector("#progressBody"); });
    await t(`${tag}: teacher: class agent run + approve`, async () => { await p.click('[data-view="teacher"]'); await p.click("#agentBtn"); await p.waitForSelector(".brief", { timeout: 15000 }); await p.click('[data-brief="0"][data-act="approved"]'); await ok((await p.textContent(".brief")).includes("approved")); });
    await t(`${tag}: teacher trend + draft approval`, async () => { await p.waitForSelector("#trend svg"); await p.click('#insight [data-appr="approve"]'); });
    await t(`${tag}: AI Lab renders`, async () => { await p.click('[data-view="lab"]'); await p.waitForSelector("#labBody table"); });
    await t(`${tag}: guided tour starts`, async () => { await p.click("#tourBtn"); await p.waitForSelector("#tourCard:not([hidden])"); await p.click("#tcClose"); });
    await t(`${tag}: no horizontal overflow on any view`, async () => { for (const v of ["home", "diagnostic", "map", "practice", "review", "progress", "lab", "teacher"]) { const n = await p.locator(`[data-view="${v}"]`).count(); if (n !== 1) throw new Error("tab count " + n + " url " + p.url()); await p.click(`[data-view="${v}"]`); await p.waitForTimeout(150); const sw = await p.evaluate(() => document.documentElement.scrollWidth); if (sw > w + 1) throw new Error(v + " overflows " + sw); } });
    await t(`${tag}: no JavaScript errors`, async () => { if (errs.length) throw new Error(errs.join(" | ")); });
    await p.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
