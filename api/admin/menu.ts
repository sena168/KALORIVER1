import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMenuResponse } from "../_lib/menu.js";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await requireAdmin(req.headers.authorization);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.message });
    return;
  }

  try {
    const data = await getMenuResponse({ includeHidden: true });
    res.status(200).json({ categories: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load admin menu" });
  }
}
