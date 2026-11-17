import { useEffect, useRef, useState } from 'react'

import { listCommunity, publishCommunity, readCommunity, type CommunityPost } from '../api'
import { forShare } from '../custom/schedule'
import { cityImage } from '../data/places'
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
  onImport: (trip: Trip, sourceId?: string) => void
  onCoverChange?: (covered: boolean) => void
}

const CITIES = ['全部', '杭州', '成都', '西安']
const feedMemory = { city: '全部', top: 0 }
let pullStart = 0

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
  const [city, setCity] = useState(feedMemory.city)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [writing, setWriting] = useState(false)
  const [attached, setAttached] = useState<Trip | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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
          window.requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = feedMemory.top
          })
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
      <header className="feed-top">
        <div className="feed-top-row">
          <h1>看看别人怎么排。</h1>
          {/* 右上发布入口用全文。若 430px 和标题抢一行，需推广改一版，不要缩短。 */}
          <button type="button" className="text-publish" onClick={() => setWriting(true)}>
            分享我的行程
          </button>
        </div>
        <p>浏览同行行程，留言交流，或导入到自己的攻略。</p>
      </header>
      <div
        className="scroll"
        ref={scrollRef}
        onScroll={(event) => {
          feedMemory.top = event.currentTarget.scrollTop
          feedMemory.city = city
        }}
        onTouchStart={(event) => {
          pullStart = event.touches[0]?.clientY ?? 0
        }}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientY ?? pullStart
          if ((scrollRef.current?.scrollTop ?? 0) <= 0 && end - pullStart > 72) setReloadKey((value) => value + 1)
        }}
      >
        <div className="chips pad-chips">
          {CITIES.map((name) => (
            <button key={name} type="button" className={city === name ? 'chip on' : 'chip'} onClick={() => setCity(name)}>
              {name}
            </button>
          ))}
        </div>
        {notice ? <p className="banner">{notice}</p> : null}
        {error ? (
          <div className="empty">
            <h2>网络不太稳定，请再试一次。</h2>
            <p>社区暂时没有打开，已填的内容还在这台设备上。</p>
            <button type="button" className="primary" onClick={() => setReloadKey((value) => value + 1)}>
              重试
            </button>
          </div>
        ) : null}
        {loading && posts.length === 0 ? (
          <div className="post-list">
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : null}
        {!loading && !error && posts.length === 0 ? (
          <div className="empty">
            {city === '全部' ? (
              <>
                <h2>社区还很安静。</h2>
                <p>把你排好的行程发出来，给同行人一个可直接导入的参考。</p>
              </>
            ) : (
              <h2>这个城市还没有分享，换个城市，或先发一套你的行程。</h2>
            )}
            <button type="button" className="primary" onClick={() => setWriting(true)}>
              分享我的行程
            </button>
          </div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card" onClick={() => onOpen(post.id)}>
                <div className="post-who">
                  <i>{post.author.slice(0, 1)}</i>
                  <span>
                    <b>{post.author}</b>
                    <small>{postedAt(post.created_at)}</small>
                  </span>
                </div>
                <ClampText text={post.note || ''} />
                <PhotoGrid
                  photos={post.photos ?? []}
                  onOpen={(index) => setViewer({ photos: post.photos ?? [], index })}
                />
                {post.has_trip ? (
                  <div className="trip-attach">
                    <img src={(post.photos ?? [])[0] || cityImage(post.city)} alt="" />
                    <span>
                      <b>{(post.highlights ?? []).slice(0, 2).join('、') || post.summary || post.city}</b>
                      <small>
                        {post.city} · {post.days}天 · {post.people}人
                      </small>
                    </span>
                  </div>
                ) : null}
                <div className="post-foot" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="text-link" onClick={() => onOpen(post.id)}>
                    留言 {post.comment_count}
                  </button>
                  <span>
                    <button type="button" className="text-link" onClick={() => onOpen(post.id)}>
                      查看详情
                    </button>
                    {post.has_trip ? (
                      <button
                        type="button"
                        className="text-link"
                        disabled={importing === post.id}
                        onClick={() => {
                          if (importing) return
                          setImporting(post.id)
                          void readCommunity(post.id)
                            .then((detail) => {
                              if (!detail.trip) return
                              onImport(detail.trip, `post:${post.id}`)
                            })
                            .catch(() => setNotice('导入失败，请再试一次。'))
                            .finally(() => setImporting(null))
                        }}
                      >
                        {importing === post.id ? '导入中…' : '导入到我的攻略'}
                      </button>
                    ) : null}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {viewer ? <Lightbox photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} onIndex={(index) => setViewer({ photos: viewer.photos, index })} /> : null}
    </div>
  )
}

function PhotoGrid({ photos, onOpen }: { photos: string[]; onOpen?: (index: number) => void }): React.ReactElement | null {
  const shown = photos.slice(0, 9)
  const [shape, setShape] = useState('')
  if (!shown.length) return null
  if (shown.length === 1) {
    return (
      <div className={`photo-grid n1 ${shape}`}>
        <img
          src={shown[0]}
          alt=""
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.(0)
          }}
          onLoad={(event) => {
            const ratio = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight
            if (ratio > 2) setShape('wide')
            else if (ratio < 0.5) setShape('tall')
          }}
        />
      </div>
    )
  }
  return (
    <div className="photo-grid">
      {shown.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.(index)
          }}
        />
      ))}
    </div>
  )
}

