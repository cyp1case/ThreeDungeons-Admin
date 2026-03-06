# ThreeDungeons Supabase Setup

This folder contains the database schema and RLS policies for the Residency RPG telemetry and authentication system.

## Prerequisites

**Owner must complete [Owner Setup Task 1](../Planning%20Documents/2025-03-05%20-%20residency-rpg-telemetry-auth.md#task-1-create-a-supabase-account-and-project)** before running migrations:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Obtain **Project URL** and **anon key** from Project Settings → API

## Applying the Schema

### Option A: Supabase CLI (recommended)

```bash
# Supabase CLI is installed locally; use npx
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Option B: SQL Editor (manual)

1. In Supabase Dashboard, go to **SQL Editor**
2. Run each migration file in order:
   - `migrations/20250305000000_initial_schema.sql`
   - `migrations/20250305000001_rls_policies.sql`
   - `migrations/20250305000002_auth_trigger.sql`
   - `migrations/20250306000000_invite_code_verify.sql`

## Super-Admin Bootstrap

After the schema is applied, promote your first super-admin:

1. Sign up at your Supabase project's Auth signup URL (or use the dashboard to create a user)
2. Run this SQL in the SQL Editor (replace with your email):

```sql
UPDATE public.profiles
SET role = 'super_admin', program_id = NULL
WHERE email = 'your-super-admin@example.com';
```

The dashboard will use `VITE_SUPER_ADMIN_EMAIL` (or `profile.role === 'super_admin'`) to show admin options.

## CORS (Owner Setup Task 3)

Before deployment, add your game and dashboard origins in Supabase:

- **Project Settings** → **API** → **CORS / Allowed Origins**
- Add: `https://yourusername.github.io` (or your specific game/dashboard URLs)

## Edge Functions (Section 6)

Deploy with `--no-verify-jwt` so the game can call them without Supabase Auth:

```bash
npx supabase secrets set JWT_SECRET=<your-jwt-secret>
npx supabase functions deploy resident-login --no-verify-jwt
npx supabase functions deploy report-telemetry --no-verify-jwt
```

If you get "Missing authorization header" when invoking, pass the anon key: `Authorization: Bearer <anon_key>`. The game may need an `anonKey` plugin parameter for this.

## Self-Verification (Section 1)

1. **Program isolation**: Create two programs. As a Leader of Program A, query Program B residents — should return no rows.
2. **Invite codes**: Generate a code, use it for Leader signup, try to use again — should fail (single-use).
3. **Attempts**: Resident insert will be handled by Edge Function (Section 6); Leader SELECT for their program should work.
