const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
 await p.goto("http://localhost:3000/#home"); await p.waitForTimeout(300);
 console.log(await p.evaluate(() => { const out = []; document.querySelectorAll("body *").forEach(e => { const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1) { let a = e.parentElement, clipped = false; while (a) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "hidden" || o === "scroll") { clipped = true; break; } a = a.parentElement; } if (!clipped) out.push((e.id || e.className || e.tagName) + ":" + Math.round(r.right)); } }); return out.slice(0, 8).join(" | ") + " sw=" + document.documentElement.scrollWidth; }));
 await b.close(); })();
