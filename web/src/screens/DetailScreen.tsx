import { useMemo, useState } from 'react'

import { saveSharedTrip } from '../api'
import { AppMap } from '../components/AppMap'
import { Photo } from '../components/Photo'
import { withStay } from '../custom/schedule'
import { photoFor } from '../data/places'
import { STYLE_META, TYPE_LABEL, costTotal, tripKindName, yuan } from '../format'
import type { ItineraryItem, Trip } from '../types'

interface DetailScreenProps {
  trip: Trip
  notice?: string | null
  onBack: () => void
  onShare?: () => void
  onSave?: () => void
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function DetailScreen({ trip, notice, onBack, onShare, onSave }: DetailScreenProps): React.ReactElement {
  const view = useMemo(() => withStay(trip), [trip])
  const [dayIndex, setDayIndex] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tilesDown, setTilesDown] = useState(false)
  const [savedNote, setSavedNote] = useState<string | null>(null)
  const [linkNote, setLinkNote] = useState<string | null>(null)
  const day = view.itinerary[dayIndex]
  const items = day?.items ?? []
  const sum = costTotal(view.cost_breakdown)
  const hotelOn = Boolean(trip.budget_includes_hotel) || view.cost_breakdown.hotel > 0
  const upcoming = nextItem(items)

  const copyLink = (): void => {
    void saveSharedTrip(view)
      .then(async ({ id }) => {
        const url = `${window.location.origin}/share/${id}`
        const style = STYLE_META[trip.style]?.name ?? tripKindName(trip)
        const sentence = `我用途灵排了一份${trip.city}${trip.days}日行程（${style}）。按天写好了时间、吃饭和花费，需要的可以导入查看。 ${url}`
        try {
          await navigator.clipboard?.writeText(sentence)
          setLinkNote('已复制分享句和链接。')
        } catch {
          setLinkNote(url)
        }
      })
      .catch(() => {
        setLinkNote(`我在途灵排好了${trip.city}的行程，三套走法能直接对比。打开「社区」就能导入。`)
      })
  }

  return (
    <div className="page workbench-body">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>
          {trip.city} · {tripKindName(trip)}
        </h1>
        <button type="button" className="nav-btn" onClick={copyLink}>
          复制链接
        </button>
      </header>
      <div className="workbench-scroll">
        <div className="workbench-main">
          {notice ? <p className="banner">{notice}</p> : null}
          <p className="hint pad">
            {hotelOn ? '住宿已按估算计入，并在费用中单独列出。' : '下列花费含门票、餐饮和市内交通，住宿未计入。'}
          </p>
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
              <b>{yuan(sum / Math.max(trip.people, 1))}</b>
            </div>
          </section>
          <p className="budget-line">
            交通 {yuan(view.cost_breakdown.transport)} · 餐饮 {yuan(view.cost_breakdown.food)} · 门票{' '}
            {yuan(view.cost_breakdown.tickets)} · 住宿 {yuan(view.cost_breakdown.hotel)}
          </p>
          {view.route_rationale ? <p className="hint pad">{view.route_rationale}</p> : null}
          <div className="day-line">
            {view.itinerary.map((item, index) => (
              <button key={item.day} type="button" className={index === dayIndex ? 'on' : ''} onClick={() => { setDayIndex(index); setActiveId(null); setTilesDown(false) }}>
                第{item.day}天
              </button>
            ))}
          </div>
          <h2 className="day-theme">{day ? `第 ${day.day} 天 · ${day.zone || '片区'} · ${day.theme}` : '行程'}</h2>
          {items.map((item, index) => (
            <article key={`${item.time_start}-${item.title}`} className="guide-stop">
              <button type="button" className="poi-main" onClick={() => setActiveId(`${dayIndex}-${index}`)}>
                <span className="num-badge">{index + 1}</span>
                <span>
                  <em>
                    {item.time_start}–{item.time_end} · {TYPE_LABEL[item.type]} · {priceLabel(item.type, item.cost_estimate)}
                  </em>
                  <b>{item.title}</b>
                </span>
              </button>
              <Photo src={photoFor(item.title)} alt={item.title} />
              {item.description ? <p>{item.description}</p> : null}
              {item.transport_to_next ? <p className="leg">{legLine(item.transport_to_next.mode, item.transport_to_next.duration_min)}</p> : null}
            </article>
          ))}
          {activeId ? <PlaceCard item={items[Number(activeId.split('-')[1])] } onClose={() => setActiveId(null)} /> : null}
        </div>
        <aside className="workbench-side">
          <p className="hint pad">地图按当天先后顺序标注，仅表示走法，不提供导航。</p>
          <div className="workbench-map">
            <AppMap
              className="map-box"
              route
              activeId={activeId ?? undefined}
              onPick={setActiveId}
              onTileFailure={() => setTilesDown(true)}
              points={items.map((item, index) => ({
                id: `${dayIndex}-${index}`,
                name: item.title,
                lat: item.poi.lat,
                lng: item.poi.lng,
              }))}
            />
            {tilesDown ? <div className="map-fallback">地图瓦片没有加载。当天的时间线仍可查看。</div> : null}
          </div>
        </aside>
      </div>
      <div className="dock dock-row">
        <button
          type="button"
          className="primary"
          onClick={() => {
            onSave?.()
            setSavedNote('已保存在攻略。')
          }}
        >
          保存到攻略
        </button>
        {onShare ? (
          <button type="button" className="ghost" onClick={onShare}>
            分享到社区
          </button>
        ) : null}
      </div>
      {savedNote || linkNote ? <p className="hint pad">{savedNote || linkNote}</p> : null}
      <div className="next-dock">
        <span>
          <small>下一站</small>
          <b>{upcoming ? `${upcoming.time_start} ${upcoming.title}` : '这一天还没有安排'}</b>
        </span>
      </div>
    </div>
  )
}

