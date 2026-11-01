import { useEffect, useMemo, useState } from 'react'

import { AppMap } from '../components/AppMap'
import { Photo } from '../components/Photo'
import { CITIES, PLACES, photoFor } from '../data/places'
import type { Trip } from '../types'

interface MapScreenProps {
  trip: Trip | null
  focusPlaceId: string | null
  initialDay: number
  onClearFocus: () => void
}

export function MapScreen({ trip, focusPlaceId, initialDay, onClearFocus }: MapScreenProps): React.ReactElement {
  const focusPlace = PLACES.find((place) => place.id === focusPlaceId) ?? null
  const [mode, setMode] = useState(focusPlace ? focusPlace.city : trip ? 'trip' : '杭州')
  const [dayIndex, setDayIndex] = useState(initialDay)
  const [activeId, setActiveId] = useState<string | null>(focusPlaceId)

  useEffect(() => {
    if (!focusPlace) return
    setMode(focusPlace.city)
    setActiveId(focusPlace.id)
  }, [focusPlace])

  const view = mode === 'trip' && trip ? 'trip' : mode === 'trip' ? '杭州' : mode
  const day = trip?.itinerary[dayIndex]
  const points = useMemo(() => {
    if (view === 'trip' && day) {
      return day.items.map((item, index) => ({
        id: `${dayIndex}-${index}`,
        name: item.title,
        lat: item.poi.lat,
        lng: item.poi.lng,
        image: photoFor(item.title),
        blurb: item.tips || item.description,
      }))
    }
    return PLACES.filter((place) => place.city === view).map((place) => ({
      id: place.id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      image: place.image,
      blurb: place.blurb,
    }))
  }, [view, day, dayIndex])

  const selected = points.find((point) => point.id === activeId) ?? points[0]

  return (
    <div className="page map-page">
      <header className="nav">
        <span />
        <h1>地图</h1>
        <span />
      </header>
      <div className="chips map-chips">
        {trip ? (
          <button
            type="button"
            className={view === 'trip' ? 'chip on' : 'chip'}
            onClick={() => {
              setMode('trip')
              setActiveId(null)
              onClearFocus()
            }}
          >
            当前行程
          </button>
        ) : null}
        {CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            className={view === city.name ? 'chip on' : 'chip'}
            onClick={() => {
              setMode(city.name)
              setActiveId(null)
              onClearFocus()
            }}
          >
            {city.name}
          </button>
        ))}
      </div>
      {view === 'trip' && trip ? (
        <div className="chips map-chips">
          {trip.itinerary.map((item, index) => (
            <button
              key={item.day}
              type="button"
              className={index === dayIndex ? 'chip on' : 'chip'}
              onClick={() => {
                setDayIndex(index)
                setActiveId(`${index}-0`)
              }}
            >
              第{item.day}天
            </button>
          ))}
        </div>
      ) : null}
      <div className="map-fill">
        <AppMap
          className="map-fill-inner"
          route={view === 'trip'}
          activeId={selected?.id}
          points={points}
          onPick={setActiveId}
        />
      </div>
      {selected ? <PlaceSheet name={selected.name} image={selected.image} blurb={selected.blurb} /> : null}
    </div>
  )
}

function PlaceSheet({ name, image, blurb }: { name: string; image: string; blurb: string }): React.ReactElement {
  return (
    <div className="map-sheet">
      <Photo src={image} alt={name} />
      <span>
        <b>{name}</b>
        <small>{blurb}</small>
      </span>
    </div>
  )
}
