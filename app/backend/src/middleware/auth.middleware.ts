import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/auth.service';
import { db } from '../../../../db';
import { matchmakers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthProfileCache } from '../utils/cache';

export interface AuthenticatedRequest extends Request {
  user?: {
    supabaseId: string;
    matchmakerId: string;
    email: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token missing' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
      });
    }

    // Resolve matchmaker ID from cache or DB using Auth UUID
    let matchmakerRecord = AuthProfileCache.get(user.id);

    if (!matchmakerRecord) {
      const [dbRecord] = await db
        .select({
          id: matchmakers.id,
          fullName: matchmakers.fullName,
          email: matchmakers.email,
        })
        .from(matchmakers)
        .where(eq(matchmakers.authId, user.id));

      if (dbRecord) {
        AuthProfileCache.set(user.id, dbRecord);
        matchmakerRecord = dbRecord;
      }
    }

    if (!matchmakerRecord) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Matchmaker profile not resolved' }
      });
    }

    req.user = {
      supabaseId: user.id,
      matchmakerId: matchmakerRecord.id,
      email: user.email || '',
    };
    next();
  } catch (err) {
    next(err);
  }
}
