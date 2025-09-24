import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useMemo, useRef } from 'react'
import './Chart.css'

// Fixed palette to match the sample style
const PALETTE = [
  { stroke: '#FF7A00' },
  { stroke: '#8B5CF6' },
  { stroke: '#06B6D4' },
  { stroke: '#22C55E' },
]

export type ObjectData = {
  name: string // Tên đối tượng
  time: string // ISO date string
  score: number // Điểm
}

export type MultiObjectData = {
  name: string // Tên đối tượng
  data: ObjectData[] // Array of ObjectData for each object
}

export type ScoreOverTimeChartProps = {
  datasets: MultiObjectData[] // Multiple datasets, each with a name and ObjectData array
  title?: string
  height?: number
}

export default function LineChart({ datasets, title = 'Performance Points Chart', height = 440 }: ScoreOverTimeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const chartData = useMemo(() => {
    const allTimes = Array.from(new Set(datasets.flatMap((dataset) => dataset.data.map((entry) => entry.time)))).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
    return allTimes.map((time) => {
      const entry: Record<string, number | null | string> = { time }
      datasets.forEach((dataset) => {
        const dataPoint = dataset.data.find((d) => d.time === time)
        entry[dataset.name] = dataPoint ? dataPoint.score : null
      })
      return entry
    })
  }, [datasets])

  const overlayTitle = `Performance Points - ${datasets.length} ${datasets.length > 1 ? 'teams' : 'team'}`

  const handleDownload = () => {
    const container = chartRef.current
    if (!container) return
    const svg = container.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chart.svg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="chart-card" style={{ height }}>
      <div className="chart-header">
        <div className="chart-header-left">
          <svg className="chart-header-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 20V10M10 20V4M16 20v-6M3 20h18" stroke="#5F6D7A" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="chart-header-title">{title}</span>
        </div>
        <div className="chart-actions">
          <button className="icon-button" title="Đổi kiểu biểu đồ" aria-label="Đổi kiểu biểu đồ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 3h18M3 9h12M3 15h8M3 21h18" stroke="#5F6D7A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="icon-button" title="Tải xuống" aria-label="Tải xuống" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="#5F6D7A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="chart-body" ref={chartRef}>
        <div className="chart-overlay-title">{overlayTitle}</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 48, right: 24, left: 8, bottom: 28 }}>
            <defs>
              {datasets.map((_, idx) => (
                <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE[idx % PALETTE.length].stroke} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={PALETTE[idx % PALETTE.length].stroke} stopOpacity={0.06} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={true} horizontal={false} strokeDasharray="3 3" stroke="#E6E9EF" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: '#667085' }}
              angle={-30}
              textAnchor="end"
              height={44}
              tickFormatter={(v: string) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis tick={{ fontSize: 12, fill: '#667085' }} label={{ value: 'Performance Points', angle: -90, position: 'insideLeft', offset: -4 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #E6E9EF', boxShadow: '0 6px 16px rgba(16,24,40,0.12)' }}
              labelFormatter={(v: string) => `Ngày: ${new Date(v).toLocaleDateString('vi-VN')}`}
              formatter={((value: any, name: string) => {
                if (value == null || value === '') return ['-', name]
                return [value, name]
              }) as any}
            />
            {datasets.map((dataset, idx) => (
              <Area
                key={`${dataset.name}-area`}
                type="monotone"
                dataKey={dataset.name}
                name={dataset.name}
                stroke={PALETTE[idx % PALETTE.length].stroke}
                strokeWidth={2}
                fill={`url(#grad-${idx})`}
                dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
