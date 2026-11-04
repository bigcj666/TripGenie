import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabBar, type MobileTab } from './src/components/TabBar';
import { engineLabel } from './src/format';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { DayScreen } from './src/screens/DayScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { TripScreen } from './src/screens/TripScreen';
import { TripsScreen } from './src/screens/TripsScreen';
import { fetchHealth, generateTrips, type HealthInfo } from './src/services/api';
import { loadTrips, rememberTrips, saveTrips, type SavedTrip } from './src/services/storage';
import type { GenerateRequest, GenerateResponse, Trip } from './src/types/trip';

type Overlay =
  | { name: 'result' }
  | { name: 'trip'; id: string }
  | { name: 'day'; id: string; dayIndex: number };

export default function App(): React.ReactElement {
  const [tab, setTab] = useState<MobileTab>('plan');
  const [stack, setStack] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [lastReq, setLastReq] = useState<GenerateRequest | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [preview, setPreview] = useState<Trip | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthInfo | { state: 'unknown' }>({ state: 'unknown' });

  useEffect(() => {
    void loadTrips().then(setTrips);
  }, []);

  useEffect(() => {
    let stop = false;
    const ping = (): void => {
      void fetchHealth().then((info) => {
        if (!stop) setHealth(info);
      });
    };
    ping();
    const timer = setInterval(ping, 8000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);

  const persist = useCallback((next: SavedTrip[]) => {
    setTrips(next);
    void saveTrips(next);
  }, []);

  const findTrip = useCallback(
    (id: string): { trip: Trip; engine?: string } | undefined => {
      const saved = trips.find((item) => item.id === id);
      if (saved) return { trip: saved.trip, engine: saved.engine };
      if (preview?.trip_id === id) return { trip: preview };
      return undefined;
    },
    [preview, trips],
  );

  const runGenerate = useCallback(async (req: GenerateRequest) => {
    setLastReq(req);
    setLoading(true);
    setError(null);
    setData(null);
    setStack([{ name: 'result' }]);
    try {
      const res = await generateTrips(req);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const openTrip = (trip: Trip, engine: string): void => {
    const next = rememberTrips(trips, [trip], engine);
    persist(next);
    setStack((current) => [...current, { name: 'trip', id: trip.trip_id }]);
  };

  const top = stack[stack.length - 1];
  const opened = top && top.name !== 'result' ? findTrip(top.id) : undefined;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {top?.name === 'result' ? (
        <ResultScreen
          loading={loading}
          error={error}
          data={data}
          onBack={() => setStack([])}
          onRetry={() => {
            if (lastReq) void runGenerate(lastReq);
          }}
          onOpen={(trip) => openTrip(trip, data?.engine ?? 'mock')}
        />
      ) : null}
      {top?.name === 'trip' && opened ? (
        <TripScreen
          trip={opened.trip}
          engine={opened.engine}
          onBack={() => setStack((current) => current.slice(0, -1))}
          onOpenDay={(dayIndex) => setStack((current) => [...current, { name: 'day', id: opened.trip.trip_id, dayIndex }])}
        />
      ) : null}
      {top?.name === 'day' && opened ? (
        <DayScreen
          day={opened.trip.itinerary[top.dayIndex] ?? opened.trip.itinerary[0]}
          city={opened.trip.city}
          onBack={() => setStack((current) => current.slice(0, -1))}
        />
      ) : null}
      {top && top.name !== 'result' && !opened ? (
        <View style={styles.missing}>
          <Text style={styles.missingText}>找不到这套行程</Text>
          <Pressable onPress={() => setStack([])} accessibilityRole="button">
            <Text style={styles.missingAction}>返回</Text>
          </Pressable>
        </View>
      ) : null}
      {!top && tab === 'plan' ? (
        <HomeScreen
          onSubmit={(req) => void runGenerate(req)}
          loading={loading}
          service={engineLabel(health.state, health.state === 'ok' ? health.engine : undefined)}
        />
      ) : null}
      {!top && tab === 'trips' ? (
        <TripsScreen
          trips={trips}
          onOpen={(id) => setStack([{ name: 'trip', id }])}
          onDelete={(id) => persist(trips.filter((item) => item.id !== id))}
        />
      ) : null}
      {!top && tab === 'community' ? (
        <CommunityScreen
          focusId={communityId}
          onFocus={setCommunityId}
          onOpenDay={(trip, dayIndex) => {
            setPreview(trip);
            setStack([{ name: 'day', id: trip.trip_id, dayIndex }]);
          }}
          onImport={(trip) => {
            const copy: Trip = { ...trip, trip_id: `import-${Date.now()}` };
            const next = rememberTrips(trips, [copy], 'community');
            persist(next);
            setTab('trips');
            setStack([{ name: 'trip', id: copy.trip_id }]);
          }}
        />
      ) : null}
      {!top ? <TabBar tab={tab} onChange={setTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  missingText: { fontSize: 15, color: '#475569' },
  missingAction: { color: '#0F766E', fontWeight: '700', fontSize: 16 },
});
