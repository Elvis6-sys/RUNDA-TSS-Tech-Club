// Shared auth utilities
// Browser client → lib/supabase-browser.ts (createBrowserSupabase)
// Server Component client → lib/supabase-server.ts (createServerSupabase)
// Route Handler client → lib/supabase-server.ts (createRouteSupabase)
export { createBrowserSupabase } from "./supabase-browser";
export { createServerSupabase, createRouteSupabase } from "./supabase-server";
