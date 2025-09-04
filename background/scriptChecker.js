// background/scriptChecker.js
class ScriptChecker {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Handles analysis results from content script.
   * @param {Object} data - Result data from content script.
   * @param {number} tabId
   */
  handleAnalysisResult(data, tabId) {
    this.logger.logScriptAnalysis(tabId, data);

    if (data.suspiciousScripts && data.suspiciousScripts.length > 0) {
      // Notify popup or other listeners about suspicious scripts
      try {
        chrome.runtime.sendMessage({
          type: 'SCRIPT_ALERT',
          tabId,
          data
        }, () => {
          if (chrome.runtime.lastError) {
            // no receiver; fine
          }
        });
      } catch (_) {}
    }
  }
}
