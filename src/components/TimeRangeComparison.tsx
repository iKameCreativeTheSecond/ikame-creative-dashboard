import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Col, Row, Space, Statistic, Typography } from 'antd'
import { FaArrowDown, FaArrowUp, FaExchangeAlt } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import './TimeRangeComparison.css'

export type TimeRangeComparisonProps = {
  data: Array<{ time: string; value: number; baseValue: number; creativeValue: number }>
}

type RangeSelection = {
  startIndex: number
  endIndex: number
}

export default function TimeRangeComparison({ data }: TimeRangeComparisonProps) {
  const { theme } = useTheme();
  const headingColor = theme === 'dark' ? '#ffffff'  : '#0d2016';
  const labelColor   = theme === 'dark' ? '#d0e8f5'  : '#1a3d2c';
  const mutedColor   = theme === 'dark' ? '#b0c8dc'  : '#4a8a70';
  const dimColor     = theme === 'dark' ? '#7a9bb8'  : '#6ba08a';
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [data])

  const getDefaultRanges = () => {
    if (sortedData.length === 0) return { range1: null, range2: null }

    const totalLength = sortedData.length
    const rangeWidth = Math.max(2, Math.floor(totalLength * 0.25))

    const range1Start = 0
    const range1End = Math.min(rangeWidth - 1, totalLength - 1)
    const range2Start = Math.min(Math.floor(totalLength * 0.5), totalLength - rangeWidth)
    const range2End = Math.min(range2Start + rangeWidth - 1, totalLength - 1)

    return {
      range1: { startIndex: range1Start, endIndex: range1End },
      range2: { startIndex: range2Start, endIndex: range2End }
    }
  }

  const defaultRanges = useMemo(() => getDefaultRanges(), [sortedData])

  const [range1, setRange1] = useState<RangeSelection | null>(defaultRanges.range1)
  const [range2, setRange2] = useState<RangeSelection | null>(defaultRanges.range2)
  const [isDragging, setIsDragging] = useState<{ range: 1 | 2; type: 'start' | 'end' | 'move'; initialX: number } | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const clampRange = (rangeSelection: RangeSelection | null, length: number): RangeSelection | null => {
    if (!rangeSelection || length <= 0) return null

    const maxIndex = length - 1
    const clampedStart = Math.max(0, Math.min(maxIndex, rangeSelection.startIndex))
    const clampedEnd = Math.max(0, Math.min(maxIndex, rangeSelection.endIndex))

    let startIndex = Math.min(clampedStart, clampedEnd)
    let endIndex = Math.max(clampedStart, clampedEnd)

    if (length > 1 && startIndex === endIndex) {
      endIndex = Math.min(maxIndex, startIndex + 1)
      startIndex = Math.max(0, endIndex - 1)
    }

    return { startIndex, endIndex }
  }

  const rangesEqual = (a: RangeSelection | null, b: RangeSelection | null) => {
    if (!a && !b) return true
    if (!a || !b) return false
    return a.startIndex === b.startIndex && a.endIndex === b.endIndex
  }

  useEffect(() => {
    if (sortedData.length === 0) {
      if (range1 !== null) setRange1(null)
      if (range2 !== null) setRange2(null)
      return
    }

    const defaults = getDefaultRanges()
    const nextRange1 = clampRange(range1, sortedData.length) ?? defaults.range1
    const nextRange2 = clampRange(range2, sortedData.length) ?? defaults.range2

    if (!rangesEqual(range1, nextRange1)) setRange1(nextRange1)
    if (!rangesEqual(range2, nextRange2)) setRange2(nextRange2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedData.length])

  const calculateStats = (rangeSelection: RangeSelection | null) => {
    if (!rangeSelection || sortedData.length === 0) return null

    const clamped = clampRange(rangeSelection, sortedData.length)
    if (!clamped) return null

    const { startIndex, endIndex } = clamped
    const rangeData = sortedData.slice(startIndex, endIndex + 1)
    if (rangeData.length === 0) return null

    return {
      startDate: rangeData[0].time,
      endDate: rangeData[rangeData.length - 1].time,
      total: Math.round(rangeData.reduce((sum, d) => sum + d.value, 0)),
      base: Math.round(rangeData.reduce((sum, d) => sum + d.baseValue, 0)),
      creative: Math.round(rangeData.reduce((sum, d) => sum + d.creativeValue, 0)),
    }
  }

  const stats1 = calculateStats(range1)
  const stats2 = calculateStats(range2)

  const comparison = useMemo(() => {
    if (!stats1 || !stats2) return null
    const totalDiff = stats2.total - stats1.total
    const totalPercent = stats1.total !== 0 ? (totalDiff / stats1.total) * 100 : 0
    return {
      totalDiff,
      totalPercent: totalPercent.toFixed(1),
      isIncrease: totalDiff > 0,
    }
  }, [stats1, stats2])

  const handleMouseDown = (rangeNum: 1 | 2, type: 'start' | 'end' | 'move', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging({ range: rangeNum, type, initialX: e.clientX })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current || sortedData.length === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const index = Math.round(percent * (sortedData.length - 1))

    const currentRange = isDragging.range === 1 ? range1 : range2
    if (!currentRange) return

    let newStart = currentRange.startIndex
    let newEnd = currentRange.endIndex

    if (isDragging.type === 'start') {
      newStart = Math.min(index, currentRange.endIndex - 1)
    } else if (isDragging.type === 'end') {
      newEnd = Math.max(index, currentRange.startIndex + 1)
    } else if (isDragging.type === 'move') {
      const width = currentRange.endIndex - currentRange.startIndex
      newStart = Math.max(0, Math.min(sortedData.length - 1 - width, index - Math.floor(width / 2)))
      newEnd = newStart + width
    }

    const validStart = Math.max(0, Math.min(sortedData.length - 1, newStart))
    const validEnd = Math.max(validStart, Math.min(sortedData.length - 1, newEnd))

    if (isDragging.range === 1) setRange1({ startIndex: validStart, endIndex: validEnd })
    else setRange2({ startIndex: validStart, endIndex: validEnd })
  }

  const handleMouseUp = () => setIsDragging(null)
  const handleMouseLeave = () => setIsDragging(null)

  const getPositionStyle = (rangeSelection: RangeSelection | null) => {
    const clamped = clampRange(rangeSelection, sortedData.length)
    if (!clamped || sortedData.length === 0) return { left: '0%', width: '0%' }
    const { startIndex, endIndex } = clamped
    return {
      left: `${(startIndex / (sortedData.length - 1)) * 100}%`,
      width: `${((endIndex - startIndex) / (sortedData.length - 1)) * 100}%`,
    }
  }

  if (sortedData.length === 0) return null

  const range1Safe = clampRange(range1, sortedData.length)
  const range2Safe = clampRange(range2, sortedData.length)

  return (
    <div className="time-range-comparison">
      <div className="time-range-header">
        <FaExchangeAlt className="section-icon" />
        <Typography.Text strong style={{ color: headingColor, fontSize: 15, lineHeight: 1 }}>Kết quả so sánh</Typography.Text>
      </div>

      {/* Visual Timeline with draggable ranges */}
      <div
        className="visual-timeline"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="timeline-bar" ref={timelineRef}>
          {range1Safe && (
            <div className="timeline-range timeline-range-1" style={getPositionStyle(range1Safe)}>
              <div className="range-handle range-handle-start" onMouseDown={(e) => handleMouseDown(1, 'start', e)} />
              <div className="range-body" onMouseDown={(e) => handleMouseDown(1, 'move', e)}>
                <div className="range-info">
                  <span className="range-date-label">
                    {new Date(sortedData[range1Safe.startIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    {' → '}
                    {new Date(sortedData[range1Safe.endIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="range-duration">({range1Safe.endIndex - range1Safe.startIndex} tuần)</span>
                </div>
              </div>
              <div className="range-handle range-handle-end" onMouseDown={(e) => handleMouseDown(1, 'end', e)} />
            </div>
          )}

          {range2Safe && (
            <div className="timeline-range timeline-range-2" style={getPositionStyle(range2Safe)}>
              <div className="range-handle range-handle-start" onMouseDown={(e) => handleMouseDown(2, 'start', e)} />
              <div className="range-body" onMouseDown={(e) => handleMouseDown(2, 'move', e)}>
                <div className="range-info">
                  <span className="range-date-label">
                    {new Date(sortedData[range2Safe.startIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    {' → '}
                    {new Date(sortedData[range2Safe.endIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="range-duration">({range2Safe.endIndex - range2Safe.startIndex} tuần)</span>
                </div>
              </div>
              <div className="range-handle range-handle-end" onMouseDown={(e) => handleMouseDown(2, 'end', e)} />
            </div>
          )}
        </div>

        <div className="timeline-ticks">
          {sortedData.map((d, i) => {
            const isFirstOrLast = i === 0 || i === sortedData.length - 1
            const showTick = isFirstOrLast || i % Math.max(1, Math.floor(sortedData.length / 10)) === 0
            if (!showTick) return null
            return (
              <div key={i} className="timeline-tick" style={{ left: `${(i / (sortedData.length - 1)) * 100}%` }}>
                <div className="tick-mark" />
                <div className="tick-label">
                  {new Date(d.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Statistics comparison */}
      <Row gutter={16} className="stats-row">
        <Col span={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card className="stats-card stats-card-1" size="small">
            <div className="stats-card-meta">
              <Space size={6} align="center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#1D7BD9" strokeWidth="2" fill="none"/>
                </svg>
                <Typography.Text style={{ color: labelColor, fontSize: 13, fontWeight: 500 }}>Khoảng thời gian trước</Typography.Text>
              </Space>
              <Typography.Text style={{ color: mutedColor, fontSize: 11 }}>
                {stats1
                  ? `${new Date(stats1.startDate).toLocaleDateString('vi-VN')} - ${new Date(stats1.endDate).toLocaleDateString('vi-VN')}`
                  : ' '}
              </Typography.Text>
            </div>
            {stats1 ? (
              <>
                <Statistic value={stats1.total} valueStyle={{ color: headingColor, fontSize: 28, fontWeight: 700, lineHeight: 1 }} />
                <Typography.Text style={{ color: mutedColor, fontSize: 11, marginTop: 4, display: 'block' }}>
                  Creative: {stats1.creative} | Base: {stats1.base}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text style={{ color: dimColor, fontStyle: 'italic', fontSize: 13 }}>Chưa chọn</Typography.Text>
            )}
          </Card>
        </Col>

        <Col span={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card className="stats-card stats-card-2" size="small">
            <div className="stats-card-meta">
              <Space size={6} align="center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
                </svg>
                <Typography.Text style={{ color: labelColor, fontSize: 13, fontWeight: 500 }}>Khoảng thời gian sau</Typography.Text>
              </Space>
              <Typography.Text style={{ color: mutedColor, fontSize: 11 }}>
                {stats2
                  ? `${new Date(stats2.startDate).toLocaleDateString('vi-VN')} - ${new Date(stats2.endDate).toLocaleDateString('vi-VN')}`
                  : ' '}
              </Typography.Text>
            </div>
            {stats2 ? (
              <>
                <Statistic value={stats2.total} valueStyle={{ color: headingColor, fontSize: 28, fontWeight: 700, lineHeight: 1 }} />
                <Typography.Text style={{ color: mutedColor, fontSize: 11, marginTop: 4, display: 'block' }}>
                  Creative: {stats2.creative} | Base: {stats2.base}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text style={{ color: dimColor, fontStyle: 'italic', fontSize: 13 }}>Chưa chọn</Typography.Text>
            )}
          </Card>
        </Col>

        <Col span={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card className="stats-card stats-comparison" size="small">
            <div className="stats-card-meta">
              <Typography.Text style={{ color: labelColor, fontSize: 13, fontWeight: 500 }}>Tăng trưởng</Typography.Text>
              <Typography.Text style={{ color: 'transparent', fontSize: 11 }}>{' '}</Typography.Text>
            </div>
            {comparison ? (
              <>
                <Statistic
                  value={comparison.totalPercent}
                  suffix="%"
                  prefix={
                    comparison.isIncrease
                      ? <FaArrowUp style={{ color: '#4ade80', fontSize: 18, marginRight: 4 }} />
                      : <FaArrowDown style={{ color: '#f87171', fontSize: 18, marginRight: 4 }} />
                  }
                  valueStyle={{
                    color: comparison.isIncrease ? '#4ade80' : '#f87171',
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                />
                <Typography.Text style={{ color: mutedColor, fontSize: 12, marginTop: 4, display: 'block' }}>
                  {comparison.isIncrease ? 'Tăng' : 'Giảm'} {Math.abs(comparison.totalDiff)} điểm
                </Typography.Text>
              </>
            ) : (
              <Typography.Text style={{ color: dimColor, fontStyle: 'italic', fontSize: 13 }}>—</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
