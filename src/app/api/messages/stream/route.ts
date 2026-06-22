import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import Redis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Create a separate Redis connection for subscribing
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const subscriber = new Redis(redisUrl);

  const channels = ["global:updates"];
  if (user) {
    channels.push(`user:${user.id}:messages`);
  }

  // Listen to message channels
  subscriber.subscribe(...channels, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channels.join(", ")}:`, err);
    }
  });

  subscriber.on("message", (chan, msg) => {
    try {
      // Send the event message payload directly to the client
      writer.write(encoder.encode(`data: ${msg}\n\n`));
    } catch (e) {
      console.error("Error writing to SSE stream:", e);
    }
  });

  // Keep-alive heartbeat to prevent timeouts (every 25 seconds)
  const heartbeatInterval = setInterval(() => {
    try {
      writer.write(encoder.encode("event: heartbeat\ndata: ping\n\n"));
    } catch (e) {
      // Stream might be closed
    }
  }, 25000);

  // Clean up on connection close
  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    subscriber.unsubscribe(...channels);
    subscriber.disconnect();
    try {
      writer.close();
    } catch (e) {
      // Already closed
    }
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Tells Nginx not to buffer this response
    },
  });
}
