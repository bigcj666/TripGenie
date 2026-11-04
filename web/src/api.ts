import type { GenerateRequest, GenerateResponse, Trip } from './types'

export interface CommunityPost {
  id: string
  author: string
  note: string
  city: string
  days: number
  people: number
  style: string
  summary: string
  created_at: string
  comment_count: number
}

export interface CommunityComment {
  id: string
  author: string
  body: string
  created_at: string
}

export interface CommunityDetail extends CommunityPost {
  trip: Trip
  comments: CommunityComment[]
}

export async function listCommunity(city?: string): Promise<CommunityPost[]> {
  const query = city ? `?city=${encodeURIComponent(city)}` : ''
  const data = await readJson<{ posts: CommunityPost[] }>(`/api/community${query}`)
  return data.posts
}

export async function readCommunity(id: string): Promise<CommunityDetail> {
  return readJson<CommunityDetail>(`/api/community/${id}`)
}

export async function publishCommunity(author: string, note: string, trip: Trip): Promise<{ id: string; token: string; post: CommunityPost }> {
  return readJson('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, note, trip }),
  })
}

export async function commentCommunity(id: string, author: string, body: string): Promise<CommunityComment> {
  return readJson(`/api/community/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, body }),
  })
}

export async function removeCommunity(id: string, token: string): Promise<void> {
  await readJson(`/api/community/${id}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error('社区暂时连不上。请先在 server 目录启动后端，端口 8000。')
  }
  if (!response.ok) throw new Error(await readError(response))
  return response.json() as Promise<T>
}

export async function generateTrip(body: GenerateRequest): Promise<GenerateResponse> {
  let response: Response
  try {
    response = await fetch('/api/trip/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('连不上生成服务。请先在 server 目录启动后端，端口 8000。')
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }
  return response.json() as Promise<GenerateResponse>
}

export interface HealthInfo {
  state: 'ok' | 'down'
  engine?: string
}

export async function fetchHealth(): Promise<HealthInfo> {
  try {
    const response = await fetch('/health')
    if (!response.ok) return { state: 'down' }
    const data = (await response.json()) as { engine?: string }
    return { state: 'ok', engine: data.engine }
  } catch {
    return { state: 'down' }
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown }
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => {
          if (typeof item === 'object' && item && 'msg' in item && typeof item.msg === 'string') {
            return item.msg
          }
          return ''
        })
        .filter(Boolean)
      if (messages.length) return messages.join('；')
    }
  } catch {
    /* 非 JSON 错误沿用状态码 */
  }
  return `请求失败（${response.status}）`
}
