// DEPRECATED: Supabase has been replaced with local auth
// This file exists only for compatibility with old imports
// Returns a mock object that prevents build errors

export function createBrowserSupabase() {
  const channelMock = {
    on: (...args: any[]) => channelMock, // Return self for chaining
    subscribe: (callback?: (status: any) => void) => {
      // Call callback immediately with a fake "SUBSCRIBED" status
      if (callback) callback('SUBSCRIBED');
      return { unsubscribe: () => { } };
    },
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    // Mock realtime methods for components that use subscriptions
    channel: (name: string, options?: any) => channelMock,
    removeChannel: (channel: any) => { }, // Mock cleanup method
  };
}
