#!/bin/bash
echo "Starting backend deployment..."
cd backend
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo "Starting FastAPI server..."
python -m uvicorn server_azure:app --host 0.0.0.0 --port 8000