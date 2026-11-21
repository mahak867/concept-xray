// Local dev server: static files + the same /api handlers Vercel runs.
const http = require("http"), fs = require("fs"), path = require("path");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".mp4": "video/mp4", ".vtt": "text/vtt", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, "");
    let body = ""; req.on("data", c => body += c); req.on("end", () => {
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
      res.status = c => (res.statusCode = c, res);
      res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
      try { require("./api/" + name)(req, res); } catch { res.statusCode = 404; res.end(); }
    }); return;
  }
  let p = path.join(__dirname, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!p.startsWith(__dirname) || !fs.existsSync(p)) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(p)] || "application/octet-stream");
  fs.createReadStream(p).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));
