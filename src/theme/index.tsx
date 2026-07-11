import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { MD3DarkTheme } from 'react-native-paper';
import { getDatabase } from '../database/db';
import { AccentKey, AccentPalette, AccentPalettes, Brand } from './brandColors';

export { AccentPalettes, BadgeTones, Brand, Gradients, Radius, Layout, Spacing, Typography, Elevation } from './brandColors';
export type { AccentKey, AccentPalette, BadgeTone } from './brandColors';

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && value in AccentPalettes;
}

function createFitDeskTheme(accentKey: AccentKey) {
  const accent = AccentPalettes[accentKey];
  return {
  ...MD3DarkTheme,
  roundness: 6,
  colors: {
    ...MD3DarkTheme.colors,
    primary:              accent.main,
    onPrimary:            Brand.textPrimary,
    primaryContainer:     Brand.surfaceElevated,
    onPrimaryContainer:   Brand.textPrimary,
    secondary:            accent.accent,
    onSecondary:          Brand.textPrimary,
    background:           Brand.backgroundDark,
    surface:              Brand.surfaceDark,
    onSurface:            Brand.textPrimary,
    onSurfaceVariant:     Brand.textMuted,
    surfaceVariant:       Brand.surfaceElevated,
    outline:              Brand.borderSubtle,
    error:                '#FF5252',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge:  { ...MD3DarkTheme.fonts.displayLarge,  fontFamily: 'Poppins_700Bold' },
    displayMedium: { ...MD3DarkTheme.fonts.displayMedium, fontFamily: 'Poppins_700Bold' },
    displaySmall:  { ...MD3DarkTheme.fonts.displaySmall,  fontFamily: 'Poppins_700Bold' },
    headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, fontFamily: 'Poppins_700Bold' },
    headlineMedium:{ ...MD3DarkTheme.fonts.headlineMedium,fontFamily: 'Montserrat_600SemiBold' },
    headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, fontFamily: 'Montserrat_600SemiBold' },
    titleLarge:    { ...MD3DarkTheme.fonts.titleLarge,    fontFamily: 'Montserrat_600SemiBold' },
    titleMedium:   { ...MD3DarkTheme.fonts.titleMedium,   fontFamily: 'Montserrat_600SemiBold' },
    titleSmall:    { ...MD3DarkTheme.fonts.titleSmall,    fontFamily: 'Montserrat_600SemiBold' },
    bodyLarge:     { ...MD3DarkTheme.fonts.bodyLarge,     fontFamily: 'Outfit_400Regular' },
    bodyMedium:    { ...MD3DarkTheme.fonts.bodyMedium,    fontFamily: 'Outfit_400Regular' },
    bodySmall:     { ...MD3DarkTheme.fonts.bodySmall,     fontFamily: 'Outfit_400Regular' },
    labelLarge:    { ...MD3DarkTheme.fonts.labelLarge,    fontFamily: 'Outfit_400Regular' },
    labelMedium:   { ...MD3DarkTheme.fonts.labelMedium,   fontFamily: 'Outfit_400Regular' },
    labelSmall:    { ...MD3DarkTheme.fonts.labelSmall,    fontFamily: 'Outfit_400Regular' },
  },
  };
}

type AppTheme = ReturnType<typeof createFitDeskTheme>;

interface ThemeContextValue {
  theme: AppTheme;
  accentKey: AccentKey;
  accentPalette: AccentPalette;
  setAccentKey: (accentKey: AccentKey) => Promise<void>;
}

const DEFAULT_ACCENT: AccentKey = 'purple';

const ThemeContext = createContext<ThemeContextValue>({
  theme: createFitDeskTheme(DEFAULT_ACCENT),
  accentKey: DEFAULT_ACCENT,
  accentPalette: AccentPalettes[DEFAULT_ACCENT],
  setAccentKey: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentKey, setAccentKeyState] = useState<AccentKey>(DEFAULT_ACCENT);

  useEffect(() => {
    let mounted = true;
    async function loadAccent() {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'accent_color'"
      );
      const storedAccent = row?.value ?? null;
      if (mounted && isAccentKey(storedAccent)) {
        setAccentKeyState(storedAccent);
      }
    }
    loadAccent().catch(() => {});
    return () => { mounted = false; };
  }, []);

  const setAccentKey = useCallback(async (nextAccentKey: AccentKey) => {
    setAccentKeyState(nextAccentKey);
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('accent_color', ?)",
      [nextAccentKey]
    );
  }, []);

  const value = useMemo(
    () => ({
      theme: createFitDeskTheme(accentKey),
      accentKey,
      accentPalette: AccentPalettes[accentKey],
      setAccentKey,
    }),
    [accentKey, setAccentKey],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
