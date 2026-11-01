import { useState } from 'react'

import { PREFERENCE_TAGS } from '../format'
import { PACK_ITEMS, type Profile } from '../storage'

type Panel = 'main' | 'name' | 'city' | 'prefs' | 'pack'

interface MineScreenProps {
  profile: Profile
  tripCount: number
  savedCount: number
  prefs: string[]
  packed: string[]
  service: string
  onProfile: (profile: Profile) => void
  onTogglePref: (tag: string) => void
  onTogglePack: (item: string) => void
  onClear: () => void
  onOpenSaved: () => void
}

const CITIES = ['杭州', '成都', '西安']

export function MineScreen(props: MineScreenProps): React.ReactElement {
  const [panel, setPanel] = useState<Panel>('main')
  if (panel === 'name') return <NamePanel {...props} onBack={() => setPanel('main')} />
  if (panel === 'city') return <CityPanel {...props} onBack={() => setPanel('main')} />
  if (panel === 'prefs') return <PrefsPanel {...props} onBack={() => setPanel('main')} />
  if (panel === 'pack') return <PackPanel {...props} onBack={() => setPanel('main')} />
  return <MainPanel {...props} onOpen={setPanel} />
}

function MainPanel({
  profile,
  tripCount,
  savedCount,
  prefs,
  packed,
  service,
  onClear,
  onOpen,
  onOpenSaved,
}: MineScreenProps & { onOpen: (panel: Panel) => void }): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <span />
        <h1>我的</h1>
        <span />
      </header>
      <div className="scroll">
        <button type="button" className="profile" onClick={() => onOpen('name')}>
          <i>{profile.name.slice(0, 1)}</i>
          <span>
            <b>{profile.name}</b>
            <small>本地账号 · {profile.city}</small>
          </span>
        </button>

        <section className="set-group">
          <SettingRow label="昵称" value={profile.name} onClick={() => onOpen('name')} />
          <SettingRow label="常用城市" value={profile.city} onClick={() => onOpen('city')} />
        </section>

        <section className="set-group">
          <SettingRow label="生成偏好" value={prefs.length ? prefs.join('、') : '未设置'} onClick={() => onOpen('prefs')} />
          <SettingRow label="行前清单" value={`${packed.length}/${PACK_ITEMS.length}`} onClick={() => onOpen('pack')} />
        </section>

        <section className="set-group">
          <div className="set-row">
            <span>攻略</span>
            <em>{tripCount}</em>
          </div>
          <SettingRow label="收藏的景点" value={savedCount ? String(savedCount) : '无'} onClick={onOpenSaved} />
        </section>

        <section className="set-group">
          <button type="button" className="set-row danger" onClick={onClear} disabled={tripCount === 0}>
            清空攻略
          </button>
        </section>
        <p className="hint pad">{service}。昵称和城市只保存在这台设备上。</p>
      </div>
    </div>
  )
}

function NamePanel({ profile, onProfile, onBack }: MineScreenProps & { onBack: () => void }): React.ReactElement {
  const [name, setName] = useState(profile.name)
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>昵称</h1>
        <span />
      </header>
      <form
        className="scroll form"
        onSubmit={(event) => {
          event.preventDefault()
          const next = name.trim().slice(0, 12)
          onProfile({ ...profile, name: next || '旅行者' })
          onBack()
        }}
      >
        <label htmlFor="nick">显示名称</label>
        <input id="nick" value={name} maxLength={12} onChange={(event) => setName(event.target.value)} />
        <button className="primary" type="submit">
          保存
        </button>
      </form>
    </div>
  )
}

function CityPanel({ profile, onProfile, onBack }: MineScreenProps & { onBack: () => void }): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>常用城市</h1>
        <span />
      </header>
      <div className="scroll">
        <p className="hint pad">没有指定城市时，生成和自定义攻略会先用这座城市。</p>
        <div className="set-group">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              className="set-row"
              onClick={() => onProfile({ ...profile, city })}
            >
              <span>{city}</span>
              <em>{profile.city === city ? '当前' : ''}</em>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PrefsPanel({ prefs, onTogglePref, onBack }: MineScreenProps & { onBack: () => void }): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>生成偏好</h1>
        <span />
      </header>
      <div className="scroll">
        <p className="hint pad">生成攻略时会带上这里选中的偏好。</p>
        <div className="set-group set-pad">
          {PREFERENCE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={prefs.includes(tag) ? 'chip on' : 'chip'}
              aria-pressed={prefs.includes(tag)}
              onClick={() => onTogglePref(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PackPanel({ packed, onTogglePack, onBack }: MineScreenProps & { onBack: () => void }): React.ReactElement {
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>行前清单</h1>
        <span />
      </header>
      <div className="scroll">
        <div className="set-group">
          {PACK_ITEMS.map((item) => {
            const on = packed.includes(item)
            return (
              <button key={item} type="button" className={on ? 'check-row on' : 'check-row'} onClick={() => onTogglePack(item)}>
                <i aria-hidden="true">{on ? '✓' : ''}</i>
                {item}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }): React.ReactElement {
  return (
    <button type="button" className="set-row" onClick={onClick}>
      <span>{label}</span>
      <em>{value}</em>
      <i aria-hidden="true">›</i>
    </button>
  )
}
