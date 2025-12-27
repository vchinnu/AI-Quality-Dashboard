# Azure Deployment Script - Deploy to Existing Resources
# This script deploys your AI Quality Dashboard to the existing Azure resources

param(
    [string]$ResourceGroupName = "Agents-AI-Quality-Dashboard",
    [string]$SubscriptionId = "40449e6d-a5d2-40f1-a151-0b76f21a48c0",
    [string]$BackendAppName = "ai-quality-dashboard-backend-v2",
    [string]$FrontendAppName = "ai-quality-dashboard-frontend"
)

# Prerequisites
Write-Host "🚀 AI Quality Dashboard - Deploy to Existing Azure Resources" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js/npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Login to Azure (if not already logged in)
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Yellow
$loginCheck = az account show 2>$null
if (!$loginCheck) {
    Write-Host "🔑 Logging into Azure..." -ForegroundColor Yellow
    az login
}

# Set the subscription
Write-Host "📋 Setting subscription..." -ForegroundColor Yellow
az account set --subscription $SubscriptionId

# Verify resource group exists
Write-Host "🔍 Verifying resource group exists..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "❌ Resource group '$ResourceGroupName' does not exist!" -ForegroundColor Red
    exit 1
}

# Get the backend URL
Write-Host "📋 Getting backend URL..." -ForegroundColor Yellow
$backendUrl = az webapp show --resource-group $ResourceGroupName --name $BackendAppName --query "defaultHostName" --output tsv
if (!$backendUrl) {
    Write-Host "❌ Could not find backend app '$BackendAppName'!" -ForegroundColor Red
    exit 1
}
$backendUrl = "https://$backendUrl"

Write-Host "✅ Found backend URL: $backendUrl" -ForegroundColor Green

# Deploy Backend
Write-Host "🔄 Deploying backend application..." -ForegroundColor Yellow
Push-Location "backend"

# Ensure we have the right Python requirements
if (!(Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found in backend folder!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Create deployment package (excluding unnecessary files)
Write-Host "📦 Creating backend deployment package..." -ForegroundColor Cyan
$excludeItems = @("__pycache__", "*.pyc", ".env", "*.log", "node_modules")
$includeItems = @("*.py", "requirements.txt", "app", "*.json", "*.txt", "startup.sh")

# Create a clean temp directory for packaging
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
Write-Host "📁 Temp directory: $tempDir" -ForegroundColor Gray

# Copy files
Get-ChildItem -Path "." -Recurse | Where-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $shouldInclude = $false
    
    foreach ($include in $includeItems) {
        if ($_.Name -like $include -or $_.PSIsContainer) {
            $shouldInclude = $true
            break
        }
    }
    
    foreach ($exclude in $excludeItems) {
        if ($relativePath -like "*$exclude*") {
            $shouldInclude = $false
            break
        }
    }
    
    return $shouldInclude
} | ForEach-Object {
    $dest = Join-Path $tempDir $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destDir = Split-Path $dest -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    if (!$_.PSIsContainer) { Copy-Item $_.FullName $dest }
}

# Create zip file
$zipPath = Join-Path $tempDir "backend-deploy.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Deploy to App Service
Write-Host "🚀 Deploying to App Service..." -ForegroundColor Cyan
az webapp deployment source config-zip --resource-group $ResourceGroupName --name $BackendAppName --src $zipPath

# Clean up temp files
Remove-Item $tempDir -Recurse -Force

Pop-Location

# Deploy Frontend
Write-Host "🔄 Deploying frontend application..." -ForegroundColor Yellow
Push-Location "frontend"

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found in frontend folder!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Install dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
npm install

# Create production environment file
Write-Host "🔧 Creating production environment configuration..." -ForegroundColor Cyan
$envContent = @"
REACT_APP_API_URL=$backendUrl
"@
$envContent | Out-File -FilePath ".env.production" -Encoding utf8

# Build the frontend
Write-Host "🔨 Building frontend for production..." -ForegroundColor Cyan
npm run build

# Check if build was successful
if (!(Test-Path "build")) {
    Write-Host "❌ Frontend build failed - build directory not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Deploy to Static Web App (using SWA CLI)
Write-Host "🚀 Deploying to Static Web App..." -ForegroundColor Cyan

# Check if SWA CLI is installed
$swaCliInstalled = Get-Command "swa" -ErrorAction SilentlyContinue
if (!$swaCliInstalled) {
    Write-Host "📥 Installing Azure Static Web Apps CLI..." -ForegroundColor Yellow
    npm install -g @azure/static-web-apps-cli
}

# Deploy using SWA CLI
try {
    swa deploy ./build --resource-group $ResourceGroupName --app-name $FrontendAppName --subscription-id $SubscriptionId --env production
} catch {
    Write-Host "⚠️  SWA CLI deployment failed, trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Create zip and deploy via REST API
    $buildZip = "build.zip"
    Compress-Archive -Path "build\*" -DestinationPath $buildZip -Force
    
    # Get Static Web App deployment token
    $deploymentToken = az staticwebapp secrets list --name $FrontendAppName --resource-group $ResourceGroupName --query "properties.deploymentToken" --output tsv
    
    if ($deploymentToken) {
        Write-Host "🔑 Using deployment token to upload frontend..." -ForegroundColor Cyan
        # This would require additional REST API calls - for now, we'll provide manual instructions
        Write-Host "⚠️  Please manually upload the build.zip to your Static Web App through the Azure portal." -ForegroundColor Yellow
    }
}

Pop-Location

# Configure App Service settings
Write-Host "⚙️  Configuring App Service settings..." -ForegroundColor Yellow

# Set Python version and startup command
az webapp config set --resource-group $ResourceGroupName --name $BackendAppName --linux-fx-version "PYTHON|3.11"

# Set startup command
az webapp config set --resource-group $ResourceGroupName --name $BackendAppName --startup-file "python -m uvicorn server:app --host 0.0.0.0 --port 8000"

# Set app settings
az webapp config appsettings set --resource-group $ResourceGroupName --name $BackendAppName --settings @('
{
    "PORT": "8000",
    "PYTHONPATH": "/home/site/wwwroot",
    "SCM_DO_BUILD_DURING_DEPLOYMENT": "true",
    "ENABLE_ORYX_BUILD": "true"
}
')

# Restart the app service to apply changes
Write-Host "🔄 Restarting App Service..." -ForegroundColor Yellow
az webapp restart --resource-group $ResourceGroupName --name $BackendAppName

# Get the frontend URL
Write-Host "📋 Getting frontend URL..." -ForegroundColor Yellow
$frontendUrl = az staticwebapp show --name $FrontendAppName --resource-group $ResourceGroupName --query "defaultHostname" --output tsv
$frontendUrl = "https://$frontendUrl"

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your AI Quality Dashboard is deployed at:" -ForegroundColor Cyan
Write-Host "   Frontend: $frontendUrl" -ForegroundColor White
Write-Host "   Backend API: $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Visit the frontend URL to test your dashboard" -ForegroundColor White
Write-Host "   2. Check the backend health at: $backendUrl/health" -ForegroundColor White
Write-Host "   3. Upload your CSV files and start analyzing!" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   - View backend logs: az webapp log tail --name $BackendAppName --resource-group $ResourceGroupName" -ForegroundColor White
Write-Host "   - View frontend logs in Azure Portal > Static Web Apps > $FrontendAppName" -ForegroundColor White