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

export function CommunityScreen({
  author,
  trips,
  draft,
  onDraftHandled,
  onOpen,
  onPublished,
  onImport,
  onCoverChange,
}: CommunityScreenProps): React.ReactElement {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [city, setCity] = useState('全部')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [writing, setWriting] = useState(false)
  const [attached, setAttached] = useState<Trip | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    onCoverChange?.(writing)
  }, [writing, onCoverChange])

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
    setAttached(draft)
    setWriting(true)
    onDraftHandled()
  }, [draft, onDraftHandled])

  if (writing) {
    return (
      <Compose
        author={author}
        trips={trips}
        attached={attached}
        onAttach={setAttached}
        onBack={() => {
          setWriting(false)
          setAttached(null)
        }}
        onDone={(share) => {
          onPublished(share)
          setWriting(false)
          setAttached(null)
          setNotice('已分享到社区。如需撤回，请在这台设备上操作。')
          if (city === '全部') setReloadKey((value) => value + 1)
          else setCity('全部')
        }}
      />
    )
  }

  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>社区</h1>
        <button type="button" className="nav-action" onClick={() => setWriting(true)}>
          写点评
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
        <h2 className="day-theme">看看别人怎么逛。</h2>
        <p className="hint pad">写下真实感受，照片和行程都可以附上。</p>
        {notice ? <p className="banner">{notice}</p> : null}
        {error ? <p className="error pad">{error}</p> : null}
        {loading && posts.length === 0 ? <p className="muted pad">正在加载…</p> : null}
        {!loading && !error && posts.length === 0 ? (
          <div className="empty">
            {city === '全部' ? (
              <>
                <h2>社区还很安静。</h2>
                <p>发一条带照片的点评，也可以附上你排好的行程。</p>
              </>
            ) : (
              <>
                <h2>这个城市还没有点评。</h2>
                <p>这个城市还没有分享，换个城市，或先发一套你的行程。</p>
              </>
            )}
            <button type="button" className="primary" onClick={() => setWriting(true)}>
              写一篇点评
            </button>
          </div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <button type="button" className="post-open" onClick={() => onOpen(post.id)}>
                  <span className="post-who">
                    <i>{post.author.slice(0, 1)}</i>
                    <b>{post.author}</b>
                    <small>{postedAt(post.created_at)}</small>
                  </span>
                  <p>{post.note || post.summary}</p>
                  <PhotoGrid photos={post.photos ?? []} />
                </button>
                {post.has_trip ? (
                  <div className="trip-attach">
                    <button type="button" onClick={() => onOpen(post.id)}>
                      <b>
                        {post.city} · {post.days}天 · {post.people}人
                      </b>
                      <span>{(post.highlights ?? []).slice(0, 2).join('、') || post.summary}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void readCommunity(post.id).then((detail) => {
                          if (!detail.trip) return
                          onImport(detail.trip)
                          setNotice('已导入到「攻略」，可以打开查看或再调整。')
                        })
                      }}
                    >
                      导入
                    </button>
                  </div>
                ) : null}
                <button type="button" className="post-comments" onClick={() => onOpen(post.id)}>
                  {post.comment_count} 条留言
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoGrid({ photos }: { photos: string[] }): React.ReactElement | null {
  if (!photos.length) return null
  const count = photos.length >= 3 ? 3 : photos.length
  return (
    <div className={`photo-grid n${count}`}>
      {photos.slice(0, 6).map((src) => (
        <img key={src} src={src} alt="" />
      ))}
    </div>
  )
}

function Compose({
  author,
  trips,
  attached,
  onAttach,
  onBack,
  onDone,
}: {
  author: string
  trips: SavedTrip[]
  attached: Trip | null
  onAttach: (trip: Trip | null) => void
  onBack: () => void
  onDone: (share: ShareRecord) => void
}): React.ReactElement {
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showTrips, setShowTrips] = useState(false)

  const publish = (): void => {
    if (!note.trim() && photos.length === 0 && !attached) {
      setError('写一点内容再发布')
      return
    }
    setSending(true)
    setError(null)
    void publishCommunity(author, note.trim(), attached, photos)
      .then((result) => onDone({ id: result.id, token: result.token }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '发布失败')
        setSending(false)
      })
  }

  const addPhotos = (files: FileList | null): void => {
    if (!files?.length) return
    const picked = [...files].slice(0, 6 - photos.length)
    void Promise.all(
      picked.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
              reject(new Error('只支持常见图片'))
              return
            }
            if (file.size > 1_200_000) {
              reject(new Error('有一张照片太大了'))
              return
            }
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ''))
            reader.onerror = () => reject(new Error('照片没有读出来'))
            reader.readAsDataURL(file)
          }),
      ),
    )
      .then((urls) => setPhotos((current) => [...current, ...urls].slice(0, 6)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '照片没有读出来'))
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>写点评</h1>
        <button type="button" className="nav-action" onClick={publish} disabled={sending}>
          发布
        </button>
      </header>
      <div className="scroll form">
        <p className="hint">以「{author}」发布。昵称来自「我的」。</p>
        <label htmlFor="share-note">这一趟怎么样</label>
        <textarea
          id="share-note"
          maxLength={400}
          value={note}
          placeholder="写下真实感受，好吃的、好逛的、想避开的都可以。"
          onChange={(event) => setNote(event.target.value)}
        />
        <label className="file-label">
          添加照片
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              addPhotos(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
        <PhotoGrid photos={photos} />
        {attached ? (
          <div className="trip-attach">
            <div>
              <b>
                {attached.city} · {attached.days}天 · {attached.people}人
              </b>
              <span>{highlightsOf(attached).join('、')}</span>
            </div>
            <button type="button" onClick={() => onAttach(null)}>
              移除
            </button>
          </div>
        ) : (
          <button type="button" className="ghost" onClick={() => setShowTrips((value) => !value)}>
            附上行程
          </button>
        )}
        {showTrips && !attached ? (
          trips.length === 0 ? (
            <p className="hint">还没有保存的行程。可以先发文字和照片。</p>
          ) : (
            <div className="set-group">
              {trips.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="set-row"
                  onClick={() => {
                    onAttach(forShare(item.trip))
                    setShowTrips(false)
                  }}
                >
                  <span>
                    {item.trip.city} · {tripKindName(item.trip)}
                  </span>
                  <em>
                    {item.trip.days}天
                  </em>
                </button>
              ))}
            </div>
          )
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        {sending ? <p className="hint">正在发布…</p> : null}
      </div>
    </div>
  )
}

function highlightsOf(trip: Trip): string[] {
  const names: string[] = []
  for (const day of trip.itinerary) {
    for (const item of day.items) {
      if (item.type === 'hotel') continue
      if (!names.includes(item.title)) names.push(item.title)
      if (names.length >= 2) return names
    }
  }
  return names
}

function postedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  if (sameDay) return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
