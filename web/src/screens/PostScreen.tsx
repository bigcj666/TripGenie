import { useEffect, useState } from 'react'

import { commentCommunity, readCommunity, removeCommunity, type CommunityDetail } from '../api'
import { TYPE_LABEL, tripKindName } from '../format'
import type { Trip } from '../types'

function PhotoGrid({ photos }: { photos: string[] }): React.ReactElement | null {
  if (!photos.length) return null
  const count = Math.min(photos.length, 3)
  return (
    <div className={`photo-grid n${count}`}>
      {photos.slice(0, 6).map((src) => (
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
        <h1>{post ? (post.days > 0 ? `${post.city} · ${post.days}天` : post.city || '点评') : '分享'}</h1>
        <span />
      </header>
      <div className="scroll with-dock">
        {error ? <p className="error pad">{error}</p> : null}
        {!post && !error ? <p className="muted pad">正在加载…</p> : null}
        {post ? (
          <>
            <article className="post-card static">
              <span className="post-who">
                <i>{post.author.slice(0, 1)}</i>
                <b>{post.author}</b>
                <small>{post.trip ? `${post.people}人 · ${tripKindName(post.trip)}` : '点评'}</small>
              </span>
              <p>{post.note || post.summary}</p>
              <PhotoGrid photos={post.photos ?? []} />
            </article>
            {post.trip
              ? post.trip.itinerary.map((day) => (
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
                ))
              : null}
            <section className="post-talk">
              <h2>留言</h2>
              {post.comments.length === 0 ? <p className="muted">还没有留言。可以说说哪里值得去，或哪里想避开。</p> : null}
              {post.comments.map((comment) => (
                <article key={comment.id} className="comment">
                  <b>{comment.author}</b>
                  <p>{comment.body}</p>
                </article>
              ))}
              <label htmlFor="comment-body" className="sr">
                留言
              </label>
              <textarea
                id="comment-body"
                maxLength={200}
                value={text}
                placeholder="写下你的看法"
                onChange={(event) => setText(event.target.value)}
              />
              <button type="button" className="primary" disabled={sending || !text.trim()} onClick={send}>
                {sending ? '发送中…' : '发送'}
              </button>
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
        <div className="dock dock-row">
          {token ? (
            <button type="button" className="ghost" onClick={() => setConfirming(true)}>
              撤回
            </button>
          ) : null}
          {post.trip ? (
            <button type="button" className="primary" onClick={() => onImport(post.trip as Trip)}>
              导入到我的攻略
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
