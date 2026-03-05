// src/ai/promptBuilder.js
// Detects casual greetings vs CRM questions and builds appropriate prompt

const CASUAL_TRIGGERS = [
  "hi",
  "hello",
  "hey",
  "what's up",
  "whats up",
  "sup",
  "good morning",
  "good afternoon",
  "good evening",
  "how are you",
  "how r u",
  "yo",
  "hiya",
  "greetings",
  "howdy",
];

function isCasualGreeting(question) {
  const q = question
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "");
  return CASUAL_TRIGGERS.some(
    (t) => q === t || q.startsWith(t + " ") || q.endsWith(" " + t),
  );
}

export function buildSalesPrompt(insights, question) {
  console.log("📝 [PROMPT BUILDER] Building prompt for question:", question);

  // ── Casual greeting → natural reply, no data ─────────────────────────────
  if (isCasualGreeting(question)) {
    console.log(
      "📝 [PROMPT BUILDER] Detected casual greeting — conversational mode",
    );
    const prompt = `You are a helpful CRM sales assistant. Reply naturally and warmly in 1-2 sentences. Do NOT list data unless asked.

User: ${question}
Assistant:`;
    console.log(
      `📝 [PROMPT BUILDER] Prompt length: ${prompt.length} chars (casual mode)`,
    );
    return prompt;
  }

  // ── CRM question → include sales data ────────────────────────────────────
  console.log(
    "📝 [PROMPT BUILDER] Detected CRM question — including sales data",
  );

  const {
    totalDeals = 0,
    openDeals = 0,
    wonDeals = 0,
    lostDeals = 0,
    totalRevenue = 0,
    winRate = 0,
    dealsByStage = {},
    topPerformers = [],
    atRiskDeals = [],
    closingSoonDeals = [],
  } = insights;

  const stageLines = Object.entries(dealsByStage)
    .map(([stage, count]) => `  ${stage}: ${count}`)
    .join("\n");

  const topPerfLines = topPerformers.length
    ? topPerformers
        .slice(0, 3)
        .map(
          (p, i) =>
            `  ${i + 1}. ${p.name} — ₹${(p.revenue || 0).toLocaleString()} (${p.deals} deals)`,
        )
        .join("\n")
    : "  No data yet";

  const atRiskLines = atRiskDeals.length
    ? atRiskDeals
        .slice(0, 3)
        .map(
          (d) =>
            `  - ${d.dealName}: ₹${(d.amount || 0).toLocaleString()} (${d.stage})`,
        )
        .join("\n")
    : "  None";

  const closingSoonLines = closingSoonDeals.length
    ? closingSoonDeals
        .slice(0, 3)
        .map(
          (d) =>
            `  - ${d.dealName}: ₹${(d.amount || 0).toLocaleString()} closing ${d.closingDate}`,
        )
        .join("\n")
    : "  None";

  const prompt = `You are a sharp, helpful CRM sales assistant. Answer directly and concisely. Match your tone to the question — be conversational, not robotic. Use bullet points only if listing multiple items, otherwise answer in plain sentences.

=== CURRENT CRM DATA ===
Deals: ${totalDeals} total | ${openDeals} open | ${wonDeals} won | ${lostDeals} lost
Revenue: ₹${totalRevenue.toLocaleString()} | Win Rate: ${winRate}%

Pipeline by stage:
${stageLines || "  No stage data"}

Top Performers:
${topPerfLines}

At-Risk Deals:
${atRiskLines}

Closing Soon:
${closingSoonLines}
========================

User question: ${question}
Answer:`;

  console.log(
    `📝 [PROMPT BUILDER] Prompt length: ${prompt.length} chars (CRM mode)`,
  );
  return prompt;
}

export function buildAdvancedAnalyticsPrompt(snapshot, question) {
  const {
    totalDeals,
    openDeals,
    wonDeals,
    winRate,
    monthlyWonAmount,
    monthlyWonCount,
  } = snapshot;

  return `You are a senior CRM analytics strategist.

Provide executive-level insights.
Be concise, sharp, and actionable.
Do NOT add markdown headers.
Do NOT combine bullets.
Use EXACT structure below.

=== CRM ANALYTICS SNAPSHOT ===
Total Deals: ${totalDeals}
Open Deals: ${openDeals}
Won Deals: ${wonDeals}
Win Rate: ${winRate}%
Monthly Won Revenue: ₹${monthlyWonAmount.toLocaleString()}
Monthly Won Count: ${monthlyWonCount}
================================

User question: ${question}

Respond EXACTLY in this format:

1. KEY INSIGHT
- Insight 1
- Insight 2

2. RISK OBSERVATION
- Risk 1
- Risk 2

3. OPPORTUNITY SUGGESTION
- Opportunity 1
- Opportunity 2

4. STRATEGIC RECOMMENDATION
- Recommendation 1
- Recommendation 2`;
}
export function buildQuickAnalyticsPrompt(snapshot) {
  const {
    totalDeals,
    openDeals,
    wonDeals,
    winRate,
    monthlyWonAmount,
  } = snapshot;

  return `You are a CRM executive assistant.

Provide a concise executive snapshot in EXACTLY 4 lines.

Use this structure only.
Do NOT use numbering.
Do NOT use bullets.
Do NOT add extra text.

Pipeline Status: Brief 1 sentence about overall pipeline health based on:
- Total Deals: ${totalDeals}
- Open Deals: ${openDeals}
- Won Deals: ${wonDeals}
- Win Rate: ${winRate}%

Main Risk: 1 sentence identifying the biggest risk.

Immediate Action: 1 practical action.

Strategic Recommendation: 1 strategic improvement suggestion.

Monthly Revenue Context: ₹${monthlyWonAmount.toLocaleString()}`;
}