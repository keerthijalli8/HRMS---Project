// backend/src/middleware/rateLimiter.js

const windowMs = 60 * 1000; // 1 minute window
const maxRequests = 20; // 20 requests per minute per key
const requestMap = new Map();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestMap.entries()) {
    if (now - record.resetTime > 0) {
      requestMap.delete(key);
    }
  }
}, 30000).unref();

export function faceEndpointRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const key = `${ip}_${req.path}`;
  const now = Date.now();

  let record = requestMap.get(key);
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    };
    requestMap.set(key, record);
    return next();
  }

  record.count++;
  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too many face verification requests. Please wait a moment before trying again.',
      retryAfterSeconds: retryAfter
    });
  }

  next();
}

