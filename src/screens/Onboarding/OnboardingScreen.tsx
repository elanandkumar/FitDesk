import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { getDatabase } from '../../database/db';
import { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    title: 'Welcome to FitDesk',
    body: 'Your personal fitness class companion. Manage your classes, clients, and payments — all in one place, right on your device.',
  },
  {
    key: '2',
    title: 'How It Works',
    body: 'Manager-sourced classes: External managers assign you Zumba, Yoga, or Dance sessions — track each class and get paid per session.\n\nPersonal training: Manage your own clients with monthly session packages and automatic session tracking.',
  },
  {
    key: '3',
    title: 'Your Data, Your Device',
    body: 'All data is stored locally on this device only.\n\nUninstalling the app or clearing app data will permanently erase everything. There is no cloud backup unless you export manually from Settings.\n\nThe developer is not responsible for data loss. Use Settings → Export to keep regular backups.',
  },
];

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              {item.title}
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.body, { color: theme.colors.onBackground }]}
            >
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
            />
          ))}
        </View>

        <Button mode="contained" onPress={next} style={styles.button}>
          {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Button>

        {activeIndex < SLIDES.length - 1 && (
          <Button mode="text" onPress={finish} compact>
            Skip
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, padding: 32, justifyContent: 'center', gap: 24 },
  title: { textAlign: 'center', fontWeight: '700' },
  body: { textAlign: 'center', lineHeight: 26 },
  footer: { padding: 24, gap: 12, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  button: { width: 200 },
});
