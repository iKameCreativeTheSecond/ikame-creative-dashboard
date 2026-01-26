import { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/TopBar';
import './WeeklyPlan.css';

interface WeeklyPlanItem {
  id: number;
  timeline: Date; // start date of the timeline (end date is computed as start + 7 days)
  project: string;
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  objectives: string;
  strategy: string;
  // Proposed quantities
  proposedCPP: number;
  proposedIcon: number;
  proposedBanner: number;
  proposedPLA: number;
  proposedVideo: number;
  // Confirmed quantities
  confirmedCPP: number;
  confirmedIcon: number;
  confirmedBanner: number;
  confirmedPLA: number;
  confirmedVideo: number;
  confirmationStatus: 'sufficient' | 'lacking' | 'pending';
}

type QuantityField =
  | 'proposedCPP'
  | 'proposedIcon'
  | 'proposedBanner'
  | 'proposedPLA'
  | 'proposedVideo'
  | 'confirmedCPP'
  | 'confirmedIcon'
  | 'confirmedBanner'
  | 'confirmedPLA'
  | 'confirmedVideo';

type TextField = 'objectives' | 'strategy';

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState<WeeklyPlanItem[]>([]);
  const [filteredData, setFilteredData] = useState<WeeklyPlanItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Helper function to get Monday of current week
  const getMondayOfWeek = (date: Date): Date => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    // Calculate how many days to subtract to get to Monday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    selectedDate.setDate(selectedDate.getDate() - daysToSubtract);
    return selectedDate;
  };

  // Helper function to get Sunday of the week containing the given date
  const getSundayOfWeek = (date: Date): Date => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    // Calculate how many days to add to get to Sunday
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    selectedDate.setDate(selectedDate.getDate() + daysToAdd);
    return selectedDate;
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseIsoDateInputToLocalDate = (value: string): Date | null => {
    if (!value) return null;
    const [yearStr, monthStr, dayStr] = value.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const normalizeToLocalDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const addDays = (date: Date, days: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const formatDateDdMm = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTimelineStartDate = (startDate: Date): Date => {
    return normalizeToLocalDate(startDate);
  };

  const getTimelineEndDate = (startDate: Date): Date => {
    const start = getTimelineStartDate(startDate);
    return addDays(start, 7);
  };

  // Quick filter options - filter from current time backwards
  const handleQuickFilter = (weeks: number) => {
    const today = new Date();
    const currentMonday = getMondayOfWeek(new Date(today));
    const toDate = formatDateForInput(currentMonday);
    
    // Calculate the from date by going backwards from current Monday
    const fromDate = new Date(currentMonday);
    fromDate.setDate(fromDate.getDate() - (weeks * 7) + 7); // +7 to include current week
    const fromDateStr = formatDateForInput(fromDate);
    
    setDateFrom(fromDateStr);
    setDateTo(toDate);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  // Handle from date change - snap to Monday
  const handleDateFromChange = (value: string) => {
    if (!value) {
      setDateFrom("");
      return;
    }
    const selectedDate = parseIsoDateInputToLocalDate(value);
    if (selectedDate) {
      const monday = getMondayOfWeek(new Date(selectedDate));
      setDateFrom(formatDateForInput(monday));
    }
  };

  // Handle to date change - snap to Sunday
  const handleDateToChange = (value: string) => {
    if (!value) {
      setDateTo("");
      return;
    }
    const selectedDate = parseIsoDateInputToLocalDate(value);
    if (selectedDate) {
      const sunday = getSundayOfWeek(new Date(selectedDate));
      setDateTo(formatDateForInput(sunday));
    }
  };

  // Shift the current date range by whole weeks (7 days)
  // direction: -1 = previous week, +1 = next week
  const getEffectiveRange = (): { from: Date; to: Date } => {
    const currentMonday = getMondayOfWeek(new Date());

    const fromBase = dateFrom ? parseIsoDateInputToLocalDate(dateFrom) : null;
    const toBase = dateTo ? parseIsoDateInputToLocalDate(dateTo) : null;

    let from = fromBase;
    let to = toBase;

    if (!from && !to) {
      from = new Date(currentMonday);
      to = new Date(currentMonday);
    } else if (from && !to) {
      to = new Date(from);
    } else if (!from && to) {
      from = new Date(to);
    }

    if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
      from = new Date(currentMonday);
      to = new Date(currentMonday);
    }

    return { from, to };
  };

  const canShiftWeekRange = (direction: -1 | 1) => {
    if (direction === -1) return true;

    const { from, to } = getEffectiveRange();
    const nextFrom = new Date(from);
    const nextTo = new Date(to);
    nextFrom.setDate(nextFrom.getDate() + 7);
    nextTo.setDate(nextTo.getDate() + 7);

    const currentMonday = getMondayOfWeek(new Date());
    return nextTo.getTime() <= currentMonday.getTime();
  };

  const shiftWeekRange = (direction: -1 | 1) => {
    if (!canShiftWeekRange(direction)) return;

    const deltaDays = direction * 7;
    const { from, to } = getEffectiveRange();

    const newFrom = new Date(from);
    newFrom.setDate(newFrom.getDate() + deltaDays);
    
    // Only shift 'to' if it's different from 'from' (i.e., there's a range)
    let newTo: Date;
    if (from.getTime() === to.getTime()) {
      // If from == to, keep 'to' fixed and only shift 'from'
      newTo = new Date(to);
    } else {
      // If there's a range, shift both
      newTo = new Date(to);
      newTo.setDate(newTo.getDate() + deltaDays);
    }

    setDateFrom(formatDateForInput(newFrom));
    setDateTo(formatDateForInput(newTo));
  };

  useEffect(() => {
    // Sample data based on the image
    // Using 2025 for demo data to match typical filter ranges
    const year = 2025;
    const sampleData: WeeklyPlanItem[] = [
      {
        id: 1,
        timeline: new Date(year, 11, 1),
        project: 'Goods Jam',
        status: 'warning',
        objectives: `Scale biến vòng
Android: Keep spend, pROAS ≥50%
iOS: Keep spend, pROAS ≥50%
Timeline: 14/12`,
        strategy: `Test core mới
Test feel
Tối ưu các creative có đã win
Winner: Christmas`,
        proposedCPP: 0,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 0,
        proposedVideo: 16,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 3,
        confirmedVideo: 3,
        confirmationStatus: 'lacking'
      },
      {
        id: 2,
        timeline: new Date(year, 11, 8),
        project: 'Skewer Jam',
        status: 'danger',
        objectives: `Keep đề tối ưu sản phẩm
Deadline: 21/12`,
        strategy: `Test nhờ trên feel mới`,
        proposedCPP: 0,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 2,
        proposedVideo: 18,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 2,
        confirmedVideo: 18,
        confirmationStatus: 'sufficient'
      },
      {
        id: 3,
        timeline: new Date(year, 11, 8),
        project: 'Water Flow',
        status: 'info',
        objectives: `Testing chỉ số sản phẩm, 1-2K daily install
Timeline: 2 tuần`,
        strategy: '',
        proposedCPP: 0,
        proposedIcon: 1,
        proposedBanner: 1,
        proposedPLA: 3,
        proposedVideo: 3,
        confirmedCPP: 0,
        confirmedIcon: 1,
        confirmedBanner: 1,
        confirmedPLA: 0,
        confirmedVideo: 5,
        confirmationStatus: 'lacking'
      },
      {
        id: 4,
        timeline: new Date(year, 11, 8),
        project: 'Screwdom 3D',
        status: 'neutral',
        objectives: `- Deadline: W3/Dec
- X2 spend, tích DAU cho Christmas`,
        strategy: `- Thời gian: từ nay đến tháng Christmas
- Test số lượng massive
- Triển khai thêm các concept tốt (nhờ rõng, nhờ nổi thật bền trong)
- Đánh thêm các hình tuồng`,
        proposedCPP: 6,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 8,
        proposedVideo: 50,
        confirmedCPP: 6,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 5,
        confirmedVideo: 10,
        confirmationStatus: 'lacking'
      },
      {
        id: 5,
        timeline: new Date(year, 11, 8),
        project: 'Scrawdom 2',
        status: 'info',
        objectives: `- Deadline: Hết tháng 11
- x2 spend`,
        strategy: `- Seasonal
- Piggy + money`,
        proposedCPP: 2,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 0,
        proposedVideo: 0,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 3,
        confirmedPLA: 0,
        confirmedVideo: 5,
        confirmationStatus: 'lacking'
      },
      {
        id: 6,
        timeline: new Date(year, 11, 8),
        project: 'Block Flow',
        status: 'info',
        objectives: `Launching + Testing:
- Dạm bảo đủ user cho testing sản phẩm
- 500 - 1k users`,
        strategy: 'Applovin',
        proposedCPP: 0,
        proposedIcon: 1,
        proposedBanner: 1,
        proposedPLA: 2,
        proposedVideo: 2,
        confirmedCPP: 0,
        confirmedIcon: 1,
        confirmedBanner: 1,
        confirmedPLA: 1,
        confirmedVideo: 2,
        confirmationStatus: 'sufficient'
      },
      {
        id: 7,
        timeline: new Date(year, 11, 8),
        project: 'Scrawzle 3D',
        status: 'danger',
        objectives: `Tính hiện spend từ từ để theo dõi thêm chỉ số ok thì x2 spend`,
        strategy: 'Top trung scale applovin',
        proposedCPP: 3,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 2,
        proposedVideo: 3,
        confirmedCPP: 3,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 2,
        confirmedVideo: 3,
        confirmationStatus: 'sufficient'
      },
      {
        id: 8,
        timeline: new Date(year, 11, 8),
        project: 'Dreamroom',
        status: 'neutral',
        objectives: `Testing chỉ số sản phẩm, 1-2K daily install
Chỉnh lại level curve
Timeline: 8/12 - 14/12`,
        strategy: `Network: Focus Applovin
Theme Christmas (đồi tóc sẽ update)`,
        proposedCPP: 0,
        proposedIcon: 1,
        proposedBanner: 1,
        proposedPLA: 1,
        proposedVideo: 3,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 0,
        confirmedVideo: 0,
        confirmationStatus: 'sufficient'
      },
      {
        id: 9,
        timeline: new Date(year, 11, 8),
        project: 'Holiday Escape',
        status: 'warning',
        objectives: `Test bản big update
Thời gian: 8/12 - 14/12`,
        strategy: `Campaign: ROAS
Network: Applovin
Geo targeting: Tier 125 (trừ US)`,
        proposedCPP: 0,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 1,
        proposedVideo: 3,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 1,
        confirmedVideo: 3,
        confirmationStatus: 'lacking'
      },
      {
        id: 10,
        timeline: new Date(year, 11, 8),
        project: 'Water Escape',
        status: 'success',
        objectives: `Test bản iOS, scale x2 bản Android
Thời gian: 8/12-14/12`,
        strategy: `Camp BLD D28 Applovin
- Test theme Christmas (localize Christmas từ các creative tốt cả)`,
        proposedCPP: 1,
        proposedIcon: 0,
        proposedBanner: 0,
        proposedPLA: 2,
        proposedVideo: 3,
        confirmedCPP: 0,
        confirmedIcon: 0,
        confirmedBanner: 0,
        confirmedPLA: 0,
        confirmedVideo: 0,
        confirmationStatus: 'sufficient'
      }
    ];

    setPlanData(sampleData);
    setFilteredData(sampleData);
  }, []);

  useEffect(() => {
    let filtered = planData;
    
    // Filter by selected project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(item => item.project === selectedProject);
    }
    
    // Filter by date range (checks by start date only)
    if (dateFrom || dateTo) {
      filtered = filtered.filter(item => {
        const itemStartDate = normalizeToLocalDate(item.timeline);
        
        if (dateFrom && dateTo) {
          const fromDate = parseIsoDateInputToLocalDate(dateFrom);
          const toDate = parseIsoDateInputToLocalDate(dateTo);
          if (!fromDate || !toDate) return true;
          return itemStartDate >= fromDate && itemStartDate <= toDate;
        } else if (dateFrom) {
          const fromDate = parseIsoDateInputToLocalDate(dateFrom);
          if (!fromDate) return true;
          return itemStartDate >= fromDate;
        } else if (dateTo) {
          const toDate = parseIsoDateInputToLocalDate(dateTo);
          if (!toDate) return true;
          return itemStartDate <= toDate;
        }
        return true;
      });
    }
    
    setFilteredData(filtered);
  }, [selectedProject, planData, dateFrom, dateTo]);

  // Sort filtered data by timeline
  const sortedItems = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => a.timeline.getTime() - b.timeline.getTime());
    return sorted;
  }, [filteredData]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success': return 'status-success';
      case 'warning': return 'status-warning';
      case 'danger': return 'status-danger';
      case 'info': return 'status-info';
      default: return 'status-neutral';
    }
  };

  const getConfirmationClass = (status: string) => {
    switch (status) {
      case 'sufficient': return 'confirm-sufficient';
      case 'lacking': return 'confirm-lacking';
      default: return 'confirm-pending';
    }
  };

  const uniqueProjects = Array.from(new Set(planData.map(item => item.project)));

  const updateQuantity = (id: number, field: QuantityField, value: number) => {
    const nextValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    setPlanData(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: nextValue } : item))
    );
  };

  const updateTextField = (id: number, field: TextField, value: string) => {
    setPlanData(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const renderQuantityInput = (item: WeeklyPlanItem, field: QuantityField) => {
    return (
      <input
        className="quantity-input"
        type="number"
        min={0}
        step={1}
        value={item[field]}
        onChange={(e) => updateQuantity(item.id, field, Number(e.target.value))}
        inputMode="numeric"
      />
    );
  };

  const renderTextArea = (item: WeeklyPlanItem, field: TextField) => {
    return (
      <div className="table-textarea-wrap">
        <textarea
          className="table-textarea"
          value={item[field]}
          onChange={(e) => updateTextField(item.id, field, e.target.value)}
          rows={9}
        />
      </div>
    );
  };

  return (
    <div className="weekly-plan-page">
      <TopBar userName="Creative Team" siteName="Weekly Plan Dashboard" showHomeButton={true} />
      <div className="weekly-plan-container">
        <div className="filter-controls weekly-plan-filter-controls">
          <div className="filter-row">
            <div className="filter-group weekly-plan-filter-group-project">
              <label>Dự án</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả Dự án</option>
                {uniqueProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>
            <div className="filter-group weekly-plan-filter-group-date">
              <label>Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group weekly-plan-filter-group-date">
              <label>Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group weekly-plan-quick-group">
              <label>Tùy chọn nhanh</label>
              <div className="weekly-plan-quick-buttons">
                <button
                  type="button"
                  className="quick-filter-btn"
                  onClick={() => shiftWeekRange(-1)}
                  aria-label="Lùi 1 tuần"
                  title="Lùi 1 tuần"
                >
                  ← Tuần trước
                </button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(1)}>1 Tuần</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(2)}>2 Tuần</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(4)}>4 Tuần</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(6)}>6 Tuần</button>
                <button
                  type="button"
                  className="quick-filter-btn"
                  onClick={() => shiftWeekRange(1)}
                  disabled={!canShiftWeekRange(1)}
                  aria-label="Tiến 1 tuần"
                  title="Tiến 1 tuần"
                >
                  Tuần sau →
                </button>
                <button type="button" className="clear-filters-btn active" onClick={clearDateFilters}>Xóa</button>
              </div>
            </div>
          </div>

          {filteredData.length > 0 && (
            <div className="timeline-display">
              <div className="timeline-label">Timeline hiển thị:</div>
              <div className="timeline-items">
                {Array.from(new Set(filteredData.map(item => 
                  `${formatDateDdMm(getTimelineStartDate(item.timeline))} - ${formatDateDdMm(getTimelineEndDate(item.timeline))}`
                ))).map((timeline, idx) => (
                  <span key={idx} className="timeline-badge">{timeline}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="plan-table-wrapper">
          <table className="plan-table">
            <thead>
              <tr>
                <th className="col-project">Dự án</th>
                <th className="col-objectives">Mục tiêu</th>
                <th className="col-strategy">Chiến lược</th>
                <th className="col-quantity">Số lượng đề xuất</th>
                <th className="col-quantity">Số lượng confirm</th>
                <th className="col-status">Đủ/Thiếu Confirm</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id}>
                  <td className="col-project">
                    <span className={`project-badge ${getStatusClass(item.status)}`}>
                      {item.project}
                    </span>
                  </td>
                  <td className="col-objectives">
                    {renderTextArea(item, 'objectives')}
                  </td>
                  <td className="col-strategy">
                    {renderTextArea(item, 'strategy')}
                  </td>
                  <td className="col-quantity">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> {renderQuantityInput(item, 'proposedCPP')}</div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> {renderQuantityInput(item, 'proposedIcon')}</div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> {renderQuantityInput(item, 'proposedBanner')}</div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> {renderQuantityInput(item, 'proposedPLA')}</div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> {renderQuantityInput(item, 'proposedVideo')}</div>
                    </div>
                  </td>
                  <td className="col-quantity">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> {renderQuantityInput(item, 'confirmedCPP')}</div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> {renderQuantityInput(item, 'confirmedIcon')}</div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> {renderQuantityInput(item, 'confirmedBanner')}</div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> {renderQuantityInput(item, 'confirmedPLA')}</div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> {renderQuantityInput(item, 'confirmedVideo')}</div>
                    </div>
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${getConfirmationClass(item.confirmationStatus)}`}>
                      {item.confirmationStatus === 'sufficient' ? 'Đủ' : 
                       item.confirmationStatus === 'lacking' ? 'Thiếu' : 'Đang chờ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedItems.length === 0 && (
          <div className="no-data">
            <p>Không có dữ liệu</p>
          </div>
        )}
      </div>
    </div>
  );
}
