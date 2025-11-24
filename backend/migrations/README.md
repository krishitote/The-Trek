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
