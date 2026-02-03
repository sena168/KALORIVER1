import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const groups = await prisma.menuItem.groupBy({
    by: ["categoryId", "name", "calories", "imagePath"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  let deleted = 0;
  for (const group of groups) {
    if (group._count.id <= 1) continue;

    const items = await prisma.menuItem.findMany({
      where: {
        categoryId: group.categoryId,
        name: group.name,
        calories: group.calories,
        imagePath: group.imagePath,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const [, ...toDelete] = items;
    if (toDelete.length === 0) continue;

    const ids = toDelete.map((item) => item.id);
    await prisma.menuItem.deleteMany({ where: { id: { in: ids } } });
    deleted += ids.length;
  }

  console.log(`Deleted ${deleted} duplicate menu items.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
