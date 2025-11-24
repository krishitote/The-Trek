# Quick Deployment Script

# Step 1: Run Database Migration First (REQUIRED)
Write-Host "🔴 CRITICAL: Before running this script, you MUST run the database migration!" -ForegroundColor Red
Write-Host ""
Write-Host "Go to: https://console.neon.tech" -ForegroundColor Yellow
Write-Host "Run this SQL:" -ForegroundColor Yellow
Write-Host @"
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token);
"@ -ForegroundColor Cyan
Write-Host ""
$continue = Read-Host "Have you run the database migration? (yes/no)"

if ($continue -ne "yes") {
    Write-Host "❌ Please run the database migration first!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "✅ Starting deployment process..." -ForegroundColor Green
Write-Host ""

# Step 2: Check if we're in the right directory
if (!(Test-Path "backend") -or !(Test-Path "src")) {
    Write-Host "❌ Error: Not in the trek directory!" -ForegroundColor Red
    Write-Host "Please cd to c:\Users\krish\the-trek first" -ForegroundColor Yellow
    exit
}

# Step 3: Show current git status
Write-Host "📋 Current changes:" -ForegroundColor Cyan
git status --short

Write-Host ""
$commit = Read-Host "Ready to commit and deploy? (yes/no)"

if ($commit -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit
}

# Step 4: Commit changes
Write-Host ""
Write-Host "📦 Committing changes..." -ForegroundColor Green
git add .
git commit -m "feat: implement rate limiting, enhanced validation, and JWT refresh tokens

- Add express-rate-limit for API protection (5 login attempts/15min, 100 API req/15min)
- Enhance Joi validation for activities, profiles, and auth
- Implement JWT refresh token system (15min access token + 7 day refresh token)
- Add auto-refresh logic in frontend (refreshes every 14 minutes)
- Add database migration for refresh token storage
- Apply rate limiting to auth, activities, and uploads
- Update frontend to use accessToken instead of token
- Add comprehensive documentation (IMPLEMENTATION_GUIDE.md, IMPROVEMENT_ROADMAP.md)

Security improvements:
- Prevents brute force attacks
- Prevents API abuse
- Better token security (short-lived access tokens)
- True logout functionality (invalidates refresh token)

Breaking changes:
- Requires database migration (add refresh_token columns to users table)
- Old tokens will be invalid (users need to re-login once)
- Frontend now stores accessToken + refreshToken instead of single token"

# Step 5: Push to GitHub
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Monitor Render deployment: https://dashboard.render.com" -ForegroundColor White
    Write-Host "2. Check backend logs for errors" -ForegroundColor White
    Write-Host "3. Test production: https://trekfit.co.ke" -ForegroundColor White
    Write-Host "4. Try registering a new user" -ForegroundColor White
    Write-Host "5. Try logging in and submitting an activity" -ForegroundColor White
    Write-Host "6. Check browser console for token refresh logs (every 14 min)" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected Render deployment time: 2-3 minutes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎉 Improvements deployed:" -ForegroundColor Green
    Write-Host "   ✅ Rate limiting (prevents abuse)" -ForegroundColor White
    Write-Host "   ✅ Enhanced validation (prevents bad data)" -ForegroundColor White
    Write-Host "   ✅ JWT refresh tokens (better security + UX)" -ForegroundColor White
    Write-Host "   ✅ Comprehensive documentation" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Write-Host "Please check the error above and try again" -ForegroundColor Yellow
}
