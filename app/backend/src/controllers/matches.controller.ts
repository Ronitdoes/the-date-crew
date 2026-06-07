import { Response, NextFunction } from 'express';
import { db } from '../../../../db';
import { customers, poolProfiles, matchActions } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { runMatchingForClient } from '../services/matching.service';
import logger from '../utils/logger';

export async function runMatches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Verify customer exists and belongs to the matchmaker
    const [customerRecord] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.matchmakerId, matchmakerId)));

    if (!customerRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const matches = await runMatchingForClient(id);

    return res.status(200).json({
      data: matches
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { matchActionId } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Verify match action exists and belongs to the matchmaker
    const [matchActionRecord] = await db
      .select({
        id: matchActions.id,
        customerId: matchActions.customerId,
        poolProfileId: matchActions.poolProfileId
      })
      .from(matchActions)
      .where(and(eq(matchActions.id, matchActionId), eq(matchActions.matchmakerId, matchmakerId)));

    if (!matchActionRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Match action not found or not assigned to you' }
      });
    }

    // Update match action
    const [updatedAction] = await db
      .update(matchActions)
      .set({
        action: 'sent',
        sentAt: new Date()
      })
      .where(eq(matchActions.id, matchActionId))
      .returning();

    // Fetch details for mock email logging
    const [customerRecord] = await db
      .select({
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email
      })
      .from(customers)
      .where(eq(customers.id, matchActionRecord.customerId));
    const [poolProfileRecord] = await db
      .select({
        firstName: poolProfiles.firstName,
        lastName: poolProfiles.lastName
      })
      .from(poolProfiles)
      .where(eq(poolProfiles.id, matchActionRecord.poolProfileId));

    logger.info(`[MOCK EMAIL LOG] Sending match recommendation to customer ${customerRecord?.firstName} ${customerRecord?.lastName} (${customerRecord?.email}) introducing candidate ${poolProfileRecord?.firstName} ${poolProfileRecord?.lastName}. Match Action ID: ${matchActionId}`);

    return res.status(200).json({
      data: updatedAction
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { matchActionId } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Verify match action exists and belongs to the matchmaker
    const [matchActionRecord] = await db
      .select({ id: matchActions.id })
      .from(matchActions)
      .where(and(eq(matchActions.id, matchActionId), eq(matchActions.matchmakerId, matchmakerId)));

    if (!matchActionRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Match action not found or not assigned to you' }
      });
    }

    // Update match action
    const [updatedAction] = await db
      .update(matchActions)
      .set({
        action: 'rejected'
      })
      .where(eq(matchActions.id, matchActionId))
      .returning();

    logger.info(`Match action ${matchActionId} updated to 'rejected' by matchmaker ${matchmakerId}`);

    return res.status(200).json({
      data: updatedAction
    });
  } catch (err) {
    next(err);
  }
}
