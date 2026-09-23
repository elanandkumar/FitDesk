import { File, Paths } from 'expo-file-system';
import { Linking } from 'react-native';
import { importJsonData } from '../utils/exportUtils';

const STORE_DEMO_URL = 'soloclasshq-dev://seed-store-demo';
const FIXTURE_FILENAME = 'store-demo-v1.5.0.json';
const RESULT_FILENAME = 'store-demo-seeded.ok';

/**
 * Imports the repository-owned store fixture only for a debuggable build
 * launched through the matching debug-only Android intent filter.
 */
export async function importStoreDemoFixtureIfRequested(): Promise<boolean> {
  if (!__DEV__) return false;

  const url = await Linking.getInitialURL();
  if (!url || url.split(/[?#]/, 1)[0] !== STORE_DEMO_URL) return false;

  const fixture = new File(Paths.cache, FIXTURE_FILENAME);
  if (!fixture.exists) {
    throw new Error(`Store demo fixture not found in app cache: ${FIXTURE_FILENAME}`);
  }

  await importJsonData(await fixture.text());

  const result = new File(Paths.cache, RESULT_FILENAME);
  result.write(new Date().toISOString());
  return true;
}
