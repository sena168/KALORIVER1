import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../_lib/prisma.js";
import { requireAdmin } from "../../../_lib/auth.js";
import { deleteCloudinaryAssetIfNeeded, uploadMenuImageIfNeeded } from "../../../_lib/cloudinary.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("menu items handler", req.method, req.url);
  const auth = await requireAdmin(req.headers.authorization);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.message });
    return;
  }

  const itemId = String(req.query.id || "");
  if (!itemId) {
    res.status(400).json({ error: "Missing item id" });
    return;
  }

  if (req.method === "PATCH" || req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
      const { name, calories, imagePath, hidden } = body;
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
        where: { id: itemId },
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      console.error(error);
      res.status(500).json({ error: "Failed to update menu item" });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      const existing = await prisma.menuItem.findUnique({ where: { id: itemId } });
      if (existing) {
        await deleteCloudinaryAssetIfNeeded(existing.imagePath);
      }
      await prisma.menuItem.delete({ where: { id: itemId } });
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
