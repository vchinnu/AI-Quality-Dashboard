import { useEffect, useState } from "react";
import { getRunSummaries } from "./api/qualityApi";
import MetricTile from "./components/MetricTile";
import MetricDrilldownDrawer from "./components/MetricDrilldownDrawer";
import ConversationDetailDrawer from "./components/ConversationDetailDrawer";

function App() {
  const [runs, setRuns] = useState<any[]>([]);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  // Enhanced color coding with 5 buckets - copied from MetricTile
  const getColor = (score: number) => {
    if (score >= 80) return "#2E7D32"; // Dark Green - Excellent
    if (score >= 60) return "#4CAF50"; // Green - Good
    if (score >= 40) return "#FFC107"; // Amber - Fair
    if (score >= 20) return "#FF9800"; // Orange - Poor
    return "#D32F2F"; // Dark Red - Critical
  };

  // Function to aggregate all runs into a single summary
  const aggregateRuns = (runsData: any[]) => {
    if (!runsData || runsData.length === 0) return null;

    const metrics = ["intentResolution", "coherence", "relevance", "groundedness", "toolCallAccuracy", "taskAdherence", "fluency"];
    const aggregated: any = { runId: "aggregated_summary" };

    metrics.forEach(metric => {
      let totalPassed = 0;
      let totalRuns = runsData.length;

      runsData.forEach(run => {
        if (run[metric]) {
          totalPassed += run[metric].passed || 0;
        }
      });

      // Calculate percentage based on pass/fail rate
      const passPercentage = Math.round((totalPassed / totalRuns) * 100);

      aggregated[metric] = {
        score: passPercentage,
        passed: totalPassed,
        total: totalRuns
      };
    });

    return aggregated;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const runsData = await getRunSummaries();
        console.log("Raw API data:", runsData);
        setRuns(runsData);
        
        // Create aggregated summary
        const summary = aggregateRuns(runsData);
        setAggregatedData(summary);
        console.log("Aggregated data:", summary);
      } catch (error) {
        console.error("Error fetching runs:", error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "28px" }}>AI Quality Dashboard</h1>
        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Evaluation metrics across {runs.length} test prompt runs</p>
      </div>
      
      {/* Aggregated Summary View */}
      {aggregatedData && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            flexWrap: "wrap", 
            justifyContent: "center",
            padding: "24px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "12px",
            border: "1px solid #e9ecef"
          }}>
            <div onClick={() => setSelected({ runId: "all", metric: "toolCallAccuracy" })} style={{
              background: getColor(Math.round((aggregatedData.toolCallAccuracy.passed / aggregatedData.toolCallAccuracy.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Tool Acc</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.toolCallAccuracy.passed / aggregatedData.toolCallAccuracy.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.toolCallAccuracy.passed}/{aggregatedData.toolCallAccuracy.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "taskAdherence" })} style={{
              background: getColor(Math.round((aggregatedData.taskAdherence.passed / aggregatedData.taskAdherence.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Task Adh</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.taskAdherence.passed / aggregatedData.taskAdherence.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.taskAdherence.passed}/{aggregatedData.taskAdherence.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "intentResolution" })} style={{
              background: getColor(Math.round((aggregatedData.intentResolution.passed / aggregatedData.intentResolution.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Intent</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.intentResolution.passed / aggregatedData.intentResolution.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.intentResolution.passed}/{aggregatedData.intentResolution.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "groundedness" })} style={{
              background: getColor(Math.round((aggregatedData.groundedness.passed / aggregatedData.groundedness.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Grounded</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.groundedness.passed / aggregatedData.groundedness.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.groundedness.passed}/{aggregatedData.groundedness.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "relevance" })} style={{
              background: getColor(Math.round((aggregatedData.relevance.passed / aggregatedData.relevance.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Relevance</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.relevance.passed / aggregatedData.relevance.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.relevance.passed}/{aggregatedData.relevance.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "coherence" })} style={{
              background: getColor(Math.round((aggregatedData.coherence.passed / aggregatedData.coherence.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Coherence</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.coherence.passed / aggregatedData.coherence.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.coherence.passed}/{aggregatedData.coherence.total}
              </div>
            </div>
            <div onClick={() => setSelected({ runId: "all", metric: "fluency" })} style={{
              background: getColor(Math.round((aggregatedData.fluency.passed / aggregatedData.fluency.total) * 100)),
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              minWidth: "100px",
              width: "110px",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>Fluency</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "2px" }}>
                {Math.round((aggregatedData.fluency.passed / aggregatedData.fluency.total) * 100)}%
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {aggregatedData.fluency.passed}/{aggregatedData.fluency.total}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Run Details (collapsible) */}
      <details style={{ marginTop: "24px" }}>
        <summary style={{ 
          cursor: "pointer", 
          fontSize: "16px", 
          fontWeight: "600", 
          marginBottom: "16px",
          color: "#495057",
          padding: "8px 0"
        }}>
          📊 Individual Prompt Run Details ({runs.length} runs)
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {runs.map((run, index) => (
            <div key={run.runId} style={{ 
              display: "flex", 
              gap: "6px", 
              alignItems: "center",
              padding: "10px", 
              backgroundColor: "#fff", 
              borderRadius: "8px",
              border: "1px solid #dee2e6",
              flexWrap: "wrap"
            }}>
              <div style={{ minWidth: "80px", fontWeight: "600", color: "#495057", fontSize: "12px", padding: "4px 8px", backgroundColor: "#e9ecef", borderRadius: "4px" }}>Prompt {index + 1}</div>
              <div style={{ 
                minWidth: "100px", 
                fontSize: "10px", 
                padding: "4px 8px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "4px",
                border: "1px solid #dee2e6"
              }}>
                <div style={{ fontWeight: "600", color: "#495057", marginBottom: "2px" }}>Conversation ID:</div>
                <button 
                  type="button"
                  onClick={() => {
                    setSelected({ type: 'conversation', runId: run.runId, conversationId: run.conversation_id, data: run });
                  }}
                  style={{
                    color: "#007bff",
                    textDecoration: "none",
                    fontSize: "9px",
                    wordBreak: "break-all"
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.textDecoration = "none";
                  }}
                >
                  {run.conversation_id || 'N/A'}
                </button>
              </div>
              <MetricTile title="Tool Acc" data={run.toolCallAccuracy}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "toolCallAccuracy" })} />
              <MetricTile title="Task Adh" data={run.taskAdherence}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "taskAdherence" })} />
              <MetricTile title="Intent" data={run.intentResolution}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "intentResolution" })} />
              <MetricTile title="Grounded" data={run.groundedness}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "groundedness" })} />
              <MetricTile title="Relevance" data={run.relevance}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "relevance" })} />
              <MetricTile title="Coherence" data={run.coherence}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "coherence" })} />
              <MetricTile title="Fluency" data={run.fluency}
                onClick={() => setSelected({ runId: run.conversation_id, metric: "fluency" })} />
            </div>
          ))}
        </div>
      </details>

      {selected && selected.type === 'conversation' &&
        <ConversationDetailDrawer {...selected} onClose={() => setSelected(null)} />
      }
      
      {selected && !selected.type &&
        <MetricDrilldownDrawer {...selected} onClose={() => setSelected(null)} />
      }
    </div>
  );
}

export default App;
