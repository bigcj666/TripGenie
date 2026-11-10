import { PLACES, type Place } from '../data/places'
import type { DayPlan, ItineraryItem, Trip } from '../types'

export type SlotKind = 'breakfast' | 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'evening' | 'hotel'

export const SLOT_LABEL: Record<SlotKind, string> = {
  breakfast: '早餐',
  morning: '上午',
  lunch: '午餐',
  afternoon: '下午',
  dinner: '晚餐',
  evening: '晚上',
  hotel: '住宿',
}

const MEAL_KINDS = new Set<SlotKind>(['breakfast', 'lunch', 'dinner'])

const CENTERS: Record<string, { lat: number; lng: number }> = {
  杭州: { lat: 30.2741, lng: 120.1551 },
  成都: { lat: 30.5728, lng: 104.0668 },
  西安: { lat: 34.3416, lng: 108.9398 },
}

/** 目录缺 ticket_price 时的后备。灵隐 2025-12-01 起免票；大雁塔按寺 10 + 登塔 25。 */
const TICKET: Record<string, number> = {
  lingyin: 0,
  feilaifeng: 0,
  leifeng: 40,
  cruise: 55,
  xixi: 80,
  panda: 55,
  terracotta: 120,
  wall: 54,
  tang: 35,
}

const MEAL_PRICE: Record<'breakfast' | 'lunch' | 'dinner', number> = {
  breakfast: 25,
  lunch: 60,
  dinner: 70,
}

export interface DayWeather {
  date: string
  label: string
  tempMin: number
  tempMax: number
  rainProb: number
  rainy: boolean
  hot: boolean
  pace: string
  carry: string
  known: boolean
}

export interface TimeSlot {
  id: string
  kind: SlotKind
  start: string
  end: string
  placeId: string | null
}

export interface CustomDay {
  date: string
  weather: DayWeather
  slots: TimeSlot[]
}

interface ForecastDay {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: Array<number | null>
}

export function isoShift(from: Date, days: number): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addISO(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  return isoShift(new Date(year, month - 1, day), days)
}

export function monthDay(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export function weekday(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(year, month - 1, day).getDay()]
}

export function pickHint(kind: SlotKind, weather: DayWeather): string {
  if (kind === 'hotel') return '已按市区放了一家，可以换成更近或更便宜的'
  if (MEAL_KINDS.has(kind)) return '已放了一家饭馆，可以换成别的，也可以就在附近吃'
  if (kind === 'evening') return weather.rainy ? '下雨的话，晚上可以留空' : '夜市和夜景适合放在这里'
  if (weather.rainy) return '今天下雨，室内的排在前面'
  if (weather.hot && kind === 'afternoon') return '下午较热，室内的排在前面'
  if (weather.hot && kind === 'morning') return '热天把户外放在上午'
  return '选一个这时段想去的地方'
}

export async function loadWeather(city: string, start: string, days: number): Promise<{ days: DayWeather[]; warning: string | null }> {
  const dates = Array.from({ length: days }, (_, index) => addISO(start, index))
  try {
    const center = CENTERS[city] ?? (await geocode(city))
    const end = addISO(start, days - 1)
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(center.lat))
    url.searchParams.set('longitude', String(center.lng))
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
    url.searchParams.set('timezone', 'Asia/Shanghai')
    url.searchParams.set('start_date', start)
    url.searchParams.set('end_date', end)
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('weather')
    const body = (await response.json()) as { daily?: ForecastDay }
    const daily = body.daily
    if (!daily) throw new Error('weather')
    return {
      warning: null,
      days: dates.map((date) => {
        const index = daily.time.indexOf(date)
        if (index < 0) return unknownWeather(date)
        return describeWeather(date, daily.weather_code[index] ?? 0, daily.temperature_2m_min[index] ?? 0, daily.temperature_2m_max[index] ?? 0, daily.precipitation_probability_max[index] ?? 0)
      }),
    }
  } catch {
    return {
      warning: '时间已按一般节奏排列，出发前建议再看当天预报。',
      days: dates.map(unknownWeather),
    }
  }
}

