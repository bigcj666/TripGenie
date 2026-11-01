import { useMemo, useState } from 'react'

import { AppMap } from '../components/AppMap'
import { Photo } from '../components/Photo'
import { withStay } from '../custom/schedule'
import { photoFor } from '../data/places'
import { MODE_LABEL, TYPE_LABEL, costTotal, guideText, tripKindName, yuan } from '../format'
import type { Trip } from '../types'

interface DetailScreenProps {
  trip: Trip
  onBack: () => void
  onShare?: () => void
}

export function DetailScreen({ trip, onBack, onShare }: DetailScreenProps): React.ReactElement {
  const view = useMemo(() => withStay(trip), [trip])
  const [dayIndex, setDayIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copySheet, setCopySheet] = useState<string | null>(null)
  const day = view.itinerary[dayIndex]
  const items = day?.items ?? []
  const sum = costTotal(view.cost_breakdown)

  const copy = (): void => {
    const text = guideText(view)
    const mark = (): void => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
    if (!navigator.clipboard?.writeText) {
      setCopySheet(text)
      return
    }
    void navigator.clipboard.writeText(text).then(mark, () => setCopySheet(text))
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>
          {trip.city} · {tripKindName(trip)}
        </h1>
        <button type="button" className="nav-btn" onClick={copy}>
          {copied ? '已复制' : '复制'}
        </button>
      </header>
      <div className="scroll">
        <section className="budget">
          <div>
            <span>预算</span>
            <b>{yuan(view.budget_total)}</b>
          </div>
          <div>
            <span>估算</span>
            <b>{yuan(sum)}</b>
          </div>
          <div>
            <span>人均</span>
            <b>{yuan(sum / trip.people)}</b>
          </div>
        </section>
        <p className="budget-line">
          交通 {yuan(view.cost_breakdown.transport)} · 餐饮 {yuan(view.cost_breakdown.food)} · 门票{' '}
          {yuan(view.cost_breakdown.tickets)} · 住宿 {yuan(view.cost_breakdown.hotel)}
        </p>
        {view.preferences.includes('自定义') || view.preferences.includes('分享') ? <p className="hint pad">{view.summary}</p> : null}
        {onShare ? (
          <button type="button" className="share-row" onClick={onShare}>
            分享到社区
          </button>
        ) : null}

        <div className="day-line">
          {view.itinerary.map((item, index) => (
            <button key={item.day} type="button" className={index === dayIndex ? 'on' : ''} onClick={() => setDayIndex(index)}>
              第{item.day}天
            </button>
          ))}
        </div>
        <h2 className="day-theme">{day ? `第${day.day}天 · ${day.zone || day.theme}` : '行程'}</h2>

        {items.map((item) => (
          <article key={`${item.time_start}-${item.title}`} className="guide-stop">
            <em>
              {item.time_start}–{item.time_end} · {TYPE_LABEL[item.type]} · {priceLabel(item.type, item.cost_estimate)}
            </em>
            <b>{item.title}</b>
            <Photo src={photoFor(item.title)} alt={item.title} />
            {item.description ? <p>{item.description}</p> : null}
            {item.tips ? <p className="tip">{item.tips}</p> : null}
            {item.transport_to_next ? (
              <p className="leg">
                下一程 {MODE_LABEL[item.transport_to_next.mode]} {item.transport_to_next.duration_min} 分钟
                {item.transport_to_next.note ? ` · ${item.transport_to_next.note}` : ''}
              </p>
            ) : null}
          </article>
        ))}

        <h2 className="day-theme">当天位置</h2>
        <AppMap
          className="map-box"
          route
          points={items.map((item, index) => ({
            id: `${dayIndex}-${index}`,
            name: item.title,
            lat: item.poi.lat,
            lng: item.poi.lng,
          }))}
        />
        <p className="hint pad">只标这一天的先后顺序，不提供导航。</p>
      </div>
      {copySheet ? (
        <div className="sheet">
          <header>
            <b>攻略文本</b>
            <button type="button" onClick={() => setCopySheet(null)}>
              关闭
            </button>
          </header>
          <textarea readOnly value={copySheet} onFocus={(event) => event.currentTarget.select()} />
        </div>
      ) : null}
    </div>
  )
}

function priceLabel(type: string, cost: number): string {
  if (cost === 0) return '免费'
  if (type === 'hotel') return `${yuan(cost)}/间`
  if (type === 'meal') return `${yuan(cost)}/人`
  return yuan(cost)
}
