import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma.js";
import { requireAdmin } from "../../_lib/auth.js";
import { deleteCloudinaryAssetIfNeeded, uploadMenuImageIfNeeded } from "../../_lib/cloudinary.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "PATCH" && req.method !== "DELETE") {
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

    if (req.method === "PATCH") {
      const { id, name, calories, imagePath, hidden } = body;
      if (!id || typeof id !== "string") {
        res.status(400).json({ error: "Missing item id" });
        return;
      }

      const data: { name?: string; calories?: number; imagePath?: string; hidden?: boolean } = {};
      if (typeof name === "string" && name.trim()) data.name = name.trim();
      const parsedCalories = Number(calories);
      if (Number.isFinite(parsedCalories) && parsedCalories >= 0) data.calories = parsedCalories;
      if (typeof imagePath === "string" && imagePath.trim()) {
        data.imagePath = await uploadMenuImageIfNeeded(imagePath.trim());
      }
      if (typeof hidden === "boolean") data.hidden = hidden;

      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: "No changes provided" });
        return;
      }

      const updated = await prisma.menuItem.update({
        where: { id },
        data,
      });

      res.status(200).json({
        item: {
          id: updated.id,
          name: updated.name,
          calories: updated.calories,
          imagePath: updated.imagePath,
          hidden: updated.hidden,
        },
      });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = body;
      if (!id || typeof id !== "string") {
        res.status(400).json({ error: "Missing item id" });
        return;
      }

      const existing = await prisma.menuItem.findUnique({ where: { id } });
      if (existing) {
        await deleteCloudinaryAssetIfNeeded(existing.imagePath);
      }
      await prisma.menuItem.delete({ where: { id } });
      res.status(204).end();
      return;
    }

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

    const storedImagePath = await uploadMenuImageIfNeeded(imagePath);
    const created = await prisma.menuItem.create({
      data: {
        name,
        calories: parsedCalories,
        imagePath: storedImagePath,
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
    res.status(500).json({ error: "Failed to save menu item" });
  }
}
