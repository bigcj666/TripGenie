import { Photo } from '../components/Photo'
import { cityImage, photoFor } from '../data/places'
import { tripKindName } from '../format'
import type { SavedTrip } from '../storage'

interface TripsScreenProps {
  trips: SavedTrip[]
  onCreate: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function TripsScreen({ trips, onCreate, onOpen, onDelete }: TripsScreenProps): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>攻略</h1>
        <button type="button" className="nav-btn" onClick={onCreate}>
          新建
        </button>
      </header>
      <div className="scroll">
        {trips.length === 0 ? (
          <div className="empty">
            <p>还没有攻略</p>
            <button type="button" className="primary" onClick={onCreate}>
              生成攻略
            </button>
          </div>
        ) : (
          trips.map((item) => {
            const first = item.trip.itinerary[0]?.items[0]
            return (
              <div key={item.id} className="trip-row">
                <button type="button" className="trip-main" onClick={() => onOpen(item.id)}>
                  <Photo src={photoFor(first?.title ?? '') || cityImage(item.trip.city)} alt={item.trip.city} />
                  <span>
                    <b>
                      {item.trip.city} · {tripKindName(item.trip)}
                    </b>
                    <small>
                      {item.trip.days}天 · {item.trip.people}人 · {formatDay(item.savedAt)}
                    </small>
                  </span>
                </button>
                <button type="button" className="text-danger" onClick={() => onDelete(item.id)}>
                  删除
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function formatDay(stamp: number): string {
  const date = new Date(stamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
