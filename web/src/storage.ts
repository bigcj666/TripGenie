import type { Trip } from './types'

const TRIPS_KEY = 'tuling.trips'
const PREFS_KEY = 'tuling.prefs'
const SAVED_KEY = 'tuling.saved'
const PACK_KEY = 'tuling.pack'
const PROFILE_KEY = 'tuling.profile'

export const PACK_ITEMS = ['身份证', '充电宝', '数据线', '常用药', '雨具', '舒适的鞋', '纸巾湿巾']

export interface Profile {
  name: string
  city: string
}

const DEFAULT_PROFILE: Profile = { name: '旅行者', city: '杭州' }

export interface SavedTrip {
  id: string
  savedAt: number
  engine: string
  trip: Trip
}

export function loadTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTrip[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTrips(items: SavedTrip[]): void {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(items.slice(0, 30)))
}

export function loadPrefs(): string[] {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return ['美食', '人文']
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePrefs(prefs: string[]): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

function loadIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function loadSaved(): string[] {
  return loadIds(SAVED_KEY)
}

export function saveSaved(ids: string[]): void {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
}

export function loadPack(): string[] {
  return loadIds(PACK_KEY)
}

export function savePack(items: string[]): void {
  localStorage.setItem(PACK_KEY, JSON.stringify(items))
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as Partial<Profile>
    const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 12) : DEFAULT_PROFILE.name
    const city = typeof parsed.city === 'string' && parsed.city.trim() ? parsed.city.trim() : DEFAULT_PROFILE.city
    return { name, city }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: profile.name.slice(0, 12), city: profile.city }))
}

export interface ShareRecord {
  id: string
  token: string
}

const SHARES_KEY = 'tuling.shares'

export function loadShares(): ShareRecord[] {
  try {
    const raw = localStorage.getItem(SHARES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShareRecord[]
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === 'string' && typeof item.token === 'string') : []
  } catch {
    return []
  }
}

export function saveShares(items: ShareRecord[]): void {
  localStorage.setItem(SHARES_KEY, JSON.stringify(items.slice(0, 30)))
}
