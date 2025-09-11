// src\lib\cache.ts
// This module provides caching strategies for various data types

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // SWR time in seconds
  maxSize?: number; // Maximum cache size
}

class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 300): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
const orderCache = new MemoryCache(50);
const profileCache = new MemoryCache(100);
const statsCache = new MemoryCache(10);

// Cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => `profile:${userId}`,
  userOrders: (userId: string) => `orders:${userId}`,
  adminOrders: () => 'admin:orders',
  orderStats: () => 'stats:orders',
  userCredits: (userId: string) => `credits:${userId}`,
} as const;

// Cache wrapper functions
export async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300 } = options;
  
  // Try to get from cache first
  const cached = getFromCache(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  setCache(key, data, ttl);
  
  return data;
}

export function getFromCache(key: string): any | null {
  // Determine which cache to use based on key prefix
  if (key.startsWith('profile:') || key.startsWith('credits:')) {
    return profileCache.get(key);
  } else if (key.startsWith('orders:') || key.startsWith('admin:orders')) {
    return orderCache.get(key);
  } else if (key.startsWith('stats:')) {
    return statsCache.get(key);
  }
  
  return null;
}

export function setCache(key: string, data: any, ttl: number = 300): void {
  // Determine which cache to use based on key prefix
  if (key.startsWith('profile:') || key.startsWith('credits:')) {
    profileCache.set(key, data, ttl);
  } else if (key.startsWith('orders:') || key.startsWith('admin:orders')) {
    orderCache.set(key, data, ttl);
  } else if (key.startsWith('stats:')) {
    statsCache.set(key, data, ttl);
  }
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    // Clear all caches
    orderCache.clear();
    profileCache.clear();
    statsCache.clear();
    return;
  }

  // Pattern-based invalidation would require more complex implementation
  // For now, clear relevant caches based on pattern
  if (pattern.includes('profile')) {
    profileCache.clear();
  }
  if (pattern.includes('order')) {
    orderCache.clear();
  }
  if (pattern.includes('stats')) {
    statsCache.clear();
  }
}

// React Hook for client-side caching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  // This would be implemented as a custom React hook for client-side caching
  // For now, it's a placeholder for future implementation
  return {
    data: null,
    isLoading: true,
    error: null,
    mutate: () => {},
  };
}

// Cache statistics for monitoring
export function getCacheStats() {
  return {
    profiles: {
      size: profileCache.size(),
      maxSize: 100,
    },
    orders: {
      size: orderCache.size(),
      maxSize: 50,
    },
    stats: {
      size: statsCache.size(),
      maxSize: 10,
    },
  };
}