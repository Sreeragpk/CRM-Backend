import cron from "node-cron";
import dayjs from "dayjs";
import prisma from "../utils/prisma.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * ⏰ RUN EVERY MINUTE
 */
cron.schedule("* * * * *", async () => {
  try {
    const now = dayjs();

    const reminders = await prisma.reminder.findMany({
      where: {
        remindAt: {
          lte: now.add(1, "minute").toDate(),
        },
      },
      include: {
        user: true,
      },
    });

    for (const r of reminders) {
      const minutesLeft = dayjs(r.remindAt).diff(now, "minute");

      /**
       * 📧 EMAIL REMINDER
       */
      if (
        r.emailBefore !== null &&
        minutesLeft <= r.emailBefore &&
        !r.isEmailSent
      ) {
        await sendEmail({
          to: r.user.email,
          subject: `Reminder: ${r.title}`,
          html: `
            <h3>${r.title}</h3>
            <p>${r.description || ""}</p>
            <p><b>Time:</b> ${dayjs(r.remindAt).format("DD MMM YYYY hh:mm A")}</p>
          `,
        });

        await prisma.reminder.update({
          where: { id: r.id },
          data: { isEmailSent: true },
        });
      }

      /**
       * 🔔 IN-APP NOTIFICATION
       */
      if (
        r.popupBefore !== null &&
        minutesLeft <= r.popupBefore &&
        !r.isPopupSent
      ) {
        await prisma.notification.create({
          data: {
            title: r.title,
            message: r.description || "You have a reminder",
            type: "REMINDER",
            userId: r.userId,
          },
        });

        await prisma.reminder.update({
          where: { id: r.id },
          data: { isPopupSent: true },
        });
      }
    }
  } catch (err) {
    console.error("❌ Reminder Worker Error:", err);
  }
});

console.log("⏰ Reminder worker started...");