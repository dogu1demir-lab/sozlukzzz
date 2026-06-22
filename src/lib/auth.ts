import { cookies } from "next/headers";
import { prisma } from "./db";
import { redis } from "./redis";

const SESSION_COOKIE_NAME = "sozlukzzz_session";

export interface SessionUser {
  id: string;
  username: string;
  role: string;
  avatarColor: string;
  avatarUrl: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    // Decode base64 session payload
    const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    if (!payload.userId) return null;

    // Check Redis cache first
    const cacheKey = `user:session:${payload.userId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get session error:", redisErr);
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, role: true, avatarColor: true, avatarUrl: true },
    });

    if (user) {
      // Cache for 30 seconds
      try {
        await redis.set(cacheKey, JSON.stringify(user), "EX", 30);
      } catch (redisErr) {
        console.error("Redis set session error:", redisErr);
      }
    }

    return user;
  } catch (e) {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ userId, createdAt: new Date().toISOString() });
  const base64Session = Buffer.from(payload).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, base64Session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

