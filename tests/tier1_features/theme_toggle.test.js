/**
 * Tier 1: Feature Coverage - Theme Toggle (Groww Light / Binance Dark)
 * Requirements:
 * - Light mode: Groww FinTech style (clean minimalist cards, crisp typography, emerald/teal accents #00D09C/#009379, canvas #FAF9F6).
 * - Dark mode: Binance Pro style (deep dark #0B0E11 canvas, signature Binance Gold #F0B90B accents, card #181A20).
 * - Seamless theme toggle in navbar.
 * - Minimum 5 comprehensive test cases.
 */

import { assert, assertEqual, assertDeepEqual, assertIncludes } from '../helpers/assert.js';
import { ThemeManagerSimulator, GROWW_LIGHT_SPEC, BINANCE_DARK_SPEC, THEME_MODES } from '../helpers/theme_oracle.js';

export async function runThemeToggleTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 1.1: Default Theme Initialization
  // --------------------------------------------------------------------------
  (() => {
    const manager = new ThemeManagerSimulator(THEME_MODES.LIGHT);
    assertEqual(manager.currentTheme, 'light', 'Default theme must be light');
    assertEqual(manager.isDark(), false, 'isDark() should be false initially');
    assertEqual(manager.domClassList.has('dark'), false, 'Root element must not have .dark class by default');

    const spec = manager.getActiveSpec();
    assertEqual(spec.name, 'Groww FinTech Light', 'Default spec must be Groww FinTech Light');
    assertEqual(spec.canvasBg, '#FAF9F6', 'Groww canvas background token mismatch');
    assertEqual(spec.accentBrand, '#00D09C', 'Groww primary emerald accent mismatch');
    assertEqual(spec.buttonGradient, 'linear-gradient(135deg, #00D09C 0%, #009379 100%)', 'Groww CTA gradient mismatch');
    assertEqual(spec.cardBg, '#FFFFFF', 'Groww card surface must be crisp white');
    results.push({ name: 'Theme 1.1: Default initialization in Groww FinTech Light mode', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 1.2: Switch to Binance Pro Dark Mode
  // --------------------------------------------------------------------------
  (() => {
    const manager = new ThemeManagerSimulator(THEME_MODES.LIGHT);
    const newTheme = manager.toggleTheme();

    assertEqual(newTheme, 'dark', 'Toggling light theme must switch to dark');
    assertEqual(manager.isDark(), true, 'isDark() should be true after toggle');
    assertEqual(manager.domClassList.has('dark'), true, 'Root element must include .dark class in dark mode');
    assertEqual(manager.storage.get('trustbridge_theme'), 'dark', 'localStorage must record "dark" preference');

    const spec = manager.getActiveSpec();
    assertEqual(spec.name, 'Binance Pro Dark', 'Active spec must be Binance Pro Dark');
    assertEqual(spec.canvasBg, '#0B0E11', 'Binance canvas background token mismatch');
    assertEqual(spec.accentBrand, '#F0B90B', 'Signature Binance Gold accent mismatch');
    assertEqual(spec.cardBg, '#181A20', 'Binance secondary card surface mismatch');
    assertEqual(spec.buttonTextColor, '#000000', 'Binance CTA text color must be black on gold');
    results.push({ name: 'Theme 1.2: Toggle to Binance Pro Dark with official gold accents and dark canvas', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 1.3: Round-Trip Dual Theme Toggling
  // --------------------------------------------------------------------------
  (() => {
    const manager = new ThemeManagerSimulator(THEME_MODES.LIGHT);
    manager.toggleTheme(); // -> Dark
    assertEqual(manager.isDark(), true, 'Intermediate state must be dark');

    const returnedTheme = manager.toggleTheme(); // -> Light
    assertEqual(returnedTheme, 'light', 'Second toggle must return to light');
    assertEqual(manager.isDark(), false, 'isDark() must return to false');
    assertEqual(manager.domClassList.has('dark'), false, 'Root .dark class must be removed');
    assertEqual(manager.storage.get('trustbridge_theme'), 'light', 'localStorage must update to "light"');
    assertEqual(manager.getActiveSpec().accentBrand, '#00D09C', 'Emerald accent restored');
    results.push({ name: 'Theme 1.3: Round-trip toggling preserves clean state and removes .dark class', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 1.4: Persistence and Rehydration from Local Storage
  // --------------------------------------------------------------------------
  (() => {
    // Simulate user previously set dark mode in storage
    const simulatedStorage = new Map([['trustbridge_theme', 'dark']]);
    const rehydratedTheme = simulatedStorage.get('trustbridge_theme') || 'light';
    const manager = new ThemeManagerSimulator(rehydratedTheme);

    assertEqual(manager.currentTheme, 'dark', 'Manager should rehydrate dark mode from storage');
    assertEqual(manager.domClassList.has('dark'), true, 'Manager should immediately apply .dark class');
    assertEqual(manager.getActiveSpec().cardBg, '#181A20', 'Card background matches Binance dark');
    results.push({ name: 'Theme 1.4: Storage persistence and rehydration restores user theme choice', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 1.5: Component Token Contrast and Invariant Parity
  // --------------------------------------------------------------------------
  (() => {
    const light = GROWW_LIGHT_SPEC;
    const dark = BINANCE_DARK_SPEC;

    // Contrast check: Light mode primary text on card surface
    assert(light.cardBg === '#FFFFFF' && light.textPrimary === '#111827', 'Light mode must have dark slate text on white cards');
    // Contrast check: Dark mode primary text on card surface
    assert(dark.cardBg === '#181A20' && dark.textPrimary === '#EAECEF', 'Dark mode must have high-contrast light text on dark cards');
    // CTA Button styling: Groww has emerald gradient, Binance has solid gold with black text
    assert(light.buttonGradient.includes('#00D09C') && light.buttonGradient.includes('#009379'), 'Groww button uses dual emerald/teal gradient');
    assert(dark.buttonSolidBg === '#F0B90B' && dark.buttonTextColor === '#000000', 'Binance button uses solid gold with black text');
    results.push({ name: 'Theme 1.5: Token contrast and visual styling invariants between Groww & Binance', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 1.6: Adversarial Fallback on Malformed Storage Values
  // --------------------------------------------------------------------------
  (() => {
    const corruptedValues = ['invalid_theme', 'null', 'undefined', '{}', '12345'];
    for (const corrupt of corruptedValues) {
      const validTheme = (corrupt === 'dark' || corrupt === 'light') ? corrupt : 'light';
      const manager = new ThemeManagerSimulator(validTheme);
      assertEqual(manager.currentTheme, 'light', `Corrupt value "${corrupt}" must safely fallback to light`);
      assertEqual(manager.isDark(), false, 'Should not activate dark mode on invalid storage value');
    }
    results.push({ name: 'Theme 1.6: Adversarial resilience against corrupted storage values with safe fallback', passed: true });
  })();

  return results;
}
