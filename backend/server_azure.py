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

# Azure imports (optional - will work without Azure SDK)
try:
    from azure.storage.blob import BlobServiceClient
    AZURE_STORAGE_AVAILABLE = True
except ImportError:
    AZURE_STORAGE_AVAILABLE = False

app = FastAPI(title="AI Quality Dashboard API")

# Configure CORS - more permissive for Azure Static Web Apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://gray-forest-03d28cf0f.1.azurestaticapps.net",
        "*"  # Allow all origins for now to debug
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure Storage configuration
AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
STORAGE_CONTAINER_NAME = "uploads"

def get_blob_service_client():
    """Get Azure Blob Storage client if available"""
    if AZURE_STORAGE_AVAILABLE and AZURE_STORAGE_CONNECTION_STRING:
        try:
            return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        except Exception as e:
            print(f"Azure Storage not available: {e}")
    return None

def save_file_to_azure(file_content: bytes, filename: str) -> str:
    """Save file to Azure Blob Storage"""
    blob_service_client = get_blob_service_client()
    
    if blob_service_client:
        try:
            # Create a unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            blob_name = f"uploaded_{timestamp}_{filename}"
            
            # Upload to blob storage
            blob_client = blob_service_client.get_blob_client(
                container=STORAGE_CONTAINER_NAME,
                blob=blob_name
            )
            blob_client.upload_blob(file_content, overwrite=True)
            
            print(f"File saved to Azure Storage: {blob_name}")
            return blob_name
        except Exception as e:
            print(f"Failed to save to Azure Storage: {e}")
    
    # Fallback to local storage
    return save_file_locally(file_content, filename)

def save_file_locally(file_content: bytes, filename: str) -> str:
    """Fallback: save file to local filesystem"""
    os.makedirs("app/data", exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"uploaded_{timestamp}_{filename}"
    file_path = os.path.join("app/data", unique_filename)
    
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    print(f"File saved locally: {file_path}")
    return file_path

def load_file_content(file_path: str) -> bytes:
    """Load file content from Azure Storage or local filesystem"""
    blob_service_client = get_blob_service_client()
    
    # Try Azure Storage first
    if blob_service_client and not os.path.exists(file_path):
        try:
            blob_client = blob_service_client.get_blob_client(
                container=STORAGE_CONTAINER_NAME,
                blob=file_path
            )
            return blob_client.download_blob().readall()
        except Exception as e:
            print(f"Failed to load from Azure Storage: {e}")
    
    # Fallback to local file
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            return f.read()
    
    raise FileNotFoundError(f"File not found: {file_path}")

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
        return str(query_obj)[:200] if query_obj else ""
    except Exception as e:
        print(f"Error parsing query: {e}")
        return str(query_str)[:200] if query_str else ""

# Default data path - can be overridden by file upload
DEFAULT_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "data", "5Prompts-DSB_WorkloadRCAAgent_quality_quality_en_20251224-055849.csv")

# Store current active dataset path and original filename
current_dataset_path = DEFAULT_CSV_PATH
current_dataset_filename = os.path.basename(DEFAULT_CSV_PATH)

def load_csv_data():
    """Load and parse the CSV data"""
    global current_dataset_path
    
    try:
        # Check if file exists
        if not current_dataset_path or not os.path.exists(current_dataset_path):
            print(f"File not found: {current_dataset_path}")
            return []
            
        # Try to load file content
        file_content = load_file_content(current_dataset_path)
        
        # Create temporary file for pandas to read
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
        
        try:
            if current_dataset_path.endswith('.csv') or temp_path.endswith('.csv'):
                df = pd.read_csv(temp_path)
            else:
                df = pd.read_excel(temp_path)
            
            print(f"Loaded {len(df)} records from {current_dataset_filename}")
            
            # Process the data into the expected format
            runs_data = []
            for i, (_, row) in enumerate(df.iterrows()):
                run_data = {
                    "runId": f"run_{i+1}",
                    "raw_data": row.to_dict()
                }
                runs_data.append(run_data)
            
            return runs_data
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
            
    except Exception as e:
        print(f"Error loading data: {e}")
        return []

# Load data from CSV - with safe error handling for Azure deployment
try:
    EVALUATION_DATA = load_csv_data()
    print(f"Successfully loaded default dataset with {len(EVALUATION_DATA)} runs")
