"""
Data parsing utilities for the AI Quality Dashboard.
"""

import csv
import os
import pandas as pd
import json
from typing import List, Dict, Any
from .models import EvaluationResult

class DataParser:
    """Parser for evaluation data files."""
    
    def __init__(self):
        """Initialize the data parser."""
        pass
    
    def load_csv(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Load evaluation data from a CSV file.
        
        Args:
            file_path (str): Path to the CSV file
            
        Returns:
            List[Dict[str, Any]]: List of evaluation records
            
        Raises:
            FileNotFoundError: If the CSV file doesn't exist
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    data.append(row)
        except Exception as e:
            raise Exception(f"Error reading CSV file: {e}")
        
        return data
    
    def parse_evaluation_results(self, raw_data: List[Dict[str, Any]]) -> List[EvaluationResult]:
        """
        Parse raw CSV data into EvaluationResult objects.
        
        Args:
            raw_data (List[Dict[str, Any]]): Raw data from CSV
            
        Returns:
            List[EvaluationResult]: Parsed evaluation results
        """
        results = []
        for row in raw_data:
            try:
                result = EvaluationResult.from_dict(row)
                results.append(result)
            except Exception as e:
                print(f"Error parsing row {row}: {e}")
                continue
        
        return results
    
    def validate_csv_format(self, file_path: str) -> bool:
        """
        Validate that the CSV file has the expected format.
        
        Args:
            file_path (str): Path to the CSV file
            
        Returns:
            bool: True if format is valid, False otherwise
        """
        required_columns = {'model', 'prompt', 'response', 'score', 'metric'}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                headers = set(reader.fieldnames or [])
                return required_columns.issubset(headers)
        except Exception:
            return False

def load_dataset(file_path: str):
    df = pd.read_csv(file_path)

    runs = []

    # Extract run_id from the first row - using conversation_id as run identifier
    run_id = df["inputs.conversation_id"].iloc[0]

    def parse_json_safely(value):
        """Safely parse JSON string, return original if parsing fails"""
        if pd.isna(value) or value == "":
            return ""
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return str(value)

    def metric(name, reason_col):
        # Convert string values to numeric for calculation
        metric_values = df[name].fillna("")
        
        # Handle string-based pass/fail values
        numeric_values = []
        for val in metric_values:
            if pd.isna(val) or val == "":
                numeric_values.append(0)
            elif str(val).lower() in ['pass', 'true', '1']:
                numeric_values.append(1)
            elif str(val).lower() in ['fail', 'false', '0']:
                numeric_values.append(0)
            else:
                # Try to convert to float, default to 0 if failed
                try:
                    numeric_values.append(float(val))
                except (ValueError, TypeError):
                    numeric_values.append(0)
        
        numeric_series = pd.Series(numeric_values)
        
        return {
            "score": int(numeric_series.mean() * 100) if len(numeric_series) > 0 else 0,
            "passed": int(numeric_series.sum()),
            "total": len(numeric_series),
            "reasons": df[reason_col].fillna("").tolist()
        }

    # Parse query and response as JSON for hover details
    queries = []
    responses = []
    
    for _, row in df.iterrows():
        query_data = parse_json_safely(row["inputs.query"])
        response_data = parse_json_safely(row["inputs.response"])
        
        queries.append(query_data)
        responses.append(response_data)

    return {
        "runId": run_id,
        "query": queries,
        "response": responses,
        "passed": df["Passed"].fillna("").tolist(),
        "toolDefinitions": [parse_json_safely(td) for td in df["inputs.tool_definitions"].fillna("")],
        "toolsUsed": [parse_json_safely(tu) for tu in df["inputs.tools_used"].fillna("")],
        "intentResolution": metric("intent_resolution.intent_resolution.result", "intent_resolution.intent_resolution.reason"),
        "coherence": metric("coherence.coherence.result", "coherence.coherence.reason"),
        "relevance": metric("relevance.relevance.result", "relevance.relevance.reason"),
        "groundedness": metric("groundedness.groundedness.result", "groundedness.groundedness.reason"),
        "toolCallAccuracy": metric("tool_call_accuracy.tool_call_accuracy.result", "tool_call_accuracy.tool_call_accuracy.reason"),
        "taskAdherence": metric("task_adherence.task_adherence.result", "task_adherence.task_adherence.reason"),
        "fluency": metric("fluency.fluency.result", "fluency.fluency.reason"),
    }