const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let history = [];
let previewRound = null;
let finalRound = null;

function generateTokens() {
  let tokens = [];
  for (let i = 0; i < 25; i++) {
    tokens.push(crypto.randomInt(0, 10)); // 0–9
  }
  return tokens;
}

function scheduleRound() {
  const now = new Date();
  const nextMin = new Date(now.getTime() - now.getSeconds() * 1000 - now.getMilliseconds() + 60000);

  const previewTime = new Date(nextMin.getTime() - 35000); // 35 sec before
  const finalTime = nextMin;

  // preview
  setTimeout(() => {
    const tokens = generateTokens();
    const sum = tokens.reduce((a, b) => a + b, 0);
    const result = sum % 10;
    previewRound = { tokens, result, time: new Date().toISOString() };
    broadcast({ type: "preview", data: previewRound });
  }, previewTime - now);

  // final
  setTimeout(() => {
    finalRound = previewRound;
    history.unshift(finalRound);
    if (history.length > 20) history.pop();

    broadcast({ type: "final", data: finalRound });
    broadcast({ type: "history", history });

    scheduleRound(); // next round
  }, finalTime - now);
}

function broadcast(msg) {
  const s = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(s);
    }
  });
}

wss.on("connection", ws => {
  if (previewRound) ws.send(JSON.stringify({ type: "preview", data: previewRound }));
  if (finalRound) ws.send(JSON.stringify({ type: "final", data: finalRound }));
  ws.send(JSON.stringify({ type: "history", history }));
});

scheduleRound();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
