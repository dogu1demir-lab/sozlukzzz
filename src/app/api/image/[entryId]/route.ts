import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const revalidate = 600; // Cache image endpoint for 10 minutes

interface RouteParams {
  params: Promise<{ entryId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { entryId } = await params;

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { imageUrl: true }
    });

    if (!entry || !entry.imageUrl) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Prevent infinite self-redirect loops if imageUrl points to this endpoint
    if (entry.imageUrl.includes("/api/image/")) {
      return new NextResponse("Image loop detected", { status: 400 });
    }

    // If it's a physical file path (starts with /) or remote URL, redirect directly
    if (entry.imageUrl.startsWith("/") || entry.imageUrl.startsWith("http")) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";
      const redirectTarget = entry.imageUrl.startsWith("http")
        ? entry.imageUrl
        : new URL(entry.imageUrl, appUrl).toString();
      return NextResponse.redirect(redirectTarget);
    }

    // Parse base64 URL schema (e.g. data:image/jpeg;base64,xxxx...)
    const matches = entry.imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return new NextResponse("Invalid image format", { status: 400 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable" // Highly cacheable image
      }
    });
  } catch (error) {
    console.error("Image proxy API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
