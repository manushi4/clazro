import { AppRegistry } from 'react-native';
import App from '../../App';

const APP_NAME = 'ManushiCoaching';

// Add error handler for debugging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
    <h2>Runtime Error</h2>
    <pre>${message}\n${source}:${lineno}:${colno}\n${error?.stack || ''}</pre>
  </div>`;
  return true;
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

console.log('[Web] Starting app...');

try {
  AppRegistry.registerComponent(APP_NAME, () => App);
  console.log('[Web] Component registered');

  const rootTag = document.getElementById('root');
  if (!rootTag) {
    throw new Error('Root element not found');
  }

  AppRegistry.runApplication(APP_NAME, {
    rootTag,
  });
  console.log('[Web] Application started');
} catch (error) {
  console.error('[Web] Startup error:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
    <h2>Startup Error</h2>
    <pre>${error instanceof Error ? error.message + '\n' + error.stack : String(error)}</pre>
  </div>`;
}
