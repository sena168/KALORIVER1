import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma.js";
import { isAdminUser, requireUser } from "./_lib/auth.js";
import { uploadImageIfNeeded } from "./_lib/cloudinary.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await requireUser(req.headers.authorization);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.message });
    return;
  }

  const { decoded } = auth;
  const uid = decoded.uid;
  const email = decoded.email ?? null;

  if (req.method === "GET") {
    const profile = await prisma.userProfile.findUnique({ where: { uid } });
    const admin = await isAdminUser(uid, email);
    res.status(200).json({
      profile,
      isAdmin: admin,
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const age = Number.isFinite(Number(body.age)) ? Number(body.age) : undefined;
    const weight = Number.isFinite(Number(body.weight)) ? Number(body.weight) : undefined;
    const height = Number.isFinite(Number(body.height)) ? Number(body.height) : undefined;
    const gender = typeof body.gender === "string" ? body.gender : undefined;
    const username = typeof body.username === "string" ? body.username.trim() : undefined;
    const photoUrl =
      typeof body.photoUrl === "string" && body.photoUrl.trim()
        ? await uploadImageIfNeeded(body.photoUrl.trim(), "users")
        : undefined;

    const profile = await prisma.userProfile.upsert({
      where: { uid },
      update: {
        age,
        weight,
        height,
        gender,
        username,
        photoUrl,
        email: email ?? undefined,
      },
      create: {
        uid,
        email: email ?? undefined,
        age,
        weight,
        height,
        gender,
        username,
        photoUrl,
      },
    });

    const admin = await isAdminUser(uid, email);
    res.status(200).json({
      profile,
      isAdmin: admin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save profile" });
  }
}
