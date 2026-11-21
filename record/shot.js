const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto("http://localhost:3000/#practice"); await p.waitForTimeout(500);
  await p.click(".primer summary"); await p.click('#opts .opt[data-i="0"]'); await p.click("#submitBtn"); await p.waitForTimeout(500);
  await p.locator("#practicePanel").screenshot({ path: "/tmp/claude-0/shots/learn.png" }); await b.close();
})();
