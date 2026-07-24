import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cleanUsernameHandle } from "@/lib/utils";

export const revalidate = 600; // Cache for 10 minutes

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const targetHandle = cleanUsernameHandle(decodedUsername);

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: targetHandle,
          mode: "insensitive"
        }
      },
      select: { avatarUrl: true }
    });

    if (!user || !user.avatarUrl) {
      return new NextResponse("Avatar not found", { status: 404 });
    }

    // Prevent infinite self-redirect loops if avatarUrl points to this endpoint
    if (user.avatarUrl.includes("/api/yazar-image/")) {
      return new NextResponse("Avatar loop detected", { status: 400 });
    }

    // If it's a physical file path (starts with /) or remote URL, redirect directly
    if (user.avatarUrl.startsWith("/") || user.avatarUrl.startsWith("http")) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";
      const redirectTarget = user.avatarUrl.startsWith("http") 
        ? user.avatarUrl 
        : new URL(user.avatarUrl, appUrl).toString();
      return NextResponse.redirect(redirectTarget);
    }

    // Parse base64
    const matches = user.avatarUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return new NextResponse("Invalid avatar format", { status: 400 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Yazar image API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
