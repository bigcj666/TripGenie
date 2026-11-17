import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styleName } from '../format';
import {
  commentCommunity,
  listCommunity,
  mediaUrl,
  readCommunity,
  type CommunityDetail,
  type CommunityPost,
} from '../services/api';
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
  const [refreshing, setRefreshing] = useState(false);
  const [post, setPost] = useState<CommunityDetail | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadFeed = useCallback((selected: string, quiet: boolean): void => {
    if (!quiet) setLoading(true);
    void listCommunity(selected === '全部' ? undefined : selected).then(
      (rows) => {
        setPosts(rows);
        setError(null);
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setError('网络不太稳定，请再试一次。');
        setLoading(false);
        setRefreshing(false);
      },
    );
  }, []);

  useEffect(() => {
    if (focusId) return;
    loadFeed(city, false);
  }, [city, focusId, loadFeed]);

  useEffect(() => {
    if (!focusId) {
      setPost(null);
      setPostError(null);
      setText('');
      setSendError(null);
      return;
    }
    let stop = false;
    setPost(null);
    setPostError(null);
    void readCommunity(focusId).then(
      (detail) => {
        if (!stop) setPost(detail);
      },
      () => {
        if (!stop) setPostError('网络不太稳定，请再试一次。');
      },
    );
    return () => {
      stop = true;
    };
  }, [focusId]);

  const send = (): void => {
    const body = text.trim();
    if (!body || !post || sending) return;
    setSending(true);
    setSendError(null);
    void commentCommunity(post.id, '旅行者', body)
      .then((comment) => {
        setPost({
          ...post,
          comments: [...post.comments, comment],
          comment_count: post.comment_count + 1,
        });
        setText('');
        setSending(false);
      })
      .catch(() => {
        setSendError('发送失败，请重试');
        setSending(false);
      });
  };

  if (focusId) {
    const photos = post?.photos ?? [];
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => onFocus(null)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.back}>返回</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {post?.author || '点评详情'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.detail} keyboardShouldPersistTaps="handled">
          {!post && !postError ? <Text style={styles.empty}>正在加载…</Text> : null}
          {postError ? (
            <View>
              <Text style={styles.error}>{postError}</Text>
              <Pressable style={styles.retry} onPress={() => onFocus(focusId)}>
                <Text style={styles.retryText}>重试</Text>
              </Pressable>
            </View>
          ) : null}
          {post ? (
            <>
              <Text style={styles.author}>{post.author}</Text>
              {post.note || post.summary ? <Text style={styles.note}>{post.note || post.summary}</Text> : null}
              <PhotoGrid photos={photos} />
              {post.trip ? (
                <>
                  <Text style={styles.meta}>
                    {post.city} · {post.days}天 · {post.people}人
                  </Text>
                  {post.trip.itinerary.map((day, index) => (
                    <Pressable key={day.day} style={styles.day} onPress={() => onOpenDay(post.trip as Trip, index)}>
                      <Text style={styles.dayTitle}>
                        第 {day.day} 天 · {day.zone || '片区'} · {day.theme}
                      </Text>
                      <Text style={styles.dayMeta}>{day.items.map((item) => item.title).join(' · ')}</Text>
                    </Pressable>
                  ))}
                  <Pressable style={styles.importBtn} onPress={() => onImport(post.trip as Trip)}>
                    <Text style={styles.importText}>导入到我的攻略</Text>
                  </Pressable>
                </>
              ) : null}
              <Text style={styles.talkTitle}>留言 {post.comments.length}</Text>
              {post.comments.length === 0 ? (
                <Text style={styles.empty}>还没有留言。先说一句这套行程好在哪，或哪里想改。</Text>
              ) : null}
              {post.comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                </View>
              ))}
              {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
            </>
          ) : null}
        </ScrollView>
        {post ? (
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              value={text}
              onChangeText={setText}
              placeholder="这套行程你想怎么走？"
              placeholderTextColor="#8e8e93"
              editable={!sending}
              maxLength={200}
            />
            <Pressable style={styles.send} onPress={send} disabled={sending || !text.trim()}>
              <Text style={[styles.sendText, (!text.trim() || sending) && styles.sendOff]}>{sending ? '发送中' : '发送'}</Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed(city, true); }} />}
    >
      <Text style={styles.title}>看看别人怎么排。</Text>
      <Text style={styles.lead}>浏览同行行程，留言交流，或导入到自己的攻略。</Text>
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
      {loading && posts.length === 0 ? <Text style={styles.empty}>正在加载…</Text> : null}
      {error ? (
        <Pressable onPress={() => loadFeed(city, false)}>
          <Text style={styles.error}>{error} 点此重试</Text>
        </Pressable>
      ) : null}
      {!loading && !error && posts.length === 0 ? (
        <Text style={styles.empty}>社区还很安静。把你排好的行程发出来，给同行人一个可直接导入的参考。</Text>
      ) : null}
      {posts.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => onFocus(item.id)}>
          <Text style={styles.cardTitle}>
            {item.days > 0 ? `${item.city} · ${item.days}天 · ${styleName(item.style)}` : item.note || item.city}
          </Text>
          {item.note ? (
            <Text style={styles.cardNote} numberOfLines={4}>
              {item.note}
            </Text>
          ) : null}
          <PhotoGrid photos={item.photos ?? []} />
          <Text style={styles.cardMeta}>
            {item.author} · {item.comment_count} 条留言
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function PhotoGrid({ photos }: { photos: string[] }): React.ReactElement | null {
  const shown = photos.slice(0, 9);
  if (!shown.length) return null;
  return (
    <View style={styles.grid}>
      {shown.map((src) => (
        <Image key={src} source={{ uri: mediaUrl(src) }} style={styles.gridImage} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { padding: 16, paddingTop: 12, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#1c1c1e' },
  lead: { marginTop: 6, fontSize: 13, color: '#8e8e93', lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: '#1c1c1e' },
  chipText: { fontSize: 15, color: '#1c1c1e' },
  chipTextOn: { color: '#FFFFFF', fontWeight: '600' },
  error: { marginTop: 16, color: '#B91C1C', fontSize: 13, lineHeight: 18 },
  empty: { marginTop: 16, color: '#8e8e93', fontSize: 14, lineHeight: 20 },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  cardNote: { marginTop: 8, fontSize: 15, color: '#1c1c1e', lineHeight: 22 },
  cardMeta: { marginTop: 8, fontSize: 12, color: '#8e8e93' },
  grid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridImage: { width: '32%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#eee' },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  back: { fontSize: 15, color: '#1c1c1e', width: 64, lineHeight: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1c1c1e' },
  headerSpacer: { width: 64 },
  detail: { padding: 16, paddingBottom: 24 },
  author: { fontSize: 15, fontWeight: '600', color: '#1c1c1e' },
  note: { marginTop: 8, fontSize: 16, color: '#1c1c1e', lineHeight: 24 },
  meta: { marginTop: 8, fontSize: 13, color: '#8e8e93' },
  day: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1e' },
  dayMeta: { marginTop: 4, fontSize: 13, color: '#8e8e93', lineHeight: 18 },
  importBtn: { marginTop: 16, backgroundColor: '#1c1c1e', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  importText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  talkTitle: { marginTop: 20, fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  comment: { marginTop: 12 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1c1c1e' },
  commentBody: { marginTop: 4, fontSize: 16, lineHeight: 24, color: '#1c1c1e' },
  retry: { marginTop: 12, minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#2F6FED', fontWeight: '600', fontSize: 15 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  composerInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F4',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1c1c1e',
  },
  send: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  sendText: { fontSize: 15, fontWeight: '600', color: '#1c1c1e' },
  sendOff: { opacity: 0.4 },
});
