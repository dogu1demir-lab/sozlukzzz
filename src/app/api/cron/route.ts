import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');

  const expectedSecret = process.env.CRON_SECRET || "sozlukzzzCronSecret2026";
  const isAuthorized = 
    secret === expectedSecret || 
    authHeader === `Bearer ${expectedSecret}`;

  if (!isAuthorized) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Keep-alive query
    await prisma.user.count();

    // 2. Automatic cleanup: Delete notifications older than 30 days to save database space
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    return NextResponse.json({ 
      ok: true, 
      message: "Veritabanı canlı tutuldu ve 30 günden eski bildirimler temizlendi.",
      cleanedNotificationsCount: deleteResult.count 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
