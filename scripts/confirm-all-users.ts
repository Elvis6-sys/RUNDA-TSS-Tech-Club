#!/usr/bin/env tsx

/**
 * Auto-confirm all unconfirmed users in Supabase Auth
 * Useful for local development to skip email verification
 * 
 * Usage:
 *   npx tsx scripts/confirm-all-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  console.log('✉️  Auto-confirming all unconfirmed users...\n');

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found');
      return;
    }

    const unconfirmed = users.filter(u => !u.email_confirmed_at);

    if (unconfirmed.length === 0) {
      console.log('✅ All users are already confirmed!');
      return;
    }

    console.log(`Found ${unconfirmed.length} unconfirmed user(s):\n`);

    let confirmed = 0;
    let failed = 0;

    for (const user of unconfirmed) {
      try {
        console.log(`📧 Confirming: ${user.email}...`);

        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error(`   ❌ Failed: ${updateError.message}`);
          failed++;
        } else {
          console.log(`   ✅ Confirmed`);
          confirmed++;
        }

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Confirmed: ${confirmed}`);
    console.log(`   Failed: ${failed}`);

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

confirmAllUsers();
