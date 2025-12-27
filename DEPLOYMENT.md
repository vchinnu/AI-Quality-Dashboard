# AI Quality Dashboard

## Quick Start (Development)

### Option 1: Use the automated script
```powershell
# Run this from the root directory
.\start-dev.ps1
```

### Option 2: Manual startup
```powershell
# Terminal 1 - Backend
cd backend
python server.py

# Terminal 2 - Frontend  
cd frontend
npm start
```

## Deployment

### Frontend (Surge.sh)
```bash
cd frontend
npm run build
npx surge build ai-quality-dashboard.surge.sh
```

### Backend (Railway/Heroku)
The backend needs a cloud platform that supports Python servers:

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway project new
railway up
```

**Heroku:**
```bash
# Install Heroku CLI then:
cd backend
heroku create ai-quality-dashboard-backend
git subtree push --prefix=backend heroku main
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.herokuapp.com
```

### Backend
```
PORT=8002
```

## Troubleshooting

### Port Issues
- Backend uses port 8002 (change in server.py if needed)
- Frontend uses port 3000
- Use `netstat -ano | findstr :PORT` to check port usage
- Kill processes with `taskkill /F /PID process_id`

### File Persistence
- Uploaded files are stored in `backend/app/data/`
- Files persist across server restarts
- Original filenames are preserved

## Architecture

- **Backend**: FastAPI with uvicorn (Python)
- **Frontend**: React with TypeScript
- **File Storage**: Local filesystem with timestamp-based naming
- **API**: RESTful endpoints for data upload and retrieval