import { useState } from 'react'

import { Photo } from '../components/Photo'
import {
  SLOT_LABEL,
  addISO,
  buildSkeleton,
  candidates,
  composeTrip,
  isoShift,
  loadWeather,
  monthDay,
  pickHint,
  weekday,
  type CustomDay,
  type SlotKind,
  type TimeSlot,
} from '../custom/schedule'
import { PLACES } from '../data/places'
import type { Trip } from '../types'

interface CustomScreenProps {
  city?: string
  savedIds: string[]
  onBack: () => void
  onDone: (trip: Trip) => void
}

export function CustomScreen({ city: initialCity, savedIds, onBack, onDone }: CustomScreenProps): React.ReactElement {
  const [city, setCity] = useState(initialCity ?? '杭州')
  const [days, setDays] = useState(2)
  const [people, setPeople] = useState(2)
  const [date, setDate] = useState(isoShift(new Date(), 1))
  const [phase, setPhase] = useState<'setup' | 'build'>('setup')
  const [plan, setPlan] = useState<CustomDay[]>([])
  const [dayIndex, setDayIndex] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [picker, setPicker] = useState<{ dayIndex: number; slotId: string } | null>(null)

  const today = isoShift(new Date(), 0)
  const latest = addISO(today, 14)
  const current = plan[dayIndex]
  const picked = plan.reduce((sum, day) => sum + day.slots.filter((slot) => slot.placeId && slot.kind !== 'breakfast' && slot.kind !== 'lunch' && slot.kind !== 'dinner' && slot.kind !== 'hotel').length, 0)

  const start = (): void => {
    if (!city.trim()) return
    setLoading(true)
    setWarning(null)
    void loadWeather(city.trim(), date, days)
      .then((result) => {
        setPlan(buildSkeleton(date, days, result.days, city.trim()))
        setWarning(result.warning)
        setDayIndex(0)
        setPhase('build')
      })
      .finally(() => setLoading(false))
  }

  const assign = (dayAt: number, slotId: string, placeId: string | null): void => {
    setPlan((currentPlan) =>
      currentPlan.map((day, index) =>
        index === dayAt
          ? { ...day, slots: day.slots.map((slot) => (slot.id === slotId ? { ...slot, placeId } : slot)) }
          : day,
      ),
    )
    setPicker(null)
  }

  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={phase === 'build' ? () => setPhase('setup') : onBack}>
          返回
        </button>
        <h1>自定义攻略</h1>
        <span />
      </header>
      {phase === 'setup' ? (
        <form
          className="scroll form"
          onSubmit={(event) => {
            event.preventDefault()
            start()
          }}
        >
          <p className="hint">先按出发日的天气排好时间、三餐和住宿。景点先空着，下一步由你自己选。</p>
          <label htmlFor="custom-city">城市</label>
          <input id="custom-city" value={city} maxLength={20} onChange={(event) => setCity(event.target.value)} />
          <div className="chips">
            {['杭州', '成都', '西安'].map((name) => (
              <button key={name} type="button" className={city === name ? 'chip on' : 'chip'} onClick={() => setCity(name)}>
                {name}
              </button>
            ))}
          </div>
          <label htmlFor="custom-date">出发日期</label>
          <input id="custom-date" type="date" value={date} min={today} max={latest} onChange={(event) => setDate(event.target.value)} />
          <div className="split">
            <Stepper label="天数" value={days} unit="天" min={1} max={5} onChange={setDays} />
            <Stepper label="人数" value={people} unit="人" min={1} max={10} onChange={setPeople} />
          </div>
          <button className="primary" type="submit" disabled={loading || !city.trim() || !date}>
            {loading ? '正在看天气…' : '按天气排日程'}
          </button>
        </form>
      ) : (
        <>
          <div className="scroll with-dock">
            {warning ? <p className="hint pad">{warning}</p> : null}
            <div className="day-line">
              {plan.map((day, index) => (
                <button key={day.date} type="button" className={index === dayIndex ? 'on' : ''} onClick={() => setDayIndex(index)}>
                  {monthDay(day.date)}
                </button>
              ))}
            </div>
            {current ? (
              <>
                <section className="weather">
                  <b>
                    {monthDay(current.date)} {weekday(current.date)}
                    {current.weather.known ? ` · ${current.weather.label}` : ''}
                  </b>
                  <span>
                    {current.weather.known
                      ? `${current.weather.tempMin}–${current.weather.tempMax}° · 降水 ${current.weather.rainProb}%`
                      : '这一天还没有预报'}
                  </span>
                  <p>
                    {current.weather.pace}。{current.weather.carry}。
                  </p>
                </section>
                {current.slots.map((slot) => (
                  <SlotRow key={slot.id} slot={slot} hint={pickHint(slot.kind, current.weather)} onPick={() => setPicker({ dayIndex, slotId: slot.id })} />
                ))}
              </>
            ) : null}
          </div>
          <div className="dock">
            <button type="button" className="primary" onClick={() => onDone(composeTrip(city.trim(), people, plan))}>
              保存攻略{picked > 0 ? ` · 已选 ${picked} 个景点` : ''}
            </button>
          </div>
        </>
      )}
      {picker && current ? (
        <Picker
          city={city.trim()}
          slot={plan[picker.dayIndex]?.slots.find((slot) => slot.id === picker.slotId)}
          weather={plan[picker.dayIndex]?.weather}
          savedIds={savedIds}
          onClose={() => setPicker(null)}
          onChoose={(placeId) => assign(picker.dayIndex, picker.slotId, placeId)}
        />
      ) : null}
    </div>
  )
}

