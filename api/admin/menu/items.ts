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
    const { name, calories, imagePath, hidden, categoryId } = body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    const parsedCalories = Number(calories);
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) {
      res.status(400).json({ error: "Invalid calories" });
      return;
    }
    if (!imagePath || typeof imagePath !== "string") {
      res.status(400).json({ error: "Invalid imagePath" });
      return;
    }
    if (!categoryId || typeof categoryId !== "string") {
      res.status(400).json({ error: "Invalid category" });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { slug: categoryId },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const existing = await prisma.menuItem.findFirst({
      where: {
        categoryId: category.id,
        name,
        calories: parsedCalories,
        imagePath,
      },
    });

    if (existing) {
      res.status(409).json({ error: "Duplicate item" });
      return;
    }

    const created = await prisma.menuItem.create({
      data: {
        name,
        calories: parsedCalories,
        imagePath,
        hidden: Boolean(hidden),
        categoryId: category.id,
      },
    });

    res.status(201).json({
      item: {
        id: created.id,
        name: created.name,
        calories: created.calories,
        imagePath: created.imagePath,
        hidden: created.hidden,
        category: category.slug,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
}
