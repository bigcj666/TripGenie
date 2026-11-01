import { useEffect, useState } from 'react'

import { listCommunity, publishCommunity, type CommunityPost } from '../api'
import { forShare } from '../custom/schedule'
import { STYLE_META, tripKindName } from '../format'
import type { SavedTrip, ShareRecord } from '../storage'
import type { TravelStyle, Trip } from '../types'

interface CommunityScreenProps {
  author: string
  trips: SavedTrip[]
  draft: Trip | null
  onDraftHandled: () => void
  onOpen: (id: string) => void
  onPublished: (share: ShareRecord) => void
}

const CITIES = ['全部', '杭州', '成都', '西安']

export function CommunityScreen({ author, trips, draft, onDraftHandled, onOpen, onPublished }: CommunityScreenProps): React.ReactElement {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [city, setCity] = useState('全部')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState<Trip | null>(null)
  const [picking, setPicking] = useState(false)

  const reload = (): void => {
    setLoading(true)
    void listCommunity().then(
      (rows) => {
        setPosts(rows)
        setError(null)
        setLoading(false)
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : '社区暂时连不上')
        setLoading(false)
      },
    )
  }

  useEffect(() => {
    reload()
  }, [])

  useEffect(() => {
    if (!draft) return
    setPicking(false)
    setComposing(draft)
    onDraftHandled()
  }, [draft, onDraftHandled])

  if (composing) {
    return (
      <Compose
        author={author}
        trip={composing}
        onBack={() => setComposing(null)}
        onDone={(share) => {
          onPublished(share)
          setComposing(null)
          setCity('全部')
          reload()
        }}
      />
    )
  }

  if (picking) {
    return (
      <PickList
        trips={trips}
        onBack={() => setPicking(false)}
        onChoose={(trip) => {
          setPicking(false)
          setComposing(forShare(trip))
        }}
      />
    )
  }

  const shown = city === '全部' ? posts : posts.filter((post) => post.city === city)

  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>社区</h1>
        <button type="button" className="nav-btn" onClick={() => setPicking(true)}>
          分享
        </button>
      </header>
      <div className="scroll">
        <div className="chips pad-chips">
          {CITIES.map((name) => (
            <button key={name} type="button" className={city === name ? 'chip on' : 'chip'} onClick={() => setCity(name)}>
              {name}
            </button>
          ))}
        </div>
        <p className="hint pad">看看别人怎么排的，也可以把自己的攻略发上来。导入后保存在这台设备的攻略里。</p>
        {error ? <p className="hint pad">{error}</p> : null}
        {loading && posts.length === 0 ? <p className="muted pad">正在加载…</p> : null}
        {!loading && !error && shown.length === 0 ? (
          <div className="empty">
            <p>还没有人分享{city === '全部' ? '' : city}的攻略</p>
            <button type="button" className="primary" onClick={() => setPicking(true)}>
              分享我的攻略
            </button>
          </div>
        ) : (
          <div className="post-list">
            {shown.map((post) => (
              <button key={post.id} type="button" className="post-card" onClick={() => onOpen(post.id)}>
                <span className="post-who">
                  <i>{post.author.slice(0, 1)}</i>
                  <b>{post.author}</b>
                  <small>{postedAt(post.created_at)}</small>
                </span>
                <strong>
                  {post.city} · {post.days}天{styleName(post.style) ? ` · ${styleName(post.style)}` : ''}
                </strong>
                <p>{post.note || post.summary}</p>
                <em>{post.comment_count} 条留言</em>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PickList({ trips, onBack, onChoose }: { trips: SavedTrip[]; onBack: () => void; onChoose: (trip: Trip) => void }): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>选择攻略</h1>
        <span />
      </header>
      <div className="scroll">
        <p className="hint pad">发出去之后，别人可以留言，也可以导入到自己的攻略里。</p>
        {trips.length === 0 ? (
          <div className="empty">
            <p>还没有可分享的攻略</p>
            <small className="muted">先生成一套，或自己排一套。</small>
          </div>
        ) : (
          <div className="set-group">
            {trips.map((item) => (
              <button key={item.id} type="button" className="set-row" onClick={() => onChoose(item.trip)}>
                <span>
                  {item.trip.city} · {tripKindName(item.trip)}
                </span>
                <em>
                  {item.trip.days}天 · {item.trip.people}人
                </em>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Compose({
  author,
  trip,
  onBack,
  onDone,
}: {
  author: string
  trip: Trip
  onBack: () => void
  onDone: (share: ShareRecord) => void
}): React.ReactElement {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const publish = (): void => {
    setSending(true)
    setError(null)
    void publishCommunity(author, note.trim(), trip)
      .then((result) => onDone({ id: result.id, token: result.token }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '发布失败')
        setSending(false)
      })
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>分享攻略</h1>
        <button type="button" className="nav-btn" onClick={publish} disabled={sending}>
          发布
        </button>
      </header>
      <div className="scroll form">
        <p className="hint">
          {trip.city} · {trip.days}天 · {trip.people}人 · {tripKindName(trip)}
        </p>
        <label htmlFor="share-note">给别人看的一句说明</label>
        <textarea id="share-note" maxLength={80} value={note} placeholder="比如适合谁、哪天去的、雨天怎么改" onChange={(event) => setNote(event.target.value)} />
        <small className="muted">会显示你的昵称「{author}」。这份说明最多 80 字。</small>
        {error ? <p className="hint">{error}</p> : null}
        {sending ? <p className="hint">正在发布…</p> : null}
      </div>
    </div>
  )
}

function styleName(style: string): string {
  if (style === 'compact' || style === 'relaxed' || style === 'economy') return STYLE_META[style as TravelStyle].name
  return ''
}

function postedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  if (sameDay) return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
