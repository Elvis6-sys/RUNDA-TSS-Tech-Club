#!/usr/bin/env tsx

/**
 * Create a test user in local Supabase for authentication testing
 * 
 * Usage:
 *   npx tsx scripts/create-test-user.ts
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

async function createTestUser() {
  console.log('🔧 Creating test user in local Supabase...\n');

  const testEmail = 'test@runda.com';
  const testPassword = 'password123';
  const testName = 'Test User';

  try {
    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = users?.find(u => u.email === testEmail);

    if (existingUser) {
      console.log(`✅ Test user already exists:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);

      // Auto-confirm if not confirmed
      if (!existingUser.email_confirmed_at) {
        console.log('\n📧 Auto-confirming email...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error('❌ Error confirming email:', updateError.message);
        } else {
          console.log('✅ Email confirmed!');
        }
      }

      console.log(`\n🔐 Login credentials:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
      return;
    }

    // Create new user
    console.log('📝 Creating new test user...');

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: testName
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    console.log(`✅ Test user created successfully!`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Name: ${testName}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`\n📍 Login at: http://localhost:3000/auth/login`);

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createTestUser();
