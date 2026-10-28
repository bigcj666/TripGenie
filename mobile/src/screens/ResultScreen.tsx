import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MapPlaceholder } from '../components/MapPlaceholder';
import { TimelineItemCard } from '../components/TimelineItemCard';
import type { GenerateResponse, TravelStyle, Trip } from '../types/trip';

const STYLE_LABEL: Record<TravelStyle, string> = {
  compact: '紧凑',
  relaxed: '松弛',
  economy: '省钱',
};

export interface ResultScreenProps {
  loading: boolean;
  error: string | null;
  data: GenerateResponse | null;
  onBack: () => void;
  onRetry: () => void;
}

export function ResultScreen({
  loading,
  error,
  data,
  onBack,
  onRetry,
}: ResultScreenProps): React.ReactElement {
  const plans = data?.plans ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTrip: Trip | undefined = plans[activeIndex] ?? plans[0];

  const isMock = useMemo(() => data?.engine === 'mock', [data]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>行程结果</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerText}>正在生成行程…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      ) : !activeTrip ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>暂无行程数据</Text>
        </View>
      ) : (
        <>
          {isMock ? (
            <View style={styles.mockBanner}>
              <Text style={styles.mockBannerText}>演示引擎（mock）· 结果为本地示例数据</Text>
            </View>
          ) : null}

          {data?.warnings && data.warnings.length > 0 ? (
            <View style={styles.warnBox}>
              {data.warnings.slice(0, 3).map((w) => (
                <Text key={w} style={styles.warnText}>
                  {w}
                </Text>
              ))}
            </View>
          ) : null}

          {plans.length > 1 ? (
            <View style={styles.tabRow}>
              {plans.map((p, i) => {
                const active = i === activeIndex;
                return (
                  <Pressable
                    key={p.trip_id}
                    onPress={() => setActiveIndex(i)}
                    style={[styles.tab, active && styles.tabActive]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {STYLE_LABEL[p.style] ?? p.style}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.singleTitleWrap}>
              <Text style={styles.singleTitle}>
                {STYLE_LABEL[activeTrip.style] ?? activeTrip.style}方案 · {activeTrip.city}
              </Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {activeTrip.city} · {activeTrip.days} 天 · {activeTrip.people} 人
              </Text>
              <Text style={styles.summaryText}>{activeTrip.summary}</Text>
              <View style={styles.costRow}>
                <CostTag label="交通" value={activeTrip.cost_breakdown.transport} />
                <CostTag label="餐饮" value={activeTrip.cost_breakdown.food} />
                <CostTag label="门票" value={activeTrip.cost_breakdown.tickets} />
                <CostTag label="住宿" value={activeTrip.cost_breakdown.hotel} />
                <CostTag label="其他" value={activeTrip.cost_breakdown.other} />
              </View>
              <Text style={styles.budgetLine}>预算 ¥{activeTrip.budget_total}</Text>
            </View>

            <MapPlaceholder />

            {activeTrip.itinerary.map((day) => (
              <View key={day.day} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>
                  Day {day.day} · {day.theme}
                </Text>
                {day.items.map((item, idx) => (
                  <TimelineItemCard
                    key={`${item.time_start}-${item.title}-${idx}`}
                    item={item}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function CostTag({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <View style={styles.costTag}>
      <Text style={styles.costTagLabel}>{label}</Text>
      <Text style={styles.costTagValue}>¥{value}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  centerText: { fontSize: 15, color: '#475569', textAlign: 'center' },
  errorIcon: { fontSize: 36 },
  retry: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F766E',
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  mockBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mockBannerText: { fontSize: 12, color: '#92400E', textAlign: 'center' },
  warnBox: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warnText: { fontSize: 11, color: '#B91C1C', lineHeight: 16 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#0F766E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  singleTitleWrap: { paddingHorizontal: 16, paddingTop: 12 },
  singleTitle: { fontSize: 16, fontWeight: '700', color: '#0F766E' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  summaryText: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },
  costRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  costTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  costTagLabel: { fontSize: 11, color: '#64748B' },
  costTagValue: { fontSize: 13, fontWeight: '700', color: '#334155' },
  budgetLine: { marginTop: 10, fontSize: 12, color: '#0F766E', fontWeight: '600' },
  dayBlock: { marginTop: 18 },
  dayTitle: { fontSize: 15, fontWeight: '800', color: '#0F766E', marginBottom: 10 },
});
