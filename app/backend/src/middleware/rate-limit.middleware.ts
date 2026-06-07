import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each matchmaker to 10 AI requests per minute
  keyGenerator: (req: any) => {
    // Limit per authenticated matchmaker, fallback to IP
    return req.user?.matchmakerId || req.ip || '';
  },
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many AI requests. Please wait a minute before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
