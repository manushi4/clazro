/**
 * Cache Manager Utility
 * Client-side caching for API responses
 * Phase 71: Comprehensive API Integration Layer
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../../lib/supabase';

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  version: string; // Cache version for invalidation
}

// Cache entry structure
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  version: string;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * CacheManager Class
 * Provides intelligent caching with TTL, versioning, and cleanup
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  
  private readonly DEFAULT_CONFIG: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    version: '1.0',
  };

  private readonly STORAGE_PREFIX = 'manushi_cache_';
  private readonly STATS_KEY = 'manushi_cache_stats';

  private constructor() {
    this.loadStatsFromStorage();
    this.startCleanupTimer();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set cache entry
   */
  public async set<T>(
    key: string, 
    data: T, 
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl,
      key,
      version: finalConfig.version,
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);
    
    // Enforce max size
    this.enforceMaxSize();
    
    // Persist to AsyncStorage for important data
    if (this.shouldPersist(key)) {
      try {
        await AsyncStorage.setItem(
          this.STORAGE_PREFIX + key,
          JSON.stringify(entry)
        );
      } catch (error) {
        console.warn('Failed to persist cache entry:', error);
      }
    }
    
    this.updateStats();
  }

  /**
   * Get cache entry
   */
  public async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let entry = this.memoryCache.get(key);
    
    // Fallback to AsyncStorage
    if (!entry && this.shouldPersist(key)) {
      try {
        const stored = await AsyncStorage.getItem(this.STORAGE_PREFIX + key);
        if (stored) {
          entry = JSON.parse(stored) as CacheEntry<T>;
          // Restore to memory cache
          this.memoryCache.set(key, entry);
        }
      } catch (error) {
        console.warn('Failed to load cache entry from storage:', error);
      }
    }

    // Check if entry exists and is valid
    if (!entry || this.isExpired(entry)) {
      this.stats.misses++;
      if (entry) {
        this.delete(key); // Clean up expired entry
      }
      return null;
    }

    this.stats.hits++;
    this.updateStats();
    return entry.data;
  }

  /**
   * Delete cache entry
   */
  public async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.shouldPersist(key)) {
      try {
        await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
      } catch (error) {
        console.warn('Failed to delete cache entry from storage:', error);
      }
    }
    
    this.updateStats();
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      // Get all keys and remove cache entries
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache from storage:', error);
    }
    
    this.resetStats();
  }

  /**
   * Check if cache has entry and it's valid
   */
  public async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get or set cache entry (cache-aside pattern)
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch new data
    const data = await fetcher();
    
    // Store in cache
    await this.set(key, data, config);
    
    return data;
  }

  /**
   * Cache API response
   */
  public async cacheApiResponse<T>(
    key: string,
    response: ApiResponse<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    if (response.success && response.data !== null) {
      await this.set(key, response, config);
    }
  }

  /**
   * Get cached API response
   */
  public async getCachedApiResponse<T>(key: string): Promise<ApiResponse<T> | null> {
    return await this.get<ApiResponse<T>>(key);
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidateByPattern(pattern: RegExp): Promise<void> {
    const keysToDelete: string[] = [];
    
    // Check memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    // Check AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .map(key => key.replace(this.STORAGE_PREFIX, ''))
        .filter(key => pattern.test(key));
      
      keysToDelete.push(...cacheKeys);
    } catch (error) {
      console.warn('Failed to get storage keys for invalidation:', error);
    }
    
    // Delete all matching keys
    await Promise.all(
      keysToDelete.map(key => this.delete(key))
    );
  }

  /**
   * Invalidate cache by prefix
   */
  public async invalidateByPrefix(prefix: string): Promise<void> {
    const pattern = new RegExp(`^${prefix}`);
    await this.invalidateByPattern(pattern);
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.memoryCache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Get all cache keys
   */
  public getCacheKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * Get cache size in bytes (approximate)
   */
  public getCacheSize(): number {
    let size = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      size += key.length;
      size += JSON.stringify(entry).length;
    }
    return size;
  }

  /**
   * Preload cache with important data
   */
  public async preload(preloadFunctions: Array<() => Promise<void>>): Promise<void> {
    console.log('🚀 Preloading cache...');
    
    const startTime = Date.now();
    
    await Promise.allSettled(
      preloadFunctions.map(async (fn, index) => {
        try {
          await fn();
        } catch (error) {
          console.warn(`Preload function ${index} failed:`, error);
        }
      })
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cache preloading completed in ${duration}ms`);
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private shouldPersist(key: string): boolean {
    // Persist important data that should survive app restarts
    const persistentKeys = [
      'user_profile',
      'app_config',
      'theme_settings',
    ];
    
    return persistentKeys.some(pattern => key.includes(pattern));
  }

  private enforceMaxSize(): void {
    while (this.memoryCache.size > this.DEFAULT_CONFIG.maxSize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }

  private updateStats(): void {
    this.stats.size = this.memoryCache.size;
    this.saveStatsToStorage();
  }

  private resetStats(): void {
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
    this.saveStatsToStorage();
  }

  private async saveStatsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  private async loadStatsFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STATS_KEY);
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  private cleanupExpired(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.memoryCache.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
      this.updateStats();
    }
  }
}

// Singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => `user_profile_${userId}`,
  userDashboard: (userId: string, role: string) => `dashboard_${role}_${userId}`,
  classList: (teacherId: string) => `classes_teacher_${teacherId}`,
  studentClasses: (studentId: string) => `classes_student_${studentId}`,
  assignments: (classId: string) => `assignments_class_${classId}`,
  notifications: (userId: string) => `notifications_${userId}`,
  submissions: (assignmentId: string, studentId: string) => `submissions_${assignmentId}_${studentId}`,
  attendance: (classId: string) => `attendance_class_${classId}`,
  parentChildren: (parentId: string) => `parent_children_${parentId}`,
  systemStats: () => 'admin_system_stats',
  appConfig: () => 'app_config',
};

// Cache durations (in milliseconds)
export const CacheDurations = {
  SHORT: 1 * 60 * 1000,     // 1 minute
  MEDIUM: 5 * 60 * 1000,    // 5 minutes  
  LONG: 30 * 60 * 1000,     // 30 minutes
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
};

// Convenience functions
export const setCache = <T>(
  key: string, 
  data: T, 
  ttl: number = CacheDurations.MEDIUM
): Promise<void> => {
  return cacheManager.set(key, data, { ttl });
};

export const getCache = <T>(key: string): Promise<T | null> => {
  return cacheManager.get<T>(key);
};

export const clearCache = (): Promise<void> => {
  return cacheManager.clear();
};

export const invalidateUserCache = (userId: string): Promise<void> => {
  return cacheManager.invalidateByPattern(new RegExp(`.*${userId}.*`));
};

export default cacheManager;