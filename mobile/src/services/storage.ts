import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Trip } from '../types/trip';

const KEY = 'tuling.mobile.trips';

export interface SavedTrip {
  id: string;
  savedAt: number;
  engine: string;
  trip: Trip;
}

export async function loadTrips(): Promise<SavedTrip[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTrip[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && item.trip);
  } catch {
    return [];
  }
}

export async function saveTrips(items: SavedTrip[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
}

export function rememberTrips(existing: SavedTrip[], incoming: Trip[], engine: string): SavedTrip[] {
  const rows: SavedTrip[] = incoming.map((trip) => ({
    id: trip.trip_id,
    savedAt: Date.now(),
    engine,
    trip,
  }));
  return [...rows, ...existing.filter((item) => !rows.some((row) => row.id === item.id))].slice(0, 30);
}
