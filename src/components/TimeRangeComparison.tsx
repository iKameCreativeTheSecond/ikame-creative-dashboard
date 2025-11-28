import { useState, useMemo, useRef } from 'react'
import './TimeRangeComparison.css'

export type TimeRangeComparisonProps = {
  data: Array<{ time: string; value: number; baseValue: number; creativeValue: number }>
}

type RangeSelection = {
  startIndex: number
  endIndex: number
}

export default function TimeRangeComparison({ data }: TimeRangeComparisonProps) {
  // Sort data by time first
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [data])

  // Initialize with default ranges
  const getDefaultRanges = () => {
    if (sortedData.length === 0) return { range1: null, range2: null }
    
    const totalLength = sortedData.length
    const rangeWidth = Math.max(2, Math.floor(totalLength * 0.25)) // 25% of timeline each
    
    // Range 1: First quarter
    const range1Start = 0
    const range1End = Math.min(rangeWidth - 1, totalLength - 1)
    
    // Range 2: Third quarter (leave gap in middle)
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

  // Update ranges when data changes
  useMemo(() => {
    if (sortedData.length > 0 && (!range1 || !range2)) {
      const defaults = getDefaultRanges()
      if (!range1) setRange1(defaults.range1)
      if (!range2) setRange2(defaults.range2)
    }
  }, [sortedData, range1, range2])

  // Calculate statistics for a range
  const calculateStats = (rangeSelection: RangeSelection | null) => {
    if (!rangeSelection || sortedData.length === 0) return null

    const { startIndex, endIndex } = rangeSelection
    const rangeData = sortedData.slice(startIndex, endIndex + 1)
    
    const totalValue = rangeData.reduce((sum, d) => sum + d.value, 0)
    const totalBase = rangeData.reduce((sum, d) => sum + d.baseValue, 0)
    const totalCreative = rangeData.reduce((sum, d) => sum + d.creativeValue, 0)

    return {
      startDate: rangeData[0].time,
      endDate: rangeData[rangeData.length - 1].time,
      total: Math.round(totalValue),
      base: Math.round(totalBase),
      creative: Math.round(totalCreative),
    }
  }

  const stats1 = calculateStats(range1)
  const stats2 = calculateStats(range2)

  // Calculate comparison
  const comparison = useMemo(() => {
    if (!stats1 || !stats2) return null

    const totalDiff = stats2.total - stats1.total
    const totalPercent = stats1.total !== 0 ? ((totalDiff / stats1.total) * 100) : 0

    return {
      totalDiff,
      totalPercent: totalPercent.toFixed(1),
      isIncrease: totalDiff > 0,
    }
  }, [stats1, stats2])

  // Drag handlers
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

    // Update only the range being dragged, keep the other one intact
    const validStart = Math.max(0, Math.min(sortedData.length - 1, newStart))
    const validEnd = Math.max(validStart, Math.min(sortedData.length - 1, newEnd))
    const updatedRange = { startIndex: validStart, endIndex: validEnd }

    if (isDragging.range === 1) {
      setRange1(updatedRange)
      // Keep range2 as is
    } else {
      setRange2(updatedRange)
      // Keep range1 as is
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const handleMouseLeave = () => {
    setIsDragging(null)
  }

  const getPositionStyle = (rangeSelection: RangeSelection | null) => {
    if (!rangeSelection || sortedData.length === 0) return { left: '0%', width: '0%' }
    
    const { startIndex, endIndex } = rangeSelection
    const left = (startIndex / (sortedData.length - 1)) * 100
    const width = ((endIndex - startIndex) / (sortedData.length - 1)) * 100
    
    return { left: `${left}%`, width: `${width}%` }
  }

  if (sortedData.length === 0) {
    return null
  }

  return (
    <div className="time-range-comparison">
      <div className="time-range-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 11l3 3L22 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3>Kết quả so sánh</h3>
      </div>

      {/* Visual Timeline with draggable ranges */}
      <div 
        className="visual-timeline"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="timeline-bar" 
          ref={timelineRef}
        >
          {/* Range 1 - Blue */}
          {range1 && (
            <div className="timeline-range timeline-range-1" style={getPositionStyle(range1)}>
              <div 
                className="range-handle range-handle-start"
                onMouseDown={(e) => handleMouseDown(1, 'start', e)}
              />
              <div 
                className="range-body"
                onMouseDown={(e) => handleMouseDown(1, 'move', e)}
              >
                <div className="range-info">
                  <span className="range-date-label">
                    {new Date(sortedData[range1.startIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    {' → '}
                    {new Date(sortedData[range1.endIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="range-duration">
                    ({range1.endIndex - range1.startIndex} tuần)
                  </span>
                </div>
              </div>
              <div 
                className="range-handle range-handle-end"
                onMouseDown={(e) => handleMouseDown(1, 'end', e)}
              />
            </div>
          )}
          
          {/* Range 2 - Purple */}
          {range2 && (
            <div className="timeline-range timeline-range-2" style={getPositionStyle(range2)}>
              <div 
                className="range-handle range-handle-start"
                onMouseDown={(e) => handleMouseDown(2, 'start', e)}
              />
              <div 
                className="range-body"
                onMouseDown={(e) => handleMouseDown(2, 'move', e)}
              >
                <div className="range-info">
                  <span className="range-date-label">
                    {new Date(sortedData[range2.startIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    {' → '}
                    {new Date(sortedData[range2.endIndex].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="range-duration">
                    ({range2.endIndex - range2.startIndex} tuần)
                  </span>
                </div>
              </div>
              <div 
                className="range-handle range-handle-end"
                onMouseDown={(e) => handleMouseDown(2, 'end', e)}
              />
            </div>
          )}
        </div>
        
        {/* Timeline tick marks */}
        <div className="timeline-ticks">
          {sortedData.map((d, i) => {
            // Show tick every week or if it's first/last
            const isFirstOrLast = i === 0 || i === sortedData.length - 1
            const showTick = isFirstOrLast || i % Math.max(1, Math.floor(sortedData.length / 10)) === 0
            
            if (!showTick) return null
            
            return (
              <div 
                key={i} 
                className="timeline-tick"
                style={{ left: `${(i / (sortedData.length - 1)) * 100}%` }}
              >
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
      <div className="time-range-stats">
        {/* Range 1 stats */}
        <div className="stats-box stats-box-1">
          <div className="stats-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#1D7BD9" strokeWidth="2" fill="none"/>
            </svg>
            <span>Khoảng thời gian trước</span>
          </div>
          {stats1 ? (
            <>
              <div className="stats-date">
                {new Date(stats1.startDate).toLocaleDateString('vi-VN')} - {new Date(stats1.endDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="stats-value">
                <span className="stats-number">{stats1.total}</span>
                <div className="stats-breakdown">
                  <span>Creative: {stats1.creative} | Base: {stats1.base}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="stats-empty">Chưa chọn</div>
          )}
        </div>

        {/* Range 2 stats */}
        <div className="stats-box stats-box-2">
          <div className="stats-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
            </svg>
            <span>Khoảng thời gian sau</span>
          </div>
          {stats2 ? (
            <>
              <div className="stats-date">
                {new Date(stats2.startDate).toLocaleDateString('vi-VN')} - {new Date(stats2.endDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="stats-value">
                <span className="stats-number">{stats2.total}</span>
                <div className="stats-breakdown">
                  <span>Creative: {stats2.creative} | Base: {stats2.base}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="stats-empty">Chưa chọn</div>
          )}
        </div>

        {/* Comparison */}
        {comparison && (
          <div className="stats-box stats-comparison">
            <div className="stats-header">
              <span>Tăng trưởng</span>
            </div>
            <div className="stats-value">
              <div className={`comparison-change ${comparison.isIncrease ? 'increase' : 'decrease'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  {comparison.isIncrease ? (
                    <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M7 7L17 17M17 17H9M17 17V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
                <span className="comparison-percent">{comparison.totalPercent}%</span>
              </div>
              <div className="comparison-details">
                {comparison.isIncrease ? 'Tăng' : 'Giảm'} {Math.abs(comparison.totalDiff)} điểm
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
