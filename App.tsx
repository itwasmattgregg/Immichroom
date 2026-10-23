import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import type { ImmichAsset } from './src/services/immich';
import { DevelopScreen } from './src/screens/DevelopScreen';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  const [asset, setAsset] = useState<ImmichAsset | null>(null);

  return (
    <>
      {asset ? (
        <DevelopScreen asset={asset} onBack={() => setAsset(null)} />
      ) : (
        <HomeScreen onOpenDevelop={setAsset} />
      )}
      <StatusBar style="light" />
    </>
  );
}
