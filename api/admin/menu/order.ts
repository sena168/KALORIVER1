import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma.js";
import { requireAdmin } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await requireAdmin(req.headers.authorization);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.message });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { categoryId, order } = body;
    if (!categoryId || typeof categoryId !== "string") {
      res.status(400).json({ error: "Invalid category" });
      return;
    }
    if (!Array.isArray(order)) {
      res.status(400).json({ error: "Invalid order" });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { slug: categoryId },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuOrder.deleteMany({ where: { categoryId: category.id } });
      if (order.length > 0) {
        await tx.menuOrder.createMany({
          data: order.map((itemId: string, index: number) => ({
            categoryId: category.id,
            itemId,
            position: index,
          })),
        });
      }
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update order" });
  }
}
