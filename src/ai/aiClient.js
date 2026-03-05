// src/ai/aiClient.js

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions";
const SARVAM_MODEL = "sarvam-m";

let modelReady = false;
let apiKeyLogged = false;

function getApiKey() {
  const key = process.env.SARVAM_API_KEY;

  if (!key) {
    throw new Error("SARVAM_API_KEY missing from .env");
  }

  // Log only once in development
  if (!apiKeyLogged && process.env.NODE_ENV === "development") {
    console.log("🔑 Sarvam API key loaded");
    apiKeyLogged = true;
  }

  return key;
}

/* ─────────────────────────────────────────────
   🔥 Warm-up (startup validation only)
───────────────────────────────────────────── */
export async function warmUpModel() {
  try {
    getApiKey();
    modelReady = true;
  } catch (err) {
    modelReady = false;
    console.error("AI initialization failed:", err.message);
    throw err;
  }
}

/* ─────────────────────────────────────────────
   🤖 Generate AI Response
───────────────────────────────────────────── */
export async function generateAIResponse(prompt) {
  try {
    const res = await axios.post(
      SARVAM_API_URL,
      {
        model: SARVAM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
      },
      {
        headers: {
          "api-subscription-key": getApiKey(),
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    return res.data?.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    // Minimal but meaningful error logging
    if (err.response?.status === 401) {
      console.error("Sarvam API unauthorized — check SARVAM_API_KEY");
    } else if (err.response?.status === 429) {
      console.error("Sarvam rate limit exceeded");
    } else if (err.code === "ECONNABORTED") {
      console.error("Sarvam request timeout");
    } else {
      console.error("Sarvam error:", err.message);
    }

    throw err;
  }
}

/* ─────────────────────────────────────────────
   📊 Model Status
───────────────────────────────────────────── */
export function getModelStatus() {
  return {
    ready: modelReady,
    model: SARVAM_MODEL,
    provider: "sarvam-ai",
  };
}