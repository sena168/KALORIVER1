import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { prisma } from "./prisma.js";

const getFirebaseApp = () => {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
};

export const verifyIdToken = async (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length);
  const app = getFirebaseApp();
  const auth = getAuth(app);
  return auth.verifyIdToken(token);
};

export const requireAdmin = async (authHeader?: string) => {
  const decoded = await verifyIdToken(authHeader);
  if (!decoded?.email) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      isActive: true,
      OR: [{ uid: decoded.uid }, { email: decoded.email }],
    },
  });

  if (!admin) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (!admin.uid) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { uid: decoded.uid },
    });
  }

  return { ok: true, admin, decoded };
};
