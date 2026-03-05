// services/analytics/dealRiskAI.service.js
import axios from "axios";

const AI_ENABLED = process.env.AI_RISK_ENABLED === "true";

export async function generateDealRiskAI({ deal, risk }) {
  if (!AI_ENABLED) return null;

  try {
    const response = await axios.post(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        model: "sarvam-llama",
        messages: [
          {
            role: "system",
            content:
              "You are a senior CRM sales risk analyst. Be concise, practical, and business-focused.",
          },
          {
            role: "user",
            content: `
Deal Name: ${deal.dealName}
Stage: ${deal.stage}
Amount: ${deal.amount || "N/A"}

Risk Score: ${risk.score}
Risk Level: ${risk.riskLevel}

Metrics:
- Days in Stage: ${risk.factors.daysInStage}
- Last Activity Gap (days): ${risk.factors.lastActivityDays}
- Probability: ${risk.factors.probability}
- Closing In (days): ${risk.factors.closingInDays}

System Playbook:
${risk.playbook.join("\n")}

Explain:
1. Why this deal is risky (short paragraph)
2. Next best actions (max 3 bullets)
`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || "";

    return {
      explanation: content,
    };
  } catch (err) {
    console.error("DealRisk AI failed:", err.message);
    return null;
  }
}