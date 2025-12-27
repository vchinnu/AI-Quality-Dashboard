import { useEffect, useState } from "react";
// import { getMetricDetails } from "../api/qualityApi";

export default function MetricDrilldownDrawer({ runId, metric, data, onClose }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching metric details for", runId, metric);
    setLoading(true);
    console.log("metric", metric);
    
    const details = data.map((item : any, index: number) => {
      // Extract user message and agent response from the actual data structure
      const userMessage = item.user_message || 'No prompt available';
      let agentResponse = '';
      
      // Parse the agent_response JSON string to extract the actual response text
      try {
        if (item.agent_response) {
          const parsedResponse = JSON.parse(item.agent_response);
          
          // Look for the final assistant response (usually the last message with role "assistant" and text content)
          if (Array.isArray(parsedResponse)) {
            for (let i = parsedResponse.length - 1; i >= 0; i--) {
              const message = parsedResponse[i];
              if (message.role === 'assistant' && message.content) {
                if (Array.isArray(message.content)) {
                  // Find text content in the content array
                  for (const content of message.content) {
                    if (content.type === 'text' && content.text) {
                      agentResponse = content.text;
                      break;
                    }
                  }
                } else if (typeof message.content === 'string') {
                  agentResponse = message.content;
                }
                if (agentResponse) break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing agent response:', e);
        agentResponse = 'Error parsing response data';
      }
      
      if (!agentResponse) {
        agentResponse = 'No response data available';
      }
      
      // Map metric names to get the correct data
      const metricMap: { [key: string]: string } = {
        'tool_call_accuracy': 'toolCallAccuracy',
        'task_adherence': 'taskAdherence', 
        'intent_resolution': 'intentResolution',
        'groundedness': 'groundedness',
        'relevance': 'relevance',
        'coherence': 'coherence',
        'fluency': 'fluency'
      };
      
      const actualMetric = metricMap[metric] || metric;
      const metricData = item[actualMetric] || {};
      
      return {
        promptId: index + 1,
        prompt: userMessage,
        conversationId: item.conversation_id || 'N/A',
        agentResponse: agentResponse,
        passed: metricData.result === "Pass",
        confidence: "0.8",
        reason: metricData.reason || 'No reason available'
      };
    });
    
    console.log("Metric details from props:", details);
    setRows(details);
    setLoading(false);
    console.log("Metric details set from props:", data);
  }, [runId, metric, data]);

  const getStatusColor = (passed: boolean) => {
    return passed ? "#2E7D32" : "#D32F2F";
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? "✅" : "❌";
  };

  const metricDisplayName: { [key: string]: string } = {
    "intentResolution": "Intent Resolution",
    "coherence": "Coherence", 
    "relevance": "Relevance",
    "groundedness": "Groundedness",
    "toolCallAccuracy": "Tool Call Accuracy",
    "taskAdherence": "Task Adherence",
    "fluency": "Fluency"
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "50%",
      height: "100vh",
      backgroundColor: "white",
      boxShadow: "-4px 0 8px rgba(0,0,0,0.15)",
      padding: "20px",
      overflowY: "auto",
      zIndex: 1000,
      borderLeft: "1px solid #dee2e6"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f8f9fa", paddingBottom: "15px" }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0", color: "#333", fontSize: "24px" }}>
            {metricDisplayName[metric] || metric}
          </h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {runId === "all" ? "Aggregated Analysis" : `Analysis for ${runId}`}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600"
        }}>✕ Close</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading analysis...
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <strong>Summary:</strong> {rows.filter(r => r.passed).length} passed, {rows.filter(r => !r.passed).length} failed out of {rows.length} evaluations
          </div>
          
          {rows.map((r, index) => (
            <div key={r.promptId} style={{
              marginBottom: "20px",
              padding: "16px",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              borderLeft: `4px solid ${getStatusColor(r.passed)}`
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "18px", marginRight: "8px" }}>{getStatusIcon(r.passed)}</span>
                <h4 style={{ margin: 0, color: getStatusColor(r.passed), fontSize: "16px", fontWeight: "600" }}>
                  {r.passed ? "PASS" : "FAIL"}
                </h4>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#666", backgroundColor: "#e9ecef", padding: "4px 8px", borderRadius: "4px" }}>
                  {r.promptId}
                </span>
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Prompt:</strong>
                <div style={{ 
                  marginTop: "4px", 
                  padding: "10px", 
                  backgroundColor: "#f8f9fa", 
                  borderRadius: "6px", 
                  fontSize: "13px", 
                  color: "#495057",
                  border: "1px solid #e9ecef"
                }}>
                  {r.prompt}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Agent Response:</strong>
                <div style={{ 
                  marginTop: "4px", 
                  padding: "10px", 
                  backgroundColor: "#f8f9fa", 
                  borderRadius: "6px", 
                  fontSize: "13px", 
                  color: "#495057",
                  border: "1px solid #e9ecef",
                  maxHeight: "150px",
                  overflowY: "auto"
                }}>
                  {r.agentResponse}
                </div>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Evaluation Reason:</strong>
                <div style={{ 
                  marginTop: "4px", 
                  padding: "10px", 
                  backgroundColor: r.passed ? "#d4edda" : "#f8d7da", 
                  borderRadius: "6px", 
                  fontSize: "13px", 
                  color: r.passed ? "#155724" : "#721c24",
                  border: `1px solid ${r.passed ? "#c3e6cb" : "#f5c6cb"}`
                }}>
                  {r.reason}
                </div>
              </div>

              {r.confidence !== undefined && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  <strong>Confidence:</strong> {(r.confidence * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}