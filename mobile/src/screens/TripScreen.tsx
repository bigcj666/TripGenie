import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { styleName, yuan } from '../format';
import type { Trip } from '../types/trip';

export interface TripScreenProps {
  trip: Trip;
  engine?: string;
  onBack: () => void;
  onOpenDay: (dayIndex: number) => void;
}

export function TripScreen({ trip, engine, onBack, onOpenDay }: TripScreenProps): React.ReactElement {
  const total =
    trip.cost_breakdown.transport +
    trip.cost_breakdown.food +
    trip.cost_breakdown.tickets +
    trip.cost_breakdown.hotel +
    trip.cost_breakdown.other;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {trip.city} · {styleName(trip.style)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.summary}>{trip.summary}</Text>
        {trip.route_rationale ? <Text style={styles.rationale}>{trip.route_rationale}</Text> : null}
        <Text style={styles.cost}>
          {trip.days} 天 · {trip.people} 人 · 估算 {yuan(total)} · 预算 {yuan(trip.budget_total)}
        </Text>
        <Text style={styles.costDetail}>
          交通 {yuan(trip.cost_breakdown.transport)} · 餐饮 {yuan(trip.cost_breakdown.food)} · 门票{' '}
          {yuan(trip.cost_breakdown.tickets)} · 住宿 {yuan(trip.cost_breakdown.hotel)}
        </Text>
        {engine === 'mock' ? <Text style={styles.note}>这份行程按城市目录排成，和网页连同一个后端时内容一致。</Text> : null}
        {trip.itinerary.map((day, index) => {
          const first = day.items[0];
          return (
            <Pressable key={day.day} style={styles.day} onPress={() => onOpenDay(index)} accessibilityRole="button">
              <View style={styles.dayText}>
                <Text style={styles.dayTitle}>第{day.day}天 · {day.zone || day.theme}</Text>
                <Text style={styles.dayMeta}>
                  {day.items.length} 项{first ? ` · ${first.time_start} ${first.title}` : ''}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  back: { fontSize: 16, color: '#0F766E', fontWeight: '600', width: 64 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0F172A' },
  headerSpacer: { width: 64 },
  content: { padding: 16, paddingBottom: 40 },
  summary: { fontSize: 15, color: '#0F172A', lineHeight: 22 },
  rationale: { marginTop: 8, fontSize: 13, color: '#475569', lineHeight: 19 },
  cost: { marginTop: 12, fontSize: 13, fontWeight: '700', color: '#0F766E' },
  costDetail: { marginTop: 6, fontSize: 12, color: '#64748B', lineHeight: 18 },
  note: { marginTop: 8, fontSize: 12, color: '#92400E' },
  day: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayText: { flex: 1 },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  dayMeta: { marginTop: 4, fontSize: 13, color: '#64748B' },
  chevron: { fontSize: 22, color: '#94A3B8', marginLeft: 8 },
});
