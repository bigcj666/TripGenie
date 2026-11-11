import { API_BASE, USE_MOCK } from '../config/constants';
import { buildMockPlans } from '../data/mockTrips';
import type { GenerateRequest, GenerateResponse, Trip } from '../types/trip';

export type { GenerateRequest, GenerateResponse };

export interface CommunityPost {
  id: string;
  author: string;
  note: string;
  city: string;
  days: number;
  people: number;
  style: string;
  summary: string;
  created_at: string;
  comment_count: number;
}

export interface CommunityDetail extends CommunityPost {
  trip: Trip;
}

export interface HealthInfo {
  state: 'ok' | 'down';
  engine?: string;
}

export async function fetchHealth(): Promise<HealthInfo> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return { state: 'down' };
    const data = (await response.json()) as { engine?: string };
    return { state: 'ok', engine: data.engine };
  } catch {
    return { state: 'down' };
  }
}

/**
 * POST {API_BASE}/api/trip/generate
 * 与网页同一份请求体。服务不可达时才回退手机内演示数据，并在 warnings 里标明。
 */
export async function generateTrips(req: GenerateRequest): Promise<GenerateResponse> {
  if (USE_MOCK) {
    return withFallback(buildMockPlans(req), '已按设置使用备用方案');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/trip/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    return withFallback(buildMockPlans(req), '暂时连不上，已改用备用方案');
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as GenerateResponse;
  if (!data || !Array.isArray(data.plans)) {
    throw new Error('生成结果格式不对');
  }
  return data;
}

export async function listCommunity(city?: string): Promise<CommunityPost[]> {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  const data = await readJson<{ posts: CommunityPost[] }>(`${API_BASE}/api/community${query}`);
  return data.posts;
}

export async function readCommunity(id: string): Promise<CommunityDetail> {
  return readJson<CommunityDetail>(`${API_BASE}/api/community/${id}`);
}

function withFallback(data: GenerateResponse, note: string): GenerateResponse {
  return { ...data, warnings: [`offline_fallback ${note}`, ...(data.warnings ?? [])] };
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(`连不上 ${API_BASE}。请先在 server 目录启动后端。`);
  }
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<T>;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  } catch {
    /* 非 JSON 错误沿用状态码 */
  }
  return `请求失败（${response.status}）`;
}