function PlaceCard({ item, onClose }: { item: ItineraryItem | undefined; onClose: () => void }): React.ReactElement | null {
  if (!item) return null
  const closed = (item.closed_weekdays ?? []).map((day) => WEEKDAYS[day] ?? '').filter(Boolean)
  const source = item.sources[0]
  return (
    <section className="place-card">
      <header className="nav" style={{ border: 0, height: 'auto', display: 'flex', justifyContent: 'space-between' }}>
        <b>{item.title}</b>
        <button type="button" className="nav-btn" onClick={onClose}>
          关闭
        </button>
      </header>
      <dl>
        <div>
          <dt>停留</dt>
          <dd>{item.duration_min} 分钟</dd>
        </div>
        <div>
          <dt>门票</dt>
          <dd>{item.ticket_price ? `${yuan(item.ticket_price)}/人` : item.cost_estimate ? yuan(item.cost_estimate) : '免费'}</dd>
        </div>
        <div>
          <dt>贴士</dt>
          <dd>{item.tips || '按目录简介安排。'}</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>{source ? source.title : '来源写在目录简介里。'}</dd>
        </div>
        <div>
          <dt>闭馆日</dt>
          <dd>{closed.length ? closed.join('、') : '没有标注闭馆日。'}</dd>
        </div>
      </dl>
    </section>
  )
}

function nextItem(items: ItineraryItem[]): ItineraryItem | undefined {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return items.find((item) => toMinutes(item.time_end) > minutes) ?? items[0]
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0
  return hour * 60 + minute
}

function legLine(mode: string, minutes: number): string {
  if (mode === 'walk') return `步行约 ${minutes} 分钟`
  if (mode === 'transit') return `公交约 ${minutes} 分钟（时间为粗算）`
  return `约 ${minutes} 分钟（时间为粗算）`
}

function priceLabel(type: string, cost: number): string {
  if (cost === 0) return '免费'
  if (type === 'hotel') return `${yuan(cost)}/间`
  if (type === 'meal') return `${yuan(cost)}/人`
  return yuan(cost)
}
