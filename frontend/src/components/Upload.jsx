/**
 * Upload component for multiple .alog files
 */
import { useState } from 'react';
import { roastAPI } from '../api';
import { FaCloudUploadAlt, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaTimes, FaSpinner } from 'react-icons/fa';

export default function Upload({ onUploadSuccess }) {
  const [alogFiles, setAlogFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const alogFiles = files.filter(f => f.name.endsWith('.alog'));
      if (alogFiles.length > 0) {
        setAlogFiles(alogFiles);
        setUploadResults(null);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setAlogFiles(files);
      setUploadResults(null);
    }
  };

  const removeFile = (index) => {
    setAlogFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (alogFiles.length === 0) {
      return;
    }

    setUploading(true);
    setUploadResults(null);

    const formData = new FormData();
    alogFiles.forEach(file => {
      formData.append('alog_files', file);
    });

    try {
      const response = await roastAPI.upload(formData);
      setUploadResults(response.data);

      // If all successful, clear files and notify parent
      if (response.data.summary.success === response.data.summary.total) {
        setAlogFiles([]);
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }
    } catch (err) {
      setUploadResults({
        summary: { total: alogFiles.length, success: 0, error: alogFiles.length, skipped: 0 },
        results: alogFiles.map(file => ({
          filename: file.name,
          status: 'error',
          error: err.response?.data?.error || 'Upload failed'
        }))
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FaCloudUploadAlt style={styles.headerIcon} />
        <div>
          <h2 style={styles.heading}>Upload Roasts</h2>
          <p style={styles.description}>
            Upload multiple Artisan .alog files at once. We'll automatically parse and generate interactive temperature charts from the data.
          </p>
        </div>
      </div>

      <div
        style={{
          ...styles.dropZone,
          ...(dragActive ? styles.dropZoneActive : {}),
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FaCloudUploadAlt style={dragActive ? styles.uploadIconActive : styles.uploadIcon} />
        <p style={styles.dropZoneText}>
          {dragActive ? 'Drop your files here!' : 'Drag and drop .alog files here'}
        </p>
        <p style={styles.dropZoneSubtext}>or</p>
        <input
          type="file"
          accept=".alog,application/octet-stream"
          multiple={true}
          onChange={handleFileSelect}
          style={styles.fileInput}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={styles.fileLabel}>
          Browse Files
        </label>
      </div>

      {alogFiles.length > 0 && (
        <div style={styles.filesContainer}>
          <div style={styles.filesHeader}>
            <strong>Selected files: {alogFiles.length}</strong>
            {!uploading && (
              <button
                onClick={() => setAlogFiles([])}
                style={styles.clearButton}
              >
                Clear All
              </button>
            )}
          </div>
          <div style={styles.filesList}>
            {alogFiles.map((file, index) => (
              <div key={index} style={styles.fileItem}>
                <FaFileAlt style={styles.fileItemIcon} />
                <span style={styles.fileName}>{file.name}</span>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    style={styles.removeButton}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadResults && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsSummary}>
            <h3 style={styles.resultsTitle}>Upload Results</h3>
            <div style={styles.summaryStats}>
              <span style={styles.successStat}>✓ {uploadResults.summary.success} succeeded</span>
              {uploadResults.summary.skipped > 0 && (
                <span style={styles.skippedStat}>⊘ {uploadResults.summary.skipped} skipped</span>
              )}
              {uploadResults.summary.error > 0 && (
                <span style={styles.errorStat}>✗ {uploadResults.summary.error} failed</span>
              )}
            </div>
          </div>
          <div style={styles.resultsList}>
            {uploadResults.results.map((result, index) => (
              <div
                key={index}
                style={{
                  ...styles.resultItem,
                  ...(result.status === 'success' ? styles.resultSuccess :
                      result.status === 'skipped' ? styles.resultSkipped :
                      styles.resultError)
                }}
              >
                <div style={styles.resultHeader}>
                  {result.status === 'success' && <FaCheckCircle style={styles.resultIcon} />}
                  {result.status === 'skipped' && <FaExclamationTriangle style={styles.resultIcon} />}
                  {result.status === 'error' && <FaExclamationTriangle style={styles.resultIcon} />}
                  <span style={styles.resultFilename}>{result.filename}</span>
                </div>
                {result.status === 'success' && (
                  <div style={styles.resultDetails}>
                    <strong>{result.title}</strong> - {result.roast_date}
                  </div>
                )}
                {result.error && (
                  <div style={styles.resultErrorText}>
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={alogFiles.length === 0 || uploading}
        style={{
          ...styles.button,
          ...((alogFiles.length === 0 || uploading) ? styles.buttonDisabled : {}),
        }}
      >
        {uploading ? (
          <>
            <FaSpinner style={{...styles.buttonIcon, animation: 'spin 1s linear infinite'}} />
            Uploading {alogFiles.length} file{alogFiles.length !== 1 ? 's' : ''}...
          </>
        ) : (
          <>
            <FaCloudUploadAlt style={styles.buttonIcon} />
            Upload {alogFiles.length > 0 ? `${alogFiles.length} Roast${alogFiles.length !== 1 ? 's' : ''}` : 'Roasts'}
          </>
        )}
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: 'clamp(20px, 3vw, 32px)',
    maxWidth: 'min(800px, 90vw)',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '2px solid #E8E4DF',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid #F0F0F0',
  },
  headerIcon: {
    fontSize: '48px',
    color: '#212121',
    flexShrink: 0,
  },
  heading: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#212121',
    marginBottom: '8px',
    margin: 0,
  },
  description: {
    fontSize: '16px',
    color: '#616161',
    lineHeight: '1.6',
    margin: '8px 0 0 0',
  },
  dropZone: {
    border: '3px dashed #D0D0D0',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  },
  uploadIcon: {
    fontSize: '64px',
    color: '#B0B0B0',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
  },
  uploadIconActive: {
    fontSize: '72px',
    color: '#212121',
    marginBottom: '16px',
    animation: 'pulse 1s infinite',
  },
  dropZoneText: {
    color: '#616161',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  dropZoneSubtext: {
    color: '#9E9E9E',
    fontSize: '14px',
    margin: '8px 0',
  },
  dropZoneActive: {
    borderColor: '#212121',
    background: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    borderWidth: '4px',
    transform: 'scale(1.02)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    display: 'inline-block',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
    color: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    borderRadius: '12px',
    marginBottom: '16px',
    color: '#2E7D32',
    fontSize: '15px',
    border: '2px solid #81C784',
    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
  },
  fileIcon: {
    fontSize: '24px',
    color: '#2E7D32',
  },
  fileDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  checkIcon: {
    fontSize: '20px',
    color: '#4CAF50',
    marginLeft: 'auto',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 24px',
    background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
    color: '#C62828',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '15px',
    border: '2px solid #EF9A9A',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
  },
  errorIcon: {
    fontSize: '20px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '18px 32px',
    background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '17px',
    fontWeight: '700',
    width: '100%',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s ease',
  },
  buttonIcon: {
    fontSize: '20px',
  },
  buttonDisabled: {
    background: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
    color: '#9E9E9E',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  filesContainer: {
    background: 'linear-gradient(135deg, #F5F5F5 0%, #ECECEC 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #E0E0E0',
  },
  filesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '16px',
    color: '#424242',
  },
  clearButton: {
    padding: '6px 16px',
    background: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
  },
  fileItemIcon: {
    fontSize: '18px',
    color: '#616161',
    flexShrink: 0,
  },
  fileName: {
    flex: 1,
    fontSize: '14px',
    color: '#424242',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeButton: {
    padding: '6px',
    background: 'transparent',
    color: '#757575',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  resultsContainer: {
    background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #E0E0E0',
  },
  resultsSummary: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #E0E0E0',
  },
  resultsTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#212121',
    margin: '0 0 12px 0',
  },
  summaryStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '14px',
    fontWeight: '600',
  },
  successStat: {
    color: '#2E7D32',
  },
  skippedStat: {
    color: '#F57C00',
  },
  errorStat: {
    color: '#C62828',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  resultItem: {
    padding: '14px 16px',
    borderRadius: '8px',
    border: '2px solid',
  },
  resultSuccess: {
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    borderColor: '#81C784',
  },
  resultSkipped: {
    background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
    borderColor: '#FFB74D',
  },
  resultError: {
    background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
    borderColor: '#EF9A9A',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  resultIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  resultFilename: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#424242',
  },
  resultDetails: {
    fontSize: '13px',
    color: '#616161',
    marginLeft: '26px',
  },
  resultErrorText: {
    fontSize: '13px',
    color: '#C62828',
    marginLeft: '26px',
  },
};

// Add spinner animation CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}
