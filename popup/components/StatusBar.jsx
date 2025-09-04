// popup/components/StatusBar.jsx
import React from 'react';

export function StatusBar({ 
  connectionStatus, 
  isLoading, 
  lastError, 
  retryCount,
  isStandalone,
  onOpenWindow,
  onClose 
}) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'disconnected': return '#dc3545';
      default: return '#ffc107';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      default: return 'Checking...';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '1rem',
      padding: '8px 0'
    }}>
      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
        🛡️ Sentinel Shield
      </h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Control buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {!isStandalone && (
            <button
              onClick={onOpenWindow}
              title="Open persistent window"
              style={{ 
                padding: '4px 8px', 
                fontSize: 10, 
                border: '1px solid #e0e0e0', 
                borderRadius: 4, 
                background: '#f8f9fa',
                cursor: 'pointer'
              }}
            >
              ▣
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            style={{ 
              padding: '4px 8px', 
              fontSize: 10, 
              border: '1px solid #e0e0e0', 
              borderRadius: 4, 
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Status info */}
        <div style={{ fontSize: 10, color: '#6c757d', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: getStatusColor(),
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 'bold' }}>{getStatusText()}</span>
          </div>
          
          {isLoading && (
            <div style={{ fontSize: 9, color: '#007bff' }}>
              🔄 Loading...
            </div>
          )}
          
          {connectionStatus === 'disconnected' && (
            <div style={{ color: '#dc3545', fontSize: 9, marginTop: 2 }}>
              <div>Extension needs reload</div>
              {retryCount > 0 && <div>Retries: {retryCount}</div>}
              {lastError && (
                <div title={lastError} style={{ 
                  maxWidth: 120, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  Error: {lastError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
