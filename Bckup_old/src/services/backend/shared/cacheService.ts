/**
 * Cache Service
 * Provides in-memory caching with TTL (Time To Live) support
 *
 * Features:
 * - In-memory cache with automatic expiration
 * - TTL-based cache invalidation
 * - Cache statistics and monitoring
 * - Namespace support for organized cache keys
 * - Bulk operations
 */

// ==================== TYPES ====================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  totalKeys: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  namespace?: string; // Cache namespace for organization
}

// ==================== CACHE CLASS ====================

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default: 300000 = 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hits++;

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   * @returns boolean
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   * @param key - Cache key
   * @returns boolean - true if deleted, false if not found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clear expired entries
   * @returns number - Number of entries cleared
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get all keys in cache
   * @param includeExpired - Include expired keys (default: false)
   * @returns string[]
   */
  keys(includeExpired: boolean = false): string[] {
    if (includeExpired) {
      return Array.from(this.cache.keys());
    }

    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= entry.ttl) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * Get cache statistics
   * @returns CacheStats
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    // Estimate memory usage (rough approximation)
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.data).length;
    }

    return {
      totalKeys: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Update TTL for an existing key
   * @param key - Cache key
   * @param ttl - New TTL in milliseconds
   * @returns boolean - true if updated, false if key not found
   */
  updateTTL(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.timestamp = Date.now(); // Reset timestamp
    return true;
  }

  /**
   * Get or set a value (lazy evaluation)
   * @param key - Cache key
   * @param factory - Factory function to generate value if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Promise<T>
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }
}

// ==================== SINGLETON INSTANCE ====================

const cacheInstance = new InMemoryCache();

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Generate a namespaced cache key
 * @param namespace - Cache namespace
 * @param key - Cache key
 * @returns string
 */
export function generateCacheKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * Set a value in cache
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options
 */
export function setCache<T>(
  key: string,
  data: T,
  options?: CacheOptions
): void {
  const cacheKey = options?.namespace
    ? generateCacheKey(options.namespace, key)
    : key;
  const ttl = options?.ttl || 300000;

  cacheInstance.set(cacheKey, data, ttl);
}

/**
 * Get a value from cache
 * @param key - Cache key
 * @param options - Cache options
 * @returns T | null
 */
export function getCache<T>(key: string, options?: CacheOptions): T | null {
  const cacheKey = options?.namespace
    ? generateCacheKey(options.namespace, key)
    : key;

  return cacheInstance.get<T>(cacheKey);
}

/**
 * Check if a key exists in cache
 * @param key - Cache key
 * @param options - Cache options
 * @returns boolean
 */
export function hasCache(key: string, options?: CacheOptions): boolean {
  const cacheKey = options?.namespace
    ? generateCacheKey(options.namespace, key)
    : key;

  return cacheInstance.has(cacheKey);
}

/**
 * Delete a key from cache
 * @param key - Cache key
 * @param options - Cache options
 * @returns boolean
 */
export function deleteCache(key: string, options?: CacheOptions): boolean {
  const cacheKey = options?.namespace
    ? generateCacheKey(options.namespace, key)
    : key;

  return cacheInstance.delete(cacheKey);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cacheInstance.clear();
}

/**
 * Clear cache entries by namespace
 * @param namespace - Cache namespace
 * @returns number - Number of entries cleared
 */
export function clearCacheNamespace(namespace: string): number {
  const keys = cacheInstance.keys();
  const prefix = `${namespace}:`;
  let cleared = 0;

  for (const key of keys) {
    if (key.startsWith(prefix)) {
      cacheInstance.delete(key);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Clear expired entries
 * @returns number - Number of entries cleared
 */
export function clearExpiredCache(): number {
  return cacheInstance.clearExpired();
}

/**
 * Get cache statistics
 * @returns CacheStats
 */
export function getCacheStats(): CacheStats {
  return cacheInstance.getStats();
}

/**
 * Get or set a value with lazy evaluation
 * @param key - Cache key
 * @param factory - Factory function to generate value
 * @param options - Cache options
 * @returns Promise<T>
 */
export async function getOrSetCache<T>(
  key: string,
  factory: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cacheKey = options?.namespace
    ? generateCacheKey(options.namespace, key)
    : key;
  const ttl = options?.ttl || 300000;

  return cacheInstance.getOrSet(cacheKey, factory, ttl);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Invalidate cache on data mutation
 * @param keys - Array of cache keys to invalidate
 * @param namespace - Optional namespace
 */
export function invalidateCache(keys: string[], namespace?: string): void {
  for (const key of keys) {
    deleteCache(key, { namespace });
  }
}

/**
 * Warm up cache with data
 * @param data - Array of key-value pairs to cache
 * @param options - Cache options
 */
export function warmUpCache<T>(
  data: Array<{ key: string; value: T }>,
  options?: CacheOptions
): void {
  for (const { key, value } of data) {
    setCache(key, value, options);
  }
}

// ==================== AUTO CLEANUP ====================

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleared = clearExpiredCache();
    if (cleared > 0) {
      console.log(`[CacheService] Cleared ${cleared} expired cache entries`);
    }
  }, 300000); // 5 minutes
}

// ==================== EXPORTS ====================

export default {
  set: setCache,
  get: getCache,
  has: hasCache,
  delete: deleteCache,
  clear: clearAllCache,
  clearNamespace: clearCacheNamespace,
  clearExpired: clearExpiredCache,
  getStats: getCacheStats,
  getOrSet: getOrSetCache,
  invalidate: invalidateCache,
  warmUp: warmUpCache,
};
