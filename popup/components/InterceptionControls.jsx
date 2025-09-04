// popup/components/InterceptionControls.jsx
import React from 'react';

export function InterceptionControls({ 
  isEnabled, 
  onToggle, 
  blockMaliciousUrls, 
  onToggleBlocking,
  isLoading 
}) {
  return (
    <div style={{ 
      padding: 12, 
      backgroundColor: '#f8f9fa', 
      border: '1px solid #e9ecef', 
      borderRadius: 6, 
      marginBottom: 16 
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold' }}>
        🛡️ Interception Controls
      </h4>
      
      {/* Main toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
        padding: 8,
        backgroundColor: isEnabled ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isEnabled ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: 4
      }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>
            Request Interception
          </div>
          <div style={{ fontSize: 10, color: '#6c757d' }}>
            {isEnabled ? 'Active - Monitoring requests' : 'Disabled - No monitoring'}
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 'bold',
            backgroundColor: isEnabled ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? '...' : (isEnabled ? 'DISABLE' : 'ENABLE')}
        </button>
      </div>

      {/* Blocking toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeeba',
        borderRadius: 4,
        opacity: isEnabled ? 1 : 0.5
      }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>
            Auto-block Malicious URLs
          </div>
          <div style={{ fontSize: 10, color: '#856404' }}>
            {blockMaliciousUrls ? 'Threats will be blocked automatically' : 'Manual review required'}
          </div>
        </div>
        <input
          type="checkbox"
          checked={blockMaliciousUrls}
          onChange={onToggleBlocking}
          disabled={!isEnabled || isLoading}
          style={{ 
            transform: 'scale(1.2)',
            cursor: (!isEnabled || isLoading) ? 'not-allowed' : 'pointer'
          }}
        />
      </div>

      {/* Status indicator */}
      <div style={{ 
        marginTop: 8, 
        padding: 6, 
        backgroundColor: '#e9ecef', 
        borderRadius: 4, 
        fontSize: 10,
        textAlign: 'center'
      }}>
        Status: 
        <span style={{ 
          fontWeight: 'bold', 
          color: isEnabled ? '#28a745' : '#6c757d',
          marginLeft: 4
        }}>
          {isEnabled ? '🟢 PROTECTING' : '🔴 INACTIVE'}
        </span>
      </div>
    </div>
  );
}
