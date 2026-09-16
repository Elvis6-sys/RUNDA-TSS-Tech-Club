// DEPRECATED: Supabase has been replaced with local auth
// This file exists only for compatibility with old imports
// Use getCurrentUser() from lib/local-auth.ts instead

import { getCurrentUser } from './local-auth';

export function createServerSupabase() {
  // Return a minimal compatible object
  return {
    auth: {
      getUser: async () => {
        const user = await getCurrentUser();
        return { data: { user }, error: null };
      },
      getSession: async () => {
        const user = await getCurrentUser();
        return { data: { session: user ? { user } : null }, error: null };
      },
    },
  };
}

export const createRouteSupabase = createServerSupabase;
