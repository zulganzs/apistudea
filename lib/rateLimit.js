import { NextResponse } from "next/server";

const requestStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestStore.entries()) {
    if (now - value.timestamp > 15 * 60 * 1000) { // 15 minutes
      requestStore.delete(key);
    }
  }
}, 15 * 60 * 1000); // 15 minutes

export function rateLimit(req) {
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
  const windowMs = 60 * 1000; // 1 minute
  const max = 5; // max requests per windowMs - setting lower for testing
  
  const now = Date.now();
  const key = `${ip}`;
  
  const current = requestStore.get(key) || { count: 0, timestamp: now };
  
  // Reset count if window has passed
  if (now - current.timestamp > windowMs) {
    current.count = 0;
    current.timestamp = now;
  }
  
  current.count++;
  requestStore.set(key, current);

  // Check if rate limit exceeded
  if (current.count > max) {
    return NextResponse.json(
      { 
        error: "Too many requests, please try again later.",
        retryAfter: Math.ceil((current.timestamp + windowMs - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.timestamp + windowMs - now) / 1000)
        }
      }
    );
  }

  return null;
}
