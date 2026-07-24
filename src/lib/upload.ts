import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB hard limit

/**
 * Saves a base64 image to the local filesystem (public/uploads/[folderName]) as an optimized WebP.
 * Returns the public relative URL path (e.g. /uploads/entries/abc123xyz.webp).
 * Includes strict size limits, magic byte format verification, and path traversal protection.
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
    // Sanitize folder name to prevent directory traversal
    const safeFolder = folderName.replace(/[^a-zA-Z0-9_-]/g, "");

    // Parse base64 header
    const matches = base64Str.match(/^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let base64Data = base64Str;

    if (matches && matches.length > 2) {
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, "base64");

    // 1. Hard Size Limit Check (Memory / OOM Protection)
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      console.error("Upload rejected: File size exceeds 10MB limit.");
      return null;
    }

    // 2. Image Format / Metadata Integrity Check (Sharp Magic Bytes Check)
    const imageInstance = sharp(buffer);
    const metadata = await imageInstance.metadata();
    
    if (!metadata.format) {
      console.error("Upload rejected: Invalid or corrupted image format.");
      return null;
    }

    // Allowed input formats
    const allowedFormats = ["jpeg", "png", "webp", "gif", "avif", "tiff", "heif"];
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      console.error(`Upload rejected: Format '${metadata.format}' is not allowed.`);
      return null;
    }

    // Define paths securely
    const relativeDir = path.join("uploads", safeFolder);
    const absoluteDir = path.resolve(process.cwd(), "public", relativeDir);
    const allowedBaseDir = path.resolve(process.cwd(), "public", "uploads");

    // Ensure absolute path stays strictly inside /public/uploads/
    if (!absoluteDir.startsWith(allowedBaseDir)) {
      console.error("Upload rejected: Invalid target directory path traversal.");
      return null;
    }

    // Ensure directory exists
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // Generate cryptographically secure filename
    const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    const absolutePath = path.join(absoluteDir, filename);
    const relativePath = `/${relativeDir}/${filename}`.replace(/\\/g, "/");

    // Process image: resize to max 1200px (bounding box) and compress webp to 80% quality
    await imageInstance
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
 * Includes strict path traversal protection to prevent arbitrary file deletion.
 */
export async function deleteImageFile(imageUrl: string | undefined | null): Promise<void> {
  if (!imageUrl) return;

  try {
    // Only process files under /uploads/
    if (imageUrl.startsWith("/uploads/")) {
      const relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
      const absolutePath = path.resolve(process.cwd(), "public", relativePath);
      const allowedUploadsDir = path.resolve(process.cwd(), "public", "uploads");

      // Strict Path Traversal Protection: absolutePath MUST stay inside /public/uploads
      if (!absolutePath.startsWith(allowedUploadsDir)) {
        console.error("Security alert: Attempted path traversal in deleteImageFile:", imageUrl);
        return;
      }

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted image file on disk: ${absolutePath}`);
      }
    }
  } catch (error) {
    console.error("Failed to delete image file from disk:", error);
  }
}