function SlotRow({ slot, hint, onPick }: { slot: TimeSlot; hint: string; onPick: () => void }): React.ReactElement {
  const place = slot.placeId ? PLACES.find((item) => item.id === slot.placeId) : undefined
  const meal = slot.kind === 'breakfast' || slot.kind === 'lunch' || slot.kind === 'dinner'
  const stay = slot.kind === 'hotel'
  const priceNote = place?.price ? `约 ${place.price} 元${stay ? '/间' : meal ? '/人' : ''} · ` : ''
  return (
    <button type="button" className="slot" onClick={onPick}>
      <em>
        {stay ? `${slot.start}–当晚` : `${slot.start}–${slot.end}`} · {SLOT_LABEL[slot.kind]}
      </em>
      {place ? (
        <span className="slot-place">
          <Photo src={place.image} alt={place.name} />
          <b>{place.name}</b>
        </span>
      ) : (
        <b>{meal ? '附近吃' : stay ? '这天不住' : '选择景点'}</b>
      )}
      <small>{place ? `${priceNote}点这里更换` : hint}</small>
    </button>
  )
}

function Picker({
  city,
  slot,
  weather,
  savedIds,
  onClose,
  onChoose,
}: {
  city: string
  slot: TimeSlot | undefined
  weather: CustomDay['weather'] | undefined
  savedIds: string[]
  onClose: () => void
  onChoose: (placeId: string | null) => void
}): React.ReactElement {
  const kind: SlotKind = slot?.kind ?? 'morning'
  const meal = kind === 'breakfast' || kind === 'lunch' || kind === 'dinner'
  const stay = kind === 'hotel'
  const list = weather ? candidates(city, kind, weather, savedIds) : []
  return (
    <div className="picker">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onClose}>
          返回
        </button>
        <h1>{meal || stay ? `选${SLOT_LABEL[kind]}` : `选${SLOT_LABEL[kind]}的景点`}</h1>
        <span />
      </header>
      <div className="scroll">
        <p className="hint pad">{weather ? pickHint(kind, weather) : ''}</p>
        {meal || stay || kind === 'evening' ? (
          <button type="button" className="slot" onClick={() => onChoose(null)}>
            <b>{meal ? '就在附近吃' : stay ? '这天不住' : '这个时段先空着'}</b>
          </button>
        ) : null}
        {list.length === 0 ? <p className="muted pad">{stay ? '这城还没有收录酒店。' : '这城还没有收录可选项，三餐可以先按附近吃。'}</p> : null}
        {list.map((place) => (
          <button key={place.id} type="button" className="poi picker-row" onClick={() => onChoose(place.id)}>
            <Photo src={place.image} alt={place.name} />
            <span>
              <b>
                {place.name}
                {savedIds.includes(place.id) ? ' · 已收藏' : ''}
              </b>
              <em>{place.tags.join(' / ')}</em>
              <small>{place.blurb}</small>
            </span>
          </button>
        ))}
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
