// src/utils/settingsManager.js
// Secure settings management with validation

const DEFAULT_SETTINGS = {
  interceptionEnabled: true,
  autoRefresh: true,
  refreshInterval: 5000,
  notificationsEnabled: true,
  logLevel: 'info',
  maxLogEntries: 200,
  blockMaliciousUrls: true,
  theme: 'light'
};

/**
 * Validates settings object
 * @param {Object} settings 
 * @returns {boolean}
 */
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  
  const validations = {
    interceptionEnabled: (v) => typeof v === 'boolean',
    autoRefresh: (v) => typeof v === 'boolean',
    refreshInterval: (v) => typeof v === 'number' && v >= 1000 && v <= 60000,
    notificationsEnabled: (v) => typeof v === 'boolean',
    logLevel: (v) => ['debug', 'info', 'warn', 'error'].includes(v),
    maxLogEntries: (v) => typeof v === 'number' && v >= 50 && v <= 1000,
    blockMaliciousUrls: (v) => typeof v === 'boolean',
    theme: (v) => ['light', 'dark'].includes(v)
  };

  for (const [key, value] of Object.entries(settings)) {
    if (validations[key] && !validations[key](value)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Settings manager class
 */
export class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
  }

  async load() {
    try {
      const stored = await chrome.storage.local.get(['extension_settings']);
      if (stored.extension_settings && validateSettings(stored.extension_settings)) {
        this.settings = { ...DEFAULT_SETTINGS, ...stored.extension_settings };
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
      // Bulk update
      const newSettings = { ...this.settings, ...key };
      if (!validateSettings(newSettings)) {
        throw new Error('Invalid settings provided');
      }
      this.settings = newSettings;
    } else {
      // Single update
      const newSettings = { ...this.settings, [key]: value };
      if (!validateSettings(newSettings)) {
        throw new Error(`Invalid value for setting: ${key}`);
      }
      this.settings = newSettings;
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

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    return this.save();
  }
}
