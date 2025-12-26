#!/usr/bin/env python3
"""
Standalone FastAPI server for AI Quality Dashboard
"""

import csv
import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

def load_csv_data():
    """Load and parse the CSV data"""
    # Use absolute path to ensure we can find the CSV file
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "data", "5Prompts-DSB_WorkloadRCAAgent_quality_quality_en_20251224-055849.csv")
    data = []
    
    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}")
        return []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                # Extract the relevant data from CSV
                query_raw = row.get("inputs.query", "")
                user_message = extract_user_message(query_raw)
                
                run_data = {
                    "runId": f"run_{row.get('id', 'unknown')}",
                    "prompt": user_message,
                    "conversation_id": row.get("inputs.conversation_id", ""),
                    "response": row.get("inputs.response", ""),
                    "tool_definitions": row.get("inputs.tool_definitions", ""),
                    "tools_used": row.get("inputs.tools_used", ""),
                    "raw_data": row  # Store raw row for detailed views
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
                    
                    # Convert result to pass/fail
                    passed = 1 if result.lower() == "pass" else 0
                    total = 1
                    
                    # Use pass/fail as the primary score (0% or 100%)
                    # This gives a clearer view of success rate per evaluation
                    score = 100 if passed == 1 else 0
                    
                    # Convert metric name for frontend compatibility
                    metric_name = metric
                    if metric == "intent_resolution":
                        metric_name = "intentResolution"
                    elif metric == "tool_call_accuracy":
                        metric_name = "toolCallAccuracy"
                    elif metric == "task_adherence":
                        metric_name = "taskAdherence"
                    
                    run_data[metric_name] = {
                        "score": score,
                        "passed": passed,
                        "total": total,
                        "result": result,
                        "reason": reason
                    }
                
                data.append(run_data)
        
        print(f"Loaded {len(data)} records from CSV")
        return data
    
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return []

# Load data from CSV
EVALUATION_DATA = load_csv_data()

@app.get("/")
def read_root():
    return {"message": "AI Quality Dashboard API"}

@app.get("/runs")
def get_runs():
    """Get all run summaries"""
    if not EVALUATION_DATA:
        return []
    return EVALUATION_DATA

@app.get("/runs/{run_id}/metrics/{metric}")
def get_metric_details(run_id: str, metric: str):
    """Get detailed metric information for a specific run"""
    
    # Handle aggregated view for all runs
    if run_id == "all":
        result = []
        for i, data in enumerate(EVALUATION_DATA):
            metric_map = {
                "intentResolution": "intent_resolution",
                "toolCallAccuracy": "tool_call_accuracy", 
                "taskAdherence": "task_adherence"
            }
            
            original_metric = metric_map.get(metric, metric)
            raw_data = data.get("raw_data", {})
            metric_data = data.get(metric, {})
            result_key = f"{original_metric}.{original_metric}.result"
            reason_key = f"{original_metric}.{original_metric}.reason"
            
            detail = {
                "promptId": f"prompt_{i+1}",
                "prompt": extract_user_message(raw_data.get("inputs.query", "")),
                "agentResponse": raw_data.get("inputs.response", "")[:500] + "..." if len(raw_data.get("inputs.response", "")) > 500 else raw_data.get("inputs.response", ""),
                "passed": raw_data.get(result_key, "").lower() == "pass",
                "confidence": metric_data.get("score", 0) / 100.0,
                "reason": raw_data.get(reason_key, "No reason provided")
            }
            result.append(detail)
        return result
    
    # Handle individual run details
    run_data = None
    for data in EVALUATION_DATA:
        if data["runId"] == run_id:
            run_data = data
            break
    
    if not run_data:
        return []
    
    # Convert camelCase metric names back to snake_case for data lookup
    metric_map = {
        "intentResolution": "intent_resolution",
        "toolCallAccuracy": "tool_call_accuracy", 
        "taskAdherence": "task_adherence"
    }
    
    original_metric = metric_map.get(metric, metric)
    
    # Get the raw CSV data for this run
    raw_data = run_data.get("raw_data", {})
    
    # Create detailed response based on the actual data
    result = []
    
    # Since we only have one record per run, create a single detail entry
    metric_data = run_data.get(metric, {})
    result_key = f"{original_metric}.{original_metric}.result"
    reason_key = f"{original_metric}.{original_metric}.reason"
    
    detail = {
        "promptId": f"prompt_{run_data.get('runId', '').split('_')[-1]}",
        "prompt": extract_user_message(raw_data.get("inputs.query", "")),
        "agentResponse": raw_data.get("inputs.response", ""),
        "passed": raw_data.get(result_key, "").lower() == "pass",
        "confidence": metric_data.get("score", 0) / 100.0,
        "reason": raw_data.get(reason_key, "No reason provided")
    }
    
    result.append(detail)
    return result

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)