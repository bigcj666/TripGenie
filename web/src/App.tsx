import { useCallback, useEffect, useState } from 'react'

import { fetchHealth, type HealthInfo } from './api'
import { TabBar } from './components/TabBar'
import { forShare } from './custom/schedule'
import { PLACES } from './data/places'
import { PREFERENCE_TAGS } from './format'
import type { CreateDraft, Tab } from './nav'
import { CityScreen } from './screens/CityScreen'
import { CommunityScreen } from './screens/CommunityScreen'
import { CreateScreen } from './screens/CreateScreen'
import { CustomScreen } from './screens/CustomScreen'
import { DetailScreen } from './screens/DetailScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MineScreen } from './screens/MineScreen'
import { PlaceScreen } from './screens/PlaceScreen'
import { PlansScreen } from './screens/PlansScreen'
import { PostScreen } from './screens/PostScreen'
import { SavedScreen } from './screens/SavedScreen'
import { TripsScreen } from './screens/TripsScreen'
import {
  loadPack,
  loadPrefs,
  loadProfile,
  loadSaved,
  loadShares,
  loadTrips,
  savePack,
  savePrefs,
  saveProfile,
  saveSaved,
  saveShares,
  saveTrips,
  type Profile,
  type SavedTrip,
  type ShareRecord,
} from './storage'
import type { GenerateResponse, Trip } from './types'

type Route =
  | { page: 'city'; city: string }
  | { page: 'place'; id: string }
  | { page: 'create'; draft: CreateDraft }
  | { page: 'custom'; city?: string }
  | { page: 'plans'; result: GenerateResponse }
  | { page: 'detail'; id: string }
  | { page: 'saved' }
  | { page: 'post'; id: string }

