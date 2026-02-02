import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAdmin(req.headers.authorization);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.message });
    return;
  }

  if (req.method === "GET") {
    const categories = await prisma.category.findMany({
      orderBy: { label: "asc" },
    });
    res.status(200).json({
      categories: categories.map((category) => ({
        id: category.slug,
        label: category.label,
      })),
    });
    return;
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { slug, label } = body;
    if (!slug || typeof slug !== "string") {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    if (!label || typeof label !== "string") {
      res.status(400).json({ error: "Invalid label" });
      return;
    }

    const created = await prisma.category.create({
      data: { slug, label },
    });
    res.status(201).json({ category: { id: created.slug, label: created.label } });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
