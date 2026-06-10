import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'

import { useMemo, useRef } from 'react'
import './Chart.css'
import type { ProjectIssue } from './ProjectIssueTable'

// Fixed palette to match the sample style - expanded for score1 and score2
const PALETTE = [
  { stroke: '#FF7A00' },
  { stroke: '#FF9F40' }, // Lighter orange for score2
  { stroke: '#8B5CF6' },
  { stroke: '#A78BFA' }, // Lighter purple for score2
  { stroke: '#06B6D4' },
  { stroke: '#22D3EE' }, // Lighter cyan for score2
  { stroke: '#22C55E' },
  { stroke: '#4ADE80' }, // Lighter green for score2
]

export type ObjectData = {
  name: string // Tên đối tượng
  time: string // ISO date string
  score: number // Điểm 1
  score2: number // Điểm 2
  score3: number // Điểm 3 (Creative)
}

export type MultiObjectData = {
  name: string // Tên đối tượng
  data: ObjectData[] // Array of ObjectData for each object
}

export type ScoreOverTimeChartProps = {
  datasets: MultiObjectData[] // Multiple datasets, each with a name and ObjectData array
  issues?: ProjectIssue[] // Project issues to show as ReferenceDot
  assigneeNameByEmail?: Record<string, string>
  title?: string
  height?: number
}

