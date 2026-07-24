import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "./db";
import { redis } from "./redis";

const SESSION_COOKIE_NAME = "sozlukzzz_session";

export interface SessionUser {
  id: string;
  username: string;
  displayName?: string | null;
  role: string;
  avatarColor: string;
  avatarUrl: string | null;
}

function getSessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET || process.env.SMTP_PASS || process.env.DATABASE_URL;
  if (!secret) {
    throw new Error(
      "Oturum imzalama anahtarı bulunamadı: SESSION_SECRET, SMTP_PASS veya DATABASE_URL tanımlanmalı."
    );
  }
  return secret;
}

function signPayload(base64Payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(base64Payload).digest("hex");
}

function encodeSession(payload: string): string {
  const base64Payload = Buffer.from(payload, "utf-8").toString("base64url");
  return `${base64Payload}.${signPayload(base64Payload)}`;
}

function decodeSession(cookieValue: string): { userId?: string } | null {
  const dotIndex = cookieValue.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const base64Payload = cookieValue.slice(0, dotIndex);
  const providedHmac = cookieValue.slice(dotIndex + 1);

  const expectedHmac = signPayload(base64Payload);
  const providedBuf = Buffer.from(providedHmac, "utf-8");
  const expectedBuf = Buffer.from(expectedHmac, "utf-8");

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    // Decode and verify the HMAC-signed session payload
    const payload = decodeSession(sessionCookie.value);
    if (!payload?.userId) return null;

    // Check Redis cache first
    const cacheKey = `user:session:${payload.userId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const cachedUser = JSON.parse(cached) as SessionUser;
        if (cachedUser.role === "BANNED") {
          // Drop the stale cache entry so the ban takes effect immediately
          try {
            await redis.del(cacheKey);
          } catch (redisErr) {
            console.error("Redis del banned session error:", redisErr);
          }
          return null;
        }
        return cachedUser;
      }
    } catch (redisErr) {
      console.error("Redis get session error:", redisErr);
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, displayName: true, role: true, avatarColor: true, avatarUrl: true },
    });

    if (user) {
      if (user.role === "BANNED") {
        return null;
      }
      // Cache for 30 seconds
      try {
        await redis.set(cacheKey, JSON.stringify(user), "EX", 30);
      } catch (redisErr) {
        console.error("Redis set session error:", redisErr);
      }
    }

    return user;
  } catch (e) {
    console.error("Session decode/verification error:", e);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ userId, createdAt: new Date().toISOString() });
  const signedSession = encodeSession(payload);

  cookieStore.set(SESSION_COOKIE_NAME, signedSession, {
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
