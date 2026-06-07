import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`${req.method} ${req.url} - Error: ${err.message || err}`, { stack: err.stack });

  // Standardize error responses
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage,
      details: err.details || undefined,
    },
  });
}
