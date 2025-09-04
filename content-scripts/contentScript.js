// content-scripts/contentScript.js
(() => {
  // Collect all scripts on page (inline + external)
  const scripts = Array.from(document.scripts);

  const results = {
    totalScripts: scripts.length,
    blockedScripts: [],        // For future CSP injection if implemented
    suspiciousScripts: [],     // Scripts flagged suspicious
    details: []                // Optional: detailed info on suspicious scripts
  };

  scripts.forEach(script => {
    const isInline = !script.src;
    const content = isInline ? script.textContent : null;

    let suspicious = false;

    // Basic suspicious pattern checks in inline scripts
    if (content) {
      // Check for eval usage (possible obfuscation)
      if (/eval\(/.test(content)) suspicious = true;

      // Example heuristic: source maps comment presence
      if (/\/\/# sourceMappingURL=/.test(content)) suspicious = true;
    }

    if (suspicious) {
      results.suspiciousScripts.push(script.src || 'inline script');
      results.details.push({
        script: script.src || 'inline script',
        reason: 'Detected suspicious pattern (eval or source map)'
      });
    }
  });

  // Send analysis results back to background script with error handling
  try {
    chrome.runtime.sendMessage({ type: 'SCRIPT_ANALYSIS_RESULT', data: results }, (response) => {
      if (chrome.runtime.lastError) {
        // Receiving end may not exist if background worker is not started yet
        console.debug('SCRIPT_ANALYSIS_RESULT send failed:', chrome.runtime.lastError.message);
        return;
      }
      // Optional: handle ack
    });
  } catch (e) {
    console.debug('SCRIPT_ANALYSIS_RESULT send exception:', e);
  }
})();
