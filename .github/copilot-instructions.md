# The Trek - AI Coding Agent Instructions

## Project Overview
**The Trek** is a full-stack fitness tracking platform with social features, communities, badges, and annual championships. Users log activities (running, cycling, swimming), track progress with charts, compete on leaderboards, earn badges, join communities, and contribute to yearly championship events.

**Live:** https://trekfit.co.ke (Frontend: TrueHost, Backend: Render, DB: Neon PostgreSQL)

## Architecture & Data Flow

### Three-Tier Structure
1. **Web App** (`src/`) - React 18 + Vite, Chakra UI v2 + Tailwind CSS v3, React Router v7
2. **Mobile App** (`the-trek-mobile/`) - React Native + Expo, Paper UI (feature parity incomplete)
3. **Backend** (`backend/`) - Express.js (ES modules), PostgreSQL via `pg`, JWT auth with refresh tokens

### Critical Flow: Authentication (Dual-Token System)
- **Registration/Login** → Returns `{ accessToken, refreshToken, user }` 
- **Access Token:** 15-min expiry, used for all API calls (`Authorization: Bearer <token>`)
- **Refresh Token:** 7-day expiry, stored in database, auto-rotates every 14 minutes client-side
- **Password Reset:** Simplified flow - username + email verification (no email sending), updates password and clears refresh tokens
- **Auth Flow:**
  1. Login → Store both tokens in `localStorage` (web) / `AsyncStorage` (mobile)
  2. Frontend (`AuthContext.jsx`) auto-refreshes access token via `setInterval(14min)`
  3. If refresh fails → Force logout
- **Middleware:** `backend/middleware/authMiddleware.js` decodes JWT, attaches `req.user.id`
- **Token Utils:** `backend/utils/tokens.js` - `generateAccessToken()`, `generateRefreshToken()`, `verifyAccessToken()`

### Data Entities
**PostgreSQL Schema (Current):**
```sql
users (
  id, username, email, password, first_name, last_name, gender, 
  date_of_birth, weight, height, profile_image, weekly_distance_goal,
  is_admin, badge_count, follower_count, following_count, created_at,
  refresh_token, refresh_token_expires,
  google_fit_token, google_fit_refresh_token
)
activities (id, user_id, type, distance_km, duration_min, date, calories_burned, like_count, comment_count)
communities (id, name, description, invite_code, is_private, is_approved, registration_fee, created_by, created_at)
community_members (community_id, user_id, role, joined_at)
annual_championships (year, event_date, registration_fee, spectator_price, participant_price, is_registration_open, qualifications_close_at)
contributions (championship_id, user_id, amount, mpesa_code, created_at)
badges (name, description, icon, category, criteria)
user_badges (user_id, badge_id, earned_at)
follows (follower_id, following_id)
activity_likes (activity_id, user_id)
activity_comments (activity_id, user_id, content)
```
**Schema Evolution:** Database uses migrations (`backend/migrations/*.sql`), not seed files. Migrations come in pairs: `00X_name.sql` (local) and `00X_name_NEON.sql` (production). Run via Neon SQL Editor.  
No ORM - raw SQL with parameterized queries (`$1`, `$2`) for injection safety.  
**Database Triggers:** Auto-update counters (`badge_count`, `like_count`, `comment_count`, `follower_count`, `following_count`) via PostgreSQL triggers - never manually update these.

## Development Workflows

### Local Development
```powershell
# Frontend (root directory)
npm install
npm run dev  # http://localhost:5173, HMR enabled

# Backend (backend/ directory)
cd backend
npm install
npm run dev  # Uses nodemon, runs on port 5000

# Mobile (the-trek-mobile/ directory)
cd the-trek-mobile
npm install
npm start  # Expo dev server, scan QR with Expo Go app
```

### Environment Variables
**Frontend (root `.env`):**
```bash
VITE_API_URL=http://localhost:5000  # Backend URL (production: https://the-trek.onrender.com)
VITE_GOOGLE_CLIENT_ID=...           # For Google Fit OAuth
```

**Backend (`backend/.env`):**
```bash
DATABASE_URL=postgresql://...       # Neon connection string
JWT_SECRET=...                      # Min 32 chars for security (used by jsonwebtoken)
PORT=5000
REDIS_URL=...                       # Optional - app works without Redis (graceful fallback)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://the-trek.onrender.com/api/googlefit/callback
```

### Deployment (Manual Frontend, Auto Backend)
1. **Backend (Auto-Deploy):** Push to `main` → Render auto-deploys (monitors `backend/` folder)
2. **Frontend (Manual Upload to TrueHost):**
   - Build: `npm run build` → Creates `dist/` folder
   - Upload entire `dist/` contents to TrueHost via cPanel File Manager
   - Keep `.htaccess` for SPA routing (if exists)
3. **Test production:** Visit https://trekfit.co.ke, check Render logs for backend errors
4. **Database Migrations:** Run SQL files from `backend/migrations/` via Neon SQL Editor

## Project-Specific Conventions

### Backend Patterns
1. **Route Organization:** All routes in `backend/routes/*.js`, imported in `server.js`
   - Example: `backend/routes/activities.js` exports Express router, imported as `activityRoutes`
   - Routes: `auth`, `activities`, `users`, `upload`, `googlefit`, `leaderboards`, `communities`, `championships`, `admin`, `stats`, `badges`, `social`
2. **Validation First:** Use Joi middleware (`backend/middleware/validation.js`) before route handlers
   - Applied: `router.post("/", authenticateToken, validateActivity, async (req, res) => {...})`
   - All POST/PUT routes MUST have Joi validators (security requirement)
3. **Error Handling:** Catch-all errors return `{ error: 'message' }` (no stack traces in production)
4. **CORS:** Whitelist domains in `server.js` line 44-52 (`allowedOrigins` array) - includes production + multiple local ports
5. **Logging:** Winston logger (`backend/config/logger.js`) logs to `backend/logs/` with request IDs
6. **Admin Access:** Use `requireAdmin` middleware (checks `is_admin` flag) AFTER `authenticateToken`
   - Grant via: `node backend/scripts/make-admin.mjs user@email.com`

### Frontend Patterns
1. **API Calls:** Centralized in `src/services/api.js` (exports `apiLogin`, `apiSubmitActivity`, etc.)
   - Always use `import.meta.env.VITE_API_URL` for base URL
   - All authenticated calls use `authHeaders(token)` helper
2. **Auth Context:** Access via `const { user, session } = useAuth()` (imported from `src/context/AuthContext.jsx`)
   - `session` contains `{ accessToken, refreshToken }`
   - Auto-refresh logic runs every 14 minutes
3. **Protected Routes:** Check `user` in component, redirect to `/login` if null
4. **Styling:** Chakra UI v2 + Tailwind CSS v3 hybrid approach
   - Chakra for components (`<Button>`, `<Box>`), Tailwind for utilities (`className="mt-4"`)
   - Theme colors in `src/theme.js` - Forest Green, Sunrise Orange, Sky Blue
   - Use `useColorMode()` for dark/light toggle

### Performance Critical
⚠️ **N+1 Query Anti-Pattern:** Dashboard previously fetched activities for EVERY user individually
- **Solution:** Use `/api/leaderboards/quick` endpoint (single query with SQL aggregation)
- **File:** `backend/routes/leaderboards.js` line 8-25 (optimized with `LEFT JOIN` and `SUM()`)
- **Caching:** Redis cache middleware with 5-minute TTL (gracefully disabled if Redis unavailable)
- **Window Functions:** Leaderboard queries use `ROW_NUMBER() OVER (PARTITION BY ...)` to fetch only top 10 per category, avoiding full table scans

### Security Patterns
1. **Input Validation:** All POST/PUT routes MUST use Joi validators (see `backend/middleware/validation.js`)
2. **Rate Limiting:** 4-tier system via `backend/middleware/rateLimiter.js`
   - `authLimiter`: 5 attempts/15min on `/api/auth/login` & `/api/auth/register`
   - `apiLimiter`: 100 requests/15min on all `/api/*` routes
   - `uploadLimiter`: 10 uploads/hour on `/api/upload`
   - `activityLimiter`: 10 activities/minute on activity submission
3. **Password Requirements:** Min 8 chars, must contain uppercase, lowercase, digit (enforced in `validateRegistration`)
4. **File Uploads:** Max 5MB, images only (JPEG/PNG), optimized with Sharp, stored in `backend/uploads/` with user ID prefix
5. **Token Security:** Access tokens expire in 15 minutes, refresh tokens in 7 days (stored in DB, rotated on use)

## Key Integration Points

### Google Fit OAuth Flow
1. User clicks "Connect Google Fit" → Frontend redirects to Google consent screen
2. Google redirects to `backend/routes/googlefit.js` `/callback` with authorization code
3. Backend exchanges code for access token, stores in session (NOT in database yet)
4. Frontend calls `/api/googlefit/sync` to fetch last 7 days of fitness data

### Leaderboard Generation (Performance-Sensitive)
- **Endpoint:** `GET /api/leaderboards` (full data) or `/api/leaderboards/quick` (dashboard)
- **Query:** Aggregates with `SUM(distance_km)`, `AVG(duration_min/distance_km)` grouped by user/type/gender
- **Caching:** Redis cache middleware with 5-min TTL for `/quick`, 10-min for full leaderboards
- **Cache Invalidation:** Automatically clears cache when new activity submitted (`invalidateCache` in `activities.js`)

### Chart.js Integration
- **Component:** `src/components/ProgressChart.jsx` uses `react-chartjs-2` wrapper
- **Data Format:** Array of `{ date: ISO string, distance_km: number }` sorted by date ASC
- **Tip:** Always filter out null distances to avoid rendering errors

### Redis Caching (Optional)
- **Config:** `backend/config/redis.js` with graceful fallback if unavailable
- **Middleware:** `backend/middleware/cache.js` provides `cacheMiddleware(options)`
- **Usage:** `router.get('/endpoint', cacheMiddleware({ ttl: 300 }), handler)`
- **Important:** App works fully without Redis - caching is performance enhancement only

## Common Pitfalls

1. **CORS Errors:** If new domain added, update `backend/server.js` line 44 `allowedOrigins` array
2. **JWT Expiry:** Access tokens expire in 15 min, refresh tokens in 7 days - auto-refresh runs client-side
3. **Database Connection:** Use `pool.query()` not `pool.connect().query()` (connection leaks)
4. **Mobile API URL:** Hardcoded in `the-trek-mobile/api/index.js` (should use env var)
5. **BMI Calculation:** Weight in kg, height in cm → formula: `weight / ((height/100)²)` in `server.js`
6. **Redis Unavailable:** Don't assume Redis exists - check `getRedisClient()` returns null, skip caching gracefully
7. **Token Refresh Loop:** Auto-refresh runs every 14 minutes - avoid creating multiple intervals
8. **Cache Invalidation:** When modifying data (POST/PUT/DELETE), call `invalidateCache(pattern)` to clear stale cache
9. **Database Triggers:** Counters auto-update via triggers - never manually `UPDATE` `badge_count`, `like_count`, `comment_count`, etc.
10. **Migration Pairs:** Always create both local (`00X_name.sql`) and Neon (`00X_name_NEON.sql`) versions with same logic

## Testing Checklist (Before Deploy)
- [ ] Run `npm run dev` for both frontend and backend, test locally
- [ ] Test auth flow: Register new user, login, logout
- [ ] Submit activity, verify it appears in dashboard and leaderboard
- [ ] Check CORS: Frontend can call backend APIs without errors
- [ ] Verify validation: Submit invalid data (negative distance, weak password) → should reject

## File Locations Cheat Sheet
- **Auth logic:** `backend/middleware/authMiddleware.js`, `src/context/AuthContext.jsx`
- **API client:** `src/services/api.js` (all fetch calls)
- **Validation rules:** `backend/middleware/validation.js` (Joi schemas)
- **Database pool:** `backend/db.js` (PostgreSQL connection)
- **Route definitions:** `backend/routes/*.js` (activities, auth, leaderboards, upload, users, googlefit)
- **Main pages:** `src/pages/` (Home, Dashboard, Profile, Login, Register, Communities, Championship, Badges, Feed, AdminDashboard)
- **Leaderboard optimization:** `backend/routes/leaderboards.js` line 8 (`/quick` endpoint)
- **Admin scripts:** `backend/scripts/make-admin.mjs` (grant admin access)

## Mobile App Notes (React Native)
- **Navigation:** `the-trek-mobile/navigation/AppNavigator.js` (stack navigator)
- **Auth:** Mirrors web, stores token in `AsyncStorage`
- **Status:** Partial feature parity (no leaderboards screen, no photo upload)
- **Build:** `npm run android` or `npm run ios` or `npx expo start`

---

**Last Updated:** January 5, 2026  
**Repo:** https://github.com/krishitote/The-Trek