export function buildSkeleton(start: string, days: number, weather: DayWeather[], city: string): CustomDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addISO(start, index)
    const dayWeather = weather.find((item) => item.date === date) ?? unknownWeather(date)
    const overnight = days === 1 || index < days - 1
    return { date, weather: dayWeather, slots: slotsFor(date, dayWeather, city, index, overnight) }
  })
}

export function candidates(city: string, kind: SlotKind, weather: DayWeather, savedIds: string[]): Place[] {
  const inCity = PLACES.filter((place) => place.city === city)
  const pool = poolFor(inCity, kind)
  return [...pool].sort((a, b) => score(b, kind, weather, savedIds) - score(a, kind, weather, savedIds))
}

export function composeTrip(city: string, people: number, days: CustomDay[]): Trip {
  const itinerary: DayPlan[] = days.map((day, index) => ({
    day: index + 1,
    theme: day.weather.known ? `${day.weather.label} ${day.weather.tempMin}–${day.weather.tempMax}°` : '天气未出',
    zone: day.weather.pace,
    items: itemsFor(day, city, days.length === 1),
  }))
  let food = 0
  let tickets = 0
  let transport = 0
  let hotel = 0
  const rooms = Math.max(1, Math.ceil(people / 2))
  for (const day of itinerary) {
    for (const item of day.items) {
      if (item.type === 'meal') food += item.cost_estimate * people
      if (item.type === 'hotel') hotel += item.cost_estimate * rooms
      if (item.type === 'attraction') tickets += item.cost_estimate * people
      if (item.transport_to_next && item.transport_to_next.mode !== 'walk') {
        const fare = item.transport_to_next.mode === 'taxi' ? 40 : 4
        transport += fare * people
      }
    }
  }
  const total = Math.round(food + tickets + transport + hotel)
  return {
    trip_id: `custom-${Date.now()}`,
    city,
    days: days.length,
    people,
    budget_total: total,
    style: 'relaxed',
    preferences: ['自定义'],
    summary: `${city}${days.length}天。时间和一日三餐、当晚住哪都写进行程，景点是你自己选的。`,
    route_rationale: days.map((day) => `${monthDay(day.date)} ${day.weather.pace}`).join('；'),
    itinerary,
    cost_breakdown: {
      transport: Math.round(transport),
      food: Math.round(food),
      tickets: Math.round(tickets),
      hotel: Math.round(hotel),
      other: 0,
    },
  }
}

export function withStay(trip: Trip): Trip {
  if (trip.preferences.includes('自定义') || trip.preferences.includes('分享')) return trip
  const restaurants = listed(trip.city, '饭馆')
  const hotels = listed(trip.city, '酒店')
  if (restaurants.length === 0 && hotels.length === 0) return trip
  const itinerary = trip.itinerary.map((day, index) => {
    const items = [...day.items]
    const meals = items.filter((item) => item.type === 'meal' || restaurants.some((place) => item.title.includes(place.name))).length
    if (restaurants.length > 0 && meals < 1) {
      insertAround(items, 12 * 60, 70, (start) => diningItem(restaurants[index % restaurants.length], fromMinutes(start), fromMinutes(start + 70), '午餐'))
    }
    if (restaurants.length > 0 && meals < 2) {
      insertAround(items, 18 * 60, 70, (start) => diningItem(restaurants[(index + 1) % restaurants.length], fromMinutes(start), fromMinutes(start + 70), '晚餐'))
    }
    const overnight = trip.days === 1 || index < trip.itinerary.length - 1
    if (overnight && hotels.length > 0 && !items.some((item) => item.type === 'hotel')) {
      insertAround(items, 21 * 60, 60, (start) => stayItem(hotels[index % hotels.length], trip.days === 1, start))
    }
    return { ...day, items: relink(items) }
  })
  return { ...trip, itinerary }
}

export function forShare(trip: Trip): Trip {
  const view = withStay(trip)
  if (view.preferences.includes('分享')) return view
  return { ...view, preferences: [...view.preferences, '分享'] }
}

