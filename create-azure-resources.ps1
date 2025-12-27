# Azure Deployment PowerShell Script for Agents-AI-Quality-Dashboard
# Run this script in PowerShell after installing Azure CLI

Write-Host "🚀 Creating Azure Resources for AI Quality Dashboard" -ForegroundColor Green
Write-Host "Resource Group: Agents-AI-Quality-Dashboard" -ForegroundColor Cyan
Write-Host "Subscription: 40449e6d-a5d2-40f1-a151-0b76f21a48c0" -ForegroundColor Cyan

# 1. Login with Entra ID (will open browser)
Write-Host "🔐 Logging in with your Entra ID..." -ForegroundColor Yellow
az login

# 2. Set subscription
Write-Host "📋 Setting subscription..." -ForegroundColor Yellow
az account set --subscription "40449e6d-a5d2-40f1-a151-0b76f21a48c0"

# 3. Create App Service Plan
Write-Host "🏗️ Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
  --name "ai-quality-dashboard-plan" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --sku B1 `
  --is-linux `
  --location "East US"

# 4. Create App Service for Backend
Write-Host "🔧 Creating Backend App Service..." -ForegroundColor Yellow
az webapp create `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --plan "ai-quality-dashboard-plan" `
  --name "ai-quality-dashboard-backend" `
  --runtime "PYTHON:3.11" `
  --startup-file "uvicorn server:app --host 0.0.0.0 --port 8000"

# 5. Configure Environment Variables
Write-Host "⚙️ Configuring environment variables..." -ForegroundColor Yellow
az webapp config appsettings set `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --name "ai-quality-dashboard-backend" `
  --settings PORT=8000 PYTHONPATH=/home/site/wwwroot

# 6. Create Storage Account
Write-Host "💾 Creating Storage Account..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$storageAccountName = "aiqldashstorage$timestamp"

az storage account create `
  --name $storageAccountName `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --location "East US" `
  --sku Standard_LRS `
  --kind StorageV2

# 7. Create Storage Container
Write-Host "📁 Creating storage container..." -ForegroundColor Yellow
az storage container create `
  --name "uploads" `
  --account-name $storageAccountName `
  --public-access off

# 8. Create Application Insights
Write-Host "📊 Creating Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create `
  --app "ai-quality-dashboard-insights" `
  --location "East US" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --application-type web

# 9. Create Static Web App for Frontend
Write-Host "🌐 Creating Static Web App..." -ForegroundColor Yellow
Write-Host "⚠️ You'll need to provide your GitHub repository URL when prompted" -ForegroundColor Red
az staticwebapp create `
  --name "ai-quality-dashboard-frontend" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --location "East US2" `
  --sku Free

# 10. Display results
Write-Host "✅ Azure resources created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Your URLs:" -ForegroundColor Cyan
Write-Host "Backend API: https://ai-quality-dashboard-backend.azurewebsites.net" -ForegroundColor White
Write-Host "Frontend will be available after GitHub setup" -ForegroundColor White
Write-Host ""
Write-Host "🔗 View in Azure Portal:" -ForegroundColor Cyan
Write-Host "https://portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/40449e6d-a5d2-40f1-a151-0b76f21a48c0/resourceGroups/Agents-AI-Quality-Dashboard/overview" -ForegroundColor Blue

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend code to App Service" -ForegroundColor White
Write-Host "2. Configure Static Web App with GitHub" -ForegroundColor White
Write-Host "3. Update frontend environment variables" -ForegroundColor White
Write-Host "4. Test the deployed dashboard" -ForegroundColor White