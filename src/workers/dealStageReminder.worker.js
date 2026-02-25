import cron from "node-cron";
import prisma from "../utils/prisma.js";
import { sendEmail } from "../utils/sendEmail.js"; // your mailer

const DAYS = 7;

cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running RFQ follow-up check...");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS);

  try {
    const deals = await prisma.deal.findMany({
      where: {
        stage: "RFQ",
      },
      include: {
        owner: true,
        stageHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    for (const deal of deals) {
      const lastUpdate = deal.stageHistory[0]?.createdAt;

      if (!lastUpdate || lastUpdate > sevenDaysAgo) continue;

      await sendEmail({
        to: deal.owner.email,
        subject: `Reminder: RFQ pending for 7 days`,
        html: `
          <h3>${deal.dealName}</h3>
          <p>Deal is still in <b>RFQ</b> stage for more than 7 days.</p>
          <p>Deal Log ID: ${deal.dealLogId}</p>
          <p>Closing Date: ${deal.closingDate.toDateString()}</p>
        `,
      });

      console.log("📧 Reminder sent →", deal.dealName);
    }
  } catch (err) {
    console.error("❌ RFQ reminder error", err);
  }
});