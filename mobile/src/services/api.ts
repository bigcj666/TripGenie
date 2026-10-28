import { API_BASE, USE_MOCK } from '../config/constants';
import { buildMockPlans } from '../data/mockTrips';
import type { GenerateRequest, GenerateResponse } from '../types/trip';

export type { GenerateRequest, GenerateResponse };

/**
 * POST {API_BASE}/api/trip/generate
 * 请求：{ city, days, budget_total, people, preferences, style }
 * 响应：GenerateResponse
 *
 * 失败或 USE_MOCK 开启时回退本地 fixture（engine=mock）。
 */
export async function generateTrips(req: GenerateRequest): Promise<GenerateResponse> {
  if (USE_MOCK) {
    return buildMockPlans(req);
  }

  try {
    const res = await fetch(`${API_BASE}/api/trip/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as GenerateResponse;
    if (!data || !Array.isArray(data.plans)) {
      throw new Error('invalid response shape');
    }
    return data;
  } catch {
    return buildMockPlans(req);
  }
}
