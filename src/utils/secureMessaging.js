// src/utils/secureMessaging.js
// Secure messaging utilities with validation and error handling

import { MESSAGE_TYPES } from '../constants/messageTypes.js';

/**
 * Validates message structure
 * @param {Object} message 
 * @returns {boolean}
 */
function isValidMessage(message) {
  if (!message || typeof message !== 'object') return false;
  if (!message.type || typeof message.type !== 'string') return false;
  if (!Object.values(MESSAGE_TYPES).includes(message.type)) return false;
  return true;
}

/**
 * Secure message sending with timeout and validation
 * @param {Object} message 
 * @param {number} timeout 
 * @returns {Promise<any>}
 */
export function sendSecureMessage(message, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!isValidMessage(message)) {
      reject(new Error('Invalid message format'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve(response || {});
      });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Safe message listener with validation
 * @param {Function} handler 
 * @returns {Function} cleanup function
 */
export function addSecureMessageListener(handler) {
  function secureHandler(message, sender, sendResponse) {
    if (!isValidMessage(message)) {
      console.warn('Received invalid message:', message);
      sendResponse({ error: 'Invalid message format' });
      return false;
    }

    try {
      const result = handler(message, sender, sendResponse);
      return result;
    } catch (error) {
      console.error('Message handler error:', error);
      try {
        sendResponse({ error: error.message });
      } catch (_) {}
      return false;
    }
  }

  chrome.runtime.onMessage.addListener(secureHandler);
  
  return () => {
    chrome.runtime.onMessage.removeListener(secureHandler);
  };
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  constructor(maxCalls = 10, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    
    const callTimes = this.calls.get(key);
    
    // Remove old calls
    while (callTimes.length > 0 && callTimes[0] < windowStart) {
      callTimes.shift();
    }
    
    if (callTimes.length >= this.maxCalls) {
      return false;
    }
    
    callTimes.push(now);
    return true;
  }
}
