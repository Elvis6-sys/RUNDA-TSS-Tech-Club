/**
 * Tauri Initialization Script
 * This script ensures the Tauri API is available when loading from localhost:3001
 */

(function() {
  console.log('🔧 Tauri Init: Checking for Tauri environment...');
  
  // Check if we're in Tauri by looking for the injected metadata
  if (window.__TAURI_METADATA__) {
    console.log('✅ Tauri Init: __TAURI_METADATA__ found');
  } else {
    console.log('⚠️ Tauri Init: __TAURI_METADATA__ not found');
  }
  
  // Check if __TAURI__ global is available
  if (window.__TAURI__) {
    console.log('✅ Tauri Init: __TAURI__ global is available');
    console.log('   Available modules:', Object.keys(window.__TAURI__));
  } else {
    console.log('⚠️ Tauri Init: __TAURI__ global not available');
  }
  
  // Log user agent for debugging
  console.log('🔍 User Agent:', navigator.userAgent);
})();
