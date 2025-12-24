"""
Data models for the AI Quality Dashboard.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from datetime import datetime

@dataclass
class EvaluationResult:
    """Model representing an AI evaluation result."""
    
    model: str
    prompt: str
    response: str
    score: float
    metric: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        """Post-initialization processing."""
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.metadata is None:
            self.metadata = {}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EvaluationResult':
        """
        Create an EvaluationResult from a dictionary.
        
        Args:
            data (Dict[str, Any]): Dictionary containing evaluation data
            
        Returns:
            EvaluationResult: Parsed evaluation result
        """
        # Convert score to float
        try:
            score = float(data.get('score', 0))
        except (ValueError, TypeError):
            score = 0.0
        
        # Parse timestamp if provided
        timestamp = None
        if 'timestamp' in data and data['timestamp']:
            try:
                timestamp = datetime.fromisoformat(data['timestamp'])
            except (ValueError, TypeError):
                timestamp = None
        
        # Extract metadata (any additional fields)
        required_fields = {'model', 'prompt', 'response', 'score', 'metric', 'timestamp'}
        metadata = {k: v for k, v in data.items() if k not in required_fields}
        
        return cls(
            model=data.get('model', ''),
            prompt=data.get('prompt', ''),
            response=data.get('response', ''),
            score=score,
            metric=data.get('metric', ''),
            timestamp=timestamp,
            metadata=metadata if metadata else None
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the EvaluationResult to a dictionary.
        
        Returns:
            Dict[str, Any]: Dictionary representation
        """
        result = {
            'model': self.model,
            'prompt': self.prompt,
            'response': self.response,
            'score': self.score,
            'metric': self.metric,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
        
        if self.metadata:
            result.update(self.metadata)
        
        return result

@dataclass
class DashboardConfig:
    """Configuration model for the dashboard."""
    
    data_source_path: str
    refresh_interval: int = 30  # seconds
    supported_metrics: list = None
    
    def __post_init__(self):
        """Post-initialization processing."""
        if self.supported_metrics is None:
            self.supported_metrics = [
                'accuracy',
                'relevance',
                'coherence',
                'fluency',
                'factuality'
            ]

@dataclass
class MetricSummary:
    """Summary statistics for a specific metric."""
    
    metric_name: str
    total_evaluations: int
    average_score: float
    min_score: float
    max_score: float
    std_deviation: float
    
    @classmethod
    def from_results(cls, results: list, metric_name: str) -> 'MetricSummary':
        """
        Calculate metric summary from a list of evaluation results.
        
        Args:
            results (list): List of EvaluationResult objects
            metric_name (str): Name of the metric to summarize
            
        Returns:
            MetricSummary: Summary statistics for the metric
        """
        metric_scores = [r.score for r in results if r.metric == metric_name]
        
        if not metric_scores:
            return cls(
                metric_name=metric_name,
                total_evaluations=0,
                average_score=0.0,
                min_score=0.0,
                max_score=0.0,
                std_deviation=0.0
            )
        
        import statistics
        
        return cls(
            metric_name=metric_name,
            total_evaluations=len(metric_scores),
            average_score=statistics.mean(metric_scores),
            min_score=min(metric_scores),
            max_score=max(metric_scores),
            std_deviation=statistics.stdev(metric_scores) if len(metric_scores) > 1 else 0.0
        )