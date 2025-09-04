// background/interceptor.js
class Interceptor {
  /**
   * @param {Logger} logger
   * @param {VerificationEngine} verifier
   * @param {Object} globalState - shared state with tabs and cache
   * @param {SettingsManager} settingsManager
   */
  constructor(logger, verifier, globalState, settingsManager) {
    this.logger = logger;
    this.verifier = verifier;
    this.state = globalState;
    this.settings = settingsManager;
    this.pendingRequests = new Map();
    this.blockedUrls = new Set();
    this.nextRuleId = 10000; // large starting id for dynamic rules

    // Listen for web requests on all URLs (non-blocking in Manifest V3)
    chrome.webRequest.onBeforeRequest.addListener(
      this.handleRequest.bind(this),
      { urls: ['<all_urls>'] }
    );

    // Listen for completed requests to check results
    chrome.webRequest.onCompleted.addListener(
      this.handleRequestCompleted.bind(this),
      { urls: ['<all_urls>'] }
    );
  }  handleRequest(details) {
    // Check if interception is enabled
    if (!this.settings?.get('interceptionEnabled')) {
      return; // Skip processing if interception is disabled
    }

    // Ignore requests not associated with a tab (e.g., extensions)
    if (details.tabId === -1) return;

    // Initialize tab state if missing
    if (!this.state.tabs.has(details.tabId)) {
      this.state.tabs.set(details.tabId, { requests: new Map() });
    }

    const requestData = {
      id: details.requestId,
      url: details.url,
      method: details.method,
      tabId: details.tabId,
      timeStamp: details.timeStamp
    };

    // Log the request immediately
    this.logger.logRequestAction(requestData, 'intercepted');

    // Store request for tracking
    this.pendingRequests.set(details.requestId, requestData);
    this.state.tabs.get(details.tabId).requests.set(details.requestId, requestData);

    // Notify popup about new request (safe: handle no receiver)
    try {
      chrome.runtime.sendMessage({
        type: 'NEW_INTERCEPTED_REQUEST',
        request: requestData
      }, () => {
        if (chrome.runtime.lastError) {
          // No active listener (e.g., popup closed) — ignore
        }
      });
    } catch (_) {}

    // Only verify URL if blocking is enabled
    if (this.settings?.get('blockMaliciousUrls')) {
      // Verify URL asynchronously
      this.verifier.verifyURL(requestData.url).then((isSafe) => {
        if (!isSafe) {
          // Log the threat
          this.logger.logRequestAction(requestData, 'threat_detected');
          this.logger.logThreatVerdict(requestData.url, 'verification_engine', 'malicious');
          
          // Add to blocked URLs for potential future blocking
          this.blockedUrls.add(requestData.url);
          // Add a dynamic DNR rule to block this URL
          this._addDynamicBlockRule(requestData.url).catch((e) => console.warn('Failed to add DNR rule:', e));
          
          // Notify popup about the threat (safe: handle no receiver)
          try {
            chrome.runtime.sendMessage({
              type: 'THREAT_DETECTED',
              request: requestData
            }, () => {
              if (chrome.runtime.lastError) {
                // No active listener — ignore
              }
            });
          } catch (_) {}
        } else {
          // Log safe request
          this.logger.logThreatVerdict(requestData.url, 'verification_engine', 'safe');
        }
      }).catch((error) => {
        console.warn('URL verification failed:', error);
        this.logger.logThreatVerdict(requestData.url, 'verification_engine', 'error');
      });
    }
  }

  handleRequestCompleted(details) {
    // Clean up completed requests
    this.pendingRequests.delete(details.requestId);
  }

  forwardRequest(requestId) {
    if (!this.pendingRequests.has(requestId)) return;

    const req = this.pendingRequests.get(requestId);
    this.pendingRequests.delete(requestId);
    this.logger.logRequestAction(req, 'forwarded');

    console.log('Request forwarded:', req.url);
  }

  dropRequest(requestId) {
    if (!this.pendingRequests.has(requestId)) return;

    const req = this.pendingRequests.get(requestId);
    this.pendingRequests.delete(requestId);
    this.logger.logRequestAction(req, 'dropped');

    console.log('Request dropped:', req.url);
  }

  // Get list of currently blocked URLs
  getBlockedUrls() {
    return Array.from(this.blockedUrls);
  }

  // Clear blocked URLs
  clearBlockedUrls() {
    this.blockedUrls.clear();
    // Clear dynamic rules we added (by tag)
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: this._addedRuleIds || [] }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed clearing dynamic rules:', chrome.runtime.lastError.message);
      }
      this._addedRuleIds = [];
    });
  }

  _urlToFilter(url) {
    try {
      const u = new URL(url);
      // Block the exact URL path with scheme+host+path
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch (_) {
      return url;
    }
  }

  async _addDynamicBlockRule(url) {
    const filter = this._urlToFilter(url);
    const id = this.nextRuleId++;
    const rule = {
      id,
      priority: 1,
      action: { type: 'block' },
      condition: { urlFilter: filter, resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script'] }
    };
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] });
    
    if (!this._addedRuleIds) this._addedRuleIds = [];
    this._addedRuleIds.push(id);
  }
}
