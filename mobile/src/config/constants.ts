/**
 * 与网页共用本机 FastAPI。
 *
 * - Android 模拟器访问宿主机用 10.0.2.2
 * - iOS 模拟器、Expo Web 用 127.0.0.1
 * - 真机改成电脑的局域网地址，或用 EXPO_PUBLIC_API_BASE 覆盖
 * EXPO_PUBLIC_USE_MOCK=1 时跳过网络，只用手机里的演示数据。
 */
import { Platform } from 'react-native';

function defaultBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
}

export const API_BASE: string = defaultBase();

/** 置 true 强制走本地 mock fixture，跳过网络请求 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1';
