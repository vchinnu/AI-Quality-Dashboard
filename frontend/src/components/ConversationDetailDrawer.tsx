import React, { useState } from 'react';

interface ConversationDetailDrawerProps {
  runId: string;
  conversationId: string;
  data: any;
  onClose: () => void;
}

export default function ConversationDetailDrawer({ runId, conversationId, data, onClose }: ConversationDetailDrawerProps) {
  const [showMetricJson, setShowMetricJson] = useState<string | null>(null);
  
  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  // const getStatusBadge = (status: string) => {
  //   const isPass = status?.toLowerCase() === 'pass';
  //   return (
  //     <span style={{
  //       padding: '2px 8px',
  //       borderRadius: '4px',
  //       fontSize: '11px',
  //       fontWeight: 'bold',
  //       backgroundColor: isPass ? '#d4edda' : '#f8d7da',
  //       color: isPass ? '#155724' : '#721c24',
  //       border: `1px solid ${isPass ? '#c3e6cb' : '#f5c6cb'}`
  //     }}>
  //       {isPass ? 'Pass' : 'Fail'}
  //     </span>
  //   );
  // };

  const metrics = [
    { key: 'intentResolution', label: 'Intent Resolution' },
    { key: 'coherence', label: 'Coherence' },
    { key: 'relevance', label: 'Relevance' },
    { key: 'groundedness', label: 'Groundedness' },
    { key: 'toolCallAccuracy', label: 'Tool Call Accuracy' },
    { key: 'taskAdherence', label: 'Task Adherence' },
    { key: 'fluency', label: 'Fluency' }
  ];

  const rawData = data.raw_data || {};
  const passedCount = metrics.filter(metric => data[metric.key]?.result === 'Pass').length;
  const totalCount = metrics.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      zIndex: 1001,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #f8f9fa',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '24px' }}>Detailed Metrics Result</h1>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Conversation ID: <strong>{conversationId}</strong></span>
              <span style={{ fontSize: '14px', color: '#666' }}>Passed: <strong>{passedCount}/{totalCount}</strong></span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>✕ Close</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* Summary Info */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '14px' }}>
            <div><strong>Conversation ID:</strong> {conversationId}</div>
            <div><strong>Overall Status:</strong> {passedCount}/{totalCount} passed</div>
          </div>
        </div>

        {/* Query and Response */}
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #dee2e6', 
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Query</span>
              <button 
                type="button"
                onClick={() => {
                  setShowMetricJson('query');
                }}
                style={{
                  color: '#007bff',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'none';
                }}
              >
                View in JSON
              </button>
            </div>
            <div style={{ padding: '12px', maxHeight: '120px', overflow: 'auto', fontSize: '13px' }}>
              {data.prompt || rawData['inputs.query'] || 'N/A'}
            </div>
          </div>
          <div style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #dee2e6', 
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Response</span>
              <button 
                type="button"
                onClick={() => {
                  setShowMetricJson('response');
                }}
                style={{
                  color: '#007bff',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'none';
                }}
              >
                View in JSON
              </button>
            </div>
            <div style={{ padding: '12px', maxHeight: '120px', overflow: 'auto', fontSize: '13px' }}>
              {(() => {
                // Extract assistant response text for main display
                const responseRaw = rawData['inputs.response'] || '';
                if (!responseRaw) return 'No response data available';
                
                let assistantResponse = '';
                
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
              })()}
            </div>
          </div>
          <div style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #dee2e6', 
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Tool Calls</span>
              <button 
                type="button"
                onClick={() => {
                  setShowMetricJson('tools');
                }}
                style={{
                  color: '#007bff',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.textDecoration = 'none';
                }}
              >
                View in JSON
              </button>
            </div>
            <div style={{ padding: '12px', maxHeight: '120px', overflow: 'auto', fontSize: '13px' }}>
              {(() => {
                // Extract and display tools used
                const toolsUsed = rawData['inputs.tools_used'] || '';
                if (!toolsUsed) return 'Note - No Tool calls made';
                
                try {
                  const parsedTools = JSON.parse(toolsUsed);
                  if (Array.isArray(parsedTools)) {
                    if (parsedTools.length === 0) return 'Note - No Tool calls made';
                    return parsedTools.join(', ');
                  } else if (typeof parsedTools === 'string') {
                    return parsedTools || 'Note - No Tool calls made';
                  } else {
                    return JSON.stringify(parsedTools);
                  }
                } catch (e) {
                  // If JSON parsing fails, return the raw string or the empty message
                  return toolsUsed || 'Note - No Tool calls made';
                }
              })()}
            </div>
          </div>
        </div>

        {/* Metric JSON Modal */}
        {showMetricJson && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1002,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '80%',
              height: '80%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '10px'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  {showMetricJson === 'query' ? 'Query - JSON Data' : 
                   showMetricJson === 'response' ? 'Response - JSON Data' :
                   `${metrics.find(m => m.key === showMetricJson)?.label} - JSON Data`}
                </h3>
                <button 
                  onClick={() => setShowMetricJson(null)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {(() => {
                    if (showMetricJson === 'query') {
                      // Parse and structure the query JSON for better readability
                      const queryRaw = rawData['inputs.query'] || '';
                      let structuredQuery = {};
                      
                      try {
                        const parsedQuery = JSON.parse(queryRaw);
                        if (Array.isArray(parsedQuery)) {
                          structuredQuery = {
                            conversation_structure: parsedQuery.map((item, index) => ({
                              message_index: index + 1,
                              role: item.role || 'unknown',
                              content_type: typeof item.content,
                              content: item.content
                            })),
                            conversation_id: rawData['inputs.conversation_id'] || 'N/A',
                            related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && (key.includes('query') || key.includes('conversation')))
                          };
                        } else {
                          structuredQuery = {
                            query_content: parsedQuery,
                            conversation_id: rawData['inputs.conversation_id'] || 'N/A',
                            related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && (key.includes('query') || key.includes('conversation')))
                          };
                        }
                      } catch (e) {
                        structuredQuery = {
                          raw_query: queryRaw,
                          parsing_error: 'Could not parse as JSON',
                          conversation_id: rawData['inputs.conversation_id'] || 'N/A',
                          related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && (key.includes('query') || key.includes('conversation')))
                        };
                      }
                      
                      return formatJson(structuredQuery);
                    } else if (showMetricJson === 'response') {
                      // Structure the response JSON for better readability
                      const responseRaw = rawData['inputs.response'] || '';
                      let structuredResponse = {};
                      
                      try {
                        const parsedResponse = JSON.parse(responseRaw);
                        structuredResponse = {
                          response_structure: parsedResponse,
                          tools_used: (() => {
                            try {
                              const toolsUsed = rawData['inputs.tools_used'];
                              return toolsUsed ? JSON.parse(toolsUsed) : 'N/A';
                            } catch {
                              return rawData['inputs.tools_used'] || 'N/A';
                            }
                          })(),
                          related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && key.includes('response'))
                        };
                      } catch (e) {
                        structuredResponse = {
                          raw_response: responseRaw,
                          parsing_error: 'Could not parse as JSON',
                          tools_used: rawData['inputs.tools_used'] || 'N/A',
                          related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && key.includes('response'))
                        };
                      }
                      
                      return formatJson(structuredResponse);
                    } else if (showMetricJson === 'tools') {
                      // Structure the tools JSON for better readability
                      const toolsRaw = rawData['inputs.tools_used'] || '';
                      const toolDefinitionsRaw = rawData['inputs.tool_definitions'] || '';
                      
                      let structuredTools = {};
                      
                      try {
                        const parsedTools = toolsRaw ? JSON.parse(toolsRaw) : null;
                        const parsedDefinitions = toolDefinitionsRaw ? JSON.parse(toolDefinitionsRaw) : null;
                        
                        structuredTools = {
                          tools_used: parsedTools,
                          tool_definitions: parsedDefinitions,
                          conversation_id: rawData['inputs.conversation_id'] || 'N/A',
                          related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && key.includes('tool'))
                        };
                      } catch (e) {
                        structuredTools = {
                          tools_used_raw: toolsRaw,
                          tool_definitions_raw: toolDefinitionsRaw,
                          parsing_error: 'Could not parse tools JSON',
                          conversation_id: rawData['inputs.conversation_id'] || 'N/A',
                          related_fields: Object.keys(rawData).filter(key => key.startsWith('inputs.') && key.includes('tool'))
                        };
                      }
                      
                      return formatJson(structuredTools);
                    } else {
                      const originalMetricKey = showMetricJson === 'intentResolution' ? 'intent_resolution' : 
                                              showMetricJson === 'toolCallAccuracy' ? 'tool_call_accuracy' :
                                              showMetricJson === 'taskAdherence' ? 'task_adherence' : showMetricJson;
                      
                      const metricJson = {
                        metric: showMetricJson,
                        result: rawData[`${originalMetricKey}.${originalMetricKey}.result`] || 'N/A',
                        score: rawData[`${originalMetricKey}.${originalMetricKey}.score`] || 'N/A',
                        reason: rawData[`${originalMetricKey}.${originalMetricKey}.reason`] || 'N/A',
                        raw_key_prefix: `${originalMetricKey}.${originalMetricKey}`,
                        available_fields: Object.keys(rawData).filter(key => key.startsWith(originalMetricKey))
                      };
                      
                      return formatJson(metricJson);
                    }
                  })()
                  }
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Table - Each metric as a row */}
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'white'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 120px 1fr',
            backgroundColor: '#f8f9fa',
            padding: '12px',
            fontWeight: 'bold',
            fontSize: '14px',
            borderBottom: '2px solid #dee2e6',
            gap: '16px'
          }}>
            <div>Metric</div>
            <div>Status</div>
            <div>Reason</div>
          </div>
          
          {/* Table Rows - One row per metric */}
          {metrics.map(metric => {
            const metricData = data[metric.key] || {};
            const isPass = metricData.result === 'Pass';
            return (
              <div key={metric.key} style={{
                display: 'grid',
                gridTemplateColumns: '200px 120px 1fr',
                padding: '16px 12px',
                alignItems: 'start',
                gap: '16px',
                borderBottom: '1px solid #e9ecef',
                fontSize: '13px'
              }}>
                {/* Metric Name */}
                <div style={{ 
                  fontWeight: '600', 
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  {metric.label}
                </div>
                
                {/* Status */}
                <div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: isPass ? '#d4edda' : '#f8d7da',
                    color: isPass ? '#155724' : '#721c24',
                    border: `1px solid ${isPass ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    {isPass ? 'Pass' : 'Fail'}
                  </span>
                </div>
                
                {/* Reason */}
                <div style={{
                  color: '#495057',
                  lineHeight: '1.4',
                  backgroundColor: '#f8f9fa',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef',
                  fontSize: '13px'
                }}>
                  {metricData.reason || 'No reason provided'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}