import { useEffect, useState } from 'react'

import { commentCommunity, readCommunity, removeCommunity, type CommunityDetail } from '../api'
import { cityImage } from '../data/places'
import { TYPE_LABEL } from '../format'
import type { Trip } from '../types'

function PhotoGrid({ photos }: { photos: string[] }): React.ReactElement | null {
  const shown = photos.slice(0, 9)
  if (!shown.length) return null
  return (
    <div className={shown.length === 1 ? 'photo-grid n1' : 'photo-grid'}>
      {shown.map((src) => (
        <img key={src} src={src} alt="" />
      ))}
    </div>
  )
}

interface PostScreenProps {
  id: string
  author: string
  token?: string
  onBack: () => void
  onImport: (trip: Trip) => void
  onRemoved: () => void
}

export function PostScreen({ id, author, token, onBack, onImport, onRemoved }: PostScreenProps): React.ReactElement {
  const [post, setPost] = useState<CommunityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let stop = false
    setPost(null)
    setError(null)
    void readCommunity(id).then(
      (detail) => {
        if (!stop) setPost(detail)
      },
      (err: unknown) => {
        if (!stop) setError(err instanceof Error ? err.message : '读取失败')
      },
    )
    return () => {
      stop = true
    }
  }, [id])

  const send = (): void => {
    const body = text.trim()
    if (!body || !post) return
    setSending(true)
    void commentCommunity(id, author, body)
      .then((comment) => {
        setPost({ ...post, comments: [...post.comments, comment], comment_count: post.comment_count + 1 })
        setText('')
        setSending(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '留言失败')
        setSending(false)
      })
  }

  const remove = (): void => {
    if (!token) return
    void removeCommunity(id, token)
      .then(onRemoved)
      .catch((err: unknown) => {
        setConfirming(false)
        setError(err instanceof Error ? err.message : '撤回失败')
      })
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>{post?.author || '点评详情'}</h1>
        <span />
      </header>
      <div className="scroll with-dock">
        {error ? <p className="error pad">{error}</p> : null}
        {!post && !error ? <p className="muted pad">正在加载…</p> : null}
        {post ? (
          <>
            <article className="post-card static">
              <div className="post-who">
                <i>{post.author.slice(0, 1)}</i>
                <span>
                  <b>{post.author}</b>
                  <small>{postedAt(post.created_at)}</small>
                </span>
              </div>
              {post.note || post.summary ? <p className="post-body">{post.note || post.summary}</p> : null}
              <PhotoGrid photos={post.photos ?? []} />
              {post.trip ? (
                <>
                  <div className="trip-attach detail">
                    <img src={(post.photos ?? [])[0] || cityImage(post.city)} alt="" />
                    <span>
                      <b>{post.summary || post.city}</b>
                      <small>
                        {post.city} · {post.days}天 · {post.people}人
                      </small>
                    </span>
                  </div>
                  <div className="attach-actions">
                    <button type="button" className="primary" onClick={() => onImport(post.trip as Trip)}>
                      导入到我的攻略
                    </button>
                    <button type="button" className="ghost" onClick={() => document.getElementById('post-itinerary')?.scrollIntoView({ block: 'start' })}>
                      查看详情
                    </button>
                  </div>
                  <div id="post-itinerary">
                    {post.trip.itinerary.map((day) => (
                      <section key={day.day} className="post-day">
                        <h2>
                          第 {day.day} 天 · {day.zone || '片区'} · {day.theme}
                        </h2>
                        {day.items.map((item) => (
                          <p key={`${item.time_start}-${item.title}`}>
                            <em>
                              {item.time_start} {TYPE_LABEL[item.type]}
                            </em>
                            {item.title}
                          </p>
                        ))}
                      </section>
                    ))}
                  </div>
                </>
              ) : null}
            </article>
            <section className="post-talk">
              <h2>留言</h2>
              {post.comments.length === 0 ? <p className="muted">还没有留言。先说一句这套行程好在哪，或哪里想改。</p> : null}
              {post.comments.map((comment) => (
                <article key={comment.id} className="comment">
                  <b>{comment.author}</b>
                  <p>{comment.body}</p>
                  <small>{postedAt(comment.created_at)}</small>
                </article>
              ))}
              {token ? (
                <button type="button" className="text-link" onClick={() => setConfirming(true)}>
                  撤回
                </button>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
      {confirming ? (
        <div className="dialog">
          <article>
            <p>撤回后他人将无法再看到这套分享，确定撤回吗？</p>
            <button type="button" className="primary" onClick={remove}>
              撤回
            </button>
            <button type="button" className="ghost" onClick={() => setConfirming(false)}>
              取消
            </button>
          </article>
        </div>
      ) : null}
      {post ? (
        <form
          className="comment-bar"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <label htmlFor="comment-body" className="sr">
            留言
          </label>
          <input
            id="comment-body"
            maxLength={200}
            value={text}
            placeholder="这套行程你想怎么走？"
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" disabled={sending || !text.trim()}>
            {sending ? '发送中…' : '发送'}
          </button>
        </form>
      ) : null}
    </div>
  )
}

function postedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const startOf = (value: Date): number => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const dayGap = Math.round((startOf(now) - startOf(date)) / 86400000)
  if (dayGap <= 0) return `${Math.floor(minutes / 60)}小时前`
  if (dayGap === 1) return '昨天'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
