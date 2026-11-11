import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DEMO_CITIES } from '../format';
import type { GenerateRequest, TravelStyle } from '../types/trip';

const PREFERENCE_TAGS = ['美食', '自然', '人文', '亲子', '购物', '网红打卡'] as const;

type StyleOption = TravelStyle | 'all';

const STYLE_OPTIONS: { value: StyleOption; label: string; hint: string }[] = [
  { value: 'all', label: '三方案', hint: '紧凑 / 松弛 / 省钱' },
  { value: 'compact', label: '紧凑', hint: '节奏快、打卡多' },
  { value: 'relaxed', label: '松弛', hint: '慢节奏、停留久' },
  { value: 'economy', label: '省钱', hint: '控预算、多免费' },
];

export interface HomeScreenProps {
  onSubmit: (req: GenerateRequest) => void;
  loading: boolean;
  service: string;
}

export function HomeScreen({ onSubmit, loading, service }: HomeScreenProps): React.ReactElement {
  const [city, setCity] = useState('杭州');
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState('1500');
  const [people, setPeople] = useState(2);
  const [prefs, setPrefs] = useState<string[]>(['美食', '人文']);
  const [style, setStyle] = useState<StyleOption>('all');

  const togglePref = (tag: string): void => {
    setPrefs((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = (): void => {
    const budgetNum = Number(budget);
    onSubmit({
      city: city.trim(),
      days,
      budget_total: Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : 1500,
      people,
      preferences: prefs,
      style,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>途灵 TripGenie</Text>
      <Text style={styles.tagline}>AI 旅游攻略 · 输入需求生成行程</Text>

      <View style={styles.card}>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.label}>目的地城市</Text>
        <View style={styles.tagWrap}>
          {DEMO_CITIES.map((name) => {
            const active = city === name;
            return (
              <Pressable key={name} onPress={() => setCity(name)} style={[styles.tag, active && styles.tagActive]}>
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="例如：杭州"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>天数</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setDays((d) => Math.max(1, d - 1))}
            accessibilityLabel="减少天数"
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{days} 天</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setDays((d) => Math.min(5, d + 1))}
            accessibilityLabel="增加天数"
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>总预算（元）</Text>
        <TextInput
          style={styles.input}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          placeholder="1500"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>人数</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setPeople((p) => Math.max(1, p - 1))}
            accessibilityLabel="减少人数"
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{people} 人</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setPeople((p) => Math.min(20, p + 1))}
            accessibilityLabel="增加人数"
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>偏好标签</Text>
        <View style={styles.tagWrap}>
          {PREFERENCE_TAGS.map((tag) => {
            const active = prefs.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => togglePref(tag)}
                style={[styles.tag, active && styles.tagActive]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>风格方案</Text>
        <View style={styles.styleWrap}>
          {STYLE_OPTIONS.map((opt) => {
            const active = style === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setStyle(opt.value)}
                style={[styles.styleCard, active && styles.styleCardActive]}
              >
                <Text style={[styles.styleLabel, active && styles.styleLabelActive]}>{opt.label}</Text>
                <Text style={[styles.styleHint, active && styles.styleHintActive]}>{opt.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>{loading ? '生成中' : '生成行程'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  brand: { fontSize: 28, fontWeight: '800', color: '#0F766E' },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  service: { fontSize: 12, color: '#0F766E', marginBottom: 4, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: '#0F766E', fontWeight: '700', lineHeight: 24 },
  stepValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', minWidth: 56, textAlign: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  tagActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  tagText: { fontSize: 13, color: '#475569' },
  tagTextActive: { color: '#FFFFFF', fontWeight: '600' },
  styleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleCard: {
    flexGrow: 1,
    minWidth: '45%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  styleCardActive: { borderColor: '#0F766E', backgroundColor: '#E6F4F1' },
  styleLabel: { fontSize: 15, fontWeight: '700', color: '#334155' },
  styleLabelActive: { color: '#0F766E' },
  styleHint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  styleHintActive: { color: '#5B8B83' },
  submit: {
    marginTop: 24,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
