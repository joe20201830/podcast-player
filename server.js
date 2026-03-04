#!/usr/bin/env node
// Simple local server: serves the podcast player and proxies RSS fetch requests
// Usage: node server.js   →  open http://localhost:3000

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;
const HTML_FILE = path.join(__dirname, "index.html");

function fetchUrl(targetUrl, res) {
  const mod = targetUrl.startsWith("https") ? https : http;
  const req = mod.get(targetUrl, { headers: { "User-Agent": "Mozilla/5.0 (podcast-player)" } }, (upstream) => {
    // Follow redirects
    if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      return fetchUrl(upstream.headers.location, res);
    }
    res.writeHead(200, {
      "Content-Type": "text/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    upstream.pipe(res);
  });
  req.on("error", () => {
    res.writeHead(502);
    res.end("Upstream error");
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" });
    return res.end();
  }

  // Proxy endpoint: /proxy?url=https://...
  if (parsed.pathname === "/proxy") {
    const target = parsed.query.url;
    if (!target) { res.writeHead(400); return res.end("Missing url param"); }
    return fetchUrl(target, res);
  }

  // Serve index.html for everything else
  fs.readFile(HTML_FILE, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Podcast player running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});
