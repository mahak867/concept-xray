// Captures README screenshots from the running app (npm run dev first).
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const out = n => `docs/${n}.png`;
  await p.goto("http://localhost:3000/"); await p.click("#pairBtn"); await p.waitForTimeout(900);
  await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: out("home") });
  await p.click('[data-view="diagnostic"]'); await p.click('#opts .opt[data-i="0"]'); await p.fill("#reason", "The first bulb uses up some of the current, so only half is left.");
  await p.click("#submitBtn"); await p.waitForTimeout(500); await p.locator("#xray").screenshot({ path: out("xray") });
  await p.click("[data-lab]"); await p.fill("#labPred", "0.25"); await p.click("#labGo"); await p.fill("#labWhy", "The current is the same everywhere in a series loop; bulbs use energy, not current.");
  await p.click("#labCheck"); await p.waitForTimeout(500); await p.locator(".lab-box").screenshot({ path: out("experiment") });
  await p.click(".lab-x"); await p.click('[data-view="practice"]'); await p.waitForTimeout(500); await p.locator("#practiceSide").screenshot({ path: out("agent-trace") });
  await p.click('[data-view="teacher"]'); await p.waitForTimeout(400); await p.locator("#insight").screenshot({ path: out("teacher-approval") });
  await b.close();
})();
