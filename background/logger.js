// background/logger.js


class Logger {
  constructor() {
    console.log('📊 Initializing Logger instance...');
    // Request logs and stats
    this.requests = [];
    this.threats = [];
    this.scriptAnalyses = [];
    this.stats = {
      threatsBlocked: 0,
      scriptsAnalyzed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    // persistence
    this._saveTimer = null;
    this._hydrated = false;
    this._hydrate();
    console.log('📊 Logger initialized successfully');
  }

  _debouncedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save().catch(console.warn), 500);
  }

  async _hydrate() {
    try {
      const stored = await chrome.storage.local.get(['logger_state']);
      if (stored && stored.logger_state) {
        const { requests, threats, scriptAnalyses, stats } = stored.logger_state;
        if (Array.isArray(requests)) this.requests = requests;
        if (Array.isArray(threats)) this.threats = threats;
        if (Array.isArray(scriptAnalyses)) this.scriptAnalyses = scriptAnalyses;
        if (stats) this.stats = Object.assign(this.stats, stats);
        this._hydrated = true;
        console.log('📦 Logger state hydrated');
      }
    } catch (e) {
      console.warn('Failed to hydrate logger state:', e);
    }
  }

  async _save() {
    try {
      const payload = {
        logger_state: {
          requests: this.requests.slice(-200),
          threats: this.threats.slice(-200),
          scriptAnalyses: this.scriptAnalyses.slice(-200),
          stats: this.stats
        }
      };
      await chrome.storage.local.set(payload);
    } catch (e) {
      console.warn('Failed to persist logger state:', e);
    }
  }

  /**
   * Log user or system action on an intercepted request.
   * @param {Object} request
   * @param {string} action - e.g. 'forwarded', 'dropped'
   */
  logRequestAction(request, action) {
    this.requests.push({
      time: new Date().toISOString(),
      url: request.url,
      tabId: request.tabId,
      action
    });
    if (action === 'dropped') this.stats.threatsBlocked++;
  this._debouncedSave();
  }

  /**
   * Log threat intelligence verdict.
   * @param {string} url
   * @param {string} source - e.g. 'whitelist', 'blacklist', 'cache', 'api'
   * @param {string} result - e.g. 'safe', 'malicious'
   */
  logThreatVerdict(url, source, result) {
    this.threats.push({
      time: new Date().toISOString(),
      url,
      source,
      result
    });
  this._debouncedSave();
  }

  /**
   * Log script analysis data.
   * @param {number} tabId
   * @param {Object} analysis - output from scriptChecker
   */
  logScriptAnalysis(tabId, analysis) {
    this.scriptAnalyses.push({
      time: new Date().toISOString(),
      tabId,
      analysis
    });
    this.stats.scriptsAnalyzed += analysis.totalScripts || 0;
  this._debouncedSave();
  }

  /**
   * Return collected statistics summary.
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get all request logs
   */
  getRequestLogs() {
    return this.requests.slice(-50); // Return last 50 requests
  }

  /**
   * Get all threat logs
   */
  getThreatLogs() {
    return this.threats.slice(-50); // Return last 50 threats
  }

  /**
   * Get all script analysis logs
   */
  getScriptLogs() {
    return this.scriptAnalyses.slice(-50); // Return last 50 analyses
  }

  /**
   * Get comprehensive data for popup
   */
  getComprehensiveData() {
    return {
      stats: this.stats,
      requestLogs: this.getRequestLogs(),
      threatLogs: this.getThreatLogs(),
      scriptLogs: this.getScriptLogs(),
      summary: {
        totalRequests: this.requests.length,
        totalThreats: this.threats.length,
        totalAnalyses: this.scriptAnalyses.length,
        lastActivity: this.requests.length > 0 ? this.requests[this.requests.length - 1].time : null
      }
    };
  }

  /**
   * Clear all logs (for maintenance)
   */
  clearLogs() {
    this.requests = [];
    this.threats = [];
    this.scriptAnalyses = [];
  this._debouncedSave();
  }
}

console.log('📊 Logger module loaded successfully');