except Exception as e:
    print(f"Could not load default dataset: {e}")
    print("Starting with empty dataset - will load data when file is uploaded")
    EVALUATION_DATA = []

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a new dataset file (CSV or Excel)"""
    global current_dataset_path, current_dataset_filename, EVALUATION_DATA
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be a CSV or Excel file")
    
    try:
        # Read file content
        content = await file.read()
        
        # Save file (Azure Storage or local)
        file_path = save_file_to_azure(content, file.filename)
        
        # Update current dataset path and filename
        current_dataset_path = file_path
        current_dataset_filename = file.filename
        
        # Reload data
        EVALUATION_DATA = load_csv_data()
        
        return {
            "message": f"Dataset {file.filename} uploaded successfully", 
            "filename": file.filename,
            "rows": len(EVALUATION_DATA)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/current-dataset-info")
def get_current_dataset_info():
    """Get information about the currently loaded dataset"""
    return {
        "filename": current_dataset_filename,
        "path": current_dataset_path,
        "rows": len(EVALUATION_DATA),
        "is_default": current_dataset_path == DEFAULT_CSV_PATH
    }

@app.post("/reset-to-default-dataset")
def reset_to_default_dataset():
    """Reset to using the default dataset"""
    global current_dataset_path, current_dataset_filename, EVALUATION_DATA
    current_dataset_path = DEFAULT_CSV_PATH
    current_dataset_filename = os.path.basename(DEFAULT_CSV_PATH)
    EVALUATION_DATA = load_csv_data()
    return {"message": "Reset to default dataset", "filename": current_dataset_filename}

@app.get("/")
def read_root():
    return {"message": "AI Quality Dashboard API", "status": "running", "dataset": current_dataset_filename}

@app.get("/health")
def health_check():
    """Health check endpoint for Azure"""
    return {
        "status": "healthy",
        "dataset_loaded": len(EVALUATION_DATA) > 0,
        "azure_storage": AZURE_STORAGE_AVAILABLE and bool(AZURE_STORAGE_CONNECTION_STRING)
    }

@app.get("/runs")
def get_runs():
    """Get all run summaries"""
    if not EVALUATION_DATA:
        return []
    
    # Aggregate metrics across all runs
    metrics = {
        "intentResolution": {"score": 0, "passed": 0, "total": 0},
        "coherence": {"score": 0, "passed": 0, "total": 0},
        "relevance": {"score": 0, "passed": 0, "total": 0},
        "groundedness": {"score": 0, "passed": 0, "total": 0},
        "toolCallAccuracy": {"score": 0, "passed": 0, "total": 0},
        "taskAdherence": {"score": 0, "passed": 0, "total": 0},
        "fluency": {"score": 0, "passed": 0, "total": 0}
    }
    
    # Process each run to calculate metrics
    for run_data in EVALUATION_DATA:
        raw_data = run_data.get("raw_data", {})
        
        # Map metrics to their CSV column patterns
        metric_mappings = {
            "intentResolution": "intent_resolution",
            "coherence": "coherence", 
            "relevance": "relevance",
            "groundedness": "groundedness",
            "toolCallAccuracy": "tool_call_accuracy",
            "taskAdherence": "task_adherence",
            "fluency": "fluency"
        }
        
        for metric_key, csv_prefix in metric_mappings.items():
            score_key = f"{csv_prefix}.{csv_prefix}.score"
            result_key = f"{csv_prefix}.{csv_prefix}.result"
            
            if score_key in raw_data:
                try:
                    score = float(raw_data[score_key])
                    metrics[metric_key]["score"] += score
                    metrics[metric_key]["total"] += 1
                    
                    # Check if passed
                    result = raw_data.get(result_key, "").lower()
                    if result == "pass":
                        metrics[metric_key]["passed"] += 1
                except (ValueError, TypeError):
                    pass
    
    # Calculate averages
    for metric in metrics.values():
        if metric["total"] > 0:
            metric["score"] = round(metric["score"] / metric["total"], 1)
        else:
            metric["score"] = 0
    
    return [{
        "runId": "all",
        **metrics
    }]

@app.get("/runs/{run_id}/metrics/{metric}")
def get_metric_details(run_id: str, metric: str):
    """Get detailed metric information for a specific run"""
    if not EVALUATION_DATA:
        return []
    
    # Convert camelCase metric names back to snake_case for data lookup
    metric_map = {
        "intentResolution": "intent_resolution",
        "toolCallAccuracy": "tool_call_accuracy", 
        "taskAdherence": "task_adherence"
    }
    
    original_metric = metric_map.get(metric, metric)
    result = []
    
    # Handle aggregated view for all runs
    if run_id == "all":
        for i, run_data in enumerate(EVALUATION_DATA):
            raw_data = run_data.get("raw_data", {})
            
            # Look for metric data
            score_key = f"{original_metric}.{original_metric}.score"
            result_key = f"{original_metric}.{original_metric}.result"
            reason_key = f"{original_metric}.{original_metric}.reason"
            
            if score_key in raw_data:
                try:
                    score = float(raw_data[score_key])
                    detail = {
                        "promptId": f"prompt_{i+1}",
                        "prompt": extract_user_message(raw_data.get("inputs.query", "")),
                        "agentResponse": raw_data.get("inputs.response", ""),
                        "passed": raw_data.get(result_key, "").lower() == "pass",
                        "confidence": score / 100.0,
                        "reason": raw_data.get(reason_key, "No reason provided")
                    }
                    result.append(detail)
                except (ValueError, TypeError):
                    pass
    
    return result

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)