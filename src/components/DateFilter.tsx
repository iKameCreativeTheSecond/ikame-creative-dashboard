import React, { useState } from 'react'
import './DateFilter.css'

type Range = {
  startDate: string | null
  endDate: string | null
}

type Props = {
  onChange?: (range: Range) => void
}

function formatDate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const DateFilter: React.FC<Props> = ({ onChange }) => {
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  const applyChange = (s: string | null, e: string | null) => {
    setStartDate(s)
    setEndDate(e)
    onChange?.({ startDate: s, endDate: e })
  }

  const setQuickRange = (months: number, weeks = 0) => {
    const now = new Date()
    const end = new Date(now)
    const start = new Date(now)
    if (months) {
      start.setMonth(start.getMonth() - months)
    }
    if (weeks) {
      start.setDate(start.getDate() - weeks * 7)
    }
    applyChange(formatDate(start), formatDate(end))
  }

  return (
    <div className="date-filter">
      <div className="date-filter-row">
        <label>
          Ngày bắt đầu
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => applyChange(e.target.value || null, endDate)}
          />
        </label>

        <label>
          Ngày kết thúc
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => applyChange(startDate, e.target.value || null)}
          />
        </label>
      </div>

      <div className="date-filter-quick">
        <span>Lựa chọn nhanh:</span>
        <div className="quick-buttons">
          <button type="button" onClick={() => setQuickRange(0, 1)}>1 tuần</button>
          <button type="button" onClick={() => setQuickRange(1)}>1 tháng</button>
          <button type="button" onClick={() => setQuickRange(3)}>3 tháng</button>
          <button type="button" onClick={() => setQuickRange(6)}>6 tháng</button>
          <button
            type="button"
            className="clear"
            onClick={() => applyChange(null, null)}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateFilter
