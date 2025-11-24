# The Trek - AI Coding Agent Instructions

## Project Overview
**The Trek** is a full-stack fitness tracking platform with social leaderboards. Users log activities (running, cycling, swimming), track progress with charts, and compete on global/gender/activity-type leaderboards. Includes Google Fit OAuth integration and profile management with BMI calculation.

**Live:** https://trekfit.co.ke (Frontend: TrueHost, Backend: Render, DB: Neon PostgreSQL)

## Architecture & Data Flow

### Three-Tier Structure
1. **Web App** (`src/`) - React 18 + Vite, Chakra UI, React Router v7
2. **Mobile App** (`the-trek-mobile/`) - React Native + Expo, Paper UI (feature parity incomplete)
3. **Backend** (`backend/`) - Express.js (ES modules), PostgreSQL via `pg`, JWT auth

### Critical Flow: Authentication
- **Registration/Login** → JWT token (7-day expiry) stored in `localStorage` (web) / `AsyncStorage` (mobile)
- **All protected routes** require `Authorization: Bearer <token>` header
- Middleware: `backend/middleware/authMiddleware.js` decodes JWT, attaches `req.user.id`
- Frontend: `src/context/AuthContext.jsx` provides `{ user, session, login, logout }` via React Context

### Data Entities
**PostgreSQL Schema:**
```sql
users (id, username, email, password, weight, height, profile_image)
activities (id, user_id, type, distance_km, duration_min, date)
```
No ORM - raw SQL with parameterized queries (`$1`, `$2`) for injection safety.

## Development Workflows

### Local Development
```powershell
# Frontend (root directory)
npm install
npm run dev  # http://localhost:5173

# Backend (backend/ directory)
cd backend
npm install
npm run dev  # Uses nodemon, runs on port 5000

# Mobile (the-trek-mobile/ directory)
cd the-trek-mobile
npm install
npm start  # Expo dev server
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
JWT_SECRET=...                      # Min 32 chars for security
PORT=5000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://the-trek.onrender.com/api/googlefit/callback
```

### Deployment (Git Push Auto-Deploy)
1. **Commit changes:** `git add . && git commit -m "message" && git push origin main`
2. **Render auto-deploys backend** (monitors `backend/` folder)
3. **TrueHost serves frontend** (build: `npm run build` → `dist/`)
4. **Test production:** Visit https://trekfit.co.ke, check Render logs for errors

## Project-Specific Conventions

### Backend Patterns
1. **Route Organization:** All routes in `backend/routes/*.js`, imported in `server.js`
   - Example: `backend/routes/activities.js` exports Express router, imported as `activityRoutes`
2. **Validation First:** Use Joi middleware (`backend/middleware/validation.js`) before route handlers
   - Applied: `router.post("/", authenticateToken, validateActivity, async (req, res) => {...})`
3. **Error Handling:** Catch-all errors return `{ error: 'message' }` (no stack traces in production)
4. **CORS:** Whitelist domains in `server.js` line 32-37 (`allowedOrigins` array)

### Frontend Patterns
1. **API Calls:** Centralized in `src/services/api.js` (exports `apiLogin`, `apiSubmitActivity`, etc.)
   - Always use `import.meta.env.VITE_API_URL` for base URL
2. **Auth Context:** Access via `const { user, session } = useAuth()` (imported from `src/context/AuthContext.jsx`)
3. **Protected Routes:** Check `user` in component, redirect to `/login` if null
4. **Chakra UI Theming:** Use `useColorMode()` for dark/light toggle, colors from `src/theme.js`

### Performance Critical
⚠️ **N+1 Query Anti-Pattern:** Dashboard previously fetched activities for EVERY user individually
- **Solution:** Use `/api/leaderboards/quick` endpoint (single query with SQL aggregation)
- **File:** `backend/routes/leaderboards.js` line 6-25 (optimized with `LEFT JOIN` and `SUM()`)

### Security Patterns
1. **Input Validation:** All POST/PUT routes MUST use Joi validators (see `backend/middleware/validation.js`)
2. **Rate Limiting:** Apply `authLimiter` to `/api/login` and `/api/register` (5 attempts/15min)
3. **Password Requirements:** Min 8 chars, must contain uppercase, lowercase, digit (enforced in `validateRegistration`)
4. **File Uploads:** Max 5MB, images only (JPEG/PNG), stored in `backend/uploads/` with user ID prefix

## Key Integration Points

### Google Fit OAuth Flow
1. User clicks "Connect Google Fit" → Frontend redirects to Google consent screen
2. Google redirects to `backend/routes/googlefit.js` `/callback` with authorization code
3. Backend exchanges code for access token, stores in session (NOT in database yet)
4. Frontend calls `/api/googlefit/sync` to fetch last 7 days of fitness data

### Leaderboard Generation (Performance-Sensitive)
- **Endpoint:** `GET /api/leaderboards` (full data) or `/api/leaderboards/quick` (dashboard)
- **Query:** Aggregates with `SUM(distance_km)`, `AVG(duration_min/distance_km)` grouped by user/type/gender
- **Caching:** None yet (TODO: Redis for 5-minute cache)

### Chart.js Integration
- **Component:** `src/components/ProgressChart.jsx` uses `react-chartjs-2` wrapper
- **Data Format:** Array of `{ date: ISO string, distance_km: number }` sorted by date ASC
- **Tip:** Always filter out null distances to avoid rendering errors

## Common Pitfalls

1. **CORS Errors:** If new domain added, update `backend/server.js` line 32 `allowedOrigins` array
2. **JWT Expiry:** Tokens expire in 7 days (no refresh token yet), user must re-login
3. **Database Connection:** Use `pool.query()` not `pool.connect().query()` (connection leaks)
4. **Mobile API URL:** Hardcoded in `the-trek-mobile/api/index.js` (should use env var)
5. **BMI Calculation:** Weight in kg, height in cm → formula: `weight / ((height/100)²)` in `server.js`

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
- **Main pages:** `src/pages/` (Home, Dashboard, Profile, Login, Register)
- **Leaderboard optimization:** `backend/routes/leaderboards.js` line 6 (`/quick` endpoint)

## Mobile App Notes (React Native)
- **Navigation:** `the-trek-mobile/navigation/AppNavigator.js` (stack navigator)
- **Auth:** Mirrors web, stores token in `AsyncStorage`
- **Status:** Partial feature parity (no leaderboards screen, no photo upload)
- **Build:** `npm run android` or `npm run ios` or `npx expo start`

---

**Last Updated:** November 24, 2025  
**Repo:** https://github.com/krishitote/The-Trek
