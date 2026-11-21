const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
 const bad = [];
 for (const v of ["home","diagnostic","map","practice","review","progress","lab","teacher"]) { await p.goto("http://localhost:3000/#" + v); await p.waitForTimeout(400);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth); if (sw > 391) bad.push(v + ":" + sw); }
 console.log("overflowing views:", JSON.stringify(bad));
 await p.goto("http://localhost:3000/#home"); await p.screenshot({ path: "/tmp/claude-0/shots/m0.png" }); await b.close(); })();
