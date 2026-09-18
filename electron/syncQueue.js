/**
 * Sync Queue Module
 * 
 * Provides offline-first submission queue with:
 * - Local queueing of submissions when offline
 * - Background sync worker with exponential backoff
 * - Retry logic with configurable intervals
 * - Opportunistic sync when network available
 * 
 * Uses electron-store for encrypted persistence.
 */

const Store = require('electron-store');
const { net } = require('electron');
const { v4: uuidv4 } = require('uuid');

// Initialize encrypted store for sync queue
// electron-store uses default export
const queueStore = new Store.default({
  name: 'sync-queue',
  encryptionKey: 'runda-tss-sync-queue-2026', // TODO: Generate per-installation key
  defaults: {
    pendingItems: [],
    completedItems: [],
    failedItems: []
  }
});

// Sync configuration
const SYNC_CONFIG = {
  INITIAL_RETRY_DELAY: 30000,      // 30 seconds
  MAX_RETRY_DELAY: 900000,         // 15 minutes
  BACKOFF_MULTIPLIER: 2,           // Exponential backoff
  MAX_RETRY_ATTEMPTS: 10,          // After 10 failures, mark as failed
  POLL_INTERVAL: 30000,            // Check queue every 30s when online
  NETWORK_CHECK_INTERVAL: 5000     // Check network every 5s when offline
};

class SyncQueue {
  constructor() {
    this.syncTimer = null;
    this.networkCheckTimer = null;
    this.isSyncing = false;
    this.isOnline = false;
    this.syncCallbacks = []; // Callbacks to notify renderer of sync status
  }

  /**
   * Add an item to the sync queue
   * @param {string} type - 'quiz_submission' | 'integrity_report' | 'assignment_submission'
   * @param {Object} payload - Data to sync
   * @param {Object} metadata - { userId, nodeId, blockId, submissionId }
   * @returns {string} queueId
   */
  enqueue(type, payload, metadata = {}) {
    const queueId = uuidv4();
    const now = Date.now();

    const item = {
      queueId,
      type,
      payload,
      metadata,
      status: 'pending',
      createdAt: now,
      lastAttemptAt: null,
      nextRetryAt: now, // Try immediately
      retryCount: 0,
      retryDelay: SYNC_CONFIG.INITIAL_RETRY_DELAY,
      error: null
    };

    const pendingItems = queueStore.get('pendingItems', []);
    pendingItems.push(item);
    queueStore.set('pendingItems', pendingItems);

    console.log(`📥 [SYNC QUEUE] Item enqueued: ${type} (${queueId})`);
    console.log(`   - Metadata:`, metadata);

    // Trigger immediate sync attempt
    this.triggerSync();

    return queueId;
  }

  /**
   * Start the background sync worker
   */
  startSyncWorker() {
    if (this.syncTimer) {
      console.log(`⚠️ [SYNC QUEUE] Sync worker already running`);
      return;
    }

    console.log(`🔄 [SYNC QUEUE] Starting background sync worker (${SYNC_CONFIG.POLL_INTERVAL}ms interval)`);

    // Initial network check
    this.checkNetworkStatus();

    // Poll queue periodically
    this.syncTimer = setInterval(() => {
      this.checkNetworkStatus();
      if (this.isOnline && !this.isSyncing) {
        this.processQueue();
      }
    }, SYNC_CONFIG.POLL_INTERVAL);

    // Check network more frequently when offline
    this.networkCheckTimer = setInterval(() => {
      if (!this.isOnline) {
        this.checkNetworkStatus();
      }
    }, SYNC_CONFIG.NETWORK_CHECK_INTERVAL);
  }

