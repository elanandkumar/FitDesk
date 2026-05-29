import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { getDatabase } from '../../database/db';
import { RootStackParamList } from '../../navigation/types';
import GradientButton from '../../components/common/GradientButton';

type Nav = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: string;
  title: string;
  body: string;
  gradient: readonly [string, string];
};

const SLIDES: Slide[] = [
  {
    key: '1',
    icon: 'dumbbell',
    title: 'Welcome to FitDesk',
    body: 'Your personal fitness class companion. Manage your classes, clients, and payments — all in one place, right on your device.',
    gradient: ['#3D1DB5', Brand.backgroundDark],
  },
  {
    key: '2',
    icon: 'calendar-check',
    title: 'How It Works',
    body: 'Manager-sourced classes: External managers assign you Zumba, Yoga, or Dance sessions — track each class and get paid per session.\n\nPersonal training: Manage your own clients with monthly session packages and automatic session tracking.',
    gradient: [Brand.surfaceElevated, Brand.backgroundDark],
  },
  {
    key: '3',
    icon: 'shield-lock-outline',
    title: 'Your Data, Your Device',
    body: 'All data is stored locally on this device only.\n\nUninstalling the app or clearing app data will permanently erase everything. Use Settings → Export to keep regular backups.',
    gradient: [Brand.backgroundDark, Brand.surfaceDark],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'slides' | 'name'>('slides');
  const [trainerName, setTrainerName] = useState('');
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  async function finish(name: string) {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarding_done', 'true')"
    );
    if (name.trim()) {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('trainer_name', ?)",
        [name.trim()]
      );
    }
    navigation.replace('MainTabs', undefined as never);
  }

  function next() {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      setPhase('name');
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

  if (phase === 'name') {
    return (
      <LinearGradient
        colors={[Brand.backgroundDark, Brand.surfaceDark]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.namePhase}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.nameContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-circle-outline" size={40} color={Brand.purple} />
            </View>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.body}>
              We'll use it to personalise your dashboard greeting.
            </Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={Brand.textMuted}
              value={trainerName}
              onChangeText={setTrainerName}
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
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[styles.slide, { width }]}
          >
            {index === 0 ? (
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={item.icon as never} size={40} color={Brand.purple} />
              </View>
            )}

            {index === 0 ? (
              <View style={styles.welcomeRow}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.brandName}>FitDesk</Text>
              </View>
            ) : (
              <Text style={styles.title}>{item.title}</Text>
            )}

            <Text style={styles.body}>{item.body}</Text>
          </LinearGradient>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <GradientButton
          label={isLast ? 'Get Started' : 'Next'}
          onPress={next}
          style={styles.button}
        />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  slide: { flex: 1, padding: Spacing.section, justifyContent: 'center', alignItems: 'center', gap: Spacing.xxl },
  namePhase: { flex: 1 },
  nameContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.section, gap: Spacing.xl },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    color: Brand.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodyLg,
    fontSize: 15,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    backgroundColor: Brand.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: 18,
    paddingVertical: Spacing.lg,
    color: Brand.textPrimary,
    ...Typography.bodyLg,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.section,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Brand.backgroundDark,
  },
  dots: { flexDirection: 'row', gap: Spacing.sm },
  dot: { height: Spacing.sm, borderRadius: Radius.full },
  dotActive: { width: 24, backgroundColor: Brand.purple },
  dotInactive: { width: Spacing.sm, backgroundColor: Brand.borderSubtle },
  button: { width: 260 },
  skipBtn: { paddingVertical: Spacing.sm },
  skipText: { ...Typography.body, color: Brand.textMuted },
  heroLogo: { width: 160, height: 160, marginBottom: Spacing.sm, borderRadius: Radius.hero },
  welcomeRow: { flexDirection: 'column', alignItems: 'center', gap: 0 },
  welcomeText: {
    ...Typography.bodyLg,
    color: Brand.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  brandName: {
    ...Typography.h1,
    fontSize: 36,
    color: Brand.purple,
    textAlign: 'center',
    letterSpacing: 2,
  },
});
