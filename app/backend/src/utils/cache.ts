export interface CachedProfile {
  id: string;
  fullName: string;
  email: string;
}

interface CacheEntry {
  profile: CachedProfile;
  expiresAt: number;
}

export class AuthProfileCache {
  private static cache = new Map<string, CacheEntry>();
  private static TTL_MS = 5 * 60 * 1000; // 5 minutes

  static get(authId: string): CachedProfile | null {
    const entry = this.cache.get(authId);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(authId);
      return null;
    }

    return entry.profile;
  }

  static set(authId: string, profile: CachedProfile): void {
    this.cache.set(authId, {
      profile,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  static delete(authId: string): void {
    this.cache.delete(authId);
  }

  static clear(): void {
    this.cache.clear();
  }
}