function slotsFor(date: string, weather: DayWeather, city: string, dayIndex: number, overnight: boolean): TimeSlot[] {
  const hot = weather.hot && !weather.rainy
  const rows: Array<[SlotKind, string, string]> = hot
    ? [
        ['breakfast', '07:30', '08:20'],
        ['morning', '08:30', '11:00'],
        ['lunch', '11:40', '12:50'],
        ['afternoon', '13:20', '16:20'],
        ['dinner', '17:30', '18:40'],
        ['evening', '19:00', '20:30'],
      ]
    : [
        ['breakfast', '08:00', '08:50'],
        ['morning', '09:10', '11:40'],
        ['lunch', '12:00', '13:10'],
        ['afternoon', '13:40', '16:40'],
        ['dinner', '17:40', '18:50'],
        ['evening', '19:10', '20:40'],
      ]
  if (overnight) rows.push(['hotel', '21:00', '23:00'])
  return rows.map(([kind, start, end]) => ({
    id: `${date}-${kind}`,
    kind,
    start,
    end,
    placeId: defaultPlaceId(city, kind, dayIndex),
  }))
}

function itemsFor(day: CustomDay, city: string, dayTrip: boolean): ItineraryItem[] {
  const center = CENTERS[city] ?? { lat: 30.27, lng: 120.16 }
  const chosen = day.slots.filter((slot) => {
    if (slot.kind === 'hotel') return Boolean(slot.placeId)
    if (MEAL_KINDS.has(slot.kind)) return true
    return Boolean(slot.placeId)
  })
  const points = chosen.map((_, index) => anchor(chosen, index, center))
  const items = chosen.map((slot, index) => slotItem(slot, placeOf(slot), points[index], day.weather, center, dayTrip))
  for (let index = 0; index < items.length - 1; index += 1) {
    items[index].transport_to_next = legBetween(points[index], points[index + 1])
  }
  if (items[0]) items[0].tips = [day.weather.carry, items[0].tips].filter(Boolean).join(' ')
  return items
}

function placeOf(slot: TimeSlot): Place | undefined {
  return slot.placeId ? PLACES.find((item) => item.id === slot.placeId) : undefined
}

function anchor(slots: TimeSlot[], index: number, center: { lat: number; lng: number }): { lat: number; lng: number } {
  const own = placeOf(slots[index])
  if (own) return { lat: own.lat, lng: own.lng }
  for (let cursor = index + 1; cursor < slots.length; cursor += 1) {
    const next = placeOf(slots[cursor])
    if (next) return { lat: next.lat, lng: next.lng }
  }
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const previous = placeOf(slots[cursor])
    if (previous) return { lat: previous.lat, lng: previous.lng }
  }
  return center
}

function slotItem(
  slot: TimeSlot,
  place: Place | undefined,
  point: { lat: number; lng: number },
  weather: DayWeather,
  center: { lat: number; lng: number },
  dayTrip: boolean,
): ItineraryItem {
  const meal = MEAL_KINDS.has(slot.kind)
  const stay = slot.kind === 'hotel'
  const far = place ? km(center, { lat: place.lat, lng: place.lng }) >= 12 : false
  const title = place ? place.name : stay ? '住宿 · 还没选' : `${SLOT_LABEL[slot.kind]} · 附近吃`
  const ticket = place && !meal && !stay ? (place.ticket_price ?? TICKET[place.id] ?? 0) : 0
  const mealKind = slot.kind === 'breakfast' || slot.kind === 'lunch' || slot.kind === 'dinner' ? slot.kind : null
  const tips = [
    far ? '离市区较远，这一天不要再排第二个远的点。' : '',
    slot.kind === 'evening' && weather.rainy ? '下雨晚上路滑，看完就回。' : '',
    place?.name.includes('夜市') ? '人多，傍晚再去。' : '',
    stay ? (dayTrip ? '价格按一间双床房估算。当天来回可以删掉这一晚。' : '当晚入住，价格按一间双床房，两人一间。') : '',
  ]
    .filter(Boolean)
    .join('')
  return {
    time_start: clockOr(slot.start, '09:00'),
    time_end: stay ? fromMinutes(minutes(slot.start) + 60) : clockOr(slot.end, '10:00'),
    type: stay ? 'hotel' : meal ? 'meal' : 'attraction',
    title,
    poi: { name: title, lat: point.lat, lng: point.lng, adcode: '' },
    duration_min: stay ? 60 : Math.max(minutes(slot.end) - minutes(slot.start), 0),
    cost_estimate: stay ? (place?.price ?? 360) : mealKind ? (place?.price ?? MEAL_PRICE[mealKind]) : ticket,
    description: place ? place.blurb : stay ? '多天行程留一晚，选离第二天景点近的。' : '不必先定店，走到哪儿就在附近吃。',
    tips,
    transport_to_next: null,
    sources: [],
    ticket_price: ticket,
    fact_status: 'estimated',
  }
}

