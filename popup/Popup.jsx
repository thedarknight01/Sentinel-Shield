import React, { useState, useEffect, useCallback } from 'react';

const MESSAGE_TYPES = {
  PING: 'PING',
  GET_COMPREHENSIVE_DATA: 'GET_COMPREHENSIVE_DATA',
  GET_BLOCKED_URLS: 'GET_BLOCKED_URLS',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TOGGLE_INTERCEPTION: 'TOGGLE_INTERCEPTION',
  CLEAR_LOGS: 'CLEAR_LOGS',
  CLEAR_BLOCKED_URLS: 'CLEAR_BLOCKED_URLS',
  USER_ACTION_FORWARD: 'USER_ACTION_FORWARD',
  USER_ACTION_DROP: 'USER_ACTION_DROP'
};

function StatusBar({ connectionStatus, isLoading, lastError, retryCount, isStandalone, onOpenWindow, onClose }) {
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '8px 0' }}>
      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>🛡️ Sentinel Shield</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isStandalone && (
            <button onClick={onOpenWindow} title="Open persistent window" style={{ padding: '4px 8px', fontSize: 10, border: '1px solid #e0e0e0', borderRadius: 4, background: '#f8f9fa', cursor: 'pointer' }}>▣</button>
          )}
          <button onClick={onClose} title="Close" style={{ padding: '4px 8px', fontSize: 10, border: '1px solid #e0e0e0', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#6c757d', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(), display: 'inline-block' }} />
            <span style={{ fontWeight: 'bold' }}>{getStatusText()}</span>
          </div>
          {isLoading && (<div style={{ fontSize: 9, color: '#007bff' }}>🔄 Loading...</div>)}
          {connectionStatus === 'disconnected' && (
            <div style={{ color: '#dc3545', fontSize: 9, marginTop: 2 }}>
              <div>Extension needs reload</div>
              {retryCount > 0 && <div>Retries: {retryCount}</div>}
              {lastError && (<div title={lastError} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Error: {lastError}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InterceptionControls({ isEnabled, onToggle, blockMaliciousUrls, onToggleBlocking, isLoading }) {
  return (
    <div style={{ padding: 12, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 6, marginBottom: 16 }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold' }}>🛡️ Interception Controls</h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 8, backgroundColor: isEnabled ? '#d4edda' : '#f8d7da', border: `1px solid ${isEnabled ? '#c3e6cb' : '#f5c6cb'}`, borderRadius: 4 }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>Request Interception</div>
          <div style={{ fontSize: 10, color: '#6c757d' }}>{isEnabled ? 'Active - Monitoring requests' : 'Disabled - No monitoring'}</div>
        </div>
        <button onClick={onToggle} disabled={isLoading} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 'bold', backgroundColor: isEnabled ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>{isLoading ? '...' : (isEnabled ? 'DISABLE' : 'ENABLE')}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 4, opacity: isEnabled ? 1 : 0.5 }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>Auto-block Malicious URLs</div>
          <div style={{ fontSize: 10, color: '#856404' }}>{blockMaliciousUrls ? 'Threats will be blocked automatically' : 'Manual review required'}</div>
        </div>
        <input type="checkbox" checked={blockMaliciousUrls} onChange={onToggleBlocking} disabled={!isEnabled || isLoading} style={{ transform: 'scale(1.2)', cursor: (!isEnabled || isLoading) ? 'not-allowed' : 'pointer' }} />
      </div>
      <div style={{ marginTop: 8, padding: 6, backgroundColor: '#e9ecef', borderRadius: 4, fontSize: 10, textAlign: 'center' }}>
        Status: <span style={{ fontWeight: 'bold', color: isEnabled ? '#28a745' : '#6c757d', marginLeft: 4 }}>{isEnabled ? '🟢 PROTECTING' : '🔴 INACTIVE'}</span>
      </div>
    </div>
  );
}

export function Popup() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isStandalone, setIsStandalone] = useState(false);
  const [settings, setSettings] = useState({ interceptionEnabled: true, blockMaliciousUrls: true, autoRefresh: true, refreshInterval: 5000 });
  const [stats, setStats] = useState({ threatsBlocked: 0, scriptsAnalyzed: 0, cacheHits: 0, cacheMisses: 0 });
  const [requestLogs, setRequestLogs] = useState([]);
  const [threatLogs, setThreatLogs] = useState([]);
  const [scriptLogs, setScriptLogs] = useState([]);
  const [blockedUrls, setBlockedUrls] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pendingActions, setPendingActions] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  // Utility: send message with timeout
  const sendMessage = useCallback((message, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => { reject(new Error('Message timeout')); }, timeout);
      try {
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
          resolve(response || {});
        });
      } catch (error) { clearTimeout(timeoutId); reject(error); }
    });
  }, []);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const response = await sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
      if (response && typeof response === 'object') { setSettings(prev => ({ ...prev, ...response })); }
    } catch (error) { console.warn('Failed to load settings:', error); }
  }, [sendMessage]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true); setLastError(null);
    try {
      const pingResult = await sendMessage({ type: MESSAGE_TYPES.PING }, 3000);
      if (!pingResult || pingResult.type !== 'PONG') throw new Error('Background script not responding');
      setConnectionStatus('connected'); setRetryCount(0);
      const comprehensiveData = await sendMessage({ type: MESSAGE_TYPES.GET_COMPREHENSIVE_DATA });
      if (comprehensiveData) {
        setStats(comprehensiveData.stats || {});
        setRequestLogs(comprehensiveData.requestLogs || []);
        setThreatLogs(comprehensiveData.threatLogs || []);
        setScriptLogs(comprehensiveData.scriptLogs || []);
        setSummary(comprehensiveData.summary || {});
      }
      const blockedUrlsData = await sendMessage({ type: MESSAGE_TYPES.GET_BLOCKED_URLS });
      setBlockedUrls(blockedUrlsData || []);
      await loadSettings();
    } catch (error) {
      setLastError(error.message); setConnectionStatus('disconnected'); setRetryCount(prev => prev + 1);
    }
    setIsLoading(false);
  }, [sendMessage, loadSettings]);

  // Toggle interception
  const toggleInterception = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await sendMessage({ type: MESSAGE_TYPES.TOGGLE_INTERCEPTION });
      if (response.status === 'success') { setSettings(prev => ({ ...prev, interceptionEnabled: response.enabled })); }
    } catch (error) { setLastError(error.message); }
    finally { setIsLoading(false); }
  }, [sendMessage]);

  // Toggle malicious URL blocking
  const toggleBlocking = useCallback(async (e) => {
    try {
      const enabled = e.target.checked;
      const newSettings = { ...settings, blockMaliciousUrls: enabled };
      const response = await sendMessage({ type: MESSAGE_TYPES.UPDATE_SETTINGS, settings: newSettings });
      if (response.status === 'success') { setSettings(newSettings); }
    } catch (error) { }
  }, [sendMessage, settings]);

  // Auto-refresh
  useEffect(() => {
    if (!settings.autoRefresh) return;
    const interval = setInterval(fetchData, settings.refreshInterval);
    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, fetchData]);

  // Message listener
  useEffect(() => {
    fetchData();
    function onMessage(message) {
      switch (message.type) {
        case 'NEW_INTERCEPTED_REQUEST': setRequestLogs((logs) => [message.request, ...logs.slice(0, 49)]); break;
        case 'THREAT_DETECTED': setThreatLogs((logs) => [message.request, ...logs.slice(0, 49)]); setAlerts((alerts) => [...alerts, message]); break;
        case 'SCRIPT_ANALYSIS_RESULT': case 'SCRIPT_ALERT': setScriptLogs((prev) => [message.data || message, ...prev.slice(0, 49)]); break;
        case 'REQUEST_ACTION_RESULT': setPendingActions((pending) => { const copy = { ...pending }; delete copy[message.requestId]; return copy; }); break;
        default: break;
      }
    }
    chrome.runtime.onMessage.addListener(onMessage);
    return () => { chrome.runtime.onMessage.removeListener(onMessage); };
  }, [fetchData]);

  // User actions
  const handleUserAction = useCallback(async (requestId, action) => {
    setPendingActions(prev => ({ ...prev, [requestId]: action }));
    const messageType = action === 'forward' ? MESSAGE_TYPES.USER_ACTION_FORWARD : MESSAGE_TYPES.USER_ACTION_DROP;
    try {
      const response = await sendMessage({ type: messageType, requestId });
      if (response.status === 'forwarded' || response.status === 'dropped') { }
    } catch (error) { }
    finally {
      setPendingActions(prev => { const copy = { ...prev }; delete copy[requestId]; return copy; });
    }
  }, [sendMessage]);

  // Clear logs
  const clearLogs = useCallback(async () => {
    try {
      const response = await sendMessage({ type: MESSAGE_TYPES.CLEAR_LOGS });
      if (response.status === 'cleared') { setRequestLogs([]); setThreatLogs([]); setScriptLogs([]); setAlerts([]); }
    } catch (error) { }
  }, [sendMessage]);
  const clearBlockedUrls = useCallback(async () => {
    try {
      const response = await sendMessage({ type: MESSAGE_TYPES.CLEAR_BLOCKED_URLS });
      if (response.status === 'cleared') { setBlockedUrls([]); }
    } catch (error) { }
  }, [sendMessage]);

  // Standalone detection
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setIsStandalone(params.get('standalone') === '1');
    } catch (_) { setIsStandalone(false); }
  }, []);
  const openAsWindow = useCallback(() => {
    try {
      chrome.windows.create({ url: chrome.runtime.getURL('popup/popup.html?standalone=1'), type: 'popup', width: 420, height: 640, focused: true });
    } catch (e) { }
  }, []);
  const closePopup = useCallback(() => { try { window.close(); } catch (_) {} }, []);

  // Filtering
  const filteredRequestLogs = requestLogs.filter((log) => log.url?.toLowerCase().includes(filter.toLowerCase()));
  const filteredThreatLogs = threatLogs.filter((log) => log.url?.toLowerCase().includes(filter.toLowerCase()));
  const hitTotal = stats.cacheHits + stats.cacheMisses;
  const hitRate = hitTotal > 0 ? ((stats.cacheHits / hitTotal) * 100).toFixed(2) : 'N/A';

  // Dashboard
  function renderDashboard() {
    return (
      <section aria-label="Dashboard overview" style={{ fontSize: 14, lineHeight: 1.5 }}>
        <InterceptionControls isEnabled={settings.interceptionEnabled} onToggle={toggleInterception} blockMaliciousUrls={settings.blockMaliciousUrls} onToggleBlocking={toggleBlocking} isLoading={isLoading} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#dc3545' }}>{stats.threatsBlocked}</div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>Threats Blocked</div>
          </div>
          <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#28a745' }}>{stats.scriptsAnalyzed}</div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>Scripts Analyzed</div>
          </div>
        </div>
        {/* ...existing code for cache, alerts, blocked URLs, etc... */}
      </section>
    );
  }

  // ...existing code for renderRequests, renderThreats, renderScripts, renderSettings...

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', width: '380px', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#fff', color: '#222' }} aria-label="Threat detector dashboard" role="main">
      <StatusBar connectionStatus={connectionStatus} isLoading={isLoading} lastError={lastError} retryCount={retryCount} isStandalone={isStandalone} onOpenWindow={openAsWindow} onClose={closePopup} />
      {/* ...existing code for tab navigation, tab panels, footer... */}
    </div>
  );
}
