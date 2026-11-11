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
          {/* 品牌名完整展示。若和右侧城市胶囊抢一行，需推广改一版，不要改短名称。 */}
          <strong>途灵 TripGenie</strong>
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
        <section className="home-hero">
          <h1>把想去的地方，排成走得通的几天。</h1>
          {/* 副标题按 14px 排，430px 内大约三行；若仍被裁切，需推广改一版，不要改这句。 */}
          <p>国内城市 1–5 日自由行。一次给出紧凑、松弛、省钱三套行程，按天看时间、花费和路线顺序。</p>
        </section>
        <div className="home-cta">
          <button type="button" className="primary" onClick={() => onCreate(draftFromQuery(keyword))}>
            {keyword ? `生成行程` : '生成行程'}
          </button>
          <button type="button" className="ghost" onClick={() => onCustom(draftFromQuery(keyword).city)}>
            自己排
          </button>
          <p className="home-note">按出发日天气排好时间段，景点留给你自己选；饭馆和住宿也可以随时更换。</p>
        </div>
        {latest && !keyword ? (
          <button type="button" className="home-recent" onClick={() => onOpenGuide(latest.id)}>
            <span>最近</span>
            <b>
              {latest.trip.city} · {tripKindName(latest.trip)} · {latest.trip.days}天
            </b>
          </button>
        ) : null}

        <section>
          <div className="sec-head">
            <h2>先从这些城市开始。</h2>
          </div>
          <p className="hint pad">杭州、成都、西安可直接生成；其他城市也能出行程，部分地点为估算。</p>
          {cities.length === 0 ? <p className="muted pad">没有这个城市，仍可以用上面的按钮生成行程</p> : null}
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

        <section className="trust" aria-label="可以对照的三点">
          <div>一次三套，数字可对比</div>
          <div>按片区排程，减少折返</div>
          <div>可保存、可分享、可导入</div>
        </section>

        <section className="block">
          <div className="sec-head">
            <h2>{keyword ? '景点' : '常见的地方'}</h2>
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
        <p className="page-foot">生成后可按天查看，并分享到社区。</p>
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
