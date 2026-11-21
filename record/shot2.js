const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto("http://localhost:3000/#map"); await p.waitForTimeout(500);
  await p.click("[data-teachback]"); await p.fill("#tbText", "Charge flowing per second is current. The charge is measured in coulombs and the rate of flow tells us the current.");
  await p.click("#tbCheck"); await p.waitForTimeout(500);
  await p.locator(".lab-box").screenshot({ path: "/tmp/claude-0/shots/tb.png" });
  await p.click(".lab-x"); await p.click('[data-view="teacher"]'); await p.waitForTimeout(500); await p.click('[data-appr="approve"]'); await p.waitForTimeout(400);
  await p.locator("#trend").screenshot({ path: "/tmp/claude-0/shots/trend.png" }); await b.close();
})();
