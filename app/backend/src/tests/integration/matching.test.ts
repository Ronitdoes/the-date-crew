import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import request from 'supertest';
import { app } from '../../index';
import { supabase } from '../../services/auth.service';
import { db } from '../../../../../db';
import { matchmakers, customers, poolProfiles, matchActions } from '../../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

jest.mock('../../services/auth.service', () => {
  return {
    supabase: {
      auth: {
        getUser: jest.fn(),
      },
    },
  };
});

describe('Matching Engine & Actions Integration Tests', () => {
  jest.setTimeout(30000);
  let testMatchmaker: any;
  let testMaleClient: any;
  let testFemalePoolProfiles: any[] = [];
  let testMatchActions: any[] = [];
  let originalActiveIds: string[] = [];

  beforeAll(async () => {
    // 0. Fetch all currently active pool profiles and deactivate them temporarily
    const activeProfiles = await db
      .select({ id: poolProfiles.id })
      .from(poolProfiles)
      .where(eq(poolProfiles.isActive, true));
    originalActiveIds = activeProfiles.map(p => p.id);

    if (originalActiveIds.length > 0) {
      await db.update(poolProfiles).set({ isActive: false }).where(inArray(poolProfiles.id, originalActiveIds));
    }

    // 1. Fetch or create a test matchmaker
    const existingMatchmakers = await db.select().from(matchmakers).limit(1);
    if (existingMatchmakers.length > 0) {
      testMatchmaker = existingMatchmakers[0];
    } else {
      const [insertedMatchmaker] = await db
        .insert(matchmakers)
        .values({
          authId: '33333333-3333-3333-3333-333333333333',
          fullName: 'Matching Test Matchmaker',
          email: 'matching-test-mm@tdc.com',
        })
        .returning();
      testMatchmaker = insertedMatchmaker;
    }

    // 2. Create a test male customer
    const [insertedClient] = await db
      .insert(customers)
      .values({
        matchmakerId: testMatchmaker.id,
        firstName: 'MaleClientFirst',
        lastName: 'MaleClientLast',
        gender: 'male',
        dateOfBirth: '1995-01-01',
        city: 'Mumbai',
        heightCm: 180,
        annualIncomeInr: 1500000,
        wantKids: 'yes',
        religion: 'Hindu',
        maritalStatus: 'never_married',
        journeyStage: 'active',
      })
      .returning();
    testMaleClient = insertedClient;

    // 3. Create three test female candidates
    // Candidate 1: Ideal match (younger, same city, Hindu, never_married, wantKids, etc)
    const [candidate1] = await db
      .insert(poolProfiles)
      .values({
        firstName: 'IdealFemaleFirst',
        lastName: 'IdealFemaleLast',
        gender: 'female',
        dateOfBirth: '1998-01-01', // 3 years younger
        city: 'Mumbai',
        heightCm: 165,
        annualIncomeInr: 800000,
        wantKids: 'yes',
        religion: 'Hindu',
        maritalStatus: 'never_married',
        isActive: true,
      })
      .returning();

    // Candidate 2: Partial match (should score 70 points)
    const [candidate2] = await db
      .insert(poolProfiles)
      .values({
        firstName: 'PartialFemaleFirst',
        lastName: 'PartialFemaleLast',
        gender: 'female',
        dateOfBirth: '1996-01-01', // 1 year younger (20 pts)
        city: 'Mumbai', // same city (10 pts)
        heightCm: 170, // shorter (10 pts)
        annualIncomeInr: 600000, // lower income (15 pts)
        wantKids: 'no', // different (0 pts)
        religion: 'Hindu', // same religion (15 pts)
        maritalStatus: 'divorced', // different (0 pts)
        isActive: true,
      })
      .returning();

    // Candidate 3: Inactive ideal profile (should be excluded)
    const [candidate3] = await db
      .insert(poolProfiles)
      .values({
        firstName: 'InactiveFemaleFirst',
        lastName: 'InactiveFemaleLast',
        gender: 'female',
        dateOfBirth: '1998-01-01',
        city: 'Mumbai',
        isActive: false, // Inactive
      })
      .returning();

    testFemalePoolProfiles = [candidate1, candidate2, candidate3];
  });

  afterAll(async () => {
    // Cleanup match actions
    if (testMaleClient?.id) {
      await db.delete(matchActions).where(eq(matchActions.customerId, testMaleClient.id)).catch(() => {});
      await db.delete(customers).where(eq(customers.id, testMaleClient.id)).catch(() => {});
    }

    // Cleanup candidates
    const candidateIds = testFemalePoolProfiles.map(c => c.id);
    if (candidateIds.length > 0) {
      await db.delete(poolProfiles).where(inArray(poolProfiles.id, candidateIds)).catch(() => {});
    }

    // Restore original active profiles
    if (originalActiveIds.length > 0) {
      await db.update(poolProfiles).set({ isActive: true }).where(inArray(poolProfiles.id, originalActiveIds)).catch(() => {});
    }
  });

  it('should generate suggested matches and return them ranked by score', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: testMatchmaker.authId,
          email: testMatchmaker.email,
        },
      },
      error: null,
    });

    const res = await request(app)
      .post(`/api/v1/customers/${testMaleClient.id}/matches/run`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    
    // Inactive profile (Candidate 3) must be excluded
    const containsInactive = res.body.data.some((m: any) => m.profile.id === testFemalePoolProfiles[2].id);
    expect(containsInactive).toBe(false);

    // Verify both active candidates are returned
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    
    const idealMatch = res.body.data.find((m: any) => m.profile.id === testFemalePoolProfiles[0].id);
    const partialMatch = res.body.data.find((m: any) => m.profile.id === testFemalePoolProfiles[1].id);

    expect(idealMatch).toBeDefined();
    expect(partialMatch).toBeDefined();

    // Ideal match score must be higher than partial match score
    expect(idealMatch.score).toBeGreaterThan(partialMatch.score);

    // Save generated actions for subsequent tests
    testMatchActions = res.body.data;
  });

  it('should mark a suggested match as sent', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: testMatchmaker.authId,
          email: testMatchmaker.email,
        },
      },
      error: null,
    });

    const actionToSend = testMatchActions[0]; // let's send this one
    const res = await request(app)
      .post(`/api/v1/matches/${actionToSend.matchActionId}/send`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.action).toBe('sent');
    expect(res.body.data.sentAt).not.toBeNull();
  });

  it('should mark a suggested match as rejected', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: testMatchmaker.authId,
          email: testMatchmaker.email,
        },
      },
      error: null,
    });

    const actionToReject = testMatchActions[1]; // reject this one
    const res = await request(app)
      .post(`/api/v1/matches/${actionToReject.matchActionId}/reject`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.action).toBe('rejected');
  });

  it('should exclude sent and rejected profiles from subsequent matches run', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: testMatchmaker.authId,
          email: testMatchmaker.email,
        },
      },
      error: null,
    });

    const res = await request(app)
      .post(`/api/v1/customers/${testMaleClient.id}/matches/run`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    
    // Both Candidate 1 (sent) and Candidate 2 (rejected) must now be excluded
    const containsSent = res.body.data.some((m: any) => m.profile.id === testFemalePoolProfiles[0].id);
    const containsRejected = res.body.data.some((m: any) => m.profile.id === testFemalePoolProfiles[1].id);

    expect(containsSent).toBe(false);
    expect(containsRejected).toBe(false);
  });
});
