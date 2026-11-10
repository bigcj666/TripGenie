import { useEffect, useState } from 'react'

import { listCommunity, publishCommunity, readCommunity, type CommunityPost } from '../api'
import { forShare } from '../custom/schedule'
import { tripKindName } from '../format'
import type { SavedTrip, ShareRecord } from '../storage'
import type { Trip } from '../types'

interface CommunityScreenProps {
  author: string
  trips: SavedTrip[]
  draft: Trip | null
  onDraftHandled: () => void
  onOpen: (id: string) => void
  onPublished: (share: ShareRecord) => void
  onImport: (trip: Trip) => void
  onCoverChange?: (covered: boolean) => void
}

const CITIES = ['全部', '杭州', '成都', '西安']

export function CommunityScreen({ author, trips, draft, onDraftHandled, onOpen, onPublished, onImport, onCoverChange }: CommunityScreenProps): React.ReactElement {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [city, setCity] = useState('全部')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState<Trip | null>(null)
  const [picking, setPicking] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    onCoverChange?.(Boolean(composing || picking))
  }, [composing, picking, onCoverChange])

  useEffect(() => {
    let stop = false
    setLoading(true)
    void listCommunity(city === '全部' ? undefined : city).then(
      (rows) => {
        if (stop) return
        setPosts(rows)
        setError(null)
        setLoading(false)
      },
      (err: unknown) => {
        if (stop) return
        setPosts([])
        setError(err instanceof Error ? err.message : '社区暂时连不上')
        setLoading(false)
      },
    )
    return () => {
      stop = true
    }
  }, [city, reloadKey])

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
          setNotice('已分享到社区。如需撤回，请在这台设备上操作。')
          if (city === '全部') setReloadKey((value) => value + 1)
          else setCity('全部')
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
        <h2 className="day-theme">看看别人怎么排。</h2>
        <p className="hint pad">浏览同行行程，留言交流，或导入到自己的攻略。</p>
        {notice ? <p className="banner">{notice}</p> : null}
        {error ? <p className="error pad">{error}</p> : null}
        {loading && posts.length === 0 ? <p className="muted pad">正在加载…</p> : null}
        {!loading && !error && posts.length === 0 ? (
          <div className="empty">
            {city === '全部' ? (
              <>
                <h2>社区还很安静。</h2>
                <p>把你排好的行程发出来，给同行人一个可直接导入的参考。</p>
              </>
            ) : (
              <>
                <h2>这个城市还没有分享。</h2>
                <p>这个城市还没有分享，换个城市，或先发一套你的行程。</p>
              </>
            )}
            <button type="button" className="primary" onClick={() => setPicking(true)}>
              分享我的行程
            </button>
          </div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card static">
                <span className="post-who">
                  <i>{post.author.slice(0, 1)}</i>
                  <b>{post.author}</b>
                  <small>{postedAt(post.created_at)}</small>
                </span>
                <strong>
                  {post.city} · {post.days}天 · {post.people}人
                </strong>
                <p>{post.note || post.summary}</p>
                <div className="post-actions">
                  <button type="button" onClick={() => onOpen(post.id)}>
                    查看详情
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      void readCommunity(post.id).then((detail) => {
                        onImport(detail.trip)
                        setNotice('已导入到「攻略」，可以打开查看或再调整。')
                      })
                    }}
                  >
                    导入到我的攻略
                  </button>
                </div>
              </article>
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
            <h2>还没有保存的行程。</h2>
            <p>生成一套，或从社区导入别人的安排，就会出现在这里。</p>
            <button type="button" className="primary" onClick={onBack}>
              返回
            </button>
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

function postedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  if (sameDay) return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
