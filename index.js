import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tokens = [];        // हर मिनट 25 tokens (0-9)
let prevResult = null;  // 45s पर दिखेगा
let finalResult = null; // 00s पर दिखेगा

function generateTokens() {
  tokens = [];
  for (let i = 0; i < 25; i++) {
    tokens.push(crypto.randomInt(0, 10)); // 0–9
  }
}

function calculateFrequencyResult() {
  if (tokens.length === 0) return null;
  const sum = tokens.reduce((a, b) => a + b, 0);
  return sum % 10; // final digit
}

function scheduleRound() {
  const now = new Date();
  const sec = now.getSeconds();

  if (sec === 0) {
    // हर मिनट नई round
    generateTokens();
    finalResult = calculateFrequencyResult();
    prevResult = null;
  } else if (sec === 45) {
    // Final से 15 sec पहले दिखेगा
    prevResult = calculateFrequencyResult();
  }
}

setInterval(scheduleRound, 1000);

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/status", (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    tokens,
    prevResult,
    finalResult,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
