# 🚀 **Complete Azure Deployment Guide for AI Quality Dashboard**

## **📋 Overview**
Deploy your AI Quality Dashboard to Azure for enterprise-grade hosting and team collaboration.

### **🏗️ Azure Architecture**
- **Azure App Service**: Backend API (Python FastAPI)
- **Azure Static Web Apps**: Frontend (React)
- **Azure Storage Account**: File persistence
- **Application Insights**: Monitoring and analytics

---

## **🛠️ Prerequisites**

### **Required Tools:**
```powershell
# 1. Install Azure CLI
winget install Microsoft.AzureCLI

# 2. Install Node.js (for frontend)
winget install OpenJS.NodeJS

# 3. Verify Python 3.11+
python --version
```

### **Azure Subscription:**
- Active Azure subscription with contributor permissions
- Resource creation permissions

---

## **🚀 Deployment Options**

### **Option 1: Automated Deployment (Recommended)**

#### **Step 1: Run Deployment Script**
```powershell
# Clone/navigate to your project
cd "C:\Users\padmajat\Documents\Dashboard-Evals\ai-quality-dashboard"

# Run automated deployment
.\deploy-azure.ps1
```

**This will:**
✅ Create all Azure resources  
✅ Deploy backend to App Service  
✅ Build and configure frontend  
✅ Set up monitoring  
✅ Provide shareable URLs  

---

### **Option 2: Manual Step-by-Step Deployment**

#### **Step 1: Azure Login & Resource Group**
```powershell
# Login to Azure
az login

# Create resource group
az group create --name ai-quality-dashboard-rg --location "East US"
```

#### **Step 2: Deploy Infrastructure**
```powershell
# Deploy Bicep template
az deployment group create \
  --resource-group ai-quality-dashboard-rg \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/main.parameters.json"
```

#### **Step 3: Deploy Backend**
```powershell
cd backend

# Create deployment package
Compress-Archive -Path "*.py", "*.txt", "app", "*.json" -DestinationPath "../backend-deploy.zip" -Force

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group ai-quality-dashboard-rg \
  --name "ai-quality-dashboard-backend-prod" \
  --src "../backend-deploy.zip"
```

#### **Step 4: Deploy Frontend**
```powershell
cd frontend

# Update production environment
echo "REACT_APP_API_URL=https://ai-quality-dashboard-backend-prod.azurewebsites.net" > .env.production

# Build and deploy
npm run build
az staticwebapp create \
  --name ai-quality-dashboard-frontend-prod \
  --resource-group ai-quality-dashboard-rg \
  --source https://github.com/YOUR-USERNAME/ai-quality-dashboard \
  --location "East US2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"
```

---

## **🌐 Post-Deployment URLs**

After successful deployment, you'll receive:

### **Production URLs:**
- **🎛️ Dashboard**: `https://ai-quality-dashboard-frontend-prod.azurestaticapps.net`
- **🔌 Backend API**: `https://ai-quality-dashboard-backend-prod.azurewebsites.net`
- **📊 Monitoring**: Azure Portal → Application Insights

### **Share with Colleagues:**
Send them the dashboard URL with these access details:
```
🎯 AI Quality Dashboard
📊 Live Dashboard: https://ai-quality-dashboard-frontend-prod.azurestaticapps.net

Features:
✅ Upload Excel/CSV evaluation files
✅ Real-time metric visualization  
✅ Interactive drill-down analysis
✅ Mobile-responsive design
```

---

## **⚡ Continuous Deployment (Optional)**

### **GitHub Actions Setup:**
The project includes automated CI/CD pipelines:

1. **Push code changes** to `main` branch
2. **GitHub Actions** automatically deploys to Azure
3. **Zero-downtime** updates

### **Configure Secrets:**
In your GitHub repository, add these secrets:
```
AZURE_CREDENTIALS: (Service Principal JSON)
AZURE_STATIC_WEB_APPS_API_TOKEN: (From Static Web Apps)
```

---

## **🔐 Security & Access**

### **Authentication (Optional):**
- **Azure Active Directory**: Enterprise SSO
- **Access Control**: Role-based permissions
- **Private Endpoints**: VPN-only access

### **Data Security:**
- **HTTPS Enforced**: All traffic encrypted
- **Azure Storage**: Files stored securely
- **No Hardcoded Secrets**: Environment variables

---

## **📊 Monitoring & Maintenance**

### **Application Insights Dashboard:**
- **Performance Metrics**: Response times, errors
- **Usage Analytics**: User behavior, popular features
- **Alert Configuration**: Automated notifications

### **Cost Management:**
- **Free Tier**: Static Web Apps (no cost)
- **App Service**: ~$13/month (Basic tier)
- **Storage**: ~$1/month for file uploads

---

## **🔄 Updates & Maintenance**

### **Deploy Updates:**
```powershell
# Quick frontend update
cd frontend
npm run build
# Auto-deploys via GitHub Actions

# Backend update  
cd backend
# Push to GitHub → Auto-deploys
```

### **Backup Strategy:**
- **Source Code**: GitHub repository
- **Data Files**: Azure Storage (geo-redundant)
- **Configuration**: Infrastructure as Code (Bicep)

---

## **🆘 Troubleshooting**

### **Common Issues:**

#### **Backend Not Responding:**
```powershell
# Check App Service logs
az webapp log tail --name ai-quality-dashboard-backend-prod --resource-group ai-quality-dashboard-rg
```

#### **Frontend Build Errors:**
```powershell
# Clear cache and rebuild
cd frontend
rm -rf node_modules\.cache
npm ci
npm run build
```

#### **File Upload Issues:**
- Check Azure Storage connection string
- Verify container permissions
- Monitor Application Insights for errors

### **Support Resources:**
- **Azure Documentation**: https://docs.microsoft.com/en-us/azure/
- **Application Insights**: Built-in error tracking
- **GitHub Issues**: Project-specific problems

---

## **🎉 Success Checklist**

After deployment, verify:

✅ **Frontend loads** at the Static Web Apps URL  
✅ **Backend API responds** at `/health` endpoint  
✅ **File upload works** with test CSV  
✅ **Metrics display** correctly  
✅ **Colleagues can access** the shared URL  
✅ **Monitoring active** in Application Insights  

---

## **💡 Next Steps**

1. **Share URLs** with your team
2. **Set up alerts** for critical errors
3. **Configure custom domain** (optional)
4. **Add authentication** for sensitive data (optional)
5. **Scale resources** based on usage

**🎯 Your dashboard is now production-ready and shareable with colleagues!**