// src/constants/messageTypes.js
// Centralized message type definitions to prevent typos and improve maintainability

export const MESSAGE_TYPES = {
  // System messages
  PING: 'PING',
  PONG: 'PONG',
  
  // User actions
  USER_ACTION_FORWARD: 'USER_ACTION_FORWARD',
  USER_ACTION_DROP: 'USER_ACTION_DROP',
  
  // Data requests
  GET_STATS: 'GET_STATS',
  GET_COMPREHENSIVE_DATA: 'GET_COMPREHENSIVE_DATA',
  GET_REQUEST_LOGS: 'GET_REQUEST_LOGS',
  GET_THREAT_LOGS: 'GET_THREAT_LOGS',
  GET_SCRIPT_LOGS: 'GET_SCRIPT_LOGS',
  GET_BLOCKED_URLS: 'GET_BLOCKED_URLS',
  GET_SETTINGS: 'GET_SETTINGS',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TOGGLE_INTERCEPTION: 'TOGGLE_INTERCEPTION',
  
  // Events from background
  NEW_INTERCEPTED_REQUEST: 'NEW_INTERCEPTED_REQUEST',
  THREAT_DETECTED: 'THREAT_DETECTED',
  SCRIPT_ANALYSIS_RESULT: 'SCRIPT_ANALYSIS_RESULT',
  SCRIPT_ALERT: 'SCRIPT_ALERT',
  REQUEST_ACTION_RESULT: 'REQUEST_ACTION_RESULT',
  
  // Maintenance
  CLEAR_LOGS: 'CLEAR_LOGS',
  CLEAR_BLOCKED_URLS: 'CLEAR_BLOCKED_URLS'
};

export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  CLEARED: 'cleared',
  FORWARDED: 'forwarded',
  DROPPED: 'dropped',
  PROCESSED: 'processed'
};
