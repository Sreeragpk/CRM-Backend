// src/controllers/ai.controller.js

import { getSalesInsights } from "../ai/salesInsights.service.js";
import {
  buildSalesPrompt,
  buildAdvancedAnalyticsPrompt,
  buildQuickAnalyticsPrompt,
} from "../ai/promptBuilder.js";
import { generateAIResponse, getModelStatus } from "../ai/aiClient.js";
import { getAdvancedAnalyticsSnapshot } from "../ai/advancedAnalytics.service.js";

/* ─────────────────────────────────────────────
   🧠 MAIN CHATBOT CONTROLLER (SMART ROUTING)
───────────────────────────────────────────── */
export async function askAI(req, res) {
  const start = Date.now();
  console.log("🧠 [AI CTRL] ══════════════════════════════════");
  console.log("🧠 [AI CTRL] Request received at", new Date().toISOString());

  try {
    const { question } = req.body;
    console.log("❓ [AI CTRL] Question:", question);

    if (!question?.trim()) {
      console.warn("⚠️  [AI CTRL] Empty question — rejected");
      return res.status(400).json({ message: "Question required" });
    }

    const status = getModelStatus();
    console.log("📊 [AI CTRL] Model status:", JSON.stringify(status));

    const q = question.toLowerCase();

    // 🔥 Detect analytics-style questions
    const analyticsTriggers = [
      "overview",
      "scenario",
      "current situation",
      "analytics",
      "pipeline health",
      "risk",
      "bottleneck",
      "performance",
      "strategic",
      "strategy",
      "growth",
      "funnel",
      "velocity",
      "current scenario",
      "advanced analytics",
    ];

    const isAnalyticsQuery = analyticsTriggers.some((word) => q.includes(word));

    let prompt;

    if (isAnalyticsQuery) {
      console.log("📊 [AI CTRL] Routing to Advanced Analytics mode");

      const t1 = Date.now();
      const snapshot = await getAdvancedAnalyticsSnapshot();
      console.log(
        `📊 [AI CTRL] Analytics snapshot fetched in ${Date.now() - t1}ms`,
      );

      prompt = buildAdvancedAnalyticsPrompt(snapshot, question);
    } else {
      console.log("📈 [AI CTRL] Routing to Sales Assistant mode");

      const t1 = Date.now();
      const insights = await getSalesInsights();
      console.log(
        `📈 [AI CTRL] Sales insights fetched in ${Date.now() - t1}ms`,
      );

      prompt = buildSalesPrompt(insights, question);
    }

    console.log(`📝 [AI CTRL] Prompt length: ${prompt.length} chars`);

    // ── Call Sarvam AI ─────────────────────────────
    const t3 = Date.now();
    const answer = await generateAIResponse(prompt);
    console.log(`🤖 [AI CTRL] Sarvam responded in ${Date.now() - t3}ms`);

    const total = Date.now() - start;
    if (total > 5000) {
      console.warn(`⚠️  [AI CTRL] SLOW: ${total}ms — check internet`);
    } else {
      console.log(`🚀 [AI CTRL] FAST: ${total}ms ✓`);
    }

    console.log("🧠 [AI CTRL] ══════════════════════════════════");

    res.json({ answer });
  } catch (err) {
    const total = Date.now() - start;
    console.error(`❌ [AI CTRL] FAILED after ${total}ms:`, err.message);
    console.error("❌ [AI CTRL] ══════════════════════════════════");
    res.status(503).json({ message: "AI busy, retry shortly" });
  }
}

/* ─────────────────────────────────────────────
   📊 DEDICATED ANALYTICS AI ENDPOINT
   POST /api/ai/analytics
───────────────────────────────────────────── */
export async function askAnalyticsAI(req, res) {
  console.log("📊 [ANALYTICS AI] Dedicated analytics endpoint triggered");

  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question required" });
    }

    const snapshot = await getAdvancedAnalyticsSnapshot();

    let prompt;

    if (
      question.includes("Pipeline Status:") &&
      question.includes("Main Risk:") &&
      question.includes("Immediate Action:")
    ) {
      console.log("⚡ [ANALYTYTICS AI] Quick mode detected");
      prompt = buildQuickAnalyticsPrompt(snapshot);
    } else {
      console.log("📊 [ANALYTICS AI] Detailed mode detected");
      prompt = buildAdvancedAnalyticsPrompt(snapshot, question);
    }

    const answer = await generateAIResponse(prompt);

    res.json({ answer });
  } catch (err) {
    console.error("❌ [ANALYTICS AI] Error:", err.message);
    res.status(503).json({ message: "Analytics AI busy" });
  }
}