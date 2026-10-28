/**
 * API 基址配置
 *
 * 默认 10.0.2.2:8000 —— Android 模拟器访问宿主机 localhost。
 * 真机调试时请改成开发机的局域网 IP，例如 http://192.168.1.10:8000。
 * 也可通过环境变量 EXPO_PUBLIC_API_BASE 覆盖。
 */
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:8000';

/** 置 true 强制走本地 mock fixture，跳过网络请求 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1';