  /**
   * Stop the background sync worker
   */
  stopSyncWorker() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log(`⏸️ [SYNC QUEUE] Sync worker stopped`);
    }
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }
  }

  /**
   * Check network connectivity
   * @returns {boolean}
   */
  checkNetworkStatus() {
    const wasOnline = this.isOnline;
    this.isOnline = net.isOnline();

    if (this.isOnline && !wasOnline) {
      console.log(`✅ [SYNC QUEUE] Network connection restored`);
      this.triggerSync(); // Immediate sync when coming back online
    } else if (!this.isOnline && wasOnline) {
      console.log(`❌ [SYNC QUEUE] Network connection lost`);
    }

    return this.isOnline;
  }

  /**
   * Trigger an immediate sync attempt (non-blocking)
   */
  triggerSync() {
    if (!this.isOnline) {
      console.log(`⏳ [SYNC QUEUE] Cannot sync: offline`);
      return;
    }

    if (this.isSyncing) {
      console.log(`⏳ [SYNC QUEUE] Sync already in progress`);
      return;
    }

    // Use setTimeout to make it non-blocking
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Process the sync queue (main sync logic)
   */
  async processQueue() {
    if (this.isSyncing) return;
    if (!this.isOnline) return;

    this.isSyncing = true;
    const now = Date.now();

    try {
      const pendingItems = queueStore.get('pendingItems', []);

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 [SYNC QUEUE] Processing queue (${pendingItems.length} items)`);

      // Filter items ready for retry (nextRetryAt <= now)
      const itemsToSync = pendingItems.filter(item => item.nextRetryAt <= now);

      if (itemsToSync.length === 0) {
        console.log(`⏳ [SYNC QUEUE] No items ready for retry yet`);
        this.isSyncing = false;
        this.notifyRenderer();
        return;
      }

      console.log(`🔄 [SYNC QUEUE] Attempting to sync ${itemsToSync.length} items`);

      // Process each item
      for (const item of itemsToSync) {
        await this.syncItem(item);
      }

      this.notifyRenderer();
    } catch (error) {
      console.error(`❌ [SYNC QUEUE] Error processing queue:`, error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item
   * @param {Object} item
   */
  async syncItem(item) {
    const now = Date.now();
    item.lastAttemptAt = now;
    item.retryCount++;

    console.log(`📤 [SYNC QUEUE] Syncing item ${item.queueId} (attempt ${item.retryCount})`);

    try {
      // Determine API endpoint based on type
      let endpoint;
      let method = 'POST';
      let body = item.payload;

      switch (item.type) {
        case 'quiz_submission':
          endpoint = 'http://localhost:3001/api/quiz/submit-quiz';
          body = { ...item.payload, fromSyncQueue: true };
          break;
        case 'integrity_report':
          endpoint = 'http://localhost:3001/api/quiz/integrity-report';
          break;
        case 'assignment_submission':
          endpoint = 'http://localhost:3001/api/assignments/submit';
          break;
        default:
          throw new Error(`Unknown sync type: ${item.type}`);
      }

      // Make HTTP request using Electron's net module
      const response = await this.makeRequest(endpoint, method, body);

      if (response.ok) {
        console.log(`✅ [SYNC QUEUE] Item synced successfully: ${item.queueId}`);
        this.markAsCompleted(item, response.data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`❌ [SYNC QUEUE] Sync failed for ${item.queueId}:`, error.message);

      item.error = error.message;

      if (item.retryCount >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
        console.error(`🚫 [SYNC QUEUE] Max retries exceeded for ${item.queueId}, moving to failed`);
        this.markAsFailed(item);
      } else {
        // Calculate next retry with exponential backoff
        item.retryDelay = Math.min(
          item.retryDelay * SYNC_CONFIG.BACKOFF_MULTIPLIER,
          SYNC_CONFIG.MAX_RETRY_DELAY
        );
        item.nextRetryAt = now + item.retryDelay;

        console.log(`⏰ [SYNC QUEUE] Will retry ${item.queueId} in ${item.retryDelay / 1000}s`);
        this.updatePendingItem(item);
      }
    }
  }

  /**
   * Make HTTP request using Electron's net module
   * @param {string} url
   * @param {string} method
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  makeRequest(url, method, body) {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method,
        url,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let responseData = '';

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          try {
            const data = responseData ? JSON.parse(responseData) : {};
            resolve({
              ok: response.statusCode >= 200 && response.statusCode < 300,
              status: response.statusCode,
              statusText: response.statusMessage,
              data
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      if (body) {
        request.write(JSON.stringify(body));
      }

      request.end();
    });
  }

  /**
   * Mark item as successfully completed
   * @param {Object} item
   * @param {Object} responseData
   */
  markAsCompleted(item, responseData) {
    // Remove from pending
    let pendingItems = queueStore.get('pendingItems', []);
    pendingItems = pendingItems.filter(i => i.queueId !== item.queueId);
    queueStore.set('pendingItems', pendingItems);

    // Add to completed
    const completedItems = queueStore.get('completedItems', []);
    completedItems.push({
      ...item,
      status: 'completed',
      completedAt: Date.now(),
      responseData
    });
    queueStore.set('completedItems', completedItems);
  }

  /**
   * Mark item as failed (max retries exceeded)
   * @param {Object} item
   */
  markAsFailed(item) {
    // Remove from pending
    let pendingItems = queueStore.get('pendingItems', []);
    pendingItems = pendingItems.filter(i => i.queueId !== item.queueId);
    queueStore.set('pendingItems', pendingItems);

    // Add to failed
    const failedItems = queueStore.get('failedItems', []);
    failedItems.push({
      ...item,
      status: 'failed',
      failedAt: Date.now()
    });
    queueStore.set('failedItems', failedItems);
  }

  /**
   * Update pending item in store
   * @param {Object} item
   */
  updatePendingItem(item) {
    let pendingItems = queueStore.get('pendingItems', []);
    const index = pendingItems.findIndex(i => i.queueId === item.queueId);
    if (index >= 0) {
      pendingItems[index] = item;
      queueStore.set('pendingItems', pendingItems);
    }
  }

  /**
   * Get current sync status
   * @returns {Object}
   */
  getStatus() {
    const pendingItems = queueStore.get('pendingItems', []);
    const completedItems = queueStore.get('completedItems', []);
    const failedItems = queueStore.get('failedItems', []);

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: pendingItems.length,
      completedCount: completedItems.length,
      failedCount: failedItems.length,
      pendingItems: pendingItems.map(item => ({
        queueId: item.queueId,
        type: item.type,
        metadata: item.metadata,
        retryCount: item.retryCount,
        nextRetryAt: item.nextRetryAt,
        createdAt: item.createdAt
      })),
      storePath: queueStore.path
    };
  }

  /**
   * Register callback to notify renderer of sync status changes
   * @param {Function} callback
   */
  onStatusChange(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * Notify renderer of sync status changes
   */
  notifyRenderer() {
    const status = this.getStatus();
    this.syncCallbacks.forEach(cb => {
      try {
        cb(status);
      } catch (error) {
        console.error(`❌ [SYNC QUEUE] Error in status callback:`, error);
      }
    });
  }

  /**
   * Force immediate sync (called by user action)
   */
  forceSyncNow() {
    console.log(`🔄 [SYNC QUEUE] Force sync requested`);
    this.checkNetworkStatus();
    if (this.isOnline) {
      this.triggerSync();
    } else {
      console.log(`❌ [SYNC QUEUE] Cannot force sync: offline`);
    }
  }

  /**
   * Clear completed items (cleanup)
   */
  clearCompleted() {
    queueStore.set('completedItems', []);
    console.log(`🧹 [SYNC QUEUE] Completed items cleared`);
  }

  /**
   * Clear all queue data (for testing/debugging)
   */
  clearAll() {
    queueStore.clear();
    console.log(`🧹 [SYNC QUEUE] All queue data cleared`);
  }
}

// Export singleton instance
module.exports = new SyncQueue();
