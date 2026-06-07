import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const mockGenerateContent = jest.fn();

// Mock the Gemini API SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: () => {
          return {
            generateContent: mockGenerateContent,
          };
        },
      };
    }),
  };
});


import request from 'supertest';
import { app } from '../../index';
import { supabase } from '../../services/auth.service';
import { db } from '../../../../../db';
import { matchmakers, customers, poolProfiles, matchActions } from '../../../../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';

jest.mock('../../services/auth.service', () => {
  return {
    supabase: {
      auth: {
        getUser: jest.fn(),
      },
    },
  };
});

describe('AI Integration & Rate Limiter Tests', () => {
  jest.setTimeout(30000);
  let testMatchmaker: any;
  let testCustomer: any;
  let testCandidate: any;
  let originalActiveIds: string[] = [];

  beforeAll(async () => {
    // Deactivate existing pool profiles to isolate matches
    const activeProfiles = await db
      .select({ id: poolProfiles.id })
      .from(poolProfiles)
      .where(eq(poolProfiles.isActive, true));
    originalActiveIds = activeProfiles.map(p => p.id);

    if (originalActiveIds.length > 0) {
      await db.update(poolProfiles).set({ isActive: false }).where(inArray(poolProfiles.id, originalActiveIds));
    }

    // Create a test matchmaker
    const existingMatchmakers = await db.select().from(matchmakers).limit(1);
    if (existingMatchmakers.length > 0) {
      testMatchmaker = existingMatchmakers[0];
    } else {
      const [insertedMatchmaker] = await db
        .insert(matchmakers)
        .values({
          authId: '44444444-4444-4444-4444-444444444444',
          fullName: 'AI Test Matchmaker',
          email: 'ai-test-mm@tdc.com',
        })
        .returning();
      testMatchmaker = insertedMatchmaker;
    }

    // Create a test female customer
    const [insertedCustomer] = await db
      .insert(customers)
      .values({
        matchmakerId: testMatchmaker.id,
        firstName: 'AITestFemale',
        lastName: 'AITestLast',
        gender: 'female',
        dateOfBirth: '1993-05-15',
        city: 'Delhi',
        religion: 'Sikh',
        diet: 'vegetarian',
        familyValues: 'moderate',
        journeyStage: 'active',
      })
      .returning();
    testCustomer = insertedCustomer;

    // Create a test male pool candidate
    const [insertedCandidate] = await db
      .insert(poolProfiles)
      .values({
        firstName: 'AITestMalePool',
        lastName: 'AITestLastPool',
        gender: 'male',
        dateOfBirth: '1991-05-15', // 2 years difference
        city: 'Delhi', // Same city (Delhi)
        religion: 'Sikh', // Same religion (Sikh)
        diet: 'vegetarian', // Same diet (vegetarian)
        familyValues: 'moderate',
        incomeTier: '20l_50l',
        isActive: true,
      })
      .returning();
    testCandidate = insertedCandidate;
  });

  afterAll(async () => {
    // Cleanup match actions and data
    if (testCustomer?.id) {
      await db.delete(matchActions).where(eq(matchActions.customerId, testCustomer.id)).catch(() => {});
      await db.delete(customers).where(eq(customers.id, testCustomer.id)).catch(() => {});
    }
    if (testCandidate?.id) {
      await db.delete(poolProfiles).where(eq(poolProfiles.id, testCandidate.id)).catch(() => {});
    }

    // Restore original active profiles
    if (originalActiveIds.length > 0) {
      await db.update(poolProfiles).set({ isActive: true }).where(inArray(poolProfiles.id, originalActiveIds)).catch(() => {});
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully call Gemini AI to enrich matches and store label/reasoning', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: testMatchmaker.authId, email: testMatchmaker.email } },
      error: null,
    });

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          label: 'High Potential',
          reasoning: 'AI-generated: excellent compatibility based on shared religion and city.'
        }),
      },
    });

    const res = await request(app)
      .post(`/api/v1/customers/${testCustomer.id}/matches/run`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);

    const match = res.body.data.find((m: any) => m.profile.id === testCandidate.id);
    expect(match).toBeDefined();
    expect(match.aiLabel).toBe('High Potential');
    expect(match.aiReasoning).toBe('AI-generated: excellent compatibility based on shared religion and city.');

    // Check DB record
    const [dbRecord] = await db
      .select()
      .from(matchActions)
      .where(and(eq(matchActions.customerId, testCustomer.id), eq(matchActions.poolProfileId, testCandidate.id)));
    
    expect(dbRecord).toBeDefined();
    expect(dbRecord.aiLabel).toBe('High Potential');
    expect(dbRecord.aiReasoning).toBe('AI-generated: excellent compatibility based on shared religion and city.');
  });

  it('should fallback to rule-based logic when Gemini compatibility call fails', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: testMatchmaker.authId, email: testMatchmaker.email } },
      error: null,
    });

    mockGenerateContent.mockRejectedValueOnce(new Error('API rate limit reached or network timeout'));

    const res = await request(app)
      .post(`/api/v1/customers/${testCustomer.id}/matches/run`)
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);

    const match = res.body.data.find((m: any) => m.profile.id === testCandidate.id);
    expect(match).toBeDefined();
    // Candidate scores high (Delhi, Sikh, vegetarian, age diff 2). Let's assert it falls back to rule-based label.
    // The candidate scores:
    // 1. incomeTier (Sikh female wants equal or better income, 20l_50l >= client's null/unknown tier -> 20 pts)
    // 2. Family values (moderate == moderate -> 20 pts)
    // 3. Relocation match (null != null -> 0 pts)
    // 4. Religion (Sikh == Sikh -> 15)
    // 5. Age proximity (1993 and 1991 is 2 years, <= 3 -> 15)
    // 6. Diet (vegetarian == vegetarian -> 10)
    // 7. Lang (0)
    // Total = 80 points.
    // For score >= 80, label is 'High Potential'.
    expect(match.aiLabel).toBe('High Potential');
    // Reasoning fallback should contain matching traits
    expect(match.aiReasoning.toLowerCase()).toContain('shared city');
    expect(match.aiReasoning.toLowerCase()).toContain('matching religion');
    expect(match.aiReasoning.toLowerCase()).toContain('matching diet');
  });

  it('should generate personalized intro email via Gemini', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: testMatchmaker.authId, email: testMatchmaker.email } },
      error: null,
    });

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          subject: 'Outreach Subject from Gemini',
          body: 'Hello client, this is candidate intro body.'
        }),
      },
    });

    const res = await request(app)
      .post('/api/v1/ai/intro-email')
      .send({ customerId: testCustomer.id, poolProfileId: testCandidate.id })
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.subject).toBe('Outreach Subject from Gemini');
    expect(res.body.data.body).toBe('Hello client, this is candidate intro body.');

    // Check database to verify it's persisted in the match action record
    const [dbRecord] = await db
      .select()
      .from(matchActions)
      .where(and(eq(matchActions.customerId, testCustomer.id), eq(matchActions.poolProfileId, testCandidate.id)));
    
    expect(dbRecord.aiIntroEmail).toBe('Hello client, this is candidate intro body.');
  });

  it('should fallback to template intro email when Gemini generation fails', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: testMatchmaker.authId, email: testMatchmaker.email } },
      error: null,
    });

    mockGenerateContent.mockRejectedValueOnce(new Error('Failed to generate'));

    const res = await request(app)
      .post('/api/v1/ai/intro-email')
      .send({ customerId: testCustomer.id, poolProfileId: testCandidate.id })
      .set('Authorization', 'Bearer mock-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.subject).toContain('Introducing AITestMalePool');
    expect(res.body.data.body).toContain('potential match from The Date Crew');
  });

  it('should enforce rate limits after 10 requests per minute', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: testMatchmaker.authId, email: testMatchmaker.email } },
      error: null,
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ subject: 'Matrimonial Intro', body: 'Body' })
      }
    });

    // Make 10 requests (which should succeed or be rate-limited depending on remaining count).
    // Note that because rate limiting state is preserved across tests in-memory, we might hit it earlier.
    // Let's call the endpoint repeatedly until we get a 429.
    const statusCodes: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/v1/ai/intro-email')
        .send({ customerId: testCustomer.id, poolProfileId: testCandidate.id })
        .set('Authorization', 'Bearer mock-jwt');
      statusCodes.push(res.status);
      if (res.status === 429) {
        break;
      }
    }

    expect(statusCodes).toContain(429);
  });
});
