# AI Quality Dashboard

A comprehensive web application for evaluating and visualizing AI prompt quality metrics with interactive dashboards and detailed analysis tools.

## 🚀 Live Deployment

- **Frontend**: https://gray-forest-03d28cf0f.1.azurestaticapps.net
- **Backend API**: https://ai-quality-dashboard-backend-v2.azurewebsites.net
- **API Documentation**: https://ai-quality-dashboard-backend-v2.azurewebsites.net/docs

## 🏗️ Architecture

- **Frontend**: React.js application hosted on Azure Static Web Apps
- **Backend**: FastAPI Python server hosted on Azure App Service
- **Database**: File-based storage with CSV/Excel support
- **CI/CD**: Automated deployment via GitHub Actions

## 📋 Features

- Upload and analyze CSV/Excel files with AI prompt evaluation data
- Interactive dashboard with quality metrics visualization
- Individual prompt run analysis with detailed scoring
- Real-time data processing and visualization
- Responsive web interface

## 🔄 Deployment Pipeline

### Automated CI/CD Flow
```
Local Development → GitHub Repository → Azure Cloud
```

### 1. Local to GitHub (Manual)
```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main
```

### 2. GitHub to Azure (Automated)

#### Backend Deployment (App Service)
- **Trigger**: Push to `main` branch
- **Method**: GitHub integration with Azure App Service  
- **Process**:
  1. GitHub detects push to `main`
  2. Azure pulls latest code from GitHub
  3. Oryx build system:
     - Detects `requirements.txt` in root
     - Creates virtual environment at `/home/site/wwwroot/.venv`
     - Installs Python dependencies (pandas, fastapi, uvicorn, etc.)
  4. Starts with: `PYTHONPATH=/home/site/wwwroot/.venv/lib/site-packages:/home/site/wwwroot python3 -m uvicorn server_azure:app --host 0.0.0.0 --port 8000`

#### Frontend Deployment (Static Web App)
- **Trigger**: Push to `main` branch
- **Method**: GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`)
- **Process**:
  1. GitHub Actions runs automatically
  2. Sets up Node.js 18
  3. Runs `npm ci` in frontend folder
  4. Builds React app with `REACT_APP_API_URL=https://ai-quality-dashboard-backend-v2.azurewebsites.net`
  5. Deploys build to Azure Static Web Apps

### Current Azure Configuration

#### Backend Settings (App Service)
```bash
PROJECT=.                                    # Deploy from root directory
SCM_DO_BUILD_DURING_DEPLOYMENT=1           # Enable Oryx build
ENABLE_ORYX_BUILD=1                         # Force dependency installation
PYTHONPATH=/home/site/wwwroot/.venv/lib/site-packages:/home/site/wwwroot  # Include virtual env
```

#### Frontend Settings (GitHub Actions)
```yaml
env:
  REACT_APP_API_URL: https://ai-quality-dashboard-backend-v2.azurewebsites.net
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server_azure.py
# Server runs on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

## 📊 Monitoring Deployments

### Backend Deployment Status
```bash
# Check deployment status
az webapp deployment list --name ai-quality-dashboard-backend-v2 --resource-group Agents-AI-Quality-Dashboard --query "[0].{status: status, message: message}"

# Watch real-time logs
az webapp log tail --name ai-quality-dashboard-backend-v2 --resource-group Agents-AI-Quality-Dashboard
```

### Frontend Deployment Status
- Go to: https://github.com/vchinnu/AI-Quality-Dashboard/actions
- Watch the "Azure Static Web Apps CI/CD" workflow

## 🛠️ Deployment Timeline
- **Backend**: 2-3 minutes after push
- **Frontend**: 3-5 minutes after push

## 🎯 Key Benefits
- **One-Click Deployment**: Just `git push` to deploy both frontend and backend
- **Automatic Scaling**: Azure handles traffic spikes
- **Zero Downtime**: Rolling deployments with health checks
- **HTTPS by Default**: Secure connections for all endpoints

## 📁 Project Structure
```
ai-quality-dashboard/
├── frontend/           # React.js application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # FastAPI Python server
│   ├── server_azure.py
│   ├── requirements.txt
│   └── app/
├── .github/workflows/ # GitHub Actions CI/CD
├── infra/            # Azure infrastructure (Bicep)
└── README.md
```

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vchinnu/AI-Quality-Dashboard.git
   cd AI-Quality-Dashboard
   ```

2. **Run locally**:
   ```bash
   # Start backend
   cd backend
   pip install -r requirements.txt
   python server_azure.py &

   # Start frontend
   cd ../frontend
   npm install
   npm start
   ```

3. **Deploy to Azure**:
   ```bash
   # Just push to main branch!
   git add .
   git commit -m "Deploy to Azure"
   git push origin main
   ```

## 🔗 Useful Links

- [Azure Resource Group](https://portal.azure.com/#view/HubsExtension/BrowseResourceGroupBlade/~/Agents-AI-Quality-Dashboard)
- [GitHub Repository](https://github.com/vchinnu/AI-Quality-Dashboard)
- [GitHub Actions](https://github.com/vchinnu/AI-Quality-Dashboard/actions)