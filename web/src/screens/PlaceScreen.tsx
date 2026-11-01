import { Photo } from '../components/Photo'
import { PLACES } from '../data/places'

interface PlaceScreenProps {
  placeId: string
  saved: boolean
  onBack: () => void
  onToggleSave: () => void
  onCreate: () => void
}

export function PlaceScreen({ placeId, saved, onBack, onToggleSave, onCreate }: PlaceScreenProps): React.ReactElement {
  const place = PLACES.find((item) => item.id === placeId)
  if (!place) {
    return (
      <div className="page">
        <header className="nav">
          <button type="button" className="nav-btn" onClick={onBack}>
            返回
          </button>
          <h1>景点</h1>
          <span />
        </header>
        <p className="muted pad">没有这个景点。</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="cover">
        <Photo src={place.image} alt={place.name} />
        <button type="button" className="cover-back" onClick={onBack}>
          返回
        </button>
        <div className="cover-name">
          <h1>{place.name}</h1>
          <p>
            {place.city} · {place.tags.join(' / ')}
          </p>
        </div>
      </div>
      <div className="scroll place-copy">
        <p>{place.blurb}</p>
      </div>
      <div className="dock dock-row">
        <button type="button" className={saved ? 'ghost on' : 'ghost'} onClick={onToggleSave}>
          {saved ? '已收藏' : '收藏'}
        </button>
        <button type="button" className="primary" onClick={onCreate}>
          生成{place.city}攻略
        </button>
      </div>
    </div>
  )
}
