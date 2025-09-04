
console.log('🚀 Starting Sentinel Shield background script...');

// Global error handler
self.addEventListener('error', (event) => {
  console.error('❌ Background script error:', event.error);
});

// Load background modules and utilities
importScripts('./logger.js', './verifier.js', './scriptChecker.js', './interceptor.js');

// Inline constants and utilities since importScripts doesn't support ES modules
const MESSAGE_TYPES = {
  PING: 'PING',
  PONG: 'PONG',
  USER_ACTION_FORWARD: 'USER_ACTION_FORWARD',
  USER_ACTION_DROP: 'USER_ACTION_DROP',
  GET_STATS: 'GET_STATS',
  GET_COMPREHENSIVE_DATA: 'GET_COMPREHENSIVE_DATA',
  GET_REQUEST_LOGS: 'GET_REQUEST_LOGS',
  GET_THREAT_LOGS: 'GET_THREAT_LOGS',
  GET_SCRIPT_LOGS: 'GET_SCRIPT_LOGS',
  GET_BLOCKED_URLS: 'GET_BLOCKED_URLS',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TOGGLE_INTERCEPTION: 'TOGGLE_INTERCEPTION',
  NEW_INTERCEPTED_REQUEST: 'NEW_INTERCEPTED_REQUEST',
  THREAT_DETECTED: 'THREAT_DETECTED',
  SCRIPT_ANALYSIS_RESULT: 'SCRIPT_ANALYSIS_RESULT',
  SCRIPT_ALERT: 'SCRIPT_ALERT',
  REQUEST_ACTION_RESULT: 'REQUEST_ACTION_RESULT',
  CLEAR_LOGS: 'CLEAR_LOGS',
  CLEAR_BLOCKED_URLS: 'CLEAR_BLOCKED_URLS'
};

const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  CLEARED: 'cleared',
  FORWARDED: 'forwarded',
  DROPPED: 'dropped',
  PROCESSED: 'processed'
};

// Simple settings manager for service worker
class SettingsManager {
  constructor() {
    this.settings = {
      interceptionEnabled: true,
      blockMaliciousUrls: true,
      autoRefresh: true,
      refreshInterval: 5000,
      notificationsEnabled: true,
      logLevel: 'info',
      maxLogEntries: 200,
      theme: 'light'
    };
    this.listeners = new Set();
  }

