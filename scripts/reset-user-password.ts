#!/usr/bin/env tsx

/**
 * Reset a user's password in Supabase Auth
 * Useful when user forgets password or for testing
 * 
 * Usage:
 *   npx tsx scripts/reset-user-password.ts <email> <new-password>
 * 
 * Example:
 *   npx tsx scripts/reset-user-password.ts leotuyi10@gmail.com newpassword123
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

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>');
    console.error('\nExample:');
    console.error('   npx tsx scripts/reset-user-password.ts test@runda.com newpass123');
    process.exit(1);
  }

  console.log(`🔧 Resetting password for: ${email}\n`);

  try {
    // Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error fetching users:', listError.message);
      process.exit(1);
    }

    const user = users?.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.error('\n💡 List all users with:');
      console.error('   npx tsx scripts/list-auth-users.ts');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.user_metadata?.name || 'N/A'}`);
    console.log(`\n🔐 Updating password...`);

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`❌ Failed to update password: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Password updated successfully!`);
    console.log(`\n🔐 New credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n📍 Login at: http://localhost:3000/auth/login`);

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

resetPassword();
