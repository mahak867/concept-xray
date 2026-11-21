const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1100 } });
  await p.goto("http://localhost:3000/#diagnostic"); await p.click('#opts .opt[data-i="0"]'); await p.fill("#reason", "first bulb uses up current"); await p.click("#submitBtn"); await p.waitForTimeout(400);
  await p.click('[data-view="map"]'); await p.waitForTimeout(300); await p.click('.node[data-id="current"]', { force: true }); await p.waitForTimeout(300);
  await p.locator("#nodeDetail").screenshot({ path: "/tmp/claude-0/shots/node.png" }); await b.close();
})();
