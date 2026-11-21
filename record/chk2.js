const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const errs = [];
 for (const [w, h, tag] of [[1280, 860, "d"], [390, 844, "m"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.on("pageerror", e => errs.push(tag + ": " + e.message));
  await p.goto("http://localhost:3000/"); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.click("#pairBtn"); await p.waitForTimeout(600); await p.locator("#sameCard").screenshot({ path: `/tmp/claude-0/shots/${tag}1.png` });
  await p.click('[data-view="diagnostic"]'); await p.click('#opts .opt[data-i="0"]'); await p.fill("#reason", "the first bulb uses up some current"); await p.click("#submitBtn"); await p.waitForTimeout(500);
  await p.click('[data-way="india"]'); await p.waitForTimeout(300);
  await p.click("[data-lab]"); await p.fill("#labPred", "0.25"); await p.click("#labGo"); await p.fill("#labWhy", "current is the same everywhere in series, the bulbs use energy not current"); await p.click("#labCheck"); await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/claude-0/shots/${tag}2.png` }); await p.click(".lab-x");
  await p.locator("#xray").screenshot({ path: `/tmp/claude-0/shots/${tag}3.png` });
  await p.click('[data-view="practice"]'); await p.waitForTimeout(500); await p.locator("#practiceSide").screenshot({ path: `/tmp/claude-0/shots/${tag}4.png` });
  await p.click('[data-view="teacher"]'); await p.waitForTimeout(400); await p.click('[data-appr="approve"]'); await p.waitForTimeout(300); await p.locator("#insight").screenshot({ path: `/tmp/claude-0/shots/${tag}5.png` });
  const ov = await p.evaluate(() => [...document.querySelectorAll(".view")].map(v => { v.classList.add("active"); const o = document.documentElement.scrollWidth > innerWidth; v.classList.remove("active"); return v.id + ":" + o; }).filter(s => s.endsWith("true")));
  console.log(tag, "overflow:", JSON.stringify(ov)); await p.close(); }
 console.log("errors", JSON.stringify(errs)); await b.close(); })();
