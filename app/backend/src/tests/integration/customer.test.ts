import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import request from 'supertest';
import { app } from '../../index';
import { supabase } from '../../services/auth.service';
import { db } from '../../../../../db';
import { matchmakers, customers } from '../../../../../db/schema';

jest.mock('../../services/auth.service', () => {
  return {
    supabase: {
      auth: {
        getUser: jest.fn(),
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        verifyOtp: jest.fn(),
        signOut: jest.fn(),
      },
    },
  };
});

describe('Customer CRUD Endpoints', () => {
  let testMatchmaker: any;
  let testCustomer: any;

  beforeAll(async () => {
    // 1. Fetch or create a test matchmaker
    const existingMatchmakers = await db.select().from(matchmakers).limit(1);
    if (existingMatchmakers.length > 0) {
      testMatchmaker = existingMatchmakers[0];
    } else {
      const [insertedMatchmaker] = await db
        .insert(matchmakers)
        .values({
          authId: '11111111-1111-1111-1111-111111111111',
          fullName: 'Integration Test Matchmaker',
          email: 'integration-test-mm@tdc.com',
        })
        .returning();
      testMatchmaker = insertedMatchmaker;
    }

    // 2. Fetch or create a test customer assigned to this matchmaker
    const [insertedCustomer] = await db
      .insert(customers)
      .values({
        matchmakerId: testMatchmaker.id,
        firstName: 'TestFirst',
        lastName: 'TestLast',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        city: 'Mumbai',
        journeyStage: 'active',
      })
      .returning();
    testCustomer = insertedCustomer;
  });

  afterAll(async () => {
    // Clean up created customer to avoid test pollution
    if (testCustomer?.id) {
      await db.delete(customers).where(eq(customers.id, testCustomer.id)).catch(() => {});
    }
  });

  it('should deny access without Bearer token', async () => {
    const res = await request(app).get('/api/v1/customers');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should deny access with invalid Bearer token', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const res = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should fetch assigned customer profiles when authenticated', async () => {
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
      .get('/api/v1/customers')
      .set('Authorization', 'Bearer mock-supabase-jwt-auth');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    
    // Check if our inserted test customer is in the results
    const containsTestCustomer = res.body.data.some(
      (c: any) => c.firstName === 'TestFirst' && c.lastName === 'TestLast'
    );
    expect(containsTestCustomer).toBe(true);
  });

  it('should fetch details of a specific assigned customer', async () => {
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
      .get(`/api/v1/customers/${testCustomer.id}`)
      .set('Authorization', 'Bearer mock-supabase-jwt-auth');

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('TestFirst');
    expect(res.body.data.age).toBeDefined();
  });

  it('should return 404 for customer detail lookup if customer is not assigned to the matchmaker', async () => {
    // Create another matchmaker and customer
    const [otherMatchmaker] = await db
      .insert(matchmakers)
      .values({
        authId: '22222222-2222-2222-2222-222222222222',
        fullName: 'Other Matchmaker',
        email: 'other-mm@tdc.com',
      })
      .returning();

    const [otherCustomer] = await db
      .insert(customers)
      .values({
        matchmakerId: otherMatchmaker.id,
        firstName: 'OtherFirst',
        lastName: 'OtherLast',
        gender: 'female',
        dateOfBirth: '1992-02-02',
        city: 'Delhi',
        journeyStage: 'onboarding',
      })
      .returning();

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
      .get(`/api/v1/customers/${otherCustomer.id}`)
      .set('Authorization', 'Bearer mock-supabase-jwt-auth');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');

    // Clean up
    await db.delete(customers).where(eq(customers.id, otherCustomer.id)).catch(() => {});
    await db.delete(matchmakers).where(eq(matchmakers.id, otherMatchmaker.id)).catch(() => {});
  });

  it('should fetch stats of assigned customers', async () => {
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
      .get('/api/v1/customers/stats')
      .set('Authorization', 'Bearer mock-supabase-jwt-auth');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.active).toBeGreaterThanOrEqual(1);
    expect(res.body.data.matchSent).toBeDefined();
    expect(res.body.data.matched).toBeDefined();
    expect(res.body.data.onboarding).toBeDefined();
  });
});

// Import helper eq for cleanup
import { eq } from 'drizzle-orm';
