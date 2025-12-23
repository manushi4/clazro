#!/usr/bin/env node

/**
 * Widget Validation Script
 *
 * Validates that a widget is properly registered across:
 * 1. Mobile app widget registry
 * 2. Platform Studio widget registry
 * 3. Platform Studio config schema
 *
 * Usage: node validate-widget.js <widget-id>
 * Example: node validate-widget.js schedule.today
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, widgetId, description) {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    log(`  [SKIP] ${description}: File not found`, 'yellow');
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const found = content.includes(`"${widgetId}"`) || content.includes(`'${widgetId}'`);

  if (found) {
    log(`  [OK] ${description}`, 'green');
  } else {
    log(`  [MISSING] ${description}`, 'red');
  }

  return found;
}

function extractConfigKeys(content, widgetId) {
  // Simple regex to find config keys - this is a basic implementation
  const regex = new RegExp(`["']${widgetId}["']\\s*:\\s*\\{([^}]+sections[^}]+)\\}`, 's');
  const match = content.match(regex);

  if (!match) return [];

  const keyMatches = match[1].matchAll(/key:\s*["']([^"']+)["']/g);
  return Array.from(keyMatches).map(m => m[1]);
}

function validateWidget(widgetId) {
  log(`\nValidating widget: ${widgetId}`, 'blue');
  log('='.repeat(50));

  const results = {
    mobileRegistry: false,
    mobileComponent: false,
    platformRegistry: false,
    platformConfig: false,
    translations: {
      en: false,
      hi: false,
    },
  };

  // Check mobile app registry
  log('\n1. Mobile App:', 'blue');
  results.mobileRegistry = checkFile(
    'src/config/widgetRegistry.ts',
    widgetId,
    'Widget Registry'
  );

  // Check widget component exists
  const category = widgetId.split('.')[0];
  const widgetName = widgetId.split('.')[1];
  const pascalName = widgetName.charAt(0).toUpperCase() + widgetName.slice(1);
  const componentPath = `src/components/widgets/${category}/${pascalName}Widget.tsx`;

  if (fs.existsSync(path.resolve(process.cwd(), componentPath))) {
    log(`  [OK] Widget Component: ${componentPath}`, 'green');
    results.mobileComponent = true;
  } else {
    log(`  [MISSING] Widget Component: ${componentPath}`, 'red');
  }

  // Check Platform Studio
  log('\n2. Platform Studio:', 'blue');
  results.platformRegistry = checkFile(
    'platform-studio/src/config/widgetRegistry.ts',
    widgetId,
    'Widget Registry'
  );
  results.platformConfig = checkFile(
    'platform-studio/src/components/builder/WidgetPropertiesPanel.tsx',
    widgetId,
    'Config Schema (WIDGET_CONFIGS)'
  );

  // Check translations
  log('\n3. Translations:', 'blue');
  const widgetKey = widgetName.charAt(0).toLowerCase() + widgetName.slice(1);

  const enPath = 'src/locales/en/dashboard.json';
  if (fs.existsSync(path.resolve(process.cwd(), enPath))) {
    const enContent = fs.readFileSync(path.resolve(process.cwd(), enPath), 'utf-8');
    results.translations.en = enContent.includes(`"${widgetKey}"`);
    if (results.translations.en) {
      log(`  [OK] English translations`, 'green');
    } else {
      log(`  [MISSING] English translations (key: ${widgetKey})`, 'red');
    }
  }

  const hiPath = 'src/locales/hi/dashboard.json';
  if (fs.existsSync(path.resolve(process.cwd(), hiPath))) {
    const hiContent = fs.readFileSync(path.resolve(process.cwd(), hiPath), 'utf-8');
    results.translations.hi = hiContent.includes(`"${widgetKey}"`);
    if (results.translations.hi) {
      log(`  [OK] Hindi translations`, 'green');
    } else {
      log(`  [MISSING] Hindi translations (key: ${widgetKey})`, 'red');
    }
  }

  // Summary
  log('\n' + '='.repeat(50));
  log('Summary:', 'blue');

  const allPassed =
    results.mobileRegistry &&
    results.mobileComponent &&
    results.platformRegistry &&
    results.platformConfig &&
    results.translations.en &&
    results.translations.hi;

  if (allPassed) {
    log('\n[SUCCESS] Widget is fully registered!', 'green');
  } else {
    log('\n[INCOMPLETE] Widget registration is incomplete:', 'yellow');

    if (!results.mobileRegistry) {
      log('  - Add to src/config/widgetRegistry.ts', 'yellow');
    }
    if (!results.mobileComponent) {
      log(`  - Create ${componentPath}`, 'yellow');
    }
    if (!results.platformRegistry) {
      log('  - Add to platform-studio/src/config/widgetRegistry.ts', 'yellow');
    }
    if (!results.platformConfig) {
      log('  - Add config schema to WidgetPropertiesPanel.tsx', 'yellow');
    }
    if (!results.translations.en) {
      log('  - Add English translations to src/locales/en/dashboard.json', 'yellow');
    }
    if (!results.translations.hi) {
      log('  - Add Hindi translations to src/locales/hi/dashboard.json', 'yellow');
    }
  }

  return allPassed;
}

// Main execution
const widgetId = process.argv[2];

if (!widgetId) {
  log('Usage: node validate-widget.js <widget-id>', 'yellow');
  log('Example: node validate-widget.js schedule.today', 'yellow');
  process.exit(1);
}

if (!widgetId.includes('.')) {
  log('Error: Widget ID must be in format "category.name"', 'red');
  log('Example: schedule.today, progress.weekly', 'yellow');
  process.exit(1);
}

const success = validateWidget(widgetId);
process.exit(success ? 0 : 1);