  async load() {
    try {
      const stored = await chrome.storage.local.get(['extension_settings']);
      if (stored.extension_settings && typeof stored.extension_settings === 'object') {
        this.settings = { ...this.settings, ...stored.extension_settings };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  async save() {
    try {
      await chrome.storage.local.set({ extension_settings: this.settings });
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  get(key) {
    return key ? this.settings[key] : { ...this.settings };
  }

  async set(key, value) {
    if (typeof key === 'object') {
      this.settings = { ...this.settings, ...key };
    } else {
      this.settings = { ...this.settings, [key]: value };
    }
    await this.save();
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }
}

// Global shared stxate for tabs and requests
const state = {
  tabs: new Map(),
  requestCache: new Map(),
  settings: null
};

// Module instances - will be initialized after successful import
let logger, verifier, scriptChecker, interceptor, settingsManager;

// Initialize modules in async function
async function initializeModules() {
  try {
    // Instantiate modules
    settingsManager = new SettingsManager();
    await settingsManager.load();
    state.settings = settingsManager;
    
    logger = new Logger();
    verifier = new VerificationEngine(logger, state.requestCache);
    scriptChecker = new ScriptChecker(logger);
    interceptor = new Interceptor(logger, verifier, state, settingsManager);
    
    console.log('✅ All modules initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize modules:', error);
  }
}

// Start initialization
initializeModules();

try {
  // Test logging
  if (logger) {
    logger.logRequestAction({ url: 'test://initialization', tabId: -1 }, 'initialized');
    console.log('✅ Test log entry created. Extension is ready.');
  }
} catch (error) {
  console.error('❌ Failed test logging:', error);
}

// Messaging listener to handle UI requests and actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate message structure
  if (!message || typeof message !== 'object' || !message.type) {
    sendResponse({ status: STATUS.ERROR, error: 'Invalid message format' });
    return false;
  }

  try {
    switch (message.type) {
      case MESSAGE_TYPES.USER_ACTION_FORWARD:
        if (interceptor && typeof interceptor.forwardRequest === 'function') {
          interceptor.forwardRequest(message.requestId);
        }
        sendResponse({ status: STATUS.FORWARDED });
        break;

      case MESSAGE_TYPES.USER_ACTION_DROP:
        if (interceptor && typeof interceptor.dropRequest === 'function') {
          interceptor.dropRequest(message.requestId);
        }
        sendResponse({ status: STATUS.DROPPED });
        break;

      case MESSAGE_TYPES.SCRIPT_ANALYSIS_RESULT:
        if (scriptChecker && typeof scriptChecker.handleAnalysisResult === 'function') {
          scriptChecker.handleAnalysisResult(message.data, sender.tab?.id);
        }
        sendResponse({ status: STATUS.PROCESSED });
        break;

      case MESSAGE_TYPES.GET_STATS:
        sendResponse(logger?.getStats() || {});
        break;

      case MESSAGE_TYPES.GET_COMPREHENSIVE_DATA:
        sendResponse(logger?.getComprehensiveData() || {});
        break;

      case MESSAGE_TYPES.GET_REQUEST_LOGS:
        sendResponse(logger?.getRequestLogs() || []);
        break;

      case MESSAGE_TYPES.GET_THREAT_LOGS:
        sendResponse(logger?.getThreatLogs() || []);
        break;

      case MESSAGE_TYPES.GET_SCRIPT_LOGS:
        sendResponse(logger?.getScriptLogs() || []);
        break;

      case MESSAGE_TYPES.GET_SETTINGS:
        sendResponse(settingsManager?.get() || {});
        break;

      case MESSAGE_TYPES.UPDATE_SETTINGS:
        if (settingsManager && message.settings) {
          settingsManager.set(message.settings).then(() => {
            sendResponse({ status: STATUS.SUCCESS });
          }).catch(error => {
            sendResponse({ status: STATUS.ERROR, error: error.message });
          });
          return true; // Async response
        }
        sendResponse({ status: STATUS.ERROR, error: 'Settings manager not available' });
        break;

      case MESSAGE_TYPES.TOGGLE_INTERCEPTION:
        if (settingsManager) {
          const current = settingsManager.get('interceptionEnabled');
          settingsManager.set('interceptionEnabled', !current).then(() => {
            sendResponse({ status: STATUS.SUCCESS, enabled: !current });
          }).catch(error => {
            sendResponse({ status: STATUS.ERROR, error: error.message });
          });
          return true; // Async response
        }
        sendResponse({ status: STATUS.ERROR, error: 'Settings manager not available' });
        break;

      case MESSAGE_TYPES.CLEAR_LOGS:
        if (logger) logger.clearLogs();
        sendResponse({ status: STATUS.CLEARED });
        break;

      case MESSAGE_TYPES.GET_BLOCKED_URLS:
        sendResponse(interceptor?.getBlockedUrls() || []);
        break;

      case MESSAGE_TYPES.CLEAR_BLOCKED_URLS:
        if (interceptor) interceptor.clearBlockedUrls();
        sendResponse({ status: STATUS.CLEARED });
        break;

      case MESSAGE_TYPES.PING:
        sendResponse({ 
          type: MESSAGE_TYPES.PONG, 
          timestamp: Date.now(),
          status: STATUS.SUCCESS 
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ status: STATUS.ERROR, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try { 
      sendResponse({ status: STATUS.ERROR, error: error.message }); 
    } catch (_) {}
  }
  
  return false; // Sync response unless explicitly returning true above
});

// Track tab updates for script analysis and cleanup
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // No programmatic injection here; content script is declared in manifest.json
  if (changeInfo.status === 'loading') {
    state.tabs.delete(tabId); // Clean up old tab data
  }
});

// Initialization message in console
console.log('🛡️ Sentinel Shield: Background service worker initialized and modules loading...');
console.log('📊 Logger instance:', typeof logger);
console.log('🔍 Verifier instance:', typeof verifier);
console.log('📜 Script checker instance:', typeof scriptChecker);
console.log('🔄 Interceptor instance:', typeof interceptor);
console.log('⚙️ Settings manager instance:', typeof settingsManager);

// Note: test logging performed during async initialization above.
