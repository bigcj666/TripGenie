import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MobileTab = 'plan' | 'trips' | 'community';

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'plan', label: '规划' },
  { id: 'trips', label: '行程' },
  { id: 'community', label: '社区' },
];

export function TabBar({ tab, onChange }: { tab: MobileTab; onChange: (tab: MobileTab) => void }): React.ReactElement {
  return (
    <View style={styles.bar}>
      {TABS.map((item) => {
        const on = item.id === tab;
        return (
          <Pressable key={item.id} style={styles.item} onPress={() => onChange(item.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Text style={[styles.label, on && styles.on]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  on: { color: '#0F766E' },
});
