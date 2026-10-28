import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import type { ItineraryItem, ItemType, TransportMode } from '../types/trip';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TYPE_META: Record<ItemType, { label: string; emoji: string; color: string }> = {
  attraction: { label: '景点', emoji: '📍', color: '#0F766E' },
  meal: { label: '餐饮', emoji: '🍜', color: '#D97706' },
  transport: { label: '交通', emoji: '🚌', color: '#2563EB' },
  hotel: { label: '住宿', emoji: '🏨', color: '#7C3AED' },
  free: { label: '自由', emoji: '☕', color: '#64748B' },
};

const MODE_LABEL: Record<TransportMode, string> = {
  walk: '步行',
  transit: '公交/地铁',
  drive: '驾车',
  taxi: '打车',
};

export function TimelineItemCard({ item }: { item: ItineraryItem }): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[item.type] ?? TYPE_META.free;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.typeChip, { backgroundColor: meta.color + '22' }]}>
          <Text style={styles.typeEmoji}>{meta.emoji}</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.time}>
            {item.time_start} – {item.time_end}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={styles.metaText}>{meta.label}</Text>
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>¥{item.cost_estimate}</Text>
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>{item.duration_min} 分钟</Text>
          </View>
          <Text style={styles.desc} numberOfLines={expanded ? undefined : 2}>
            {item.description}
          </Text>

          {item.transport_to_next ? (
            <View style={styles.transport}>
              <Text style={styles.transportText}>
                ➜ {MODE_LABEL[item.transport_to_next.mode]} · {item.transport_to_next.duration_min} 分钟
                {item.transport_to_next.note ? ` · ${item.transport_to_next.note}` : ''}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpanded((v) => !v);
            }}
            style={styles.toggle}
            accessibilityRole="button"
          >
            <Text style={styles.toggleText}>{expanded ? '收起详情 ▲' : '展开详情 ▼'}</Text>
          </Pressable>

          {expanded ? (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>小贴士</Text>
              <Text style={styles.detailText}>{item.tips || '—'}</Text>

              <Text style={styles.detailLabel}>来源</Text>
              {item.sources.length === 0 ? (
                <Text style={styles.detailText}>—</Text>
              ) : (
                item.sources.map((s, i) => (
                  <Text key={`${s.url}-${i}`} style={styles.source}>
                    · {s.title}
                  </Text>
                ))
              )}

              <Text style={styles.detailLabel}>坐标</Text>
              <Text style={styles.detailText}>
                {item.poi.name} · {item.poi.lat.toFixed(4)}, {item.poi.lng.toFixed(4)} · {item.poi.adcode}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: { flexDirection: 'row', gap: 10 },
  typeChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: { fontSize: 18 },
  main: { flex: 1 },
  time: { fontSize: 12, color: '#0F766E', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { fontSize: 12, color: '#64748B' },
  desc: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 18 },
  transport: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  transportText: { fontSize: 12, color: '#334155' },
  toggle: { marginTop: 8, alignSelf: 'flex-start' },
  toggleText: { fontSize: 12, color: '#0F766E', fontWeight: '600' },
  detail: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 2,
  },
  detailLabel: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  detailText: { fontSize: 12, color: '#475569', lineHeight: 17 },
  source: { fontSize: 12, color: '#2563EB', lineHeight: 17 },
});
