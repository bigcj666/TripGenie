import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { generateTrips } from './src/services/api';
import type { GenerateRequest, GenerateResponse } from './src/types/trip';

type Route = 'home' | 'result';

export default function App(): React.ReactElement {
  const [route, setRoute] = useState<Route>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [lastReq, setLastReq] = useState<GenerateRequest | null>(null);

  const runGenerate = useCallback(async (req: GenerateRequest) => {
    setLastReq(req);
    setLoading(true);
    setError(null);
    setData(null);
    setRoute('result');
    try {
      const res = await generateTrips(req);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastReq) void runGenerate(lastReq);
  }, [lastReq, runGenerate]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {route === 'home' ? (
        <HomeScreen onSubmit={(req) => void runGenerate(req)} loading={loading} />
      ) : (
        <ResultScreen
          loading={loading}
          error={error}
          data={data}
          onBack={() => setRoute('home')}
          onRetry={handleRetry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
});
