/**
 * Smart API Key Rotation Manager
 * Automatically rotates between multiple Groq API keys when rate limits are hit
 * 
 * ✅ WORKS WITH ALL GROQ MODELS:
 * - GPT-OSS 120B (current)
 * - Llama models (if available)
 * - Qwen models
 * - Any future Groq-hosted models
 * 
 * The rotation is MODEL-AGNOSTIC — it only cares about API rate limits,
 * not which model you're using. All Groq API keys share the same endpoint
 * and can access any model available on your tier.
 */

interface APIKeyStatus {
  key: string;
  isAvailable: boolean;
  resetTime?: Date;
  usageCount: number;
  lastError?: string;
}

class APIKeyManager {
  private keys: APIKeyStatus[];
  private currentIndex: number = 0;
  private readonly RATE_LIMIT_RESET_HOURS = 24;

  constructor(apiKeys: string[]) {
    this.keys = apiKeys.map(key => ({
      key,
      isAvailable: true,
      usageCount: 0
    }));
  }

  /**
   * Get the next available API key
   * Automatically rotates to find an available key across all 13 keys
   */
  getNextKey(): string {
    const maxAttempts = this.keys.length;
    const startIndex = this.currentIndex;

    // Search through ALL keys to find one that's available
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const currentKey = this.keys[this.currentIndex];

      // Check if reset time has passed and restore availability
      if (currentKey.resetTime && new Date() > currentKey.resetTime) {
        currentKey.isAvailable = true;
        currentKey.resetTime = undefined;
        currentKey.lastError = undefined;
        console.log(`♻️ Key ${this.currentIndex + 1} reset time passed - now available`);
      }

      // If this key is available, use it!
      if (currentKey.isAvailable) {
        currentKey.usageCount++;
        const keyNumber = this.currentIndex + 1;
        console.log(`🔑 Using API key ${keyNumber} of ${this.keys.length} (${this.keys.filter(k => k.isAvailable).length} available)`);
        return currentKey.key;
      }

      // Try next key
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }

    // All keys exhausted - return first one anyway with warning
    this.currentIndex = startIndex;
    console.error(`❌ All ${this.keys.length} API keys are rate limited! Returning current key (will likely fail).`);
    return this.keys[this.currentIndex].key;
  }

  /**
   * Mark current key as rate limited and rotate to next available key
   * Called when we receive 429 error
   */
  markCurrentKeyAsLimited(resetInSeconds: number = 86400) {
    const limitedKeyIndex = this.currentIndex;
    const currentKey = this.keys[limitedKeyIndex];
    currentKey.isAvailable = false;
    currentKey.resetTime = new Date(Date.now() + (resetInSeconds * 1000));
    currentKey.lastError = 'Rate limit exceeded';

    console.log(`🔄 Key ${limitedKeyIndex + 1} rate limited until ${currentKey.resetTime.toLocaleString()}`);

    // Find next available key (don't just rotate sequentially)
    const availableKeys = this.keys.filter(k => k.isAvailable).length;

    if (availableKeys > 0) {
      // Smart rotation: find the next available key
      for (let i = 1; i <= this.keys.length; i++) {
        const nextIndex = (limitedKeyIndex + i) % this.keys.length;
        if (this.keys[nextIndex].isAvailable) {
          this.currentIndex = nextIndex;
          console.log(`✅ Rotated to key ${this.currentIndex + 1} (${availableKeys} keys still available)`);
          return;
        }
      }
    } else {
      console.error(`❌ All ${this.keys.length} API keys are now rate limited!`);
    }
  }

  /**
   * Mark current key as failed (for other errors)
   */
  markCurrentKeyAsFailed(error: string) {
    const currentKey = this.keys[this.currentIndex];
    currentKey.lastError = error;
    console.warn(`⚠️ Key ${this.currentIndex + 1} failed: ${error}`);
  }

  /**
   * Get status of all keys
   */
  getStatus(): { available: number; total: number; currentIndex: number; keys: APIKeyStatus[] } {
    const available = this.keys.filter(k => k.isAvailable).length;
    return {
      available,
      total: this.keys.length,
      currentIndex: this.currentIndex,
      keys: this.keys.map(k => ({
        key: `${k.key.substring(0, 10)}...${k.key.substring(k.key.length - 4)}`,
        isAvailable: k.isAvailable,
        resetTime: k.resetTime,
        usageCount: k.usageCount,
        lastError: k.lastError
      }))
    };
  }

  /**
   * Force rotate to next key (manual override)
   */
  forceRotate() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`🔄 Manually rotated to key ${this.currentIndex + 1}`);
  }

  /**
   * Reset all keys (clear rate limits)
   */
  resetAllKeys() {
    this.keys.forEach(key => {
      key.isAvailable = true;
      key.resetTime = undefined;
      key.lastError = undefined;
    });
    console.log('✅ All API keys reset');
  }

  /**
   * Get current key index (for logging)
   */
  getCurrentKeyIndex(): number {
    return this.currentIndex + 1; // 1-based for human readability
  }
}

// Load API keys from environment (21 keys for maximum capacity!)
const API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY_8,
  process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10,
  process.env.GROQ_API_KEY_11,
  process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13,
  process.env.GROQ_API_KEY_14,
  process.env.GROQ_API_KEY_15,
  process.env.GROQ_API_KEY_16,
  process.env.GROQ_API_KEY_17,
  process.env.GROQ_API_KEY_18,
  process.env.GROQ_API_KEY_19,
  process.env.GROQ_API_KEY_20,
  process.env.GROQ_API_KEY_21,
].filter(Boolean) as string[]; // Remove undefined keys

// Log loaded keys count on startup
console.log(`✅ API Key Manager initialized with ${API_KEYS.length} keys`);
if (API_KEYS.length < 21) {
  console.warn(`⚠️ Warning: Only ${API_KEYS.length} of 21 keys loaded. Check .env file.`);
}

// Create singleton instance
export const apiKeyManager = new APIKeyManager(API_KEYS);

// Helper function to get current key
export function getCurrentAPIKey(): string {
  return apiKeyManager.getNextKey();
}

// Helper function to handle rate limit error
export function handleRateLimitError(resetInSeconds?: number) {
  apiKeyManager.markCurrentKeyAsLimited(resetInSeconds);
}

// Helper function to get manager status
export function getAPIKeyManagerStatus() {
  return apiKeyManager.getStatus();
}

// Export manager for advanced usage
export default apiKeyManager;
