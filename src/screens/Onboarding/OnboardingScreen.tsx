import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
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
import { Brand } from '../../theme/brandColors';
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
    gradient: ['#3D1DB5', '#1B102F'],
  },
  {
    key: '2',
    icon: 'calendar-check',
    title: 'How It Works',
    body: 'Manager-sourced classes: External managers assign you Zumba, Yoga, or Dance sessions — track each class and get paid per session.\n\nPersonal training: Manage your own clients with monthly session packages and automatic session tracking.',
    gradient: ['#2E1D50', '#1B102F'],
  },
  {
    key: '3',
    icon: 'shield-lock-outline',
    title: 'Your Data, Your Device',
    body: 'All data is stored locally on this device only.\n\nUninstalling the app or clearing app data will permanently erase everything. Use Settings → Export to keep regular backups.',
    gradient: ['#1B102F', '#241640'],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  async function finish() {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarding_done', 'true')"
    );
    navigation.replace('MainTabs', undefined as never);
  }

  function next() {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

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
              <Image source={require('../../../assets/logo-only.png')} style={styles.heroLogo} resizeMode="contain" />
            ) : (
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={item.icon as never} size={40} color={Brand.purple} />
              </View>
            )}

            {index === 0 ? (
              <View style={styles.welcomeRow}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Image source={require('../../../assets/logo-text.png')} style={styles.brandLogo} resizeMode="contain" />
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
  slide: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 24 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Brand.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: Brand.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  body: {
    color: Brand.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
  },
  footer: { paddingHorizontal: 32, paddingTop: 24, gap: 16, alignItems: 'center', backgroundColor: Brand.backgroundDark },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: Brand.purple },
  dotInactive: { width: 8, backgroundColor: Brand.borderSubtle },
  button: { width: 260 },
  skipBtn: { paddingVertical: 8 },
  skipText: { color: Brand.textMuted, fontSize: 14 },
  heroLogo: { width: 160, height: 160, marginBottom: 0 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  welcomeText: {
    color: Brand.textSecondary,
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    letterSpacing: 1,
  },
  brandLogo: { width: 100, height: 30 },
});
