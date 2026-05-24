export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
