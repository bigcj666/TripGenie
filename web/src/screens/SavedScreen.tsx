import { Photo } from '../components/Photo'
import { PLACES } from '../data/places'
import type { CreateDraft } from '../nav'

interface SavedScreenProps {
  savedIds: string[]
  onBack: () => void
  onPlace: (placeId: string) => void
  onToggleSave: (placeId: string) => void
  onCreate: (draft: CreateDraft) => void
}

export function SavedScreen({ savedIds, onBack, onPlace, onToggleSave, onCreate }: SavedScreenProps): React.ReactElement {
  const places = PLACES.filter((place) => savedIds.includes(place.id))
  const city = dominantCity(savedIds)

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>收藏的景点</h1>
        <span />
      </header>
      <div className="scroll">
        {places.length === 0 ? (
          <div className="empty">
            <p>还没有收藏的景点</p>
            <small className="muted">在首页或城市页点「收藏」。自定义行程里，收藏的点会排在前面。</small>
          </div>
        ) : (
          places.map((place) => (
            <div key={place.id} className="poi">
              <button type="button" className="poi-main" onClick={() => onPlace(place.id)}>
                <Photo src={place.image} alt={place.name} />
                <span>
                  <b>{place.name}</b>
                  <em>{place.city}</em>
                  <small>{place.blurb}</small>
                </span>
              </button>
              <button type="button" className="save on" onClick={() => onToggleSave(place.id)}>
                已藏
              </button>
            </div>
          ))
        )}
      </div>
      {city ? (
        <div className="dock">
          <button type="button" className="primary" onClick={() => onCreate({ city })}>
            用收藏生成{city}攻略
          </button>
        </div>
      ) : null}
    </div>
  )
}

function dominantCity(ids: string[]): string | null {
  const counts = new Map<string, number>()
  for (const id of ids) {
    const place = PLACES.find((item) => item.id === id)
    if (!place) continue
    counts.set(place.city, (counts.get(place.city) ?? 0) + 1)
  }
  let best: string | null = null
  let score = 0
  for (const [city, count] of counts) {
    if (count > score) {
      best = city
      score = count
    }
  }
  return best
}
