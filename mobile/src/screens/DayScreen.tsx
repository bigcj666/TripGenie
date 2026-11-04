import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TimelineItemCard } from '../components/TimelineItemCard';
import type { DayPlan } from '../types/trip';

export interface DayScreenProps {
  day: DayPlan;
  city: string;
  onBack: () => void;
}

export function DayScreen({ day, city, onBack }: DayScreenProps): React.ReactElement {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {city} · 第{day.day}天
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.theme}>{day.zone || day.theme}</Text>
        <Text style={styles.note}>按时间读完这一天。地图上的先后顺序在网页打开同一套攻略时查看。</Text>
        {day.items.map((item, index) => (
          <TimelineItemCard key={`${item.time_start}-${item.title}-${index}`} item={item} />
        ))}
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
  theme: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 6 },
  note: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 12 },
});
