import { Stack } from 'expo-router';

export default function LayoutAuth() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="aceite-pop" />
    </Stack>
  );
}
