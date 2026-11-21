const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto("http://localhost:3000/"); await p.click("#tourBtn"); await p.waitForTimeout(800); await p.click("#tcVideo");
 await p.waitForTimeout(2500);
 console.log(await p.evaluate(() => { const v = document.querySelector("#demoVideo"); return { modal: !document.querySelector("#videoModal").hidden, tourClosed: document.querySelector("#tourCard").hidden, duration: v.duration, ready: v.readyState, tracks: v.textTracks.length, err: v.error && v.error.code }; }));
 await b.close(); })();