// Custom tooltip component that shows all data points and issues for a specific time
const CustomTooltip = ({
  active,
  payload,
  label,
  issues = [],
  assigneeNameByEmail = {},
}: any & { issues: ProjectIssue[]; assigneeNameByEmail: Record<string, string> }) => {
  if (!active || !payload || !label) {
    return null;
  }

  // Lấy thông tin từ payload để tìm timeGroup
  const currentItem = payload[0]?.payload;
  if (!currentItem) return null;

  // Tìm các issue tại mốc thời gian này
  let issuesAtTime: ProjectIssue[] = [];
  if (issues && label) {
    issuesAtTime = issues.filter((issue: ProjectIssue) => {
      if (!issue.StartWeek) return false;
      // Normalize both dates to compare just the date part
      const labelDate = new Date(label as string).toISOString().split('T')[0];
      const issueDate = new Date(issue.StartWeek).toISOString().split('T')[0];
      return issueDate === labelDate;
    });
  }

  // Gom các team/object tại cùng một thời điểm
  const teamsAtTime: Array<{name: string, score: number | null, score2: number | null, score3: number | null}> = [];
  
  // Tìm tất cả các team từ currentItem (loại bỏ time và các key _score2, _score3)
  const teamNames = Object.keys(currentItem).filter(key => 
    key !== 'time' && 
    !key.includes('_score2') && 
    !key.includes('_score3')
  );

  teamNames.forEach(teamName => {
    teamsAtTime.push({
      name: teamName,
      score: currentItem[teamName] ?? null,
      score2: currentItem[`${teamName}_score2`] ?? null,
      score3: currentItem[`${teamName}_score3`] ?? null
    });
  });

  return (
    <div className="custom-tooltip" style={{ zIndex: 9999 }}>
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', color: '#e2ecf4' }}>
        {new Date(label as string).toLocaleDateString('vi-VN')}
      </p>
      {teamsAtTime.length > 0 && (
        <>
          <p style={{ margin: '0 0 6px 0', fontWeight: '600', fontSize: '12px', color: '#94b8d0' }}>
            ĐIỂM HIỆU SUẤT:
          </p>
          {teamsAtTime.map((team, teamIndex) => (
            <div key={team.name} style={{ marginBottom: '8px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '11px', color: '#c5d8e8' }}>
                {team.name}:
              </p>
              {/* Performance Score */}
              {team.score !== null && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '11px', paddingLeft: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', marginRight: '6px', display: 'inline-block', backgroundColor: PALETTE[(teamIndex * 2) % PALETTE.length].stroke }}></span>
                  <span style={{ color: '#d0e4f0' }}>
                    Performance: {team.score}
                  </span>
                </div>
              )}
              {/* Base Score */}
              {team.score2 !== null && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '11px', paddingLeft: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', marginRight: '6px', display: 'inline-block', backgroundColor: PALETTE[(teamIndex * 2 + 1) % PALETTE.length].stroke }}></span>
                  <span style={{ color: '#d0e4f0' }}>
                    Base: {team.score2}
                  </span>
                </div>
              )}
              {/* Creative Score */}
              {team.score3 !== null && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '11px', paddingLeft: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', marginRight: '6px', display: 'inline-block', backgroundColor: '#06B6D4' }}></span>
                  <span style={{ color: '#d0e4f0' }}>
                    Creative: {team.score3}
                  </span>
                </div>
              )}
            </div>
          ))}
        </>
      )}
      {issuesAtTime.length > 0 && (
        <>
          <p style={{ margin: '12px 0 6px 0', fontWeight: '600', fontSize: '12px', color: '#fca5a5' }}>
            ISSUE:
          </p>
          <div className="custom-tooltip-issue-list">
            {issuesAtTime.map((issue: ProjectIssue, idx: number) => (
              <div key={idx} className="custom-tooltip-issue-card">
                <span style={{ fontWeight: '600', color: '#fca5a5', fontSize: '12px' }}>{issue.Project}</span>
                <span style={{ color: '#f87171', fontSize: '10px' }}>Team: {issue.Team}</span>
                <span style={{ color: '#f87171', fontSize: '10px' }}>
                  Assignees:{' '}
                  {(issue.Assignees && issue.Assignees.length > 0)
                    ? issue.Assignees
                        .map(a => {
                          const key = String(a ?? '').toLowerCase();
                          return assigneeNameByEmail[key] ?? a;
                        })
                        .join(', ')
                    : '—'}
                </span>
                <span style={{ color: issue.Difference > 0 ? '#34d399' : '#f87171', fontSize: '10px', fontWeight: '600' }}>
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

export default function LineChart({
  datasets,
  issues = [],
  assigneeNameByEmail = {},
  title = 'Performance Points Chart',
  height = 440,
}: ScoreOverTimeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const chartData = useMemo(() => {
    const allTimes = Array.from(new Set(datasets.flatMap((dataset) => dataset.data.map((entry) => entry.time)))).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
    return allTimes.map((time) => {
      const entry: Record<string, number | null | string> = { time }
      datasets.forEach((dataset) => {
        const dataPoint = dataset.data.find((d) => d.time === time)
        entry[`${dataset.name}`] = dataPoint ? dataPoint.score : null
        entry[`${dataset.name}_score2`] = dataPoint ? dataPoint.score2 : null
        entry[`${dataset.name}_score3`] = dataPoint && dataPoint.score3 !== undefined ? dataPoint.score3 : null
      })
      return entry
    })
  }, [datasets])

  // Hiển thị các issue như ReferenceDot trên trục thời gian (group theo time, hiển thị count giống ColumnChart)
  const issueDots = useMemo(() => {
    if (!issues || issues.length === 0 || !chartData || chartData.length === 0) return []

    const timeList = chartData.map((d) => d.time as string)

    const issuesByTime: Record<string, ProjectIssue[]> = {}

    issues.forEach((issue) => {
      if (!issue.StartWeek) return

      let xValue = issue.StartWeek
      const parsed = new Date(xValue)
      if (!Number.isNaN(parsed.getTime())) {
        xValue = parsed.toISOString()
      }

      const matchedTime =
        timeList.find((t) => {
          if (t === xValue) return true
          const tDate = new Date(t).toISOString().split('T')[0]
          const xDate = new Date(xValue).toISOString().split('T')[0]
          return tDate === xDate
        }) ??
        timeList.reduce((prev, curr) => {
          const currTime = new Date(curr).getTime()
          const prevTime = new Date(prev).getTime()
          const xTime = new Date(xValue).getTime()
          return Math.abs(currTime - xTime) < Math.abs(prevTime - xTime) ? curr : prev
        }, timeList[0])

      if (!issuesByTime[matchedTime]) {
        issuesByTime[matchedTime] = []
      }
      issuesByTime[matchedTime].push(issue)
    })

    return Object.entries(issuesByTime).map(([time, timeIssues]) => {
      const issueCount = timeIssues.length
      return {
        x: time,
        y: 0,
        key: `issue-dot-group-${time}`,
        fill: '#E53E3E',
        r: Math.min(6 + (issueCount - 1) * 2, 12),
        issueCount,
        issues: timeIssues,
      }
    })
  }, [issues, chartData])

  const overlayTitle = `Performance Points (2 Scores) - ${datasets.length} ${datasets.length > 1 ? 'teams' : 'team'}`

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
    <div className="chart-inner" style={{ height }}>
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
          <AreaChart data={chartData} margin={{ top: 48, right: 24, left: 8, bottom: 28 }}>
            <defs>
              {datasets.flatMap((_, idx) => [
                <linearGradient key={`grad-${idx * 2}`} id={`grad-${idx * 2}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE[(idx * 2) % PALETTE.length].stroke} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={PALETTE[(idx * 2) % PALETTE.length].stroke} stopOpacity={0.06} />
                </linearGradient>,
                <linearGradient key={`grad-${idx * 2 + 1}`} id={`grad-${idx * 2 + 1}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE[(idx * 2 + 1) % PALETTE.length].stroke} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={PALETTE[(idx * 2 + 1) % PALETTE.length].stroke} stopOpacity={0.06} />
                </linearGradient>
              ])}
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
            <YAxis tick={{ fontSize: 12, fill: '#667085' }} label={{ value: 'Điểm số', angle: -90, position: 'insideLeft', offset: 10 }} />
            <Tooltip 
            content={<CustomTooltip issues={issues} assigneeNameByEmail={assigneeNameByEmail} />}
            allowEscapeViewBox={{ x: false, y: true }}
            position={{ x: undefined, y: undefined }}
            />
            {datasets.flatMap((dataset, idx) => [
              <Area
                key={`${dataset.name}-area-score1`}
                type="monotone"
                dataKey={dataset.name}
                name={`${dataset.name} (Điểm 1)`}
                stroke={PALETTE[(idx * 2) % PALETTE.length].stroke}
                strokeWidth={2}
                fill={`url(#grad-${idx * 2})`}
                dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
                connectNulls
              />,
              <Area
                key={`${dataset.name}-area-score2`}
                type="monotone"
                dataKey={`${dataset.name}_score2`}
                name={`${dataset.name} (Điểm 2)`}
                stroke={PALETTE[(idx * 2 + 1) % PALETTE.length].stroke}
                strokeWidth={2}
                fill={`url(#grad-${idx * 2 + 1})`}
                dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ])}
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
                    ),
                  })}
                />
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
