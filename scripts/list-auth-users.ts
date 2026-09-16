#!/usr/bin/env tsx

/**
 * List all users in local Supabase Auth
 * 
 * Usage:
 *   npx tsx scripts/list-auth-users.ts
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
  console.error('   Make sure .env file exists with:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  console.log('📋 Listing all users in Supabase Auth...\n');

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in Supabase Auth');
      console.log('\n💡 Create a test user with:');
      console.log('   npx tsx scripts/create-test-user.ts');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No (needs confirmation)'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata || {})}`);
      console.log('');
    });

    // Count confirmed vs unconfirmed
    const confirmed = users.filter(u => u.email_confirmed_at).length;
    const unconfirmed = users.length - confirmed;

    console.log(`📊 Summary:`);
    console.log(`   Total: ${users.length}`);
    console.log(`   Confirmed: ${confirmed}`);
    console.log(`   Unconfirmed: ${unconfirmed}`);

    if (unconfirmed > 0) {
      console.log(`\n⚠️  ${unconfirmed} user(s) need email confirmation`);
      console.log(`   Run this to auto-confirm all:`);
      console.log(`   npx tsx scripts/confirm-all-users.ts`);
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

listUsers();
