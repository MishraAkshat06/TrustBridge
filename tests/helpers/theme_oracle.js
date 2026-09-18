/**
 * Authoritative Theme Oracle
 * Defines exact design tokens, CSS variables, colors, and behaviors for:
 * 1. Groww FinTech Light Mode
 * 2. Binance Pro Dark Mode
 */

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark'
};

export const GROWW_LIGHT_SPEC = {
  mode: THEME_MODES.LIGHT,
  name: 'Groww FinTech Light',
  canvasBg: '#FAF9F6',
  cardBg: '#FFFFFF',
  secondaryBg: '#F4F6F8',
  borderColor: '#E2E8F0',
  textPrimary: '#111827',
  textSecondary: '#475569',
  accentBrand: '#00D09C', // Groww Emerald
  accentBrandHover: '#00B386',
  accentSecondary: '#009379',
  buttonGradient: 'linear-gradient(135deg, #00D09C 0%, #009379 100%)',
  buttonTextColor: '#FFFFFF',
  badgeSuccessBg: '#ECFDF5',
  badgeSuccessText: '#047857',
  rootClass: '' // No .dark class
};

export const BINANCE_DARK_SPEC = {
  mode: THEME_MODES.DARK,
  name: 'Binance Pro Dark',
  canvasBg: '#0B0E11', // Binance Canvas
  cardBg: '#181A20', // Binance Card Surface
  secondaryBg: '#1E2329', // Binance Elevated
  borderColor: '#2B313A', // Binance Separator
  textPrimary: '#EAECEF',
  textSecondary: '#B7BDC6',
  accentBrand: '#F0B90B', // Signature Binance Gold
  accentBrandHover: '#FCD535',
  accentSecondary: '#C99400',
  buttonSolidBg: '#F0B90B',
  buttonTextColor: '#000000',
  bullGreen: '#0ECB81',
  bearRed: '#F6465D',
  rootClass: 'dark' // Requires .dark class on html/root
};

export class ThemeManagerSimulator {
  constructor(initialTheme = THEME_MODES.LIGHT) {
    this.currentTheme = initialTheme;
    this.storageKey = 'trustbridge_theme';
    this.storage = new Map();
    this.domClassList = new Set();

    if (initialTheme === THEME_MODES.DARK) {
      this.domClassList.add('dark');
    }
  }

  toggleTheme() {
    if (this.currentTheme === THEME_MODES.LIGHT) {
      this.currentTheme = THEME_MODES.DARK;
      this.domClassList.add('dark');
      this.storage.set(this.storageKey, 'dark');
    } else {
      this.currentTheme = THEME_MODES.LIGHT;
      this.domClassList.delete('dark');
      this.storage.set(this.storageKey, 'light');
    }
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme !== THEME_MODES.LIGHT && theme !== THEME_MODES.DARK) {
      throw new Error(`Invalid theme: ${theme}`);
    }
    this.currentTheme = theme;
    if (theme === THEME_MODES.DARK) {
      this.domClassList.add('dark');
    } else {
      this.domClassList.delete('dark');
    }
    this.storage.set(this.storageKey, theme);
  }

  isDark() {
    return this.currentTheme === THEME_MODES.DARK;
  }

  getActiveSpec() {
    return this.isDark() ? BINANCE_DARK_SPEC : GROWW_LIGHT_SPEC;
  }
}
