/**
 * Tauri Bridge for iframe communication
 * 
 * This module provides a bridge between the Next.js app (running in an iframe)
 * and the Tauri wrapper (which has access to the real Tauri API).
 */

let bridgeReady = false;
let requestId = 0;
const pendingRequests = new Map<number, {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}>();

// Check if we're in an iframe
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Listen for messages from parent (Tauri wrapper)
if (typeof window !== 'undefined' && isInIframe()) {
  window.addEventListener('message', (event) => {
    const { type, id, success, result, error } = event.data;
    
    if (type === 'TAURI_BRIDGE_READY') {
      console.log('✅ Tauri bridge is ready!');
      bridgeReady = true;
      return;
    }
    
    if (type === 'TAURI_RESULT') {
      const pending = pendingRequests.get(id);
      if (pending) {
        if (success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error));
        }
        pendingRequests.delete(id);
      }
    }
  });
}

/**
 * Invoke a Tauri command through the bridge
 */
export async function invoke<T = any>(command: string, args?: Record<string, any>): Promise<T> {
  // If not in iframe, we're in regular browser - throw error
  if (!isInIframe()) {
    throw new Error('Not in Tauri environment');
  }
  
  // Wait for bridge to be ready (max 2 seconds)
  const startTime = Date.now();
  while (!bridgeReady && Date.now() - startTime < 2000) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  if (!bridgeReady) {
    throw new Error('Tauri bridge not ready');
  }
  
  // Create request
  const id = requestId++;
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    
    // Send message to parent
    window.parent.postMessage({
      type: 'TAURI_INVOKE',
      id,
      command,
      args: args || {}
    }, '*');
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Tauri command timeout: ${command}`));
      }
    }, 10000);
  });
}

/**
 * Check if Tauri is available
 */
export function isTauriAvailable(): boolean {
  return isInIframe() && bridgeReady;
}

/**
 * Wait for Tauri bridge to be ready
 */
export async function waitForTauri(timeoutMs: number = 3000): Promise<boolean> {
  if (!isInIframe()) {
    return false;
  }
  
  const startTime = Date.now();
  while (!bridgeReady && Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return bridgeReady;
}
