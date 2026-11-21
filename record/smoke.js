const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto("http://localhost:3000/?record=1");
  const shots = [2, 6, 9, 12, 15, 18, 20, 23];
  for (let i = 0; i < 17; i++) {
    await p.waitForTimeout(i === 0 ? 1600 : 300);
    await p.screenshot({ path: `/tmp/claude-0/shots/s${String(i+1).padStart(2,"0")}.png` });
    const ok = await p.evaluate(() => !!document.querySelector("#tcNext"));
    // advance manually for speed
    await p.evaluate(() => { const b = document.querySelector("#tcAuto"); });
    await p.click("#tcNext"); await p.waitForTimeout(2200);
  }
  console.log("errors:", JSON.stringify(errs)); await b.close();
})();