function legBetween(from: { lat: number; lng: number }, to: { lat: number; lng: number }): ItineraryItem['transport_to_next'] {
  const distance = km(from, to)
  if (distance < 0.4) return { mode: 'walk', duration_min: 8, note: '同一片，步行即可' }
  if (distance < 1.2) return { mode: 'walk', duration_min: Math.max(10, Math.round((distance / 4) * 60)), note: '步行前往' }
  if (distance >= 15) return { mode: 'taxi', duration_min: Math.max(40, Math.round((distance / 30) * 60 + 10)), note: '离得远，按打车估算' }
  return { mode: 'transit', duration_min: Math.max(20, Math.round((distance / 20) * 60 + 12)), note: '公共交通前往' }
}

function poolFor(places: Place[], kind: SlotKind): Place[] {
  if (kind === 'hotel') return places.filter((place) => place.tags.includes('酒店'))
  if (MEAL_KINDS.has(kind)) {
    const restaurants = places.filter((place) => place.tags.includes('饭馆'))
    return restaurants.length > 0 ? restaurants : places.filter((place) => place.tags.includes('美食'))
  }
  return sightsFor(places, kind)
}

function sightsFor(places: Place[], kind: SlotKind): Place[] {
  const sights = places.filter((place) => !place.tags.includes('酒店') && !place.tags.includes('饭馆'))
  if (kind === 'evening') return sights.filter((place) => place.name.includes('夜市') || place.name.includes('不夜城') || place.tags.some((tag) => tag !== '美食'))
  return sights.filter((place) => !(place.tags.length === 1 && place.tags[0] === '美食') && !place.name.includes('夜市'))
}

function listed(city: string, tag: string): Place[] {
  return PLACES.filter((place) => place.city === city && place.tags.includes(tag))
}

function defaultPlaceId(city: string, kind: SlotKind, dayIndex: number): string | null {
  if (kind !== 'hotel' && !MEAL_KINDS.has(kind)) return null
  const list = listed(city, kind === 'hotel' ? '酒店' : '饭馆')
  if (list.length === 0) return null
  const offset = kind === 'lunch' ? 1 : kind === 'dinner' ? 2 : 0
  return list[(dayIndex + offset) % list.length].id
}

function diningItem(place: Place, start: string, end: string, meal: string): ItineraryItem {
  return {
    time_start: start,
    time_end: end,
    type: 'meal',
    title: place.name,
    poi: { name: place.name, lat: place.lat, lng: place.lng, adcode: '' },
    duration_min: 70,
    cost_estimate: place.price ?? 60,
    description: `${meal}。${place.blurb}`,
    tips: '按人均估算，人多可以提前订位。',
    transport_to_next: null,
    sources: [],
    ticket_price: 0,
    fact_status: 'estimated',
  }
}

function stayItem(place: Place, dayTrip: boolean, startMin = 21 * 60): ItineraryItem {
  return {
    time_start: fromMinutes(startMin),
    time_end: fromMinutes(startMin + 60),
    type: 'hotel',
    title: place.name,
    poi: { name: place.name, lat: place.lat, lng: place.lng, adcode: '' },
    duration_min: 60,
    cost_estimate: place.price ?? 360,
    description: place.blurb,
    tips: dayTrip ? '当天来回可以不订。价格按一间双床房。' : '当晚入住。价格按一间双床房，两人一间。',
    transport_to_next: null,
    sources: [],
    ticket_price: 0,
    fact_status: 'estimated',
  }
}

function score(place: Place, kind: SlotKind, weather: DayWeather, savedIds: string[]): number {
  let value = savedIds.includes(place.id) ? 10 : 0
  const indoor = isIndoor(place)
  if (kind === 'evening' && (place.name.includes('夜市') || place.name.includes('不夜城'))) value += 6
  if (weather.rainy && indoor && (kind === 'morning' || kind === 'afternoon')) value += 4
  if (weather.hot && kind === 'morning' && !indoor) value += 3
  if (weather.hot && kind === 'afternoon' && indoor) value += 4
  if (!weather.rainy && !weather.hot && kind === 'morning' && !indoor) value += 2
  return value
}

