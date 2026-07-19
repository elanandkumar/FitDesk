import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { getDatabase } from '../database/db';
import {
  AccentKey,
  AccentPalettes,
  AppThemeColors,
  getAccentPalette,
  ResolvedThemeMode,
  ResolvedAccentPalette,
  ThemePalettes,
  ThemePreference,
  Typography,
} from './brandColors';

export {
  AccentPalettes,
  BadgeTonePalettes,
  BadgeTones,
  BrandCore,
  getAccentPalette,
  getBadgeTones,
  Gradients,
  Layout,
  Radius,
  Spacing,
  ThemePalettes,
  Typography,
} from './brandColors';
export type {
  AccentKey,
  AccentPalette,
  AppThemeColors,
  BadgeTone,
  ResolvedBadgeTones,
  ResolvedAccentPalette,
  ResolvedThemeMode,
  ThemePreference,
} from './brandColors';

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveThemeMode(
  preference: ThemePreference,
  deviceMode: ResolvedThemeMode | 'unspecified' | null | undefined,
): ResolvedThemeMode {
  if (preference !== 'system') return preference;
  return deviceMode === 'light' || deviceMode === 'dark' ? deviceMode : 'dark';
}

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && value in AccentPalettes;
}

export function createFitDeskTheme(
  accentKey: AccentKey,
  mode: ResolvedThemeMode = 'dark',
) {
  const accent = AccentPalettes[accentKey];
  const baseTheme = mode === 'light' ? MD3LightTheme : MD3DarkTheme;
  const colors: AppThemeColors = ThemePalettes[mode];
  return {
    ...baseTheme,
    roundness: 6,
    colors: {
      ...baseTheme.colors,
      primary: accent.main,
      onPrimary: '#FFFFFF',
      primaryContainer: colors.surfaceRaised,
      onPrimaryContainer: colors.textPrimary,
      secondary: accent.accent,
      onSecondary: '#FFFFFF',
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.textPrimary,
      onSurfaceVariant: colors.textMuted,
      surfaceVariant: colors.surfaceRaised,
      outline: colors.border,
      error: colors.danger,
    },
    fonts: {
      ...baseTheme.fonts,
      displayLarge: { ...baseTheme.fonts.displayLarge, fontFamily: 'Poppins_700Bold' },
      displayMedium: { ...baseTheme.fonts.displayMedium, fontFamily: 'Poppins_700Bold' },
      displaySmall: { ...baseTheme.fonts.displaySmall, fontFamily: 'Poppins_700Bold' },
      headlineLarge: { ...baseTheme.fonts.headlineLarge, fontFamily: 'Poppins_700Bold' },
      headlineMedium: { ...baseTheme.fonts.headlineMedium, fontFamily: 'Montserrat_600SemiBold' },
      headlineSmall: { ...baseTheme.fonts.headlineSmall, fontFamily: 'Montserrat_600SemiBold' },
      titleLarge: { ...baseTheme.fonts.titleLarge, fontFamily: 'Montserrat_600SemiBold' },
      titleMedium: { ...baseTheme.fonts.titleMedium, fontFamily: 'Montserrat_600SemiBold' },
      titleSmall: { ...baseTheme.fonts.titleSmall, fontFamily: 'Montserrat_600SemiBold' },
      bodyLarge: { ...baseTheme.fonts.bodyLarge, fontFamily: 'Outfit_400Regular' },
      bodyMedium: { ...baseTheme.fonts.bodyMedium, fontFamily: 'Outfit_400Regular' },
      bodySmall: { ...baseTheme.fonts.bodySmall, ...Typography.bodySm },
      labelLarge: { ...baseTheme.fonts.labelLarge, fontFamily: 'Outfit_400Regular' },
      labelMedium: { ...baseTheme.fonts.labelMedium, ...Typography.labelMd },
      labelSmall: { ...baseTheme.fonts.labelSmall, ...Typography.labelSm },
    },
  };
}

export type AppTheme = ReturnType<typeof createFitDeskTheme>;

export interface ThemeContextValue {
  theme: AppTheme;
  colors: AppThemeColors;
  themePreference: ThemePreference;
  resolvedThemeMode: ResolvedThemeMode;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  accentKey: AccentKey;
  accentPalette: ResolvedAccentPalette;
  setAccentKey: (accentKey: AccentKey) => Promise<void>;
}

const DEFAULT_ACCENT: AccentKey = 'purple';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
const DEFAULT_RESOLVED_MODE: ResolvedThemeMode = 'dark';

const ThemeContext = createContext<ThemeContextValue>({
  theme: createFitDeskTheme(DEFAULT_ACCENT, DEFAULT_RESOLVED_MODE),
  colors: ThemePalettes[DEFAULT_RESOLVED_MODE],
  themePreference: DEFAULT_THEME_PREFERENCE,
  resolvedThemeMode: DEFAULT_RESOLVED_MODE,
  isDark: true,
  setThemePreference: async () => {},
  accentKey: DEFAULT_ACCENT,
  accentPalette: getAccentPalette(DEFAULT_ACCENT, DEFAULT_RESOLVED_MODE),
  setAccentKey: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceMode = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [accentKey, setAccentKeyState] = useState<AccentKey>(DEFAULT_ACCENT);
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAppearance() {
      try {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          "SELECT key, value FROM settings WHERE key IN ('theme', 'accent_color')"
        );
        if (!mounted) return;

        const settings = new Map(rows.map(({ key, value }) => [key, value]));
        setThemePreferenceState(parseThemePreference(settings.get('theme')));
        const storedAccent = settings.get('accent_color') ?? null;
        if (isAccentKey(storedAccent)) {
          setAccentKeyState(storedAccent);
        }
      } finally {
        if (mounted) setAppearanceLoaded(true);
      }
    }
    loadAppearance().catch(() => {});
    return () => { mounted = false; };
  }, []);

  const setThemePreference = useCallback(async (nextPreference: ThemePreference) => {
    setThemePreferenceState(nextPreference);
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?)",
      [nextPreference]
    );
  }, []);

  const setAccentKey = useCallback(async (nextAccentKey: AccentKey) => {
    setAccentKeyState(nextAccentKey);
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('accent_color', ?)",
      [nextAccentKey]
    );
  }, []);

  const resolvedThemeMode = resolveThemeMode(themePreference, deviceMode);

  const value = useMemo<ThemeContextValue>(
    () => {
      const colors = ThemePalettes[resolvedThemeMode];
      return {
        theme: createFitDeskTheme(accentKey, resolvedThemeMode),
        colors,
        themePreference,
        resolvedThemeMode,
        isDark: resolvedThemeMode === 'dark',
        setThemePreference,
        accentKey,
        accentPalette: getAccentPalette(accentKey, resolvedThemeMode),
        setAccentKey,
      };
    },
    [accentKey, resolvedThemeMode, setAccentKey, setThemePreference, themePreference],
  );

  if (!appearanceLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
