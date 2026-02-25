
// import prisma from "../utils/prisma.js";

// /* =========================================================
//    CREATE TASK
// ========================================================= */
// export const createTask = async (req, res, next) => {
//   try {
//     const {
//       subject,
//       dueDate,
//       status,
//       priority,
//       reminder,
//       repeat,
//       description,
//       contactId,
//       accountId,
//       dealId,
//     } = req.body;

//     const result = await prisma.$transaction(async (tx) => {
//       const task = await tx.task.create({
//         data: {
//           subject,
//           dueDate: dueDate ? new Date(dueDate) : null,
//           status,
//           priority,
//           reminder: !!reminder,
//           repeat: repeat ?? false,
//           description: description || null,

//           ownerId: req.user.id,
//           createdById: req.user.id,
//           modifiedById: req.user.id,

//           contactId: contactId || null,
//           accountId: accountId || null,
//           dealId: dealId || null,
//         },
//       });

//       /* 🔔 CREATE REMINDER */
//       if (reminder?.remindAt) {
//         await tx.reminder.create({
//           data: {
//             title: subject,
//             description,
//             remindAt: new Date(reminder.remindAt),
//             emailBefore: reminder.emailBefore ?? null,
//             popupBefore: reminder.popupBefore ?? null,
//             userId: req.user.id,
//             contactId: contactId || null,
//             accountId: accountId || null,
//             dealId: dealId || null,
//             taskId: task.id,
//           },
//         });
//       }

//       return task;
//     });

//     res.status(201).json({ success: true, data: result });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    GET ALL TASKS (LIST)
// ========================================================= */
// export const getTasks = async (req, res, next) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       status,
//       priority,
//       ownerId,
//       sortBy = "createdAt",
//       order = "desc",
//     } = req.query;

//     const pageNum = Number(page);
//     const limitNum = Number(limit);

//     const where = {
//       AND: [
//         search
//           ? { subject: { contains: search, mode: "insensitive" } }
//           : {},
//         status ? { status } : {},
//         priority ? { priority } : {},
//         ownerId ? { ownerId } : {},
//       ],
//     };

//     const tasks = await prisma.task.findMany({
//       where,
//       include: {
//         contact: { select: { id: true, firstName: true, lastName: true } },
//         account: { select: { id: true, accountName: true } },
//         deal: { select: { id: true, dealName: true } },
//       },
//       orderBy: { [sortBy]: order },
//       skip: (pageNum - 1) * limitNum,
//       take: limitNum,
//     });

//     const total = await prisma.task.count({ where });

//     res.json({
//       success: true,
//       data: tasks,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         pages: Math.ceil(total / limitNum),
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    GET SINGLE TASK (⭐ FOR EDIT PAGE)
// ========================================================= */
// export const getTaskById = async (req, res, next) => {
//   try {
//     const task = await prisma.task.findUnique({
//       where: { id: req.params.id },
//       include: {
//         contact: true,
//         account: true,
//         deal: true,
//         reminders: true,
//       },
//     });

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json({ success: true, data: task });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    MY TASKS
// ========================================================= */
// export const getMyTasks = async (req, res, next) => {
//   try {
//     const tasks = await prisma.task.findMany({
//       where: { ownerId: req.user.id },
//       include: {
//         contact: { select: { id: true, firstName: true, lastName: true } },
//         account: { select: { id: true, accountName: true } },
//         deal: { select: { id: true, dealName: true } },
//       },
//       orderBy: { dueDate: "asc" },
//     });

//     res.json({ success: true, data: tasks });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    UPCOMING TASK FOR CONTACT
// ========================================================= */
// export const getUpcomingTaskForContact = async (req, res, next) => {
//   try {
//     const { contactId } = req.params;

//     const task = await prisma.task.findFirst({
//       where: {
//         contactId,
//         status: { not: "COMPLETED" },
//         dueDate: { gte: new Date() },
//       },
//       orderBy: { dueDate: "asc" },
//       select: {
//         subject: true,
//         dueDate: true,
//       },
//     });

//     res.json({ success: true, data: task || null });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    UPDATE TASK + REMINDER
// ========================================================= */
// export const updateTask = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { reminder, ...taskData } = req.body;

//     const result = await prisma.$transaction(async (tx) => {
//       const updatedTask = await tx.task.update({
//         where: { id },
//         data: {
//           ...taskData,
//           dueDate: taskData.dueDate
//             ? new Date(taskData.dueDate)
//             : null,
//           reminder: !!reminder,
//           modifiedById: req.user.id,
//         },
//       });

//       const existingReminder = await tx.reminder.findFirst({
//         where: { taskId: id },
//       });

//       /* ❌ REMOVE REMINDER */
//       if (!reminder && existingReminder) {
//         await tx.reminder.delete({
//           where: { id: existingReminder.id },
//         });
//       }

