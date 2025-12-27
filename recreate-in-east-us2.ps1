# Recreate Azure Resources in East US 2 Region
# This script will delete existing resources and recreate them in East US 2

Write-Host "🔄 Recreating Azure Resources in East US 2" -ForegroundColor Green
Write-Host "Resource Group: Agents-AI-Quality-Dashboard" -ForegroundColor Cyan

# 1. Delete existing resources from East US
Write-Host "🗑️ Cleaning up existing East US resources..." -ForegroundColor Yellow

Write-Host "Deleting App Service..." -ForegroundColor Gray
az webapp delete --name "ai-quality-dashboard-backend" --resource-group "Agents-AI-Quality-Dashboard"

Write-Host "Deleting App Service Plan..." -ForegroundColor Gray
az appservice plan delete --name "ai-quality-dashboard-plan" --resource-group "Agents-AI-Quality-Dashboard" --yes

Write-Host "Deleting Storage Account..." -ForegroundColor Gray
az storage account delete --name "aiqldash290" --resource-group "Agents-AI-Quality-Dashboard" --yes

Write-Host "Deleting Application Insights..." -ForegroundColor Gray
az monitor app-insights component delete --app "ai-quality-dashboard-insights" --resource-group "Agents-AI-Quality-Dashboard"

Write-Host "Deleting Static Web App..." -ForegroundColor Gray
az staticwebapp delete --name "ai-quality-dashboard-frontend" --resource-group "Agents-AI-Quality-Dashboard"

Write-Host "✅ Cleanup completed!" -ForegroundColor Green

# Wait a moment for cleanup to complete
Start-Sleep -Seconds 10

# 2. Create new resources in East US 2
Write-Host "🏗️ Creating new resources in East US 2..." -ForegroundColor Yellow

# Create App Service Plan in East US 2
Write-Host "Creating App Service Plan..." -ForegroundColor Cyan
az appservice plan create `
  --name "ai-quality-dashboard-plan" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --sku B1 `
  --is-linux `
  --location "East US 2"

# Create App Service for Backend in East US 2
Write-Host "Creating Backend App Service..." -ForegroundColor Cyan
az webapp create `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --plan "ai-quality-dashboard-plan" `
  --name "ai-quality-dashboard-backend" `
  --runtime "PYTHON:3.11" `
  --startup-file "uvicorn server:app --host 0.0.0.0 --port 8000"

# Configure Environment Variables
Write-Host "Configuring environment variables..." -ForegroundColor Cyan
az webapp config appsettings set `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --name "ai-quality-dashboard-backend" `
  --settings PORT=8000 PYTHONPATH=/home/site/wwwroot

# Create Storage Account in East US 2
Write-Host "Creating Storage Account..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$storageAccountName = "aiqldash$timestamp"

az storage account create `
  --name $storageAccountName `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --location "East US 2" `
  --sku Standard_LRS `
  --kind StorageV2

# Create Storage Container
Write-Host "Creating storage container..." -ForegroundColor Cyan
az storage container create `
  --name "uploads" `
  --account-name $storageAccountName `
  --public-access off

# Create Application Insights in East US 2
Write-Host "Creating Application Insights..." -ForegroundColor Cyan
az monitor app-insights component create `
  --app "ai-quality-dashboard-insights" `
  --location "East US 2" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --application-type web

# Create Static Web App in East US 2
Write-Host "Creating Static Web App..." -ForegroundColor Cyan
az staticwebapp create `
  --name "ai-quality-dashboard-frontend" `
  --resource-group "Agents-AI-Quality-Dashboard" `
  --location "East US 2" `
  --sku Free

Write-Host "✅ All resources recreated successfully in East US 2!" -ForegroundColor Green
Write-Host ""

# Get the new URLs
Write-Host "📋 Your new URLs:" -ForegroundColor Cyan
Write-Host "Backend API: https://ai-quality-dashboard-backend.azurewebsites.net" -ForegroundColor White
$frontendUrl = az staticwebapp show --name "ai-quality-dashboard-frontend" --resource-group "Agents-AI-Quality-Dashboard" --query "defaultHostname" -o tsv 2>$null
if ($frontendUrl) {
    Write-Host "Frontend: https://$frontendUrl" -ForegroundColor White
} else {
    Write-Host "Frontend: Will be available after GitHub configuration" -ForegroundColor White
}

Write-Host ""
Write-Host "🌍 All resources are now in East US 2 region!" -ForegroundColor Green
Write-Host "📊 Storage Account: $storageAccountName" -ForegroundColor White
Write-Host ""
Write-Host "🔗 View in Azure Portal:" -ForegroundColor Cyan
Write-Host "https://portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/40449e6d-a5d2-40f1-a151-0b76f21a48c0/resourceGroups/Agents-AI-Quality-Dashboard/overview" -ForegroundColor Blue

Write-Host ""
Write-Host "📚 Ready for deployment!" -ForegroundColor Yellow