import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Simple check for safety: we can allow Vercel crons without secret if not configured
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // A simple fast query to trigger database activity on Supabase
    await prisma.user.count();
    return NextResponse.json({ ok: true, message: "vızzz! Database is kept awake." });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
