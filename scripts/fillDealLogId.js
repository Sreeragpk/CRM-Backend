import prisma from "../src/utils/prisma.js";

const FY = "FY2526";

async function main() {
  const deals = await prisma.deal.findMany({
    where: { dealLogId: null },
    orderBy: { createdAt: "asc" },
  });

  let counter = 1000;

  for (const d of deals) {
    const dealLogId = `${FY}.${counter++}`;

    await prisma.deal.update({
      where: { id: d.id },
      data: { dealLogId },
    });
  }

  console.log("✅ DealLogId filled");
}

main();