import { useEffect, useMemo, useState } from 'react'

import { Photo } from '../components/Photo'
import { isoShift, loadWeather } from '../custom/schedule'
import { CITIES, PLACES } from '../data/places'
import { tripKindName } from '../format'
import type { CreateDraft } from '../nav'
import type { SavedTrip } from '../storage'

interface HomeScreenProps {
  latest: SavedTrip | null
  homeCity: string
  savedIds: string[]
  onCity: (city: string) => void
  onCreate: (draft: CreateDraft) => void
  onCustom: (city?: string) => void
  onPlace: (placeId: string) => void
  onOpenGuide: (id: string) => void
  onToggleSave: (placeId: string) => void
}

export function HomeScreen({
  latest,
  homeCity,
  savedIds,
  onCity,
  onCreate,
  onCustom,
  onPlace,
  onOpenGuide,
  onToggleSave,
}: HomeScreenProps): React.ReactElement {
  const [query, setQuery] = useState('')
  const keyword = query.trim()
  const cities = useMemo(
    () => (keyword ? CITIES.filter((city) => city.name.includes(keyword)) : CITIES),
    [keyword],
  )
  const places = useMemo(() => {
    if (!keyword) {
      const featured = ['duanqiao', 'panda', 'terracotta', 'lingyin', 'jinli', 'wall']
      return featured.flatMap((id) => {
        const place = PLACES.find((item) => item.id === id)
        return place ? [place] : []
      })
    }
    return PLACES.filter(
      (place) => place.name.includes(keyword) || place.city.includes(keyword) || place.tags.some((tag) => tag.includes(keyword)),
    )
  }, [keyword])
  const namedCity = latest?.trip.city
  const focusCity = namedCity && CITIES.some((city) => city.name === namedCity) ? namedCity : homeCity
  const [weather, setWeather] = useState('')

  useEffect(() => {
    let stop = false
    setWeather('')
    void loadWeather(focusCity, isoShift(new Date(), 0), 1).then((result) => {
      if (stop) return
      const day = result.days[0]
      setWeather(day?.known ? `${day.label} ${day.tempMin}–${day.tempMax}°` : '')
    })
    return () => {
      stop = true
    }
  }, [focusCity])

  return (
    <div className="page">
      <header className="top home-bar">
        <div className="home-title">
          <strong>途灵</strong>
          <button type="button" className="home-meta" onClick={() => onCity(focusCity)}>
            <b>{focusCity}</b>
            {weather ? <span>{weather}</span> : null}
          </button>
        </div>
        <label className="search">
          <span className="sr">搜索</span>
          <input value={query} placeholder="搜索城市、景点" onChange={(event) => setQuery(event.target.value)} />
        </label>
      </header>
      <div className="scroll">
        <section className="home-panel">
          <div className="home-actions">
            <button type="button" className="home-action" onClick={() => onCreate(draftFromQuery(keyword))}>
              <b>{keyword ? `生成「${keyword}」` : '生成攻略'}</b>
              <small>一次给出三套走法</small>
            </button>
            <button type="button" className="home-action quiet" onClick={() => onCustom(draftFromQuery(keyword).city)}>
              <b>自己排</b>
              <small>天气、三餐、住宿</small>
            </button>
          </div>
          {latest && !keyword ? (
            <button type="button" className="home-recent" onClick={() => onOpenGuide(latest.id)}>
              <span>最近</span>
              <b>
                {latest.trip.city} · {tripKindName(latest.trip)} · {latest.trip.days}天
              </b>
            </button>
          ) : null}
        </section>

        <section>
          <div className="sec-head">
            <h2>目的地</h2>
          </div>
          {cities.length === 0 ? <p className="muted pad">没有这个城市，仍可以用上面的按钮生成攻略</p> : null}
          <div className="hscroll">
            {cities.map((city) => (
              <button key={city.name} type="button" className="city-card" onClick={() => onCity(city.name)}>
                <Photo src={city.image} alt={city.name} />
                <span>
                  <b>{city.name}</b>
                  <small>{city.line}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="sec-head">
            <h2>{keyword ? '景点' : '攻略里常见的点'}</h2>
          </div>
          {places.length === 0 ? <p className="muted pad">没有匹配的景点</p> : null}
          {places.map((place) => (
            <div key={place.id} className="poi">
              <button type="button" className="poi-main" onClick={() => onPlace(place.id)}>
                <Photo src={place.image} alt={place.name} />
                <span>
                  <b>{place.name}</b>
                  <em>
                    {place.city} · {place.tags.join(' / ')}
                  </em>
                  <small>{place.blurb}</small>
                </span>
              </button>
              <button
                type="button"
                className={savedIds.includes(place.id) ? 'save on' : 'save'}
                aria-pressed={savedIds.includes(place.id)}
                onClick={() => onToggleSave(place.id)}
              >
                {savedIds.includes(place.id) ? '已藏' : '收藏'}
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function draftFromQuery(keyword: string): CreateDraft {
  if (!keyword) return {}
  const city = CITIES.find((item) => item.name.includes(keyword))
  if (city) return { city: city.name }
  const place = PLACES.find((item) => item.name.includes(keyword) || keyword.includes(item.name))
  if (place) return { city: place.city }
  return { city: keyword }
}
