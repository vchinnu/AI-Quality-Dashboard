import React, { useState, useRef } from 'react';

interface DatasetInfo {
  filename: string;
  rows: number;
  columns: string[];
  is_default: boolean;
  path: string;
}

interface DatasetUploaderProps {
  onDatasetUpdated: () => void;
}

const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onDatasetUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<DatasetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCurrentDatasetInfo = async () => {
    try {
      const response = await fetch('http://localhost:8002/current-dataset-info');
      const data = await response.json();
      if (!data.error) {
        setCurrentDataset(data);
      }
    } catch (err) {
      console.error('Failed to fetch current dataset info:', err);
    }
  };

  React.useEffect(() => {
    fetchCurrentDatasetInfo();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8002/upload-dataset', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Refresh current dataset info
      await fetchCurrentDatasetInfo();
      
      // Notify parent component to refresh data
      onDatasetUpdated();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetToDefault = async () => {
    try {
      const response = await fetch('http://localhost:8002/reset-to-default-dataset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset to default dataset');
      }

      // Refresh current dataset info
      await fetchCurrentDatasetInfo();
      
      // Notify parent component to refresh data
      onDatasetUpdated();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="dataset-uploader" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Dataset Management</h3>
      
      {currentDataset && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
          <div><strong>Current Dataset:</strong> {currentDataset.filename || 'N/A'}</div>
          <div><strong>Rows:</strong> {currentDataset.rows || 0}</div>
          {currentDataset.is_default && <div style={{ color: '#666', fontSize: '0.9em' }}>Using default dataset</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          style={{
            padding: '8px 16px',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload New Dataset'}
        </button>

        <button
          onClick={handleResetToDefault}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset to Default
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
        />

        <span style={{ fontSize: '0.85em', color: '#666' }}>
          Supported: CSV, Excel (.xlsx, .xls)
        </span>
      </div>

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px 12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default DatasetUploader;