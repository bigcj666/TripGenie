import type { Tab } from '../nav'
import { IconCommunity, IconHome, IconMine, IconTrip } from './Icons'

const TABS: { id: Tab; label: string; icon: typeof IconHome }[] = [
  { id: 'home', label: '首页', icon: IconHome },
  { id: 'guides', label: '攻略', icon: IconTrip },
  { id: 'community', label: '社区', icon: IconCommunity },
  { id: 'mine', label: '我的', icon: IconMine },
]

interface TabBarProps {
  tab: Tab
  onChange: (tab: Tab) => void
}

export function TabBar({ tab, onChange }: TabBarProps): React.ReactElement {
  return (
    <nav className="tabbar" aria-label="页面">
      {TABS.map((item) => {
        const Icon = item.icon
        const on = tab === item.id
        return (
          <button key={item.id} type="button" className={on ? 'on' : ''} onClick={() => onChange(item.id)}>
            <Icon active={on} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