//       /* 🔁 CREATE OR UPDATE REMINDER */
//       if (reminder?.remindAt) {
//         if (existingReminder) {
//           await tx.reminder.update({
//             where: { id: existingReminder.id },
//             data: {
//               remindAt: new Date(reminder.remindAt),
//               emailBefore: reminder.emailBefore ?? null,
//               popupBefore: reminder.popupBefore ?? null,
//             },
//           });
//         } else {
//           await tx.reminder.create({
//             data: {
//               title: updatedTask.subject,
//               description: updatedTask.description,
//               remindAt: new Date(reminder.remindAt),
//               emailBefore: reminder.emailBefore ?? null,
//               popupBefore: reminder.popupBefore ?? null,
//               userId: req.user.id,
//               taskId: id,
//             },
//           });
//         }
//       }

//       return updatedTask;
//     });

//     res.json({ success: true, data: result });
//   } catch (err) {
//     next(err);
//   }
// };

// /* =========================================================
//    DELETE TASK
// ========================================================= */
// export const deleteTask = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     await prisma.$transaction([
//       prisma.reminder.deleteMany({ where: { taskId: id } }),
//       prisma.task.delete({ where: { id } }),
//     ]);

//     res.json({ success: true, message: "Task deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };
import prisma from "../utils/prisma.js";

/* =========================================================
   CREATE TASK
========================================================= */
export const createTask = async (req, res, next) => {
  try {
    const {
      subject,
      dueDate,
      status,
      priority,
      reminder,
      repeat,
      description,
      contactId,
      accountId,
      dealId,
    } = req.body;

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          subject,
          dueDate: dueDate ? new Date(dueDate) : null,
          status,
          priority,
          reminder: !!reminder,
          repeat: repeat ?? false,
          description: description || null,

          ownerId: req.user.id,
          createdById: req.user.id,
          modifiedById: req.user.id,

          contactId: contactId || null,
          accountId: accountId || null,
          dealId: dealId || null,
        },
      });

      // 🔔 Reminder
      if (reminder?.remindAt) {
        await tx.reminder.create({
          data: {
            title: subject,
            description,
            remindAt: new Date(reminder.remindAt),
            emailBefore: reminder.emailBefore ?? null,
            popupBefore: reminder.popupBefore ?? null,
            userId: req.user.id,
            contactId: contactId || null,
            accountId: accountId || null,
            dealId: dealId || null,
            taskId: newTask.id,
          },
        });
      }

      return newTask;
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET ALL TASKS
========================================================= */
export const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      priority,
      ownerId,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const where = {
      AND: [
        search
          ? { subject: { contains: search, mode: "insensitive" } }
          : {},
        status ? { status } : {},
        priority ? { priority } : {},
        ownerId ? { ownerId } : {},
      ],
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          account: { select: { id: true, accountName: true } },
          deal: { select: { id: true, dealName: true } },
        },
        orderBy: { [sortBy]: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   GET SINGLE TASK (DETAIL / EDIT PAGE)
========================================================= */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true } },
        contact: true,
        account: true,
        deal: true,
        reminders: true,
        createdBy: { select: { name: true } },
        modifiedBy: { select: { name: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   MY TASKS
========================================================= */
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { ownerId: req.user.id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        account: { select: { id: true, accountName: true } },
        deal: { select: { id: true, dealName: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   UPDATE TASK + REMINDER
========================================================= */
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reminder, ...taskData } = req.body;

    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          reminder: !!reminder,
          modifiedById: req.user.id,
        },
      });

      const existingReminder = await tx.reminder.findFirst({
        where: { taskId: id },
      });

      // ❌ remove
      if (!reminder && existingReminder) {
        await tx.reminder.delete({ where: { id: existingReminder.id } });
      }

      // 🔁 create / update
      if (reminder?.remindAt) {
        if (existingReminder) {
          await tx.reminder.update({
            where: { id: existingReminder.id },
            data: {
              remindAt: new Date(reminder.remindAt),
              emailBefore: reminder.emailBefore ?? null,
              popupBefore: reminder.popupBefore ?? null,
            },
          });
        } else {
          await tx.reminder.create({
            data: {
              title: updatedTask.subject,
              description: updatedTask.description,
              remindAt: new Date(reminder.remindAt),
              emailBefore: reminder.emailBefore ?? null,
              popupBefore: reminder.popupBefore ?? null,
              userId: req.user.id,
              taskId: id,
            },
          });
        }
      }

      return updatedTask;
    });

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   DELETE TASK
========================================================= */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction([
      prisma.reminder.deleteMany({ where: { taskId: id } }),
      prisma.task.delete({ where: { id } }),
    ]);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUpcomingTaskForContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        contactId,
        status: { not: "COMPLETED" },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      select: {
        subject: true,
        dueDate: true,
      },
    });

    res.json({ success: true, data: task || null });
  } catch (err) {
    next(err);
  }
};