function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: string[]
  index: number
  onClose: () => void
  onIndex: (index: number) => void
}): React.ReactElement {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const src = photos[index]
  useEffect(() => {
    setFailed(false)
  }, [index, src])
  return (
    <div className="lightbox" onClick={onClose}>
      {failed ? (
        <div className="empty" onClick={(event) => event.stopPropagation()}>
          <h2>网络不太稳定，请再试一次。</h2>
          <button
            type="button"
            className="primary"
            onClick={() => {
              setFailed(false)
              setAttempt((value) => value + 1)
            }}
          >
            重试
          </button>
        </div>
      ) : (
        <img key={`${src}-${attempt}`} src={src} alt="" onClick={(event) => event.stopPropagation()} onError={() => setFailed(true)} />
      )}
      <div className="lightbox-bar" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="text-publish" disabled={index <= 0} onClick={() => onIndex(index - 1)}>
          上一张
        </button>
        <button type="button" className="text-publish" onClick={onClose}>
          关闭
        </button>
        <button type="button" className="text-publish" disabled={index >= photos.length - 1} onClick={() => onIndex(index + 1)}>
          下一张
        </button>
      </div>
    </div>
  )
}

function ClampText({ text }: { text: string }): React.ReactElement | null {
  const ref = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [overflow, setOverflow] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || open) return
    setOverflow(node.scrollHeight > node.clientHeight + 1)
  }, [text, open])
  if (!text.trim()) return null
  return (
    <>
      <p ref={ref} className={open ? 'post-body' : 'post-body clamp'}>
        {text}
      </p>
      {!open && overflow ? (
        <button
          type="button"
          className="text-expand"
          onClick={(event) => {
            event.stopPropagation()
            setOpen(true)
          }}
        >
          展开
        </button>
      ) : null}
    </>
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
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('tuling.compose')
      if (!saved) return
      const parsed = JSON.parse(saved) as { note?: string }
      if (parsed.note) setNote(parsed.note)
    } catch {
      sessionStorage.removeItem('tuling.compose')
    }
  }, [])

  const publish = (): void => {
    if (!note.trim() && photos.length === 0 && !attached) {
      setError('写一点内容再发布')
      return
    }
    setSending(true)
    setError(null)
    void publishCommunity(author, note.trim(), attached, photos)
      .then((result) => {
        sessionStorage.removeItem('tuling.compose')
        onDone({ id: result.id, token: result.token })
      })
      .catch(() => {
        setError('没有发出去，请再试一次。')
        setSending(false)
      })
  }

  const requestBack = (): void => {
    if (note.trim() || photos.length > 0 || attached) {
      setLeaving(true)
      return
    }
    onBack()
  }

  const addPhotos = (files: FileList | null): void => {
    if (!files?.length) return
    const picked = [...files].slice(0, 9 - photos.length)
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
      .then((urls) => setPhotos((current) => [...current, ...urls].slice(0, 9)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '照片没有读出来'))
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={requestBack}>
          取消
        </button>
        <h1>写点评</h1>
        <button type="button" className="text-publish" onClick={publish} disabled={sending}>
          发布
        </button>
      </header>
      <div className="scroll form">
        <p className="hint">昵称会显示在你分享的行程上。</p>
        <label htmlFor="share-note" className="sr">
          这一趟怎么样
        </label>
        <textarea
          id="share-note"
          maxLength={400}
          value={note}
          placeholder="这套行程你想怎么走？"
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="compose-photos">
          {photos.length < 9 ? (
            <label className="photo-add">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label="添加照片"
                onChange={(event) => {
                  addPhotos(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
          ) : null}
          {photos.map((src) => (
            <span key={src} className="compose-photo">
              <img src={src} alt="" />
              <button type="button" aria-label="移除这张照片" onClick={() => setPhotos((current) => current.filter((item) => item !== src))}>
                移除
              </button>
            </span>
          ))}
        </div>
        {attached ? (
          <div className="trip-attach">
            <img src={cityImage(attached.city)} alt="" />
            <span>
              <b>{highlightsOf(attached).join('、') || attached.city}</b>
              <small>
                {attached.city} · {attached.days}天 · {attached.people}人
              </small>
            </span>
            <button type="button" className="text-link" onClick={() => onAttach(null)}>
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
            <p className="hint">还没有保存的行程。</p>
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
        {leaving ? (
          <div className="dialog">
            <article>
              <p>还没发布，确定离开吗？</p>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  sessionStorage.setItem('tuling.compose', JSON.stringify({ note }))
                  onBack()
                }}
              >
                离开
              </button>
              <button type="button" className="ghost" onClick={() => setLeaving(false)}>
                继续写
              </button>
            </article>
          </div>
        ) : null}
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
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const startOf = (value: Date): number => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const dayGap = Math.round((startOf(now) - startOf(date)) / 86400000)
  if (dayGap <= 0) return `${Math.floor(minutes / 60)}小时前`
  if (dayGap === 1) return '昨天'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
