import { useState } from 'react'

import { Photo } from '../components/Photo'
import { cityImage, photoFor } from '../data/places'
import { tripKindName } from '../format'
import type { SavedTrip } from '../storage'

interface TripsScreenProps {
  trips: SavedTrip[]
  onCreate: () => void
  onCommunity: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function TripsScreen({ trips, onCreate, onCommunity, onOpen, onDelete }: TripsScreenProps): React.ReactElement {
  const [menuId, setMenuId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>攻略</h1>
        <button type="button" className="nav-action" onClick={onCreate}>
          生成行程
        </button>
      </header>
      <div className="scroll">
        <p className="hint pad">打开即可按天查看，不需要的可以删除。</p>
        {trips.length === 0 ? (
          <div className="empty">
            <h2>还没有保存的行程。</h2>
            <p>生成一套，或从社区导入别人的安排，就会出现在这里。</p>
            <div className="empty-actions">
              <button type="button" className="primary" onClick={onCreate}>
                生成行程
              </button>
              <button type="button" className="ghost" onClick={onCommunity}>
                去社区看看
              </button>
            </div>
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
                <button type="button" className="nav-btn" aria-label="更多" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
                  ···
                </button>
                {menuId === item.id ? (
                  <button type="button" className="text-danger" onClick={() => setPendingDelete(item.id)}>
                    删除
                  </button>
                ) : null}
              </div>
            )
          })
        )}
      </div>
      {pendingDelete ? (
        <div className="dialog">
          <article>
            <p>删除后不可恢复，确定删除这套行程吗？</p>
            <button
              type="button"
              className="primary"
              onClick={() => {
                onDelete(pendingDelete)
                setPendingDelete(null)
                setMenuId(null)
              }}
            >
              删除
            </button>
            <button type="button" className="ghost" onClick={() => setPendingDelete(null)}>
              取消
            </button>
          </article>
        </div>
      ) : null}
    </div>
  )
}

function formatDay(stamp: number): string {
  const date = new Date(stamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
