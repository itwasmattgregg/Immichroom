import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { getEnv } from '../config/env';
import type { ImmichAsset } from '../services/immich';
import { getImmichClient } from '../services/immich/singleton';

type Props = {
  onOpenDevelop: (asset: ImmichAsset) => void;
};

export function HomeScreen({ onOpenDevelop }: Props) {
  const env = getEnv();
  const [status, setStatus] = useState('Checking Immich…');
  const [assets, setAssets] = useState<ImmichAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!env.immichBaseUrl) {
        setStatus('Set EXPO_PUBLIC_IMMICH_BASE_URL in .env');
        setAssets([]);
        return;
      }
      if (!env.immichApiKey) {
        setStatus('Set EXPO_PUBLIC_IMMICH_API_KEY in .env');
        setAssets([]);
        return;
      }
      const client = getImmichClient();
      const { version, user } = await client.validateConnection();
      const items = await client.listRecentAssets({ size: 30 });
      setAssets(items.filter((a) => a.type === 'IMAGE'));
      const ver =
        version.version ??
        [version.major, version.minor, version.patch].filter((v) => v != null).join('.');
      setStatus(`Connected as ${user?.email ?? 'user'} · Immich ${ver || '?'}`);
    } catch (err) {
      setAssets([]);
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [env.immichApiKey, env.immichBaseUrl]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const client = env.immichBaseUrl ? getImmichClient() : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IMMICHROOM</Text>
      <Text style={styles.subtitle}>Auto · Tri-X Warm · Immich library</Text>
      <Text style={styles.status}>{status}</Text>

      <Pressable onPress={() => void refresh()} style={styles.refresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#f5f5f5" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <Text style={styles.empty}>No images yet. Check Immich connection.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => onOpenDevelop(item)}>
              {client ? (
                <Image
                  source={{
                    uri: client.thumbnailUrl(item.id, 'thumbnail'),
                    headers: client.mediaHeaders(),
                  }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    color: '#a3a3a3',
    fontSize: 14,
  },
  status: {
    marginTop: 12,
    color: '#737373',
    fontSize: 12,
  },
  refresh: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#262626',
  },
  refreshText: { color: '#f5f5f5', fontWeight: '600', fontSize: 13 },
  grid: { paddingBottom: 32, gap: 4 },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  thumb: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: '#171717' },
  empty: { color: '#737373', marginTop: 24, textAlign: 'center' },
});
