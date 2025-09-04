// Test script to verify all modules can be loaded
console.log('🧪 Testing module loading...');

try {
  importScripts('logger.js');
  console.log('✅ Logger loaded');
  
  importScripts('verifier.js');
  console.log('✅ Verifier loaded');
  
  importScripts('scriptChecker.js');
  console.log('✅ ScriptChecker loaded');
  
  importScripts('interceptor.js');
  console.log('✅ Interceptor loaded');
  
  // Test instantiation
  const testLogger = new Logger();
  console.log('✅ Logger instantiated');
  
  const testCache = new Map();
  const testVerifier = new VerificationEngine(testLogger, testCache);
  console.log('✅ Verifier instantiated');
  
  const testScriptChecker = new ScriptChecker(testLogger);
  console.log('✅ ScriptChecker instantiated');
  
  const testState = { tabs: new Map(), requestCache: new Map() };
  const testInterceptor = new Interceptor(testLogger, testVerifier, testState);
  console.log('✅ Interceptor instantiated');
  
  console.log('🎉 All modules test passed!');
  
} catch (error) {
  console.error('❌ Module test failed:', error);
}
