# Database Migrations

This folder contains SQL migration files for The Trek database.

## How to Run Migrations

### Option 1: Using Neon Console (Recommended)
1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project and database
3. Click on "SQL Editor"
4. Copy and paste the contents of the migration file
5. Execute the SQL

### Option 2: Using psql Command Line
```bash
# Set your database URL
$env:DATABASE_URL="your-neon-connection-string"

# Run migration
psql $env:DATABASE_URL -f migrations/001_add_refresh_tokens.sql
```

### Option 3: Using the test-db.mjs Script
```bash
node test-db.mjs
```

## Migration Files

### 001_add_refresh_tokens.sql
- Adds `refresh_token` and `refresh_token_expires` columns to users table
- Required for JWT refresh token rotation

### 002_add_date_of_birth.sql
- Adds `date_of_birth` column to users table (historical)
- Note: Superseded by migration 010

### 010_add_date_of_birth.sql ⚠️ **REQUIRED**
- Drops unused `age` column
- Adds `date_of_birth DATE` column (required by Profile.jsx)
- Fixes profile editing functionality
- **Status: Must run in production**

### 011_add_created_at_to_users.sql ⚠️ **REQUIRED**
- Adds `created_at` timestamp to users table
- Enables real user growth analytics in admin dashboard
- Backfills existing users with current timestamp
- **Status: Must run in production**

## ⚠️ Action Required

Run these migrations in Neon SQL Editor:
1. **010_add_date_of_birth.sql** - Fixes profile editing
2. **011_add_created_at_to_users.sql** - Enables admin analytics

See SCHEMA_ANALYSIS.md for full database schema review.
- **Date:** 2025-11-24
- **Description:** Adds refresh token support for JWT authentication
- **Changes:**
  - Adds `refresh_token` column (TEXT)
  - Adds `refresh_token_expires` column (TIMESTAMP)
  - Creates index on `refresh_token` for faster lookups

### 002_add_date_of_birth.sql
- **Date:** 2025-12-09
- **Description:** Replaces age integer with date_of_birth for accurate age calculation
- **Changes:**
  - Adds `date_of_birth` column (DATE)
  - Creates index on `date_of_birth` for birthday queries
  - Adds constraint to ensure date_of_birth is in the past
  - Optional: Comment to drop old `age` column
- **Purpose**: Add JWT refresh token support
- **Changes**:
  - Adds `refresh_token` TEXT column to users table
  - Adds `refresh_token_expires` TIMESTAMP column to users table
  - Creates index on `refresh_token` for faster lookups
- **Status**: ⚠️ Required for new authentication system

## Rollback

If you need to rollback the refresh token migration:

```sql
-- Remove refresh token columns
ALTER TABLE users 
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS refresh_token_expires;

-- Remove index
DROP INDEX IF EXISTS idx_users_refresh_token;
```

## Notes

- Always backup your database before running migrations
- Test migrations on a development database first
- Migrations are one-way only (no automatic rollback)
- Keep this folder in version control