function isIndoor(place: Place): boolean {
  const indoor = place.tags.some((tag) => tag === '人文' || tag === '购物')
  const outdoor = place.tags.includes('自然')
  return indoor && !outdoor
}

function describeWeather(date: string, code: number, tempMin: number, tempMax: number, rainProb: number): DayWeather {
  const rainy = rainProb >= 55 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95
  const hot = tempMax >= 33
  const label = weatherLabel(code)
  let pace = '上下午都可以安排户外，晚上留一档夜景或夜市'
  let carry = '穿舒适的鞋'
  if (rainy) {
    pace = '今天改室内，户外往后放'
    carry = '带伞，鞋要防滑'
  } else if (hot) {
    pace = '上午出门，下午进室内躲晒'
    carry = '防晒、带水，中午避开暴晒'
  } else if (tempMin <= 5) {
    pace = '户外可以去，停留别太久'
    carry = '加一件外套'
  }
  return { date, label, tempMin: Math.round(tempMin), tempMax: Math.round(tempMax), rainProb: Math.round(rainProb), rainy, hot, pace, carry, known: true }
}

function unknownWeather(date: string): DayWeather {
  return {
    date,
    label: '天气未出',
    tempMin: 0,
    tempMax: 0,
    rainProb: 0,
    rainy: false,
    hot: false,
    pace: '先按一般节奏排时间，出发前再看预报',
    carry: '舒适的鞋',
    known: false,
  }
}

function weatherLabel(code: number): string {
  if (code === 0) return '晴'
  if (code <= 3) return '多云'
  if (code === 45 || code === 48) return '雾'
  if (code >= 71 && code <= 77) return '雪'
  if (code >= 95) return '雷雨'
  if (code >= 51) return '有雨'
  return '多云'
}

async function geocode(city: string): Promise<{ lat: number; lng: number }> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', city)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('geo')
  const body = (await response.json()) as { results?: Array<{ latitude: number; longitude: number }> }
  const hit = body.results?.[0]
  if (!hit) throw new Error('geo')
  return { lat: hit.latitude, lng: hit.longitude }
}

function minutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN
  return hour * 60 + minute
}

function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)))
  const hour = Math.floor(clamped / 60)
  const minute = clamped % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function clockOr(value: string, fallback: string): string {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback
}

function rangesOverlap(start: number, end: number, items: ItineraryItem[]): boolean {
  return items.some((item) => {
    const itemStart = minutes(item.time_start)
    const itemEnd = minutes(item.time_end)
    if (!Number.isFinite(itemStart) || !Number.isFinite(itemEnd)) return false
    return start < itemEnd - 5 && end > itemStart + 5
  })
}

function insertAround(items: ItineraryItem[], preferStart: number, duration: number, make: (start: number) => ItineraryItem): void {
  const latest = 22 * 60 + 30 - duration
  const candidates = [preferStart]
  for (const item of items) {
    const end = minutes(item.time_end)
    if (Number.isFinite(end)) candidates.push(end + 15)
  }
  candidates.sort((left, right) => Math.abs(left - preferStart) - Math.abs(right - preferStart))
  const seen = new Set<number>()
  for (const start of candidates) {
    const rounded = Math.round(start / 5) * 5
    if (seen.has(rounded) || rounded < 8 * 60 || rounded > latest) continue
    seen.add(rounded)
    if (rangesOverlap(rounded, rounded + duration, items)) continue
    items.push(make(rounded))
    return
  }
}

function relink(items: ItineraryItem[]): ItineraryItem[] {
  const sorted = [...items].sort((left, right) => left.time_start.localeCompare(right.time_start))
  return sorted.map((item, index) => {
    const next = sorted[index + 1]
    if (!next) return { ...item, transport_to_next: null }
    return { ...item, transport_to_next: legBetween(item.poi, next.poi) }
  })
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radius = 6371
  const p1 = (a.lat * Math.PI) / 180
  const p2 = (b.lat * Math.PI) / 180
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}
