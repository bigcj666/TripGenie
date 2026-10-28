import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function MapPlaceholder(): React.ReactElement {
  return (
    <View style={styles.wrap} accessibilityLabel="地图占位">
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>地图打点（占位）</Text>
      <Text style={styles.hint}>M2 将接入 WebView + 高德地图</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#99C9BF',
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  icon: { fontSize: 32, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#0F766E' },
  hint: { fontSize: 12, color: '#5B8B83', marginTop: 4 },
});
