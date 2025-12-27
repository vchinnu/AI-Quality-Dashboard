#!/usr/bin/env python3
"""
Azure-optimized FastAPI server for AI Quality Dashboard
"""

import csv
import json
import os
import tempfile
import shutil
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Optional

app = FastAPI(title="AI Quality Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_user_message(query_str):
    """Extract user message from JSON query string"""
    try:
        if not query_str:
            return ""
        
        # Parse the JSON string
        query_obj = json.loads(query_str)
        
        # Look for user role content
        if isinstance(query_obj, list):
            for item in query_obj:
                if isinstance(item, dict) and item.get('role') == 'user':
                    content = item.get('content', '')
                    if isinstance(content, list):
                        # Extract text from content array
                        for content_item in content:
                            if isinstance(content_item, dict) and content_item.get('type') == 'text':
                                return content_item.get('text', '')
                    elif isinstance(content, str):
                        return content
        
        # If no user role found, return first 200 chars of original
        return query_str[:200] + "..." if len(query_str) > 200 else query_str
        
    except (json.JSONDecodeError, Exception) as e:
        # If JSON parsing fails, return first 200 chars
        return query_str[:200] + "..." if len(query_str) > 200 else query_str

# Default data path - adjusted for Azure
DEFAULT_CSV_PATH = os.path.join("app", "data", "5Prompts-DSB_WorkloadRCAAgent_quality_quality_en_20251224-055849.csv")

# Store current active dataset path and original filename
current_dataset_path = DEFAULT_CSV_PATH
current_dataset_filename = os.path.basename(DEFAULT_CSV_PATH)

def load_csv_data():
    """Load and parse the CSV data"""
    global current_dataset_path
    data = []
    
    if not os.path.exists(current_dataset_path):
        print(f"CSV file not found at {current_dataset_path}")
        return []
    
    try:
        # Load the file based on its extension  
        if current_dataset_path.endswith('.csv'):
            with open(current_dataset_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Extract the relevant data from CSV
                    query_raw = row.get("inputs.query", "")
                    user_message = extract_user_message(query_raw)
                    
                    run_data = {
                        "runId": f"run_{row.get('id', 'unknown')}",
                        "conversation_id": row.get("inputs.conversation_id", ""),
                        "user_message": user_message,
                        "agent_response": row.get("inputs.response", "")
                    }
                    
                    # Parse evaluation metrics
                    metrics = ["intent_resolution", "coherence", "relevance", "groundedness", "tool_call_accuracy", "task_adherence", "fluency"]
                    
                    for metric in metrics:
                        result_key = f"{metric}.{metric}.result"
                        score_key = f"{metric}.{metric}.score" 
                        reason_key = f"{metric}.{metric}.reason"
                        
                        result = row.get(result_key, "")
                        score_str = row.get(score_key, "0")
                        reason = row.get(reason_key, "")
                        
                        # Parse score
                        try:
                            score = float(score_str) if score_str else 0.0
                        except ValueError:
                            score = 0.0
                        
                        run_data[f"{metric}_result"] = result
                        run_data[f"{metric}_score"] = score  
                        run_data[f"{metric}_reason"] = reason
                    
                    data.append(run_data)
        
        elif current_dataset_path.endswith(('.xlsx', '.xls')):
            # Read Excel file
            df = pd.read_excel(current_dataset_path)
            for _, row in df.iterrows():
                # Process Excel data similar to CSV
                query_raw = row.get("inputs.query", "")
                user_message = extract_user_message(query_raw)
                
                run_data = {
                    "runId": f"run_{row.get('id', 'unknown')}",
                    "conversation_id": row.get("inputs.conversation_id", ""),
                    "user_message": user_message,
                    "agent_response": row.get("inputs.response", "")
                }
                
                # Parse evaluation metrics
                metrics = ["intent_resolution", "coherence", "relevance", "groundedness", "tool_call_accuracy", "task_adherence", "fluency"]
                
                for metric in metrics:
                    result_key = f"{metric}.{metric}.result"
                    score_key = f"{metric}.{metric}.score" 
                    reason_key = f"{metric}.{metric}.reason"
                    
                    result = row.get(result_key, "")
                    score_str = str(row.get(score_key, "0"))
                    reason = row.get(reason_key, "")
                    
                    # Parse score
                    try:
                        score = float(score_str) if score_str else 0.0
                    except ValueError:
                        score = 0.0
                    
                    run_data[f"{metric}_result"] = result
                    run_data[f"{metric}_score"] = score  
                    run_data[f"{metric}_reason"] = reason
                
                data.append(run_data)
                
    except Exception as e:
        print(f"Error loading CSV data: {str(e)}")
        return []
    
    return data

@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "AI Quality Dashboard API", "status": "running"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/runs")
def get_runs():
    """Get all evaluation runs"""
    try:
        data = load_csv_data()
        return {"runs": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")

@app.get("/metrics")
def get_metrics():
    """Get aggregated metrics"""
    try:
        data = load_csv_data()
        
        if not data:
            return {"metrics": []}
        
        # Calculate metrics
        metrics_data = {}
        metrics = ["intent_resolution", "coherence", "relevance", "groundedness", "tool_call_accuracy", "task_adherence", "fluency"]
        
        for metric in metrics:
            scores = [run.get(f"{metric}_score", 0) for run in data]
            valid_scores = [s for s in scores if isinstance(s, (int, float)) and s > 0]
            
            if valid_scores:
                avg_score = sum(valid_scores) / len(valid_scores)
                metrics_data[metric] = {
                    "name": metric.replace("_", " ").title(),
                    "value": round(avg_score, 2),
                    "total_runs": len(data),
                    "valid_scores": len(valid_scores)
                }
            else:
                metrics_data[metric] = {
                    "name": metric.replace("_", " ").title(),
                    "value": 0,
                    "total_runs": len(data),
                    "valid_scores": 0
                }
        
        return {"metrics": list(metrics_data.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")

@app.get("/runs/{run_id}")
def get_run(run_id: str):
    """Get specific run details"""
    try:
        data = load_csv_data()
        
        run = next((r for r in data if r["runId"] == run_id), None)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return {"run": run}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting run: {str(e)}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV/Excel file"""
    global current_dataset_path, current_dataset_filename
    
    try:
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Create temporary file
        suffix = '.csv' if file.filename.endswith('.csv') else '.xlsx'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Save uploaded file
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Update current dataset path
        current_dataset_path = temp_file.name
        current_dataset_filename = file.filename
        
        # Test load the data
        test_data = load_csv_data()
        
        return {
            "message": f"File uploaded successfully: {file.filename}",
            "filename": file.filename,
            "rows_loaded": len(test_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/current-dataset")
def get_current_dataset():
    """Get info about currently loaded dataset"""
    return {
        "filename": current_dataset_filename,
        "path": current_dataset_path,
        "exists": os.path.exists(current_dataset_path)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)