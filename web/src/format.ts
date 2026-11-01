import type { CostBreakdown, TravelStyle, Trip, TripMetrics } from './types'

export const STYLE_ORDER: TravelStyle[] = ['compact', 'relaxed', 'economy']

export const STYLE_META: Record<TravelStyle, { name: string; line: string }> = {
  compact: { name: '紧凑', line: '一天多看几处' },
  relaxed: { name: '松弛', line: '少换地方，停留更久' },
  economy: { name: '省钱', line: '把门票压下去' },
}

export const TYPE_LABEL = {
  attraction: '景点',
  meal: '用餐',
  transport: '交通',
  hotel: '住宿',
  free: '自由活动',
} as const

export const MODE_LABEL = {
  walk: '步行',
  transit: '公共交通',
  drive: '自驾',
  taxi: '打车',
} as const

export const PREFERENCE_TAGS = ['美食', '自然', '人文', '亲子', '购物', '网红打卡'] as const

export const DEMO_CITIES = ['杭州', '成都', '西安'] as const

export function yuan(value: number): string {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`
}

export function costTotal(cost: CostBreakdown): number {
  return cost.transport + cost.food + cost.tickets + cost.hotel + cost.other
}

export function deriveMetrics(trip: Trip): TripMetrics {
  if (trip.metrics) return trip.metrics
  const items = trip.itinerary.flatMap((day) => day.items)
  const legs = items
    .map((item) => item.transport_to_next)
    .filter((leg): leg is NonNullable<typeof leg> => leg !== null)
  const walks = legs.filter((leg) => leg.mode === 'walk').length
  return {
    stop_count: items.length,
    transit_min: legs.reduce((sum, leg) => sum + leg.duration_min, 0),
    ticket_total: trip.cost_breakdown.tickets,
    walk_ratio: legs.length === 0 ? 0 : walks / legs.length,
  }
}

export function presentWarning(raw: string): string {
  return raw
    .replace(/^\[(compact|relaxed|economy)\]\s*/, '')
    .replace(/^over_budget\s+/, '')
    .replace(/^under_budget\s+/, '')
    .replace(/^style_rule\s+/, '')
}

export function warningsFor(warnings: string[] | undefined, style: TravelStyle): string[] {
  if (!warnings?.length) return []
  const tag = `[${style}]`
  const specific = warnings.filter((warning) => warning.includes(tag))
  if (specific.length === 0) return warnings.map(presentWarning)
  return specific.map(presentWarning)
}

export function walkPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function tripKindName(trip: Trip): string {
  if (trip.preferences.includes('自定义')) return '自定义'
  return STYLE_META[trip.style]?.name ?? trip.style
}

export function guideText(trip: Trip): string {
  const style = tripKindName(trip)
  const head = `${trip.city} ${trip.days}天 · ${style} · ${trip.people}人`
  const days = trip.itinerary.map((day) => {
    const lines = [`第${day.day}天 ${day.zone || day.theme}`]
    for (const item of day.items) {
      const cost = item.cost_estimate === 0 ? '免费' : `¥${Math.round(item.cost_estimate)}`
      lines.push(`${item.time_start}-${item.time_end} ${item.title}（${cost}）`)
      if (item.tips) lines.push(item.tips)
    }
    return lines.join('\n')
  })
  const sum = Math.round(costTotal(trip.cost_breakdown))
  return [head, ...days, `合计约 ¥${sum}，预算 ¥${Math.round(trip.budget_total)}`].join('\n\n')
}
