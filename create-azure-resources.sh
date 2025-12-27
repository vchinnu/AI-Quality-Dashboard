# Azure Deployment Commands for Agents-AI-Quality-Dashboard Resource Group
# Run these commands in order after logging in with az login

# 1. Login with your Entra ID
az login

# 2. Set your subscription
az account set --subscription "40449e6d-a5d2-40f1-a151-0b76f21a48c0"

# 3. Create App Service Plan (Basic B1 - $13/month)
az appservice plan create \
  --name "ai-quality-dashboard-plan" \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --sku B1 \
  --is-linux \
  --location "East US"

# 4. Create App Service for Backend
az webapp create \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --plan "ai-quality-dashboard-plan" \
  --name "ai-quality-dashboard-backend" \
  --runtime "PYTHON:3.11" \
  --startup-file "uvicorn server:app --host 0.0.0.0 --port 8000"

# 5. Configure App Service Environment Variables
az webapp config appsettings set \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --name "ai-quality-dashboard-backend" \
  --settings PORT=8000 PYTHONPATH=/home/site/wwwroot

# 6. Create Storage Account for File Uploads
az storage account create \
  --name "aiqldashstorage$(date +%s)" \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --location "East US" \
  --sku Standard_LRS \
  --kind StorageV2

# 7. Create Storage Container
# First, get the storage account name
STORAGE_ACCOUNT=$(az storage account list --resource-group "Agents-AI-Quality-Dashboard" --query "[0].name" -o tsv)

# Create container
az storage container create \
  --name "uploads" \
  --account-name $STORAGE_ACCOUNT \
  --public-access off

# 8. Create Application Insights for Monitoring
az monitor app-insights component create \
  --app "ai-quality-dashboard-insights" \
  --location "East US" \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --application-type web

# 9. Create Static Web App for Frontend
az staticwebapp create \
  --name "ai-quality-dashboard-frontend" \
  --resource-group "Agents-AI-Quality-Dashboard" \
  --source "https://github.com/YOUR-GITHUB-USERNAME/ai-quality-dashboard" \
  --location "East US2" \
  --branch "main" \
  --app-location "/frontend" \
  --output-location "build"

# 10. Get the URLs after creation
echo "Backend URL: https://ai-quality-dashboard-backend.azurewebsites.net"
echo "Frontend URL: $(az staticwebapp show --name ai-quality-dashboard-frontend --resource-group Agents-AI-Quality-Dashboard --query defaultHostname -o tsv)"