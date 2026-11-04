/** 行程数据契约 —— 与 server/app/schemas/trip.py 逐字段同步 */

export type TravelStyle = 'compact' | 'relaxed' | 'economy';
export type ItemType = 'attraction' | 'meal' | 'transport' | 'hotel' | 'free';
export type TransportMode = 'walk' | 'transit' | 'drive' | 'taxi';

export interface Poi {
  name: string;
  lat: number;
  lng: number;
  adcode: string;
}

export interface SourceRef {
  title: string;
  url: string;
}

export interface TransportToNext {
  mode: TransportMode;
  duration_min: number;
  note: string;
}

export interface ItineraryItem {
  time_start: string; // "09:00"
  time_end: string;
  type: ItemType;
  title: string;
  poi: Poi;
  duration_min: number;
  cost_estimate: number;
  description: string;
  tips: string;
  transport_to_next: TransportToNext | null;
  sources: SourceRef[];
  ticket_price?: number;
  fact_status?: 'sourced' | 'estimated';
  closed_weekdays?: number[];
}

export interface DayPlan {
  day: number;
  theme: string;
  items: ItineraryItem[];
  zone?: string;
}

export interface CostBreakdown {
  transport: number;
  food: number;
  tickets: number;
  hotel: number;
  other: number;
}

export interface TripMetrics {
  stop_count: number;
  transit_min: number;
  ticket_total: number;
  walk_ratio: number;
}

export interface Trip {
  trip_id: string;
  city: string;
  days: number;
  people: number;
  budget_total: number;
  style: TravelStyle;
  preferences: string[];
  summary: string;
  itinerary: DayPlan[];
  cost_breakdown: CostBreakdown;
  metrics?: TripMetrics;
  route_rationale?: string;
}

export interface GenerateResponse {
  engine: 'deepseek' | 'glm' | 'mock';
  plans: Trip[];
  warnings?: string[];
}

export interface GenerateRequest {
  city: string;
  days: number;
  budget_total: number;
  people: number;
  preferences: string[];
  style: TravelStyle | 'all';
}
