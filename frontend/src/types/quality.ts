export interface MetricScore {
  score: number;
  passed: number;
  total: number;
}

export interface RunSummary {
  runId: string;
  intentResolution: MetricScore;
  coherence: MetricScore;
  relevance: MetricScore;
  groundedness: MetricScore;
  toolCallAccuracy: MetricScore;
  taskAdherence: MetricScore;
  fluency: MetricScore;
}