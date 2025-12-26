import { useEffect, useState } from "react";
import { getMetricDetails } from "../api/qualityApi";

// Helper function to extract clean assistant response text
const extractAssistantResponse = (responseRaw: string): string => {
  if (!responseRaw) return 'No response data available';
  
  let assistantResponse = '';
  
  // First try the specific pattern you mentioned: "role":"assistant","content":[{"type":"text","text":"
  const specificPattern = /"role"\s*:\s*"assistant"\s*,\s*"content"\s*:\s*\[\s*{\s*"type"\s*:\s*"text"\s*,\s*"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/;
  const specificMatch = responseRaw.match(specificPattern);
  
  if (specificMatch) {
    return specificMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }
  
  try {
    const parsedResponse = JSON.parse(responseRaw);
    
    // Helper function to extract text from content
    const extractTextFromContent = (content: any): string => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item && item.type === 'text' && item.text) return item.text;
          if (typeof item === 'string') return item;
        }
      }
      if (content && content.text) return content.text;
      return '';
    };
    
    // Handle array of messages
    if (Array.isArray(parsedResponse)) {
      for (const item of parsedResponse) {
        if (item && item.role === 'assistant') {
          assistantResponse = extractTextFromContent(item.content);
          if (assistantResponse) break;
        }
      }
    }
    // Handle single message
    else if (parsedResponse && parsedResponse.role === 'assistant') {
      assistantResponse = extractTextFromContent(parsedResponse.content);
    }
    // Handle direct content
    else if (parsedResponse && parsedResponse.content) {
      assistantResponse = extractTextFromContent(parsedResponse.content);
    }
    // Handle direct text
    else if (parsedResponse && parsedResponse.text) {
      assistantResponse = parsedResponse.text;
    }
    
  } catch (e) {
    // Fallback: extract any text that comes after "assistant" role
    const assistantMatch = responseRaw.match(/"role"\s*:\s*"assistant"[\s\S]*?"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (assistantMatch) {
      assistantResponse = assistantMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    } else {
      // Try to find any text field that might be the response
      const textMatch = responseRaw.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      if (textMatch && responseRaw.indexOf(textMatch[0]) > responseRaw.indexOf('"assistant"')) {
        assistantResponse = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      }
    }
  }
  
  return assistantResponse || 'No assistant response found';
};

export default function MetricDrilldownDrawer({ runId, metric, onClose }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMetricDetails(runId, metric).then(data => {
      setRows(data);
      setLoading(false);
    });
  }, [runId, metric]);

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
                  {extractAssistantResponse(r.agentResponse)}
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