import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Simple check for safety: we can allow Vercel crons without secret if not configured
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Keep-alive query to prevent Supabase from pausing the free tier
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
      message: "vızzz! Database is kept awake.",
      cleanedNotificationsCount: deleteResult.count 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
