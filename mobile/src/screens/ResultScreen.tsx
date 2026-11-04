import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deriveMetrics, presentWarning, STYLE_META, walkPercent, warningsFor, yuan } from '../format';
import type { GenerateResponse, TravelStyle, Trip } from '../types/trip';

export interface ResultScreenProps {
  loading: boolean;
  error: string | null;
  data: GenerateResponse | null;
  onBack: () => void;
  onRetry: () => void;
  onOpen: (trip: Trip) => void;
}

export function ResultScreen({ loading, error, data, onBack, onRetry, onOpen }: ResultScreenProps): React.ReactElement {
  const plans = data?.plans ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTrip: Trip | undefined = plans[activeIndex] ?? plans[0];
  const warnings = activeTrip ? warningsFor(data?.warnings, activeTrip.style) : (data?.warnings ?? []).map(presentWarning);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{plans.length > 1 ? '三套攻略' : '攻略'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerText}>正在生成行程…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      ) : !activeTrip ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>没有生成出攻略</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>{engineLine(data?.engine)}</Text>
          </View>
          <Text style={styles.meta}>
            {activeTrip.city} · {activeTrip.days} 天 · {activeTrip.people} 人 · 预算 {yuan(activeTrip.budget_total)}
          </Text>
          {plans.length > 1 ? (
            <View style={styles.tabRow}>
              {plans.map((plan, index) => {
                const active = index === activeIndex;
                return (
                  <Pressable
                    key={plan.trip_id}
                    onPress={() => setActiveIndex(index)}
                    style={[styles.tab, active && styles.tabActive]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{styleLabel(plan.style)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <PlanCard trip={activeTrip} warnings={warnings} onOpen={() => onOpen(activeTrip)} />
        </ScrollView>
      )}
    </View>
  );
}

function PlanCard({
  trip,
  warnings,
  onOpen,
}: {
  trip: Trip;
  warnings: string[];
  onOpen: () => void;
}): React.ReactElement {
  const metrics = deriveMetrics(trip);
  const meta = STYLE_META[trip.style];
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{meta?.name ?? trip.style}</Text>
      <Text style={styles.cardLine}>{meta?.line}</Text>
      <Text style={styles.summary}>{trip.summary}</Text>
      <View style={styles.metrics}>
        <Metric label="去几处" value={String(metrics.stop_count)} />
        <Metric label="路上" value={`${metrics.transit_min}分`} />
        <Metric label="门票" value={yuan(metrics.ticket_total)} />
        <Metric label="步行" value={walkPercent(metrics.walk_ratio)} />
      </View>
      {warnings.map((warning, index) => (
        <Text key={`${index}-${warning.slice(0, 12)}`} style={styles.warn}>
          {warning}
        </Text>
      ))}
      <Pressable style={styles.open} onPress={onOpen} accessibilityRole="button">
        <Text style={styles.openText}>查看行程</Text>
      </Pressable>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function styleLabel(style: TravelStyle): string {
  return STYLE_META[style]?.name ?? style;
}

function engineLine(engine: string | undefined): string {
  if (engine === 'deepseek') return '由 DeepSeek 写成';
  if (engine === 'glm') return '由智谱写成';
  if (engine === 'mock') return '演示引擎：没有密钥时与网页一样走内置数据；若写了连不上后端，则是手机里的备份';
  return '行程已生成';
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  centerText: { fontSize: 15, color: '#475569', textAlign: 'center' },
  retry: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0F766E' },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  mockBanner: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 12 },
  mockBannerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  meta: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center' },
  tabActive: { backgroundColor: '#0F766E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardLine: { fontSize: 13, color: '#64748B', marginTop: 4 },
  summary: { fontSize: 14, color: '#334155', marginTop: 10, lineHeight: 20 },
  metrics: { flexDirection: 'row', marginTop: 14 },
  metric: { flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#0F766E' },
  metricLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  warn: { marginTop: 8, fontSize: 12, color: '#B45309', lineHeight: 17 },
  open: { marginTop: 16, backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  openText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
