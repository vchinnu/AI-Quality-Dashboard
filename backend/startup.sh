#!/bin/bash
echo "Starting AI Quality Dashboard Backend"
cd /home/site/wwwroot
python -m uvicorn server_clean:app --host 0.0.0.0 --port 8000