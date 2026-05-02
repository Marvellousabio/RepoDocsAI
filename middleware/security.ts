import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Security Middleware
 * Provides input validation, rate limiting, and security headers
 */

// Rate limiting for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for analysis endpoint
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 analysis requests per hour
  message: {
    error: 'Too many analysis requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input validation for repository URL
 */
export function validateRepositoryUrl(req: Request, res: Response, next: NextFunction) {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'Repository URL is required and must be a string' });
  }

  // Basic URL validation
  try {
    const url = new URL(repoUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Check if it's a GitHub URL
    if (!url.hostname.includes('github.com')) {
      return res.status(400).json({ error: 'Only GitHub repositories are supported' });
    }

    // Validate GitHub URL format
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?\/?$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL format' });
    }

    const [, owner, repo] = match;

    // Basic validation for owner and repo names
    if (owner.length === 0 || owner.length > 39 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(owner)) {
      return res.status(400).json({ error: 'Invalid repository owner name' });
    }

    if (repo.length === 0 || repo.length > 100 || !/^[a-zA-Z0-9._-]+$/.test(repo.replace('.git', ''))) {
      return res.status(400).json({ error: 'Invalid repository name' });
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
}

/**
 * Query parameter validation for repository queries
 */
export function validateRepositoryQuery(req: Request, res: Response, next: NextFunction) {
  const { limit, offset, minStars, maxStars } = req.query;

  // Validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be a number between 1 and 100' });
    }
  }

  // Validate offset
  if (offset !== undefined) {
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ error: 'Offset must be a non-negative number' });
    }
  }

  // Validate star ranges
  if (minStars !== undefined) {
    const minStarsNum = parseInt(minStars as string);
    if (isNaN(minStarsNum) || minStarsNum < 0) {
      return res.status(400).json({ error: 'Minimum stars must be a non-negative number' });
    }
  }

  if (maxStars !== undefined) {
    const maxStarsNum = parseInt(maxStars as string);
    if (isNaN(maxStarsNum) || maxStarsNum < 0) {
      return res.status(400).json({ error: 'Maximum stars must be a non-negative number' });
    }
  }

  // Validate sort parameters
  const validSortBy = ['stars', 'updatedAt', 'createdAt'];
  const validSortOrder = ['asc', 'desc'];

  if (req.query.sortBy && !validSortBy.includes(req.query.sortBy as string)) {
    return res.status(400).json({ error: 'Invalid sortBy parameter' });
  }

  if (req.query.sortOrder && !validSortOrder.includes(req.query.sortOrder as string)) {
    return res.status(400).json({ error: 'Invalid sortOrder parameter' });
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.github.com"
  );

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Don't expose internal errors
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}