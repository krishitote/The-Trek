# The Trek - Netlify Deployment Script
# Builds and deploys to Netlify automatically

Write-Host "🚀 The Trek - Deploying to Netlify..." -ForegroundColor Green
Write-Host ""

# Step 1: Build the frontend
Write-Host "📦 Building production bundle..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Check if Netlify CLI is installed
Write-Host "🔍 Checking Netlify CLI..." -ForegroundColor Cyan
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "📥 Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
    Write-Host "✅ Netlify CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Netlify CLI already installed" -ForegroundColor Green
}

Write-Host ""

# Step 3: Deploy to Netlify
Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Cyan
Write-Host "📂 Deploying from: dist/" -ForegroundColor Gray
Write-Host ""

# Deploy to production
netlify deploy --prod --dir=dist

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "🌲 Your nature + energy theme is now LIVE at https://trekfit.co.ke" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Checklist:" -ForegroundColor Cyan
    Write-Host "  - Login should now work (API path fixed)" -ForegroundColor White
    Write-Host "  - Forest green gradients visible" -ForegroundColor White
    Write-Host "  - Sunrise orange buttons active" -ForegroundColor White
    Write-Host "  - Dashboard stat cards deployed" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "💡 Try manual deployment:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://app.netlify.com" -ForegroundColor White
    Write-Host "   2. Find your site" -ForegroundColor White
    Write-Host "   3. Drag dist/ folder to deploy" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
