#!/usr/bin/env tsx

/**
 * Migrate users from Prisma database to Supabase Auth
 * 
 * This script:
 * 1. Reads users from your Prisma database
 * 2. Creates them in Supabase Auth
 * 3. Auto-confirms their emails
 * 4. Sets a default password (users must reset)
 * 
 * Usage:
 *   npx tsx scripts/migrate-users-to-auth.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'ChangeMe123!'; // Users will be notified to change this

async function migrateUsers() {
  console.log('🔄 Starting user migration from Prisma DB to Supabase Auth...\n');

  try {
    // Fetch all users from Prisma database
    console.log('📚 Fetching users from Prisma database...');
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    if (dbUsers.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    console.log(`✅ Found ${dbUsers.length} user(s) in database\n`);

    // Fetch existing Supabase Auth users
    console.log('📋 Checking existing Supabase Auth users...');
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing Supabase users:', listError.message);
      process.exit(1);
    }

    const existingEmails = new Set(authUsers?.map(u => u.email) || []);
    console.log(`✅ Found ${existingEmails.size} existing user(s) in Supabase Auth\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Migrate each user
    for (const dbUser of dbUsers) {
      if (!dbUser.email) {
        console.log(`⏭️  Skipping user ${dbUser.id}: No email address`);
        skipped++;
        continue;
      }

      if (existingEmails.has(dbUser.email)) {
        console.log(`⏭️  Skipping ${dbUser.email}: Already exists in Supabase Auth`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔧 Migrating: ${dbUser.email} (${dbUser.role})...`);

        const { data, error: createError } = await supabase.auth.admin.createUser({
          email: dbUser.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: dbUser.name || '',
            role: dbUser.role,
            prisma_id: dbUser.id,
            migrated_at: new Date().toISOString()
          }
        });

        if (createError) {
          console.error(`   ❌ Failed: ${createError.message}`);
          failed++;
          continue;
        }

        // Update Prisma user with Supabase auth ID
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            // Store Supabase auth ID if you have a field for it
            // supabaseAuthId: data.user.id 
          }
        });

        console.log(`   ✅ Created: ${data.user.id}`);
        created++;

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('═'.repeat(60));
    console.log(`   Total users in DB: ${dbUsers.length}`);
    console.log(`   Created in Auth:   ${created}`);
    console.log(`   Skipped:           ${skipped}`);
    console.log(`   Failed:            ${failed}`);
    console.log('═'.repeat(60));

    if (created > 0) {
      console.log(`\n⚠️  IMPORTANT: Default password set for all migrated users:`);
      console.log(`   Password: ${DEFAULT_PASSWORD}`);
      console.log(`\n📧 Next steps:`);
      console.log(`   1. Notify users to log in with default password`);
      console.log(`   2. Users should change their password immediately`);
      console.log(`   3. Or: Implement password reset flow`);
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
