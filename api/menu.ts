import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMenuResponse } from "./_lib/menu.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = await getMenuResponse({ includeHidden: false });
    res.status(200).json({ categories: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load menu" });
  }
}
