import { useState } from 'react'

import { generateTrip } from '../api'
import { PREFERENCE_TAGS, STYLE_META, yuan } from '../format'
import type { CreateDraft } from '../nav'
import type { GenerateResponse, TravelStyle } from '../types'

interface CreateScreenProps {
  draft: CreateDraft
  savedPrefs: string[]
  homeCity: string
  onBack: () => void
  onDone: (result: GenerateResponse) => void
}

export function CreateScreen({ draft, savedPrefs, homeCity, onBack, onDone }: CreateScreenProps): React.ReactElement {
  const [city, setCity] = useState(draft.city ?? homeCity)
  const [days, setDays] = useState(draft.days ?? 3)
  const [people, setPeople] = useState(2)
  const [budget, setBudget] = useState('1500')
  const [prefs, setPrefs] = useState<string[]>(draft.prefs ?? savedPrefs)
  const [style, setStyle] = useState<TravelStyle | 'all'>('all')
  const [includeHotel, setIncludeHotel] = useState(false)
  const [dateStart, setDateStart] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (): void => {
    const budgetNum = Number(budget)
    if (!city.trim() || !Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('这次没有生成成功，请检查条件后重试。')
      return
    }
    setError(null)
    setLoading(true)
    void generateTrip({
      city: city.trim(),
      days,
      people,
      budget_total: budgetNum,
      preferences: prefs,
      style,
      budget_includes_hotel: includeHotel,
      date_start: dateStart || undefined,
    })
      .then(onDone)
      .catch(() => setError('这次没有生成成功，请检查条件后重试。'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>生成行程</h1>
        <span />
      </header>
      <form
        id="create-form"
        className="scroll form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <p className="hint">先填写这次出行的基本条件。</p>
        <label htmlFor="city">城市</label>
        <input id="city" value={city} maxLength={20} onChange={(event) => setCity(event.target.value)} />
        <div className="chips">
          {['杭州', '成都', '西安'].map((name) => (
            <button key={name} type="button" className={city === name ? 'chip on' : 'chip'} onClick={() => setCity(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="split">
          <Stepper label="天数" value={days} unit="天" min={1} max={5} onChange={setDays} />
          <Stepper label="人数" value={people} unit="人" min={1} max={10} onChange={setPeople} />
        </div>
        <p className="hint">1–5 天的短途更合适。费用按出行人数估算。</p>
        <label htmlFor="date-start">出发日期</label>
        <input id="date-start" type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} />
        <p className="hint">填了出发日，遇到闭馆会改到同片区其他地方。</p>
        <label htmlFor="budget">总预算 · {people} 人</label>
        <input
          id="budget"
          inputMode="numeric"
          value={budget}
          onChange={(event) => setBudget(event.target.value.replace(/[^\d.]/g, ''))}
        />
        <p className="hint">人均约 {perPerson(budget, people)}。默认不含住宿，需要时可计入。</p>
        <button type="button" className={includeHotel ? 'chip on' : 'chip'} aria-pressed={includeHotel} onClick={() => setIncludeHotel((value) => !value)}>
          {includeHotel ? '住宿已计入' : '计入住宿'}
        </button>
        <p className="label">偏好</p>
        <p className="hint">用于安排重点，不会只改几句形容。</p>
        <div className="chips">
          {PREFERENCE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={prefs.includes(tag) ? 'chip on' : 'chip'}
              aria-pressed={prefs.includes(tag)}
              onClick={() => setPrefs((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))}
            >
              {tag}
            </button>
          ))}
        </div>
        <p className="label">方案</p>
        <div className="chips">
          <button type="button" className={style === 'all' ? 'chip on' : 'chip'} onClick={() => setStyle('all')}>
            三套一起
          </button>
          {(['compact', 'relaxed', 'economy'] as const).map((item) => (
            <button key={item} type="button" className={style === item ? 'chip on' : 'chip'} onClick={() => setStyle(item)}>
              {STYLE_META[item].name}
            </button>
          ))}
        </div>
        <p className="hint">{style === 'all' ? '一次给出紧凑、松弛、省钱三套。' : STYLE_META[style].line}</p>
        {loading ? <p className="hint">正在按你的条件排出三套行程…</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
      <div className="dock dock-row">
        {error ? (
          <button type="button" className="ghost" onClick={submit}>
            重试
          </button>
        ) : null}
        <button className="primary" type="submit" form="create-form" disabled={loading}>
          生成行程
        </button>
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  onChange: (value: number) => void
}): React.ReactElement {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`减少${label}`}>
          −
        </button>
        <b>
          {value}
          {unit}
        </b>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`增加${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

function perPerson(budget: string, people: number): string {
  const value = Number(budget)
  if (!Number.isFinite(value) || value <= 0) return '—'
  return yuan(value / people)
}
