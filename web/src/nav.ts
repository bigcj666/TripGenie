export type Tab = 'home' | 'guides' | 'community' | 'mine'

export interface CreateDraft {
  city?: string
  prefs?: string[]
  days?: number
}
