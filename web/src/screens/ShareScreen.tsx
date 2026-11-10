import { useEffect, useState } from 'react'

import { readSharedTrip } from '../api'
import { STYLE_META, tripKindName, yuan } from '../format'
import { loadTrips, saveTrips, type SavedTrip } from '../storage'
import type { Trip } from '../types'

interface ShareScreenProps {
  id: string
}

export function ShareScreen({ id }: ShareScreenProps): React.ReactElement {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [missing, setMissing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    void readSharedTrip(id).then(
      (data) => {
        if (!stop) setTrip(data)
      },
      () => {
        if (!stop) setMissing(true)
      },
    )
    return () => {
      stop = true
    }
  }, [id])

  if (missing) {
    return (
      <div className="page">
        <div className="empty">
          <h2>这份分享打不开。</h2>
          <p>链接可能已失效。可以回到首页，重新生成一套行程。</p>
          <a className="primary" href="/" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>
            回到首页
          </a>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="page">
        <p className="hint pad">正在打开这套行程…</p>
      </div>
    )
  }

  const style = STYLE_META[trip.style]
  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>
          {trip.city} · {trip.days}天
        </h1>
        <span />
      </header>
      <div className="scroll with-dock">
        <p className="hint pad">{style?.line ?? '按天写好了时间、吃饭和花费。'}</p>
        <p className="pad">
          我用途灵排了一份{trip.city}
          {trip.days}日行程（{style?.name ?? tripKindName(trip)}）。按天写好了时间、吃饭和花费，需要的可以导入查看。
        </p>
        {notice ? <p className="banner">{notice}</p> : null}
        <p className="budget-line">
          门票 {yuan(trip.cost_breakdown.tickets)} · 餐饮 {yuan(trip.cost_breakdown.food)} · 交通 {yuan(trip.cost_breakdown.transport)}
        </p>
        {trip.itinerary.map((day) => (
          <section key={day.day} className="post-day">
            <h2>
              第 {day.day} 天 · {day.zone || '片区'} · {day.theme}
            </h2>
            {day.items.map((item, index) => (
              <p key={`${item.time_start}-${item.title}`}>
                <em>
                  {index + 1}. {item.time_start}
                </em>
                {item.title}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div className="dock">
        <button
          type="button"
          className="primary"
          onClick={() => {
            const copy: Trip = { ...trip, trip_id: `import-${Date.now()}` }
            const row: SavedTrip = { id: copy.trip_id, savedAt: Date.now(), engine: 'share', trip: copy }
            const next = [row, ...loadTrips().filter((item) => item.id !== row.id)].slice(0, 30)
            saveTrips(next)
            setNotice('已导入到「攻略」，可以打开查看或再调整。')
          }}
        >
          导入到我的攻略
        </button>
      </div>
    </div>
  )
}
