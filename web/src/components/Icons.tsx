interface IconProps {
  active?: boolean
}

export function IconHome({ active }: IconProps): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconTrip({ active }: IconProps): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconCommunity({ active }: IconProps): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M5 6.2h9.2a2 2 0 0 1 2 2v4.6a2 2 0 0 1-2 2H9.2L6.2 17.6v-2.8H5a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.2 10.2h5.2" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconMine({ active }: IconProps): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
