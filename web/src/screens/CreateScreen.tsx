import { useState } from 'react'

import { generateTrip } from '../api'
import { PREFERENCE_TAGS, yuan } from '../format'
import type { CreateDraft } from '../nav'
import type { GenerateResponse } from '../types'

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
  const [styleAll, setStyleAll] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (): void => {
    const budgetNum = Number(budget)
    if (!city.trim()) {
      setError('填写城市')
      return
    }
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('填写预算')
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
      style: styleAll ? 'all' : 'relaxed',
    })
      .then(onDone)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '生成失败'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>生成攻略</h1>
        <span />
      </header>
      <form
        className="scroll form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
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
        <label htmlFor="budget">总预算 · {people} 人</label>
        <input
          id="budget"
          inputMode="numeric"
          value={budget}
          onChange={(event) => setBudget(event.target.value.replace(/[^\d.]/g, ''))}
        />
        <p className="hint">人均约 {perPerson(budget, people)}</p>
        <p className="label">偏好</p>
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
        <label className="check">
          <input type="checkbox" checked={styleAll} onChange={(event) => setStyleAll(event.target.checked)} />
          同时给紧凑、松弛、省钱三套
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? '正在生成…' : '生成攻略'}
        </button>
      </form>
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
