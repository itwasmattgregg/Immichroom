import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import {
  bakePreviewDataUri,
  clearEditRecipe,
  computeAutoToneRecipe,
  createEmptyEditRecipe,
  createTriXWarmRecipe,
  loadEditRecipe,
  loadPixelsFromUrl,
  saveEditRecipe,
  type EditRecipe,
  type PixelBuffer,
} from '../develop';
import type { ImmichAsset } from '../services/immich';
import { getImmichClient } from '../services/immich/singleton';

type Props = {
  asset: ImmichAsset;
  onBack: () => void;
};

export function DevelopScreen({ asset, onBack }: Props) {
  const client = useMemo(() => getImmichClient(), []);
  const previewUrl = client.thumbnailUrl(asset.id, 'preview');
  const headers = useMemo(() => client.mediaHeaders(), [client]);

  const [pixels, setPixels] = useState<PixelBuffer | null>(null);
  const [recipe, setRecipe] = useState<EditRecipe>(createEmptyEditRecipe());
  const [bakedUri, setBakedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Loading preview…');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus('Loading preview + recipe…');
        const [px, saved] = await Promise.all([
          loadPixelsFromUrl(previewUrl, headers),
          loadEditRecipe(client, asset.id),
        ]);
        if (cancelled) return;
        setPixels(px);
        const next = saved ?? createEmptyEditRecipe();
        setRecipe(next);
        setBakedUri(bakePreviewDataUri(px, next));
        setStatus(saved ? 'Loaded saved EditRecipe' : 'Ready');
        setDirty(false);
      } catch (err) {
        if (!cancelled) {
          setStatus(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asset.id, client, headers, previewUrl]);

  const applyRecipe = useCallback(
    (next: EditRecipe, markDirty = true) => {
      setRecipe(next);
      if (pixels) {
        setBakedUri(bakePreviewDataUri(pixels, next));
      }
      if (markDirty) setDirty(true);
    },
    [pixels],
  );

  const onAuto = useCallback(() => {
    if (!pixels) return;
    setBusy(true);
    try {
      const next = computeAutoToneRecipe(pixels, 1);
      applyRecipe(next);
      setStatus('Auto Tone v1 applied (unsaved)');
    } finally {
      setBusy(false);
    }
  }, [applyRecipe, pixels]);

  const onTriX = useCallback(() => {
    applyRecipe(createTriXWarmRecipe());
    setStatus('Tri-X Warm applied (unsaved)');
  }, [applyRecipe]);

  const onReset = useCallback(() => {
    applyRecipe(createEmptyEditRecipe());
    setStatus('Reset to empty recipe (unsaved)');
  }, [applyRecipe]);

  const onSave = useCallback(async () => {
    setBusy(true);
    try {
      await saveEditRecipe(client, asset.id, recipe);
      setDirty(false);
      setStatus('Saved EditRecipe to Immich metadata');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [asset.id, client, recipe]);

  const onClearSaved = useCallback(async () => {
    setBusy(true);
    try {
      await clearEditRecipe(client, asset.id);
      applyRecipe(createEmptyEditRecipe(), false);
      setDirty(false);
      setStatus('Cleared Immich EditRecipe metadata');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [applyRecipe, asset.id, client]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Develop</Text>
        <Text style={styles.badge}>{dirty ? 'Unsaved' : 'Saved'}</Text>
      </View>

      <View style={styles.previewWrap}>
        {bakedUri ? (
          <Image source={{ uri: bakedUri }} style={styles.preview} contentFit="contain" />
        ) : (
          <Image
            source={{ uri: previewUrl, headers }}
            style={styles.preview}
            contentFit="contain"
          />
        )}
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>

      <Text style={styles.status} numberOfLines={3}>
        {status}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {asset.originalFileName ?? asset.id}
        {recipe.presetId ? ` · ${recipe.presetId}` : ''}
        {recipe.auto ? ' · auto' : ''}
      </Text>

      <View style={styles.row}>
        <ToolButton label="Auto" onPress={onAuto} disabled={!pixels || busy} />
        <ToolButton label="Tri-X Warm" onPress={onTriX} disabled={busy} />
        <ToolButton label="Reset" onPress={onReset} disabled={busy} />
      </View>
      <View style={styles.row}>
        <ToolButton label="Save" onPress={onSave} disabled={busy} primary />
        <ToolButton label="Clear saved" onPress={onClearSaved} disabled={busy} />
      </View>
    </View>
  );
}

function ToolButton({
  label,
  onPress,
  disabled,
  primary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        primary && styles.btnPrimary,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  back: { color: '#93c5fd', fontSize: 16 },
  title: { color: '#f5f5f5', fontSize: 18, fontWeight: '600' },
  badge: { color: '#a3a3a3', fontSize: 13 },
  previewWrap: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#171717',
  },
  preview: { width: '100%', height: '100%' },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  status: { color: '#a3a3a3', fontSize: 13, marginTop: 10 },
  meta: { color: '#737373', fontSize: 12, marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#262626',
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#e5e5e5' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#f5f5f5', fontWeight: '600', fontSize: 14 },
  btnTextPrimary: { color: '#0c0c0c' },
});
