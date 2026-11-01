import { Photo } from '../components/Photo'
import { CITIES, PLACES } from '../data/places'

interface CityScreenProps {
  city: string
  savedIds: string[]
  onBack: () => void
  onCreate: () => void
  onCustom: () => void
  onPlace: (placeId: string) => void
  onToggleSave: (placeId: string) => void
}

export function CityScreen({ city, savedIds, onBack, onCreate, onCustom, onPlace, onToggleSave }: CityScreenProps): React.ReactElement {
  const cover = CITIES.find((item) => item.name === city)
  const places = PLACES.filter((place) => place.city === city)

  return (
    <div className="page">
      <div className="cover">
        <Photo src={cover?.image ?? ''} alt={city} />
        <button type="button" className="cover-back" onClick={onBack}>
          返回
        </button>
        <div className="cover-name">
          <h1>{city}</h1>
          <p>{cover?.line ?? '看看这里的景点'}</p>
        </div>
      </div>
      <div className="scroll">
        {places.length === 0 ? <p className="muted pad">这城还没有收录景点，可以直接生成攻略。</p> : null}
        {places.map((place) => (
          <div key={place.id} className="poi">
            <button type="button" className="poi-main" onClick={() => onPlace(place.id)}>
              <Photo src={place.image} alt={place.name} />
              <span>
                <b>{place.name}</b>
                <em>{place.tags.join(' / ')}</em>
                <small>{place.blurb}</small>
              </span>
            </button>
            <button
              type="button"
              className={savedIds.includes(place.id) ? 'save on' : 'save'}
              onClick={() => onToggleSave(place.id)}
            >
              {savedIds.includes(place.id) ? '已藏' : '收藏'}
            </button>
          </div>
        ))}
      </div>
      <div className="dock dock-row">
        <button type="button" className="ghost" onClick={onCustom}>
          自定义
        </button>
        <button type="button" className="primary" onClick={onCreate}>
          生成{city}攻略
        </button>
      </div>
    </div>
  )
}
