import type { TravelStyle, Trip, TripMetrics } from './types/trip';

export const STYLE_META: Record<TravelStyle, { name: string; line: string }> = {
  compact: { name: '紧凑', line: '一天多看几处' },
  relaxed: { name: '松弛', line: '少换地方，停留更久' },
  economy: { name: '省钱', line: '把门票压下去' },
};

export const DEMO_CITIES = ['杭州', '成都', '西安'] as const;

export function yuan(value: number): string {
  return `¥${Math.round(value)}`;
}

export function deriveMetrics(trip: Trip): TripMetrics {
  if (trip.metrics) return trip.metrics;
  const items = trip.itinerary.flatMap((day) => day.items);
  const legs = items
    .map((item) => item.transport_to_next)
    .filter((leg): leg is NonNullable<typeof leg> => leg != null);
  const walks = legs.filter((leg) => leg.mode === 'walk').length;
  return {
    stop_count: items.length,
    transit_min: legs.reduce((sum, leg) => sum + leg.duration_min, 0),
    ticket_total: trip.cost_breakdown.tickets,
    walk_ratio: legs.length === 0 ? 0 : walks / legs.length,
  };
}

export function walkPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function presentWarning(raw: string): string {
  return raw
    .replace(/^\[(compact|relaxed|economy)\]\s*/, '')
    .replace(/^offline_fallback\s+/, '')
    .replace(/^over_budget\s+/, '')
    .replace(/^under_budget\s+/, '')
    .replace(/^style_rule\s+/, '');
}

export function warningsFor(warnings: string[] | undefined, style?: TravelStyle): string[] {
  if (!warnings?.length) return [];
  if (!style) return warnings.map(presentWarning);
  const tag = `[${style}]`;
  const specific = warnings.filter((warning) => warning.includes(tag) || warning.startsWith('offline_fallback'));
  const source = specific.length > 0 ? specific : warnings.filter((warning) => !warning.startsWith('['));
  return source.map(presentWarning);
}

export function engineLabel(state: 'ok' | 'down' | 'unknown', engine?: string): string {
  if (state === 'down') return '生成服务未连接。生成时会改用手机里的演示数据。';
  if (state === 'unknown') return '正在连接生成服务…';
  if (engine === 'mock') return '目录行程已就绪，说明来自城市目录';
  if (engine === 'deepseek') return '生成服务已连接 · DeepSeek';
  if (engine === 'glm') return '生成服务已连接 · 智谱';
  return '生成服务已连接';
}

export function styleName(style: string): string {
  if (style === 'compact' || style === 'relaxed' || style === 'economy') return STYLE_META[style].name;
  return style;
}
