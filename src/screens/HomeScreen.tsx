import { StyleSheet, Text, View } from 'react-native';

/**
 * Placeholder home — verifies IMMICHROOM boots.
 * Library UI + Immich wiring come next; connection lives in services/immich.
 */
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>IMMICHROOM</Text>
      <Text style={styles.subtitle}>Fast thin client for your Immich library</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 12,
    color: '#a3a3a3',
    fontSize: 15,
    textAlign: 'center',
  },
});
