import React, { createContext, useContext, ReactNode } from 'react';
import { MD3DarkTheme } from 'react-native-paper';
import { Brand } from './brandColors';

export { Brand, Gradients, Radius, Layout } from './brandColors';

const FitDeskTheme = {
  ...MD3DarkTheme,
  roundness: 6,
  colors: {
    ...MD3DarkTheme.colors,
    primary:              Brand.purple,
    onPrimary:            Brand.textPrimary,
    primaryContainer:     Brand.surfaceElevated,
    onPrimaryContainer:   Brand.textPrimary,
    secondary:            Brand.orange,
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

type AppTheme = typeof FitDeskTheme;

interface ThemeContextValue {
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: FitDeskTheme });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: FitDeskTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
