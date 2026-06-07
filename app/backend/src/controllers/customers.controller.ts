import { Response, NextFunction } from 'express';
import { db } from '../../../../db';
import { customers } from '../../../../db/schema';
import { eq, and, or, ilike, sql } from 'drizzle-orm';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Helper to calculate age from DOB
function getAge(dateString: string): number {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export async function getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const gender = req.query.gender as string;
    const stage = req.query.stage as string;
    const city = req.query.city as string;
    const search = req.query.search as string;

    const conditions = [eq(customers.matchmakerId, matchmakerId)];

    if (gender) {
      conditions.push(eq(customers.gender, gender));
    }
    if (stage) {
      conditions.push(eq(customers.journeyStage, stage));
    }
    if (city) {
      conditions.push(eq(customers.city, city));
    }
    if (search) {
      conditions.push(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`)
        ) as any
      );
    }

    const offset = (page - 1) * perPage;

    // Get paginated data
    const rawData = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        dateOfBirth: customers.dateOfBirth,
        gender: customers.gender,
        city: customers.city,
        maritalStatus: customers.maritalStatus,
        journeyStage: customers.journeyStage,
        profilePhotoUrl: customers.profilePhotoUrl,
        email: customers.email,
        phoneNumber: customers.phoneNumber,
      })
      .from(customers)
      .where(and(...conditions))
      .limit(perPage)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(...conditions));
    
    const total = Number(countResult[0]?.count || 0);

    const formattedData = rawData.map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      age: getAge(c.dateOfBirth),
      gender: c.gender,
      city: c.city,
      maritalStatus: c.maritalStatus,
      journeyStage: c.journeyStage,
      profilePhotoUrl: c.profilePhotoUrl,
      email: c.email,
      phoneNumber: c.phoneNumber
    }));

    return res.status(200).json({
      data: formattedData,
      meta: {
        total,
        page,
        perPage
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomersStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const statsResult = await db
      .select({
        journeyStage: customers.journeyStage,
        count: sql<number>`count(*)`
      })
      .from(customers)
      .where(eq(customers.matchmakerId, matchmakerId))
      .groupBy(customers.journeyStage);

    const stats = {
      total: 0,
      active: 0,
      matchSent: 0,
      matched: 0,
      onboarding: 0
    };

    for (const row of statsResult) {
      const count = Number(row.count || 0);
      stats.total += count;

      if (row.journeyStage === 'active') {
        stats.active = count;
      } else if (row.journeyStage === 'match_sent') {
        stats.matchSent = count;
      } else if (row.journeyStage === 'matched') {
        stats.matched = count;
      } else if (row.journeyStage === 'onboarding') {
        stats.onboarding = count;
      }
    }

    return res.status(200).json({
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const [customerRecord] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.matchmakerId, matchmakerId)));

    if (!customerRecord) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const customerWithAge = {
      ...customerRecord,
      age: getAge(customerRecord.dateOfBirth)
    };

    return res.status(200).json({
      data: customerWithAge
    });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const payload = {
      ...req.body,
      matchmakerId
    };

    const [newCustomer] = await db
      .insert(customers)
      .values(payload)
      .returning();

    logger.info(`Customer created: ${newCustomer.firstName} ${newCustomer.lastName} (${newCustomer.id})`);

    return res.status(201).json({
      data: newCustomer
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const [existing] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.matchmakerId, matchmakerId)));

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();

    logger.info(`Customer updated: ${updatedCustomer.firstName} ${updatedCustomer.lastName} (${updatedCustomer.id})`);

    return res.status(200).json({
      data: updatedCustomer
    });
  } catch (err) {
    next(err);
  }
}

export async function patchJourneyStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id } = req.params;
    const { journeyStage } = req.body;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const [existing] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.matchmakerId, matchmakerId)));

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        journeyStage,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();

    logger.info(`Customer journey stage updated to '${journeyStage}' for: ${updatedCustomer.firstName} (${updatedCustomer.id})`);

    return res.status(200).json({
      data: updatedCustomer
    });
  } catch (err) {
    next(err);
  }
}
