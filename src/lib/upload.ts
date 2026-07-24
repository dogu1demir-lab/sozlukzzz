import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";

/**
 * Saves a base64 image to the local filesystem (public/uploads/[folderName]) as an optimized WebP.
 * Returns the public relative URL path (e.g. /uploads/entries/abc123xyz.webp).
 */
export async function saveBase64Image(
  base64Str: string | undefined | null,
  folderName: string
): Promise<string | null> {
  if (!base64Str) return null;

  // If it's already a URL/path, return as is
  if (base64Str.startsWith("/") || base64Str.startsWith("http")) {
    return base64Str;
  }

  try {
    // Parse base64 header
    const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let base64Data = base64Str;

    if (matches && matches.length > 2) {
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, "base64");

    // Define paths
    const relativeDir = path.join("uploads", folderName);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);

    // Ensure directory exists
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // Generate random name and webp extension
    const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    const absolutePath = path.join(absoluteDir, filename);
    const relativePath = `/${relativeDir}/${filename}`.replace(/\\/g, "/");

    // Process image: resize to max 1200px (bounding box) and compress webp to 80% quality
    await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(absolutePath);

    return relativePath;
  } catch (error) {
    console.error("Failed to save base64 image:", error);
    return null;
  }
}

/**
 * Deletes a saved image file from the local filesystem if it exists in public/uploads.
 */
export async function deleteImageFile(imageUrl: string | undefined | null): Promise<void> {
  if (!imageUrl) return;

  try {
    // Only delete files under /uploads/
    if (imageUrl.startsWith("/uploads/")) {
      const relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
      const absolutePath = path.join(process.cwd(), "public", relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted image file on disk: ${absolutePath}`);
      }
    }
  } catch (error) {
    console.error("Failed to delete image file from disk:", error);
  }
}
