import { prisma } from "./prisma.js";

export const getMenuResponse = async (options?: { includeHidden?: boolean }) => {
  const categories = await prisma.category.findMany({
    orderBy: { label: "asc" },
  });

  const categoryIds = categories.map((category) => category.id);
  const items = await prisma.menuItem.findMany({
    where: {
      categoryId: { in: categoryIds },
      ...(options?.includeHidden ? {} : { hidden: false }),
    },
  });

  const orders = await prisma.menuOrder.findMany({
    where: { categoryId: { in: categoryIds } },
  });

  const orderMap = new Map<string, { itemId: string; position: number }[]>();
  orders.forEach((order) => {
    const list = orderMap.get(order.categoryId) ?? [];
    list.push({ itemId: order.itemId, position: order.position });
    orderMap.set(order.categoryId, list);
  });

  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.categoryId === category.id);
    const ordered = orderMap.get(category.id);

    let sorted = categoryItems;
    if (ordered && ordered.length > 0) {
      const orderIndex = new Map(ordered.map((order) => [order.itemId, order.position]));
      sorted = [...categoryItems].sort((a, b) => {
        const aPos = orderIndex.get(a.id);
        const bPos = orderIndex.get(b.id);
        if (aPos === undefined && bPos === undefined) return a.name.localeCompare(b.name);
        if (aPos === undefined) return 1;
        if (bPos === undefined) return -1;
        return aPos - bPos;
      });
    } else {
      sorted = [...categoryItems].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      id: category.slug,
      label: category.label,
      items: sorted.map((item) => ({
        id: item.id,
        name: item.name,
        calories: item.calories,
        imagePath: item.imagePath,
        category: category.slug,
        hidden: item.hidden,
      })),
    };
  });
};
