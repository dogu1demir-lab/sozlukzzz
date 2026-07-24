import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import Redis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Create a separate Redis connection for subscribing.
  // Offline queue must stay ENABLED here: subscribe() is issued before the
  // connection is ready, otherwise ioredis fails fast with
  // "Stream isn't writeable".
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const subscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
  });

  // Log connection errors instead of crashing the process on unhandled 'error' events
  subscriber.on("error", (err) => {
    console.error("SSE Redis subscriber error:", err);
  });

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
    // Send the event message payload directly to the client
    writer.write(encoder.encode(`data: ${msg}\n\n`)).catch((e) => {
      console.error("Error writing to SSE stream:", e);
    });
  });

  // Keep-alive heartbeat to prevent timeouts (every 25 seconds)
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode("event: heartbeat\ndata: ping\n\n")).catch(() => {
      // Stream might be closed
    });
  }, 25000);

  // Clean up on connection close
  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    subscriber.unsubscribe(...channels).catch((e) => {
      console.error("SSE Redis unsubscribe error:", e);
    });
    subscriber.disconnect();
    writer.close().catch(() => {
      // Already closed
    });
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
