import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AuthProfileCache } from '../../utils/cache';

// Mock the db
const mockDb = {
  where: jest.fn(),
};

jest.mock('../../../../../db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (...args: any[]) => mockDb.where(...args),
      }),
    }),
  },
}));

// Mock Supabase getUser
const mockGetUser = jest.fn();
jest.mock('../../services/auth.service', () => ({
  supabase: {
    auth: {
      getUser: (token: string) => mockGetUser(token),
    },
  },
}));

describe('AuthProfileCache Unit Tests', () => {
  beforeEach(() => {
    AuthProfileCache.clear();
  });

  it('should set and get items from cache', () => {
    const profile = { id: 'mm-1', fullName: 'John Doe', email: 'john@example.com' };
    AuthProfileCache.set('auth-1', profile);
    expect(AuthProfileCache.get('auth-1')).toEqual(profile);
  });

  it('should return null for expired items', () => {
    const profile = { id: 'mm-1', fullName: 'John Doe', email: 'john@example.com' };
    
    // Mock Date.now to test expiration
    const realNow = Date.now;
    const startTime = 1000000;
    let mockTime = startTime;
    global.Date.now = () => mockTime;

    AuthProfileCache.set('auth-1', profile);
    expect(AuthProfileCache.get('auth-1')).toEqual(profile);

    // Fast forward 5 minutes + 1 second
    mockTime += 5 * 60 * 1000 + 1000;
    expect(AuthProfileCache.get('auth-1')).toBeNull();

    // Restore Date.now
    global.Date.now = realNow;
  });
});

describe('requireAuth Middleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    AuthProfileCache.clear();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should return 401 if token is missing', async () => {
    await requireAuth(req as AuthenticatedRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Token missing' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', async () => {
    req.headers!.authorization = 'Bearer invalid-token';
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Invalid token') });

    await requireAuth(req as AuthenticatedRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if matchmaker profile is not resolved in DB and cache', async () => {
    req.headers!.authorization = 'Bearer valid-token';
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'auth-user-1', email: 'test@example.com' } }, error: null });
    mockDb.where.mockResolvedValueOnce([]); // DB returns empty array

    await requireAuth(req as AuthenticatedRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should query DB and store in cache on cache miss, then populate req.user and call next', async () => {
    req.headers!.authorization = 'Bearer valid-token';
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'auth-user-1', email: 'test@example.com' } }, error: null });
    
    const dbRecord = { id: 'mm-1', fullName: 'Matchmaker One', email: 'test@example.com' };
    mockDb.where.mockResolvedValueOnce([dbRecord]);

    await requireAuth(req as AuthenticatedRequest, res as Response, next);

    expect(mockDb.where).toHaveBeenCalled();
    expect(req.user).toEqual({
      supabaseId: 'auth-user-1',
      matchmakerId: 'mm-1',
      email: 'test@example.com',
    });
    expect(next).toHaveBeenCalled();

    // Verify it is cached
    expect(AuthProfileCache.get('auth-user-1')).toEqual(dbRecord);
  });

  it('should read from cache on cache hit and NOT query DB, then populate req.user and call next', async () => {
    // Prime the cache
    const cachedRecord = { id: 'mm-cached', fullName: 'Cached Matchmaker', email: 'test@example.com' };
    AuthProfileCache.set('auth-user-2', cachedRecord);

    req.headers!.authorization = 'Bearer valid-token-cached';
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'auth-user-2', email: 'test@example.com' } }, error: null });

    await requireAuth(req as AuthenticatedRequest, res as Response, next);

    // DB select/where should NOT have been called in this test run
    expect(mockDb.where).not.toHaveBeenCalled();
    expect(req.user).toEqual({
      supabaseId: 'auth-user-2',
      matchmakerId: 'mm-cached',
      email: 'test@example.com',
    });
    expect(next).toHaveBeenCalled();
  });
});
