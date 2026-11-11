import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { styleName } from '../format';
import type { SavedTrip } from '../services/storage';

export interface TripsScreenProps {
  trips: SavedTrip[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TripsScreen({ trips, onOpen, onDelete }: TripsScreenProps): React.ReactElement {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>行程</Text>
      <Text style={styles.lead}>生成或从社区导入的攻略留在这台设备上，点进去可以按天查看。</Text>
      {trips.length === 0 ? <Text style={styles.empty}>还没有行程。先在「规划」里生成一套。</Text> : null}
      {trips.map((item) => (
        <View key={item.id} style={styles.row}>
          <Pressable style={styles.main} onPress={() => onOpen(item.id)} accessibilityRole="button">
            <Text style={styles.name}>
              {item.trip.city} · {styleName(item.trip.style)}
            </Text>
            <Text style={styles.meta}>
              {item.trip.days} 天 · {item.trip.people} 人
            </Text>
          </Pressable>
          <Pressable onPress={() => onDelete(item.id)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.delete}>删除</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F766E' },
  lead: { marginTop: 6, marginBottom: 16, fontSize: 13, color: '#64748B', lineHeight: 18 },
  empty: { fontSize: 14, color: '#64748B', marginTop: 24 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  meta: { marginTop: 4, fontSize: 12, color: '#64748B' },
  delete: { color: '#B91C1C', fontSize: 13, fontWeight: '600', paddingLeft: 12 },
});
