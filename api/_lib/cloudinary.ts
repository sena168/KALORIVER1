import { v2 as cloudinary } from "cloudinary";

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
};

export const uploadImageIfNeeded = async (imagePath: string, folder: string) => {
  if (!imagePath) return imagePath;
  if (!imagePath.startsWith("data:")) return imagePath;

  ensureConfigured();
  const result = await cloudinary.uploader.upload(imagePath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url || result.url;
};

export const uploadMenuImageIfNeeded = async (imagePath: string) => uploadImageIfNeeded(imagePath, "menu");

export const deleteCloudinaryAssetIfNeeded = async (imagePath: string) => {
  if (!imagePath || !imagePath.includes("res.cloudinary.com")) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return;

  // Expected: https://res.cloudinary.com/<cloud>/image/upload/<version>/folder/file.ext
  const marker = `/res.cloudinary.com/${cloudName}/image/upload/`;
  const index = imagePath.indexOf(marker);
  if (index === -1) return;

  const remainder = imagePath.slice(index + marker.length);
  const withoutVersion = remainder.replace(/^v\d+\//, "");
  const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
  if (!publicId) return;

  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.warn("Cloudinary delete failed:", error);
  }
};
