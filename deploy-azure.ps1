# Azure Deployment Scripts

# Prerequisites
Write-Host "🚀 AI Quality Dashboard - Azure Deployment" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
az login

# Set variables
$resourceGroupName = "ai-quality-dashboard-rg"
$location = "East US"
$deploymentName = "ai-quality-dashboard-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create resource group
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $resourceGroupName --location $location

# Deploy infrastructure
Write-Host "🏗️  Deploying Azure infrastructure..." -ForegroundColor Yellow
az deployment group create `
    --resource-group $resourceGroupName `
    --template-file "./infra/main.bicep" `
    --parameters "./infra/main.parameters.json" `
    --name $deploymentName

# Get deployment outputs
Write-Host "📋 Getting deployment outputs..." -ForegroundColor Yellow
$outputs = az deployment group show --resource-group $resourceGroupName --name $deploymentName --query properties.outputs --output json | ConvertFrom-Json

$backendUrl = $outputs.backendUrl.value
$frontendUrl = $outputs.frontendUrl.value
$storageAccountName = $outputs.storageAccountName.value

Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Storage Account: $storageAccountName" -ForegroundColor Cyan

# Deploy backend code
Write-Host "🔄 Deploying backend application..." -ForegroundColor Yellow
Set-Location "backend"

# Create deployment package
Compress-Archive -Path "*.py", "*.txt", "app", "*.json" -DestinationPath "../backend-deploy.zip" -Force

# Deploy to App Service
az webapp deployment source config-zip --resource-group $resourceGroupName --name "ai-quality-dashboard-backend-prod" --src "../backend-deploy.zip"

Set-Location ".."

# Update frontend environment variables
Write-Host "🔧 Configuring frontend..." -ForegroundColor Yellow
Set-Location "frontend"

# Create production environment file
@"
REACT_APP_API_URL=$backendUrl
"@ | Out-File -FilePath ".env.production" -Encoding utf8

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

Set-Location ".."

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your dashboard at:" -ForegroundColor Cyan
Write-Host "   Frontend: $frontendUrl" -ForegroundColor White
Write-Host "   Backend API: $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Setup GitHub Actions for CI/CD" -ForegroundColor White
Write-Host "   2. Configure custom domain (optional)" -ForegroundColor White
Write-Host "   3. Share URLs with your colleagues!" -ForegroundColor White