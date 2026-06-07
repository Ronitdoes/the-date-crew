import { Response, NextFunction } from 'express';
import { db } from '../../../../db';
import { customers, poolProfiles, matchActions } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateIntroEmail } from '../services/ai.service';
import { getAge } from '../services/matching.service';
import logger from '../utils/logger';

export async function generateIntroEmailHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { customerId, poolProfileId } = req.body;
    if (!customerId || !poolProfileId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Missing customerId or poolProfileId in request body' }
      });
    }

    // 1. Verify customer exists and belongs to the matchmaker
    const [customerRecord] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.matchmakerId, matchmakerId)));

    if (!customerRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    // 2. Fetch the candidate profile
    const [poolProfileRecord] = await db
      .select()
      .from(poolProfiles)
      .where(eq(poolProfiles.id, poolProfileId));

    if (!poolProfileRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Pool profile not found' }
      });
    }

    // 3. Find the match action record
    const [actionRecord] = await db
      .select()
      .from(matchActions)
      .where(and(eq(matchActions.customerId, customerId), eq(matchActions.poolProfileId, poolProfileId)));

    if (!actionRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Match recommendation not found for this customer and candidate pair' }
      });
    }

    // Enforce ownership
    if (actionRecord.matchmakerId !== matchmakerId) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this match recommendation' }
      });
    }

    let emailSubject: string;
    let emailBody: string;

    try {
      // 4. Generate the personalized email using Gemini
      const emailResult = await generateIntroEmail(customerRecord, poolProfileRecord);
      emailSubject = emailResult.subject;
      emailBody = emailResult.body;
    } catch (err) {
      logger.warn(`Gemini AI intro email generation failed for customer ${customerId} and candidate ${poolProfileId}. Using fallback. Error: ${err}`);
      
      // Matrimonial context fallback
      const candidateAge = getAge(poolProfileRecord.dateOfBirth);
      emailSubject = `Introducing ${poolProfileRecord.firstName} — A Potential Match from The Date Crew`;
      emailBody = `Dear ${customerRecord.firstName},\n\nWe would like to introduce you to ${poolProfileRecord.firstName} ${poolProfileRecord.lastName}, a potential match from The Date Crew.\n\n${poolProfileRecord.firstName} is a ${candidateAge}-year-old professional residing in ${poolProfileRecord.city}. They work as a ${poolProfileRecord.designation || 'professional'} at ${poolProfileRecord.currentCompany || 'their company'}.\n\nWe believe this could be a great fit based on your preferences. Please let us know if you would like to proceed.\n\nBest regards,\nYour Matchmaker`;
    }

    // 5. Update the match action record with the generated email
    await db
      .update(matchActions)
      .set({
        aiIntroEmail: emailBody
      })
      .where(eq(matchActions.id, actionRecord.id));

    return res.status(200).json({
      data: {
        subject: emailSubject,
        body: emailBody,
        emailSubject,
        emailBody
      }
    });
  } catch (err) {
    next(err);
  }
}
