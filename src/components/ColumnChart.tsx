import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useMemo, useRef, useState } from 'react'
import './Chart.css' // Sử dụng chung CSS với LineChart

// Fixed palette to match the sample style
const PALETTE = [
  { fill: '#FF7A00', stroke: '#FF7A00' },
  { fill: '#8B5CF6', stroke: '#8B5CF6' },
  { fill: '#06B6D4', stroke: '#06B6D4' },
  { fill: '#22C55E', stroke: '#22C55E' },
  { fill: '#F59E0B', stroke: '#F59E0B' },
  { fill: '#EF4444', stroke: '#EF4444' },
]

export type ColumnObjectData = {
  name: string // Tên đối tượng
  time: string // ISO date string
  score1: number // Điểm 1
  score2: number // Điểm 2
  score3: number // Điểm 3
}

export type ColumnChartProps = {
  data: ColumnObjectData[] // Array of data for column chart
  title?: string
  height?: number
}

export default function ColumnChart({ data, title = 'Column Chart', height = 440 }: ColumnChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const chartData = useMemo(() => {
    // Nhóm dữ liệu theo thời gian
    const grouped = data.reduce((acc, item) => {
      const timeKey = item.time
      if (!acc[timeKey]) {
        acc[timeKey] = { time: timeKey, objects: [] }
      }
      acc[timeKey].objects.push(item)
      return acc
    }, {} as Record<string, { time: string; objects: ColumnObjectData[] }>)

    // Chuyển đổi thành format phù hợp cho BarChart
    return Object.values(grouped)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .flatMap((group) => 
        group.objects.map((obj, index) => ({
          timeGroup: group.time,
          displayTime: `${new Date(group.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${obj.name}`,
          name: obj.name,
          score1: obj.score1,
          score2: obj.score2,
          score3: obj.score3,
          objectIndex: index,
        }))
      )
  }, [data])

  const overlayTitle = `Column Chart - ${data.length} ${data.length > 1 ? 'records' : 'record'}`

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

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
    a.download = 'column-chart.svg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`chart-card ${isFullscreen ? 'fullscreen' : ''}`} style={isFullscreen ? {} : { height }}>
      <div className="chart-header">
        <div className="chart-header-left">
          <span className="chart-header-title">{title}</span>
        </div>
        <div className="chart-actions">
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
          <BarChart 
            data={chartData} 
            margin={{ top: 48, right: 24, left: 8, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" stroke="#E6E9EF" />
            <XAxis
              dataKey="displayTime"
              tick={{ fontSize: 12, fill: '#667085' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#667085' }} 
              label={{ value: 'Điểm số', angle: -90, position: 'insideLeft', offset: 10 }} 
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: 8, 
                border: '1px solid #E6E9EF', 
                boxShadow: '0 6px 16px rgba(16,24,40,0.12)' 
              }}
              labelFormatter={(label: string) => {
                const item = chartData.find(d => d.displayTime === label)
                return item ? `${item.name} - ${new Date(item.timeGroup).toLocaleDateString('vi-VN')}` : label
              }}
              formatter={(value: any, name: string) => {
                const displayName = name === 'score1' ? 'Điểm 1' : 
                                   name === 'score2' ? 'Điểm 2' : 
                                   name === 'score3' ? 'Điểm 3' : name
                return [value, displayName]
              }}
            />
            <Legend 
              formatter={(value) => value === 'score1' ? 'Điểm 1' : 
                                   value === 'score2' ? 'Điểm 2' : 
                                   value === 'score3' ? 'Điểm 3' : value}
            />
            <Bar 
              dataKey="score1" 
              name="score1"
              fill={PALETTE[0].fill}
              stroke={PALETTE[0].stroke}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="score2" 
              name="score2"
              fill={PALETTE[1].fill}
              stroke={PALETTE[1].stroke}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="score3" 
              name="score3"
              fill={PALETTE[2].fill}
              stroke={PALETTE[2].stroke}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}