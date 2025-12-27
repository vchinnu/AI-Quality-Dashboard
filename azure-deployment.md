# Azure Deployment Configuration

## Azure Resources Required:
1. **Azure App Service** (Backend - Python/FastAPI)
2. **Azure Static Web Apps** (Frontend - React)
3. **Azure Storage Account** (File persistence)
4. **Application Insights** (Monitoring)

## Deployment Steps:

### 1. Backend - Azure App Service

#### Create App Service:
```bash
# Login to Azure
az login

# Create resource group
az group create --name ai-quality-dashboard-rg --location "East US"

# Create App Service plan
az appservice plan create \
  --name ai-quality-dashboard-plan \
  --resource-group ai-quality-dashboard-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group ai-quality-dashboard-rg \
  --plan ai-quality-dashboard-plan \
  --name ai-quality-dashboard-backend \
  --runtime "PYTHON:3.11" \
  --startup-file "uvicorn server:app --host 0.0.0.0 --port 8000"
```

#### Configure App Settings:
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group ai-quality-dashboard-rg \
  --name ai-quality-dashboard-backend \
  --settings PORT=8000 PYTHONPATH=/home/site/wwwroot
```

### 2. Frontend - Azure Static Web Apps

#### Deploy Static Web App:
```bash
# Create static web app
az staticwebapp create \
  --name ai-quality-dashboard-frontend \
  --resource-group ai-quality-dashboard-rg \
  --source https://github.com/YOUR-USERNAME/ai-quality-dashboard \
  --location "East US2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"
```

### 3. Storage Account (File Persistence)

```bash
# Create storage account
az storage account create \
  --name aiqldashstorage \
  --resource-group ai-quality-dashboard-rg \
  --location "East US" \
  --sku Standard_LRS

# Create container for uploaded files
az storage container create \
  --name uploads \
  --account-name aiqldashstorage \
  --public-access off
```

## Deployment URLs:
- **Backend**: https://ai-quality-dashboard-backend.azurewebsites.net
- **Frontend**: https://YOUR-STATIC-APP-NAME.azurestaticapps.net