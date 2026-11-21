// Records the auto-playing guided tour as the demo video + writes WebVTT/SRT captions.
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const OUT = path.join(__dirname, "..", "demo");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT + "/raw", size: { width: 1440, height: 900 } } });
  const t0 = Date.now();
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/?record=1");
  await p.waitForFunction(() => window.__tourDone === true, null, { timeout: 300000, polling: 500 });
  await p.waitForTimeout(1500);
  const log = await p.evaluate(() => window.__capLog);
  const vid = await p.video().path(); await ctx.close(); await b.close();
  fs.renameSync(vid, OUT + "/raw.webm");
  const ts = ms => { const d = new Date(Math.max(0, ms)); return d.toISOString().substr(11, 12); };
  const caps = log.filter(x => !x.end).map((x, k, a) => ({ s: x.t - t0, e: (a[k + 1] || log.find(y => y.end)).t - t0, cap: x.cap }));
  fs.writeFileSync(OUT + "/concept-xray-demo.vtt", "WEBVTT\n\n" + caps.map((c, i) => `${i + 1}\n${ts(c.s)} --> ${ts(c.e)}\n${c.cap}\n`).join("\n"));
  fs.writeFileSync(OUT + "/concept-xray-demo.srt", caps.map((c, i) => `${i + 1}\n${ts(c.s).replace(".", ",")} --> ${ts(c.e).replace(".", ",")}\n${c.cap}\n`).join("\n"));
  console.log("captions:", caps.length, "duration(s):", Math.round(caps.at(-1).e / 1000));
})();
