import cron from "node-cron";
import prisma from "../utils/prisma.js";
import { sendEmail } from "../utils/sendEmail.js";

cron.schedule("0 9 * * *", async () => {
  // ⏰ every day at 9 AM

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const staleDeals = await prisma.deal.findMany({
      where: {
        stage: "RFQ",
        stageHistory: {
          some: {
            createdAt: { lte: sevenDaysAgo },
          },
        },
      },
      include: {
        owner: { select: { name: true, email: true } },
        account: { select: { accountName: true } },
        stageHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    for (const deal of staleDeals) {
      const lastUpdate = deal.stageHistory[0]?.createdAt;

      await sendEmail({
        to: deal.owner.email,
        subject: `⚠ Deal stuck in RFQ – ${deal.dealName}`,
        html: `
          <h3>Deal Stage Reminder</h3>
          <p><b>Deal:</b> ${deal.dealName}</p>
          <p><b>Account:</b> ${deal.account?.accountName || "-"}</p>
          <p><b>Current Stage:</b> RFQ</p>
          <p><b>Last Updated:</b> ${lastUpdate?.toDateString()}</p>

          <p style="color:red">
            This deal has not moved for more than 7 days.
          </p>

          <a href="${process.env.FRONTEND_URL}/deals/${deal.id}">
            Open Deal
          </a>
        `,
      });
    }

    console.log("✅ Deal reminder job completed");
  } catch (err) {
    console.error("❌ Deal reminder job error", err);
  }
});