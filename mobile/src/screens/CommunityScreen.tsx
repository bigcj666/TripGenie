import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listCommunity, readCommunity, type CommunityDetail, type CommunityPost } from '../services/api';
import { styleName } from '../format';
import type { Trip } from '../types/trip';

const CITIES = ['全部', '杭州', '成都', '西安'];

export interface CommunityScreenProps {
  focusId: string | null;
  onFocus: (id: string | null) => void;
  onOpenDay: (trip: Trip, dayIndex: number) => void;
  onImport: (trip: Trip) => void;
}

export function CommunityScreen({ focusId, onFocus, onOpenDay, onImport }: CommunityScreenProps): React.ReactElement {
  const [city, setCity] = useState('全部');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityDetail | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) {
      setPost(null);
      setPostError(null);
      return;
    }
    let stop = false;
    setPost(null);
    setPostError(null);
    void readCommunity(focusId).then(
      (detail) => {
        if (!stop) setPost(detail);
      },
      (err: unknown) => {
        if (!stop) setPostError(err instanceof Error ? err.message : '读取失败');
      },
    );
    return () => {
      stop = true;
    };
  }, [focusId]);

  useEffect(() => {
    let stop = false;
    setLoading(true);
    void listCommunity(city === '全部' ? undefined : city).then(
      (rows) => {
        if (stop) return;
        setPosts(rows);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (stop) return;
        setPosts([]);
        setError(err instanceof Error ? err.message : '社区暂时连不上');
        setLoading(false);
      },
    );
    return () => {
      stop = true;
    };
  }, [city]);

  if (focusId) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => onFocus(null)} accessibilityRole="button">
            <Text style={styles.back}>‹ 返回</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{post ? `${post.city} · ${post.days}天` : '分享'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.detail}>
          {!post && !postError ? <ActivityIndicator color="#0F766E" /> : null}
          {postError ? <Text style={styles.error}>{postError}</Text> : null}
          {post ? (
            <>
              <Text style={styles.author}>{post.author}</Text>
              <Text style={styles.note}>{post.note || post.summary}</Text>
              <Text style={styles.meta}>
                {post.people} 人 · {styleName(post.trip.style)}
              </Text>
              {post.trip.itinerary.map((day, index) => (
                <Pressable key={day.day} style={styles.day} onPress={() => onOpenDay(post.trip, index)}>
                  <Text style={styles.dayTitle}>第{day.day}天 · {day.zone || day.theme}</Text>
                  <Text style={styles.dayMeta}>{day.items.map((item) => item.title).join(' · ')}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.importBtn} onPress={() => onImport(post.trip)}>
                <Text style={styles.importText}>导入到我的行程</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>社区</Text>
      <Text style={styles.lead}>和网页看同一批分享。导入后可以按天查看，不必再登录。</Text>
      <View style={styles.chips}>
        {CITIES.map((name) => {
          const active = city === name;
          return (
            <Pressable key={name} onPress={() => setCity(name)} style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
      {loading ? <ActivityIndicator color="#0F766E" style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && posts.length === 0 ? <Text style={styles.empty}>还没有人分享</Text> : null}
      {posts.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => onFocus(item.id)}>
          <Text style={styles.cardTitle}>
            {item.city} · {item.days}天 · {styleName(item.style)}
          </Text>
          <Text style={styles.cardNote} numberOfLines={2}>
            {item.note || item.summary}
          </Text>
          <Text style={styles.cardMeta}>
            {item.author} · {item.comment_count} 条留言
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F766E' },
  lead: { marginTop: 6, fontSize: 13, color: '#64748B', lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  chipOn: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextOn: { color: '#FFFFFF', fontWeight: '700' },
  error: { marginTop: 16, color: '#B91C1C', fontSize: 13, lineHeight: 18 },
  empty: { marginTop: 24, color: '#64748B' },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardNote: { marginTop: 6, fontSize: 13, color: '#334155', lineHeight: 18 },
  cardMeta: { marginTop: 8, fontSize: 12, color: '#94A3B8' },
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
  detail: { padding: 16, paddingBottom: 40 },
  author: { fontSize: 13, color: '#64748B' },
  note: { marginTop: 8, fontSize: 16, color: '#0F172A', lineHeight: 22 },
  meta: { marginTop: 6, fontSize: 12, color: '#0F766E' },
  day: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  dayMeta: { marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 18 },
  importBtn: { marginTop: 16, backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importText: { color: '#FFFFFF', fontWeight: '700' },
});
