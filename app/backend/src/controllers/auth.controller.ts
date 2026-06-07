import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/auth.service';
import { db } from '../../../../db';
import { matchmakers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export async function login(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  try {
    const { data: { session, user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !session || !user) {
      logger.error(`Supabase signIn failed for ${email}: ${error?.message}`);
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: error?.message || 'Invalid email or password' }
      });
    }

    // Resolve matchmaker profile from DB
    const [matchmakerRecord] = await db
      .select()
      .from(matchmakers)
      .where(eq(matchmakers.authId, user.id));

    if (!matchmakerRecord) {
      logger.error(`Matchmaker record not found in DB for authId ${user.id}`);
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Matchmaker profile not resolved' }
      });
    }

    return res.status(200).json({
      data: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        matchmaker: {
          id: matchmakerRecord.id,
          fullName: matchmakerRecord.fullName,
          email: matchmakerRecord.email
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // In stateless API, logging out is discarding tokens on the client side.
    // Proactively call supabase.auth.signOut if local session existed.
    await supabase.auth.signOut().catch(() => {});
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      });
    }

    const [matchmakerRecord] = await db
      .select()
      .from(matchmakers)
      .where(eq(matchmakers.id, req.user.matchmakerId));

    if (!matchmakerRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Matchmaker profile not found' }
      });
    }

    return res.status(200).json({
      data: {
        matchmaker: {
          id: matchmakerRecord.id,
          fullName: matchmakerRecord.fullName,
          email: matchmakerRecord.email,
          createdAt: matchmakerRecord.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
}
