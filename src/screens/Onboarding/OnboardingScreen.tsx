import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme";
import { AppThemeColors, Radius, Spacing, ThemePalettes, Typography } from "../../theme/brandColors";
import { getDatabase } from "../../database/db";
import { RootStackParamList } from "../../navigation/types";
import GradientButton from "../../components/common/GradientButton";
import AppIcon, { AppIconName } from "../../components/common/AppIcon";
import Constants from "expo-constants";

type Nav = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  icon: AppIconName;
  title: string;
  body: string;
};

const createSlides = (): Slide[] => [
  {
    key: "1",
    icon: "barbell",
    title: "Welcome to FitDesk",
    body: "Your personal fitness class companion. Manage your classes, clients, and payments — all in one place, right on your device.",
  },
  {
    key: "2",
    icon: "calendarCheck",
    title: "How It Works",
    body: "Manager-sourced classes: External managers assign you Zumba, Yoga, or Dance sessions — track each class and get paid per session.\n\nPersonal training: Manage your own clients with monthly session packages and automatic session tracking.",
  },
  {
    key: "3",
    icon: "lock",
    title: "Your Data, Your Device",
    body: "All data is stored locally on this device only.\n\nUninstalling the app or clearing app data will permanently erase everything. Use Settings → Export to keep regular backups.",
  },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function OnboardingScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slides = useMemo(() => createSlides(), []);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"slides" | "name">("slides");
  const [trainerName, setTrainerName] = useState("");
  const [nameInputResetKey, setNameInputResetKey] = useState(0);
  const listRef = useRef<FlatList>(null);
  const trainerInitials = useMemo(() => getInitials(trainerName), [trainerName]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  async function finish(name: string) {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarding_done', 'true')",
    );
    if (name.trim()) {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('trainer_name', ?)",
        [name.trim()],
      );
    }
    const appVersion = Constants.nativeAppVersion ?? Constants.expoConfig?.version;
    if (appVersion) {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_seen_whats_new_version', ?)",
        [appVersion],
      );
    }
    navigation.replace("MainTabs", undefined as never);
  }

  function next() {
    if (activeIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      setPhase("name");
    }
  }

  function handleTrainerNameChange(nextName: string) {
    if (nextName.length === 0 && trainerName.length > 0) {
      setNameInputResetKey((key) => key + 1);
    }
    setTrainerName(nextName);
  }

  const isLast = activeIndex === slides.length - 1;

  if (phase === "name") {
    return (
      <LinearGradient
        colors={[colors.background, colors.surface]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.namePhase}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.nameContent}>
            <View style={styles.iconCircle}>
              {trainerInitials ? (
                <Text style={[styles.initialsText, { color: accentPalette.textAccent }]}>
                  {trainerInitials}
                </Text>
              ) : (
                <AppIcon name="userCircle" size={40} color={accentPalette.main} />
              )}
            </View>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.body}>
              We'll use it to personalise your dashboard greeting.
            </Text>
            <TextInput
              key={`name-input-${nameInputResetKey}`}
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={trainerName}
              onChangeText={handleTrainerNameChange}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => finish(trainerName)}
            />
          </View>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
            <GradientButton
              label="Let's Go!"
              onPress={() => finish(trainerName)}
              style={styles.button}
            />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width, paddingTop: insets.top + 80 }]}>
            <View style={styles.heroBadge}>
              {index === 0 ? (
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
              ) : (
                <AppIcon name={item.icon} size={52} color={accentPalette.textAccent} />
              )}
            </View>

            <View style={styles.titleSlot}>
              {index === 0 ? (
                <View style={styles.welcomeRow}>
                  <Text style={styles.welcomeText}>Welcome to</Text>
                  <Image
                    source={require("../../../assets/logo-text.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Text style={styles.title}>{item.title}</Text>
              )}
            </View>

            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: accentPalette.main }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <GradientButton
          label={isLast ? "Get Started" : "Next"}
          onPress={next}
          style={styles.button}
        />
        <TouchableOpacity onPress={() => navigation.navigate("PrivacyPolicy")} style={styles.privacyLink}>
          <Text style={[styles.privacyText, { color: accentPalette.textAccent }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: {
    flex: 1,
    padding: Spacing.section,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: Spacing.xxl,
  },
  logoImage: {
    width: 100,
    height: 30,
  },
  namePhase: { flex: 1 },
  nameContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.section,
    gap: Spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  initialsText: {
    ...Typography.h1,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  title: {
    ...Typography.h1,
    fontSize: 26, // between h1(24) and heroNum(52) — onboarding hero title
    color: colors.textPrimary,
    textAlign: "center",
  },
  body: {
    ...Typography.bodyLg,
    fontSize: 15, // between body(14) and bodyLg(16) — onboarding subtitle
    color: colors.textSecondary,
    textAlign: "center",
  },
  nameInput: {
    width: "100%",
    backgroundColor: colors.surfaceRaised,
    borderRadius: Radius.lg,
    paddingHorizontal: 18, // between lg(16) and xl(20) — tuned for input feel
    paddingVertical: Spacing.lg,
    color: colors.textPrimary,
    ...Typography.bodyLg,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.section,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dots: { flexDirection: "row", gap: Spacing.sm },
  dot: { height: Spacing.sm, borderRadius: Radius.full },
  dotActive: { width: 24 },
  dotInactive: { width: Spacing.sm, backgroundColor: colors.border },
  button: { width: 260 },
  privacyLink: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  privacyText: { ...Typography.labelMd },
  skipBtn: { paddingVertical: Spacing.sm },
  skipText: { ...Typography.body, color: colors.textMuted },
  heroBadge: {
    width: 136,
    height: 136,
    borderRadius: Radius.full,
    backgroundColor: ThemePalettes.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLogo: {
    width: 112,
    height: 112,
  },
  titleSlot: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  welcomeText: {
    ...Typography.h1,
    color: colors.textSecondary,
    textAlign: "center",
  },
  brandName: {
    ...Typography.h1,
    fontSize: 36, // between h1(24) and heroNum(52) — brand display name
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 2,
  },
});