export function App(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Route[]>([])
  const [trips, setTrips] = useState<SavedTrip[]>(() => loadTrips())
  const [prefs, setPrefs] = useState<string[]>(() => loadPrefs())
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSaved())
  const [packed, setPacked] = useState<string[]>(() => loadPack())
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [shares, setShares] = useState<ShareRecord[]>(() => loadShares())
  const [shareDraft, setShareDraft] = useState<Trip | null>(null)
  const [health, setHealth] = useState<HealthInfo | { state: 'unknown' }>({ state: 'unknown' })

  useEffect(() => {
    let stop = false
    const ping = (): void => {
      void fetchHealth().then((info) => {
        if (!stop) setHealth(info)
      })
    }
    ping()
    const timer = window.setInterval(ping, 8000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [])

  const top = stack[stack.length - 1]
  const latest = trips[0] ?? null

  const push = (route: Route): void => setStack((current) => [...current, route])
  const pop = (): void => setStack((current) => current.slice(0, -1))
  const clearShareDraft = useCallback(() => setShareDraft(null), [])

  const toggleSave = (placeId: string): void => {
    const next = savedIds.includes(placeId) ? savedIds.filter((id) => id !== placeId) : [...savedIds, placeId]
    setSavedIds(next)
    saveSaved(next)
  }

  const remember = (result: GenerateResponse): SavedTrip[] => {
    const incoming: SavedTrip[] = result.plans.map((trip) => ({
      id: trip.trip_id,
      savedAt: Date.now(),
      engine: result.engine,
      trip,
    }))
    const next = [...incoming, ...trips.filter((item) => !incoming.some((row) => row.id === item.id))].slice(0, 30)
    setTrips(next)
    saveTrips(next)
    return incoming
  }

  const openTrip = (id: string): void => {
    push({ page: 'detail', id })
  }

  return (
    <div className="phone">
      {top?.page === 'city' ? (
        <CityScreen
          city={top.city}
          savedIds={savedIds}
          onBack={pop}
          onCreate={() => push({ page: 'create', draft: { city: top.city } })}
          onCustom={() => push({ page: 'custom', city: top.city })}
          onPlace={(placeId) => push({ page: 'place', id: placeId })}
          onToggleSave={toggleSave}
        />
      ) : null}
      {top?.page === 'place' ? (
        <PlaceScreen
          placeId={top.id}
          saved={savedIds.includes(top.id)}
          onBack={pop}
          onToggleSave={() => toggleSave(top.id)}
          onCreate={() => {
            const place = PLACES.find((item) => item.id === top.id)
            const prefs = place?.tags.filter((tag) => (PREFERENCE_TAGS as readonly string[]).includes(tag))
            push({ page: 'create', draft: { city: place?.city, prefs: prefs && prefs.length > 0 ? prefs : undefined } })
          }}
        />
      ) : null}
      {top?.page === 'create' ? (
        <CreateScreen
          draft={top.draft}
          savedPrefs={prefs}
          homeCity={profile.city}
          onBack={pop}
          onDone={(result) => {
            remember(result)
            setStack((current) => [...current.slice(0, -1), { page: 'plans', result }])
          }}
        />
      ) : null}
      {top?.page === 'custom' ? (
        <CustomScreen
          city={top.city}
          savedIds={savedIds}
          onBack={pop}
          onDone={(trip) => {
            const row: SavedTrip = { id: trip.trip_id, savedAt: Date.now(), engine: 'custom', trip }
            const next = [row, ...trips.filter((item) => item.id !== row.id)].slice(0, 30)
            setTrips(next)
            saveTrips(next)
            setStack((current) => [...current.slice(0, -1), { page: 'detail', id: trip.trip_id }])
          }}
        />
      ) : null}
      {top?.page === 'plans' ? (
        <PlansScreen
          result={top.result}
          onBack={pop}
          onOpen={(index) => {
            const trip = top.result.plans[index]
            if (!trip) return
            push({ page: 'detail', id: trip.trip_id })
          }}
        />
      ) : null}
      {top?.page === 'detail' ? (
        <DetailRoute
          id={top.id}
          trips={trips}
          onBack={pop}
          onShare={(trip) => {
            setShareDraft(forShare(trip))
            setStack([])
            setTab('community')
          }}
        />
      ) : null}
      {top?.page === 'saved' ? (
        <SavedScreen
          savedIds={savedIds}
          onBack={pop}
          onPlace={(placeId) => push({ page: 'place', id: placeId })}
          onToggleSave={toggleSave}
          onCreate={(draft) => push({ page: 'create', draft })}
        />
      ) : null}
      {top?.page === 'post' ? (
        <PostScreen
          id={top.id}
          author={profile.name}
          token={shares.find((item) => item.id === top.id)?.token}
          onBack={pop}
          onImport={(trip) => {
            const copy: Trip = { ...trip, trip_id: `import-${Date.now()}` }
            const row: SavedTrip = { id: copy.trip_id, savedAt: Date.now(), engine: 'community', trip: copy }
            const next = [row, ...trips.filter((item) => item.id !== row.id)].slice(0, 30)
            setTrips(next)
            saveTrips(next)
            push({ page: 'detail', id: copy.trip_id })
          }}
          onRemoved={() => {
            const next = shares.filter((item) => item.id !== top.id)
            setShares(next)
            saveShares(next)
            pop()
          }}
        />
      ) : null}

      {!top && tab === 'home' ? (
        <HomeScreen
          latest={latest}
          homeCity={profile.city}
          savedIds={savedIds}
          onCity={(city) => push({ page: 'city', city })}
          onCreate={(draft) => push({ page: 'create', draft })}
          onCustom={(city) => push({ page: 'custom', city: city ?? profile.city })}
          onPlace={(placeId) => push({ page: 'place', id: placeId })}
          onOpenGuide={openTrip}
          onToggleSave={toggleSave}
        />
      ) : null}
      {!top && tab === 'guides' ? (
        <TripsScreen
          trips={trips}
          onCreate={() => push({ page: 'create', draft: {} })}
          onOpen={openTrip}
          onDelete={(id) => {
            const next = trips.filter((item) => item.id !== id)
            setTrips(next)
            saveTrips(next)
          }}
        />
      ) : null}
      {!top && tab === 'community' ? (
        <CommunityScreen
          author={profile.name}
          trips={trips}
          draft={shareDraft}
          onDraftHandled={clearShareDraft}
          onOpen={(id) => push({ page: 'post', id })}
          onPublished={(share) => {
            const next = [share, ...shares.filter((item) => item.id !== share.id)].slice(0, 30)
            setShares(next)
            saveShares(next)
          }}
        />
      ) : null}
      {!top && tab === 'mine' ? (
        <MineScreen
          profile={profile}
          tripCount={trips.length}
          savedCount={savedIds.length}
          prefs={prefs}
          packed={packed}
          service={serviceLabel(health)}
          onProfile={(next) => {
            setProfile(next)
            saveProfile(next)
          }}
          onTogglePref={(tag) => {
            const next = prefs.includes(tag) ? prefs.filter((item) => item !== tag) : [...prefs, tag]
            setPrefs(next)
            savePrefs(next)
          }}
          onTogglePack={(item) => {
            const next = packed.includes(item) ? packed.filter((name) => name !== item) : [...packed, item]
            setPacked(next)
            savePack(next)
          }}
          onClear={() => {
            setTrips([])
            saveTrips([])
          }}
          onOpenSaved={() => push({ page: 'saved' })}
        />
      ) : null}
      {!top ? <TabBar tab={tab} onChange={setTab} /> : null}
    </div>
  )
}

function DetailRoute({
  id,
  trips,
  onBack,
  onShare,
}: {
  id: string
  trips: SavedTrip[]
  onBack: () => void
  onShare: (trip: Trip) => void
}): React.ReactElement {
  const saved = trips.find((item) => item.id === id)
  if (!saved) {
    return (
      <div className="page">
        <header className="nav">
          <button type="button" className="nav-btn" onClick={onBack}>
            返回
          </button>
          <h1>攻略</h1>
          <span />
        </header>
        <p className="muted pad">找不到这套攻略。</p>
      </div>
    )
  }
  return <DetailScreen trip={saved.trip} onBack={onBack} onShare={() => onShare(saved.trip)} />
}

function serviceLabel(health: HealthInfo | { state: 'unknown' }): string {
  if (health.state === 'down') return '生成服务未连接'
  if (health.state === 'unknown') return '正在连接生成服务'
  if (health.engine === 'mock') return '演示引擎已连接，没有大模型密钥'
  if (health.engine === 'deepseek') return '生成服务已连接 · DeepSeek'
  if (health.engine === 'glm') return '生成服务已连接 · 智谱'
  return '生成服务已连接'
}
