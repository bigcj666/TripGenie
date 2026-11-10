import type { CostBreakdown, TravelStyle, Trip, TripMetrics } from './types'

export const STYLE_ORDER: TravelStyle[] = ['compact', 'relaxed', 'economy']

export const STYLE_META: Record<TravelStyle, { name: string; line: string; tag: string }> = {
  compact: { name: '紧凑', line: '多看几处，同一片区连着走。', tag: '适合想多打卡' },
  relaxed: { name: '松弛', line: '少换地方，每处停留更久。', tag: '适合慢慢逛' },
  economy: { name: '省钱', line: '优先免费景点，把门票压下来。', tag: '门票更低' },
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

const WARNING_COPY: Array<[string, string]> = [
  ['over_budget', '这套已计入费用高于预算，可改看省钱方案，或减少安排。'],
  ['under_budget', '这套还低于预算，可改看更从容的方案，或加入必去地点。'],
  ['style_rule', '该片区可排的点有限，已尽量按当前风格安排。'],
  ['must_visit_unmatched', '有的必去地点还匹配不到目录，未写入行程。'],
  ['closed_day', ''],
]

export function presentWarning(raw: string): string {
  const body = raw.replace(/^\[(compact|relaxed|economy)\]\s*/, '')
  for (const [code, sentence] of WARNING_COPY) {
    if (!body.startsWith(code)) continue
    if (code === 'closed_day') return body.slice(code.length).trim()
    return sentence
  }
  return body
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
