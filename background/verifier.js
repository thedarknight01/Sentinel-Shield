// background/verifier.js
class VerificationEngine {
  constructor(logger, cache) {
    this.logger = logger;
    this.cache = cache; // Map for caching domain results
    
    this.localBlacklist = new Set([
      'malicious-domain.com',
      'badexample.com',
      'suspicious-site.net',
      'malware-test.org',
      'phishing-example.com'
    ]);
    this.localWhitelist = new Set([
      'trusted.com',
      'google.com',
      'github.com',
      'stackoverflow.com',
      'mozilla.org'
    ]);
  }

  /**
   * Checks if a URL is malicious using the urlscan.io API.
   * @param {string} url
   * @returns {Promise<boolean>} true if safe, false if malicious
   */
  async verifyURL(url) {
    try {
      const domain = new URL(url).hostname;
      const apiUrl = `https://urlscan.io/api/v1/search/?q=domain:${domain}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`urlscan.io API error: ${response.status}`);
      }

      const data = await response.json();

      this.cache.set(domain, data);
      // Optional chaining (?.) prevents errors if properties don't exist.
      const isMalicious = data.results?.some(
        result => result.verdicts?.overall?.malicious
      ) ?? false; // Default to false if 'results' isn't an array.

      this.logger.logThreatVerdict(url, 'urlscan.io', isMalicious ? 'malicious' : 'safe');
      return !isMalicious;

    } catch (error) {
      console.error('Verification error:', error);
      return true; // Default to safe on error
    }
  }

  /**
   * Placeholder for another threat API. Kept for original structure.
   * @param {string} domain
   * @returns {Promise<boolean>} true if malicious, false if safe
   */
  async queryThreatApi(domain) {
    return domain === 'badexample.com';
  }
}