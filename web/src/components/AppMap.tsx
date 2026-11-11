import { useEffect, useRef } from 'react'
import L from 'leaflet'

export interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
}

interface AppMapProps {
  points: MapPoint[]
  activeId?: string
  route?: boolean
  className?: string
  onPick?: (id: string) => void
  onTileFailure?: () => void
}

const TILES =
  'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'

export function AppMap({ points, activeId, route, className, onPick, onTileFailure }: AppMapProps): React.ReactElement {
  const el = useRef<HTMLDivElement>(null)
  const signature = `${route ? 'r' : 'p'}:${activeId ?? ''}:${points.map((point) => point.id).join(',')}`

  useEffect(() => {
    const node = el.current
    if (!node) return
    const map = L.map(node, { zoomControl: false, attributionControl: true })
    L.control.zoom({ position: 'topright' }).addTo(map)
    const tiles = L.tileLayer(TILES, {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      attribution: '高德地图',
    }).addTo(map)
    tiles.on('tileerror', () => onTileFailure?.())

    if (route && points.length > 1) {
      L.polyline(
        points.map((point) => [point.lat, point.lng] as [number, number]),
        { color: '#1c1c1e', weight: 3, opacity: 0.85 },
      ).addTo(map)
    }

    points.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'tuli-pin',
          html: `<span class="${point.id === activeId ? 'on' : ''}">${route ? index + 1 : ''}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: point.name,
      })
      marker.on('click', () => onPick?.(point.id))
      marker.addTo(map)
    })

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number])), { padding: [28, 28] })
    } else {
      map.setView([30.25, 120.16], 12)
    }

    const timer = window.setTimeout(() => map.invalidateSize(), 60)
    return () => {
      window.clearTimeout(timer)
      map.remove()
    }
    // signature captures the inputs that should rebuild the map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return <div ref={el} className={className ?? 'map-box'} />
}
