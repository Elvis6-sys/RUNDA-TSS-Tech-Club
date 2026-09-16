# User Management Scripts

Scripts to manage users between Prisma database and Supabase Auth.

## Prerequisites

Make sure your `.env` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

## Available Scripts

### 1. List All Auth Users

**See who's in Supabase Auth:**

```bash
npx tsx scripts/list-auth-users.ts
```

**Output:**
- Lists all users in Supabase Auth
- Shows email, ID, confirmation status
- Summary of confirmed vs unconfirmed users

---

### 2. Create Test User

**Create a test user for development:**

```bash
npx tsx scripts/create-test-user.ts
```

**Creates:**
- Email: `test@runda.com`
- Password: `password123`
- Auto-confirmed (no email verification needed)

**Use this for quick testing!**

---

### 3. Migrate Database Users to Auth

**Transfer existing users from Prisma DB to Supabase Auth:**

```bash
npx tsx scripts/migrate-users-to-auth.ts
```

**What it does:**
1. Reads all users from Prisma database
2. Creates them in Supabase Auth
3. Auto-confirms their emails
4. Sets default password: `ChangeMe123!`
5. Skips users that already exist

**⚠️ IMPORTANT:** After migration, users must change their password!

---

### 4. Confirm All Users

**Auto-confirm all unconfirmed users (skip email verification):**

```bash
npx tsx scripts/confirm-all-users.ts
```

**Use this:**
- In local development
- After migration
- When email delivery is unavailable

---

## Typical Workflow

### Scenario 1: Fresh Setup (No Users)

```bash
# 1. Check if any users exist
npx tsx scripts/list-auth-users.ts

# 2. Create a test user
npx tsx scripts/create-test-user.ts

# 3. Test login at http://localhost:3000/auth/login
#    Email: test@runda.com
#    Password: password123
```

---

### Scenario 2: Migrate Existing Users

```bash
# 1. Check current auth users
npx tsx scripts/list-auth-users.ts

# 2. Migrate from database
npx tsx scripts/migrate-users-to-auth.ts

# 3. Verify migration
npx tsx scripts/list-auth-users.ts

# 4. Auto-confirm if needed
npx tsx scripts/confirm-all-users.ts
```

---

### Scenario 3: User Can't Login

**"Invalid credentials" error?**

```bash
# 1. Check if user exists in auth
npx tsx scripts/list-auth-users.ts

# If user NOT in list:
# → User needs to register first at /auth/register

# If user IS in list but not confirmed:
npx tsx scripts/confirm-all-users.ts

# If user IS in list and confirmed:
# → Password is wrong, user needs to reset
```

---

## Understanding the Auth System

### Current Setup:
- **Supabase Auth** handles authentication (login/logout)
- **Prisma database** stores user profiles and data
- User ID must match between both systems

### User Flow:
1. **Register** → Creates user in Supabase Auth + Prisma DB
2. **Login** → Checks Supabase Auth credentials
3. **Session** → Stored in Supabase Auth
4. **Profile** → Fetched from Prisma DB using auth ID

### Why Two Systems?
- **Supabase Auth:** Secure password hashing, sessions, tokens
- **Prisma DB:** User profiles, roles, application data, relationships

---

## Troubleshooting

### Error: "Invalid credentials"

**Possible causes:**

1. **User doesn't exist in Supabase Auth**
   ```bash
   npx tsx scripts/list-auth-users.ts
   # If not listed, user needs to register
   ```

2. **Email not confirmed**
   ```bash
   npx tsx scripts/confirm-all-users.ts
   ```

3. **Wrong password**
   - User needs to reset password
   - Or if migrated, use default: `ChangeMe123!`

4. **Supabase not running**
   ```bash
   curl http://127.0.0.1:54321/auth/v1/health
   # Should return: {"name":"GoTrue",...}
   ```

---

### Error: "SUPABASE_SERVICE_ROLE_KEY not found"

**Fix:** Add to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get the key from:
- Local Supabase: Check `.env.local` after `supabase start`
- Cloud Supabase: Project Settings → API → service_role key

---

### Error: "User already exists"

**This is normal!** It means:
- User is already in Supabase Auth
- They can log in with their existing credentials
- No action needed

---

## Security Notes

### ⚠️ Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies and has full access. 

**Never:**
- Commit it to git
- Use it in client-side code
- Share it publicly

**Only use it:**
- In server-side code
- In these migration scripts
- In API routes with proper validation

### 🔐 Default Passwords

After migration, users have password: `ChangeMe123!`

**You must:**
1. Notify users to change their password
2. Implement password reset flow
3. Force password change on first login (optional)

---

## Advanced Usage

### Create Multiple Test Users

```typescript
// Modify create-test-user.ts
const testUsers = [
  { email: 'student@runda.com', password: 'student123', role: 'STUDENT' },
  { email: 'trainer@runda.com', password: 'trainer123', role: 'TRAINER' },
  { email: 'admin@runda.com', password: 'admin123', role: 'ADMIN' },
];

for (const user of testUsers) {
  // Create user logic...
}
```

### Delete All Auth Users (Reset)

```typescript
const { data: { users } } = await supabase.auth.admin.listUsers();
for (const user of users) {
  await supabase.auth.admin.deleteUser(user.id);
}
```

### Sync Auth ID to Database

After migration, update Prisma records:

```typescript
// Add field to schema.prisma:
// supabaseAuthId String? @unique

await prisma.user.update({
  where: { email: user.email },
  data: { supabaseAuthId: authUser.id }
});
```

---

## Questions?

**Check:**
1. Supabase is running: `curl http://127.0.0.1:54321/auth/v1/health`
2. .env has correct keys
3. Database connection works: `npx prisma studio`

**Common commands:**
```bash
# List users
npx tsx scripts/list-auth-users.ts

# Create test user
npx tsx scripts/create-test-user.ts

# Confirm all users
npx tsx scripts/confirm-all-users.ts

# Migrate existing users
npx tsx scripts/migrate-users-to-auth.ts
```

**Test login:**
- URL: `http://localhost:3000/auth/login`
- Email: `test@runda.com`
- Password: `password123`

Good luck! 🚀
