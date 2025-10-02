import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from 'recharts'
import { useMemo, useRef } from 'react'
import './Chart.css' // Sử dụng chung CSS với LineChart
import type { ProjectIssue } from './ProjectIssueTable'

// Fixed palette to match the sample style
const PALETTE = [
  { fill: '#FF7A00', stroke: '#FF7A00' },
  { fill: '#8B5CF6', stroke: '#8B5CF6' },
  { fill: '#06B6D4', stroke: '#06B6D4' },
  { fill: '#22C55E', stroke: '#22C55E' },
  { fill: '#F59E0B', stroke: '#F59E0B' },
  { fill: '#EF4444', stroke: '#EF4444' },
]

// Custom tooltip component that shows all data points and issues for a specific time
const CustomTooltip = ({ active, payload, label, issues = [] }: any & { issues: ProjectIssue[] }) => {
  if (!active || !payload || !label) {
    return null;
  }

  // Lấy thông tin từ payload để tìm timeGroup
  const currentItem = payload[0]?.payload;
  if (!currentItem) return null;

  // Tìm các issue tại mốc thời gian này
  let issuesAtTime: ProjectIssue[] = [];
  if (issues && currentItem.timeGroup) {
    const currentDate = new Date(currentItem.timeGroup).toISOString().slice(0, 10);
    issuesAtTime = issues.filter((issue: ProjectIssue) => {
      if (!issue.StartWeek) return false;
      const issueDate = new Date(issue.StartWeek).toISOString().slice(0, 10);
      return issueDate === currentDate;
    });
  }

  return (
    <div className="custom-tooltip" style={{ zIndex: 9999 }}>
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', color: '#1F2937' }}>
        {currentItem.name} - {new Date(currentItem.timeGroup).toLocaleDateString('vi-VN')}
      </p>
      {payload.length > 0 && (
        <>
          <p style={{ margin: '0 0 6px 0', fontWeight: '600', fontSize: '12px', color: '#6B7280' }}>
            ĐIỂM HIỆU SUẤT:
          </p>
          {/* Hiển thị các score từ payload */}
          {payload.map((entry: any) => {
            const displayName = entry.dataKey === 'score1' ? 'Performance' : 
                               entry.dataKey === 'score2' ? 'Base' : 
                               entry.dataKey === 'score3' ? 'Creative' : entry.dataKey;
            // Hiển thị giá trị gốc cho score1 trong tooltip
            const displayValue = entry.dataKey === 'score1' ? currentItem.originalScore1 : entry.value;
            return (
              <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '8px', display: 'inline-block', backgroundColor: entry.color }}></span>
                <span style={{ color: '#374151' }}>
                  {displayName}: {displayValue !== null ? displayValue : '-'}
                </span>
              </div>
            )
          })}
          {/* Hiển thị Creative (score3) riêng biệt vì không có trong payload */}
          {currentItem.score3 !== undefined && (
            <div key="creative-score" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '8px', display: 'inline-block', backgroundColor: '#06B6D4' }}></span>
              <span style={{ color: '#374151' }}>
                Creative: {currentItem.score3 !== null ? currentItem.score3 : '-'}
              </span>
            </div>
          )}
        </>
      )}
      {issuesAtTime.length > 0 && (
        <>
          <p style={{ margin: '12px 0 6px 0', fontWeight: '600', fontSize: '12px', color: '#DC2626' }}>
            ISSUE:
          </p>
          <div className="custom-tooltip-issue-list">
            {issuesAtTime.map((issue: ProjectIssue, idx: number) => (
              <div key={idx} style={{ marginBottom: '4px', padding: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px', wordBreak: 'break-word' }}>
                <span style={{ fontWeight: '600', color: '#DC2626', fontSize: '12px' }}>{issue.Project}</span>
                <span style={{ color: '#7F1D1D', fontSize: '10px' }}>Team: {issue.Team}</span>
                <span style={{ color: issue.Difference > 0 ? '#059669' : '#DC2626', fontSize: '10px', fontWeight: '600' }}>
                  Difference: {issue.Difference > 0 ? '+' : ''}{issue.Difference}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export type ColumnObjectData = {
  name: string // Tên đối tượng
  time: string // ISO date string
  score1: number // Điểm 1
  score2: number // Điểm 2
  score3: number // Điểm 3
}

export type ColumnChartProps = {
  data: ColumnObjectData[] // Array of data for column chart
  issues?: ProjectIssue[] // Project issues to show as ReferenceDot
  title?: string
  height?: number
}

export default function ColumnChart({ data, issues = [], title = 'Column Chart', height = 440 }: ColumnChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

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
          score1: Math.max(0, obj.score1 - obj.score2), // Giảm score1 đi score2
          score2: obj.score2,
          score3: obj.score3,
          originalScore1: obj.score1, // Giữ lại giá trị gốc để hiển thị trong tooltip
          objectIndex: index,
        }))
      )
  }, [data])

  // Tính toán các issue dots để hiển thị trên chart - nhóm theo thời gian
  const issueDots = useMemo(() => {
    if (!issues || issues.length === 0 || !chartData || chartData.length === 0) return [];
    const timeGroups = Array.from(new Set(chartData.map(d => d.timeGroup)));
    
    // Nhóm issues theo thời gian
    const issuesByTime: Record<string, ProjectIssue[]> = {};
    issues.forEach(issue => {
      if (!issue.StartWeek) return;
      let xValue = issue.StartWeek;
      const d = new Date(xValue);
      xValue = d.toISOString().slice(0, 10);
      
      // Tìm vị trí gần nhất trên trục thời gian
      const matchedTime = timeGroups.find(t => t === xValue) ?? timeGroups.reduce((prev, curr) => {
        const safeCurr = curr ?? '';
        const safePrev = prev ?? '';
        const safeXValue = xValue ?? '';
        return Math.abs(new Date(safeCurr).getTime() - new Date(safeXValue).getTime()) < Math.abs(new Date(safePrev).getTime() - new Date(safeXValue).getTime()) ? curr : prev;
      }, timeGroups[0]);
      
      if (!issuesByTime[matchedTime]) {
        issuesByTime[matchedTime] = [];
      }
      issuesByTime[matchedTime].push(issue);
    });
    
    // Tạo một dot duy nhất cho mỗi thời điểm có issues
    return Object.entries(issuesByTime).map(([timeGroup, timeIssues]) => {
      const matchedItem = chartData.find(item => item.timeGroup === timeGroup);
      const issueCount = timeIssues.length;
      
      return {
        x: matchedItem?.displayTime,
        y: 0,
        key: `issue-dot-group-${timeGroup}`,
        fill: '#E53E3E',
        r: Math.min(6 + (issueCount - 1) * 2, 12), // Tăng kích thước theo số lượng issues
        issueCount,
        timeGroup,
        issues: timeIssues
      };
    });
  }, [issues, chartData]);

  const overlayTitle = `Column Chart - ${data.length} ${data.length > 1 ? 'records' : 'record'}`

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
    <div className="chart-card" style={{ height }}>
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
            margin={{ top: 80, right: 24, left: 8, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" stroke="#E6E9EF" />
            <XAxis
              dataKey="displayTime"
              tick={{ fontSize: 12, fill: '#667085' }}
              angle={-15}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#667085' }} 
              label={{ value: 'Điểm số', angle: -90, position: 'insideLeft', offset: 10 }} 
            />
            <Tooltip 
              content={<CustomTooltip issues={issues} />}
              allowEscapeViewBox={{ x: false, y: true }}
              position={{ x: undefined, y: undefined }}
            />
            <Legend 
              verticalAlign="bottom"
              height={1}
              formatter={(value) => value === 'score1' ? 'Performance' : 
                                   value === 'score2' ? 'Base' : value}
            />
            <Bar 
              dataKey="score2" 
              name="score2"
              stackId="stack"
              fill={PALETTE[1].fill}
              stroke={PALETTE[1].stroke}
              strokeWidth={1}
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="score1" 
              name="score1"
              stackId="stack"
              fill={PALETTE[0].fill}
              stroke={PALETTE[0].stroke}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
            {/* ReferenceDot for issues */}
            {issueDots
              .filter(dot => dot.x !== null)
              .map(dot => (
                <ReferenceDot
                  key={dot.key}
                  x={dot.x ?? undefined}
                  y={dot.y}
                  r={dot.r}
                  fill={dot.fill}
                  stroke="#ed0000ff"
                  strokeWidth={2}
                  // Add a small text to show issue count if more than 1
                  {...(dot.issueCount > 1 && {
                    shape: (props: any) => (
                      <g>
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={props.r} 
                          fill={props.fill}
                          stroke={props.stroke}
                          strokeWidth={props.strokeWidth}
                        />
                        <text 
                          x={props.cx} 
                          y={props.cy + 1}
                          textAnchor="middle"
                          fontSize="10"
                          fill="white"
                          fontWeight="bold"
                        >
                          {dot.issueCount}
                        </text>
                      </g>
                    )
                  })}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}