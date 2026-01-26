import { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/TopBar';
import './WeeklyPlan.css';

interface WeeklyPlanItem {
  id: number;
  timeline: string;
  stt: number;
  project: string;
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  objectives: string;
  strategy: string;
  proposedQuantity: string;
  confirmedQuantity: string;
  confirmationStatus: 'sufficient' | 'lacking' | 'pending';
}

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState<WeeklyPlanItem[]>([]);
  const [filteredData, setFilteredData] = useState<WeeklyPlanItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to get Monday of current week
  const getMondayOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Parse timeline string "08/12 - 14/12" to get start date
  const parseTimelineToDate = (timeline: string): Date | null => {
    try {
      const [startPart] = timeline.split(' - ');
      const [day, month] = startPart.split('/').map(num => parseInt(num, 10));
      // Assume current year if not specified
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day);
    } catch {
      return null;
    }
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

  // Shift the current date range by whole weeks (7 days)
  // direction: -1 = previous week, +1 = next week
  const getEffectiveRange = (): { from: Date; to: Date } => {
    const currentMonday = getMondayOfWeek(new Date());

    const fromBase = dateFrom ? new Date(dateFrom) : null;
    const toBase = dateTo ? new Date(dateTo) : null;

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

    from.setDate(from.getDate() + deltaDays);
    to.setDate(to.getDate() + deltaDays);

    setDateFrom(formatDateForInput(from));
    setDateTo(formatDateForInput(to));
  };

  useEffect(() => {
    // Sample data based on the image
    const sampleData: WeeklyPlanItem[] = [
      {
        id: 1,
        timeline: '01/12 - 14/12',
        stt: 5,
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
        proposedQuantity: `AXON + GG: Theo plan đã bàn
Meta: 12-20`,
        confirmedQuantity: `PLA + vid: 6
meta: ok`,
        confirmationStatus: 'lacking'
      },
      {
        id: 2,
        timeline: '08/12 - 14/12',
        stt: 6,
        project: 'Skewer Jam',
        status: 'danger',
        objectives: `Keep đề tối ưu sản phẩm
Deadline: 21/12`,
        strategy: `Test nhờ trên feel mới`,
        proposedQuantity: `Video: 3
PLA: 2
Meta: 15-20`,
        confirmedQuantity: 'ok',
        confirmationStatus: 'sufficient'
      },
      {
        id: 3,
        timeline: '08/12 - 14/12',
        stt: 7,
        project: 'Water Flow',
        status: 'info',
        objectives: `Testing chỉ số sản phẩm, 1-2K daily install
Timeline: 2 tuần`,
        strategy: '',
        proposedQuantity: `- Video: 3
- PLA: 3
- Store: 1 icon + 1 SS`,
        confirmedQuantity: `vid 5
store ok`,
        confirmationStatus: 'lacking'
      },
      {
        id: 4,
        timeline: '08/12 - 14/12',
        stt: 8,
        project: 'Screwdom 3D',
        status: 'neutral',
        objectives: `- Deadline: W3/Dec
- X2 spend, tích DAU cho Christmas`,
        strategy: `- Thời gian: từ nay đến tháng Christmas
- Test số lượng massive
- Triển khai thêm các concept tốt (nhờ rõng, nhờ nổi thật bền trong)
- Đánh thêm các hình tuồng`,
        proposedQuantity: `- PLA: 8
- CPP: 1 SS + 5 banner chạy Facebook
- Video cho Meta: 50`,
        confirmedQuantity: `vid 10
pla 5
cpp ok
meta 20`,
        confirmationStatus: 'lacking'
      },
      {
        id: 5,
        timeline: '08/12 - 14/12',
        stt: 9,
        project: 'Scrawdom 2',
        status: 'info',
        objectives: `- Deadline: Hết tháng 11
- x2 spend`,
        strategy: `- Seasonal
- Piggy + money`,
        proposedQuantity: `- SS: 2 SS (Christmas + Winter) - Nhờ hồng
`,
        confirmedQuantity: `banner 3
video 5`,
        confirmationStatus: 'lacking'
      },
      {
        id: 6,
        timeline: '08/12 - 14/12',
        stt: 10,
        project: 'Block Flow',
        status: 'info',
        objectives: `Launching + Testing:
- Dạm bảo đủ user cho testing sản phẩm
- 500 - 1k users`,
        strategy: 'Applovin',
        proposedQuantity: `- Video: 2
- PLA: 2
- Store: 1 icon + 1 screenshot`,
        confirmedQuantity: `vid 2
pla 1
store: đã có`,
        confirmationStatus: 'sufficient'
      },
      {
        id: 7,
        timeline: '08/12 - 14/12',
        stt: 11,
        project: 'Scrawzle 3D',
        status: 'danger',
        objectives: `Tính hiện spend từ từ để theo dõi thêm chỉ số ok thì x2 spend`,
        strategy: 'Top trung scale applovin',
        proposedQuantity: `- Video: 3 (1 video nhờ xanh lẻ & đồ gỗi ref & oder ED á)
- PLA: 2
- CPP icon: 3
- Concept CPP house/room...`,
        confirmedQuantity: `vid 3
pla 2
ok`,
        confirmationStatus: 'sufficient'
      },
      {
        id: 8,
        timeline: '08/12 - 14/12',
        stt: 12,
        project: 'Dreamroom',
        status: 'neutral',
        objectives: `Testing chỉ số sản phẩm, 1-2K daily install
Chỉnh lại level curve
Timeline: 8/12 - 14/12`,
        strategy: `Network: Focus Applovin
Theme Christmas (đồi tóc sẽ update)`,
        proposedQuantity: `- Video: 3 (theme Christmas + concept quay ipad)
- PLA: 1 (theme Christmas)
- Store: 1 icon + 1 theme Christmas (theo hướng dẫn người chơi, có gesture)`,
        confirmedQuantity: 'bàn lại',
        confirmationStatus: 'sufficient'
      },
      {
        id: 9,
        timeline: '08/12 - 14/12',
        stt: 13,
        project: 'Holiday Escape',
        status: 'warning',
        objectives: `Test bản big update
Thời gian: 8/12 - 14/12`,
        strategy: `Campaign: ROAS
Network: Applovin
Geo targeting: Tier 125 (trừ US)`,
        proposedQuantity: `- Video: 3
- PLA: 1`,
        confirmedQuantity: `vid: ok
pla: 1 (chu thuộc assets)`,
        confirmationStatus: 'lacking'
      },
      {
        id: 10,
        timeline: '08/12 - 14/12',
        stt: 14,
        project: 'Water Escape',
        status: 'success',
        objectives: `Test bản iOS, scale x2 bản Android
Thời gian: 8/12-14/12`,
        strategy: `Camp BLD D28 Applovin
- Test theme Christmas (localize Christmas từ các creative tốt cả)`,
        proposedQuantity: `- Video: 3
- PLA: 2
- CPP Christmas: 1`,
        confirmedQuantity: '0',
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
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(item => {
        const itemDate = parseTimelineToDate(item.timeline);
        if (!itemDate) return true; // Keep items with unparseable dates
        
        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (dateFrom) {
          const fromDate = new Date(dateFrom);
          return itemDate >= fromDate;
        } else if (dateTo) {
          const toDate = new Date(dateTo);
          return itemDate <= toDate;
        }
        return true;
      });
    }
    
    setFilteredData(filtered);
  }, [selectedProject, planData, dateFrom, dateTo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProject, dateFrom, dateTo]);

  // Group filtered data by timeline (each timeline is a page)
  const timelinePages = useMemo(() => {
    const map = new Map<string, WeeklyPlanItem[]>();
    for (const item of filteredData) {
      const key = item.timeline || 'Unknown';
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const aDate = parseTimelineToDate(a[0])?.getTime() ?? 0;
      const bDate = parseTimelineToDate(b[0])?.getTime() ?? 0;
      return aDate - bDate;
    });

    return entries.map(([timeline, items]) => ({ timeline, items }));
  }, [filteredData]);

  const totalPages = Math.max(1, timelinePages.length);

  // Clamp current page when data changes
  useEffect(() => {
    if (timelinePages.length === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    const maxPage = timelinePages.length;
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [timelinePages.length, currentPage]);

  const currentTimelinePage = timelinePages.length > 0 ? timelinePages[currentPage - 1] : null;
  const pageItems = currentTimelinePage?.items ?? [];
  const currentTimelineLabel = currentTimelinePage?.timeline ?? '';

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
                onChange={(e) => setDateFrom(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group weekly-plan-filter-group-date">
              <label>Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-row weekly-plan-quick-row">
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
        </div>

        {timelinePages.length > 1 && (
          <div className="weekly-plan-table-footer table-footer">
            <div className="pagination-info">
              {currentTimelineLabel ? `Timeline: ${currentTimelineLabel} (${pageItems.length} dòng)` : 'Timeline: -'}
            </div>
            <div className="pagination-controls">
              <button
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                aria-label="Trang đầu"
              >«</button>
              <button
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                aria-label="Trang trước"
              >‹</button>
              <span className="page-indicator">Trang {currentPage} / {totalPages}</span>
              <button
                className="page-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                aria-label="Trang sau"
              >›</button>
              <button
                className="page-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                aria-label="Trang cuối"
              >»</button>
            </div>
          </div>
        )}

        <div className="plan-table-wrapper">
          <table className="plan-table">
            <thead>
              <tr>
                <th className="col-timeline">Timeline</th>
                <th className="col-stt">STT</th>
                <th className="col-project">Dự án</th>
                <th className="col-objectives">Mục tiêu</th>
                <th className="col-strategy">Chiến lược</th>
                <th className="col-quantity">Số lượng đề xuất</th>
                <th className="col-quantity">Số lượng confirm</th>
                <th className="col-status">Đủ/Thiếu Confirm</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td className="col-timeline">{item.timeline}</td>
                  <td className="col-stt">{item.stt}</td>
                  <td className="col-project">
                    <span className={`project-badge ${getStatusClass(item.status)}`}>
                      {item.project}
                    </span>
                  </td>
                  <td className="col-objectives">
                    <div className="text-content">{item.objectives}</div>
                  </td>
                  <td className="col-strategy">
                    <div className="text-content">{item.strategy}</div>
                  </td>
                  <td className="col-quantity">
                    <div className="text-content">{item.proposedQuantity}</div>
                  </td>
                  <td className="col-quantity">
                    <div className="text-content">{item.confirmedQuantity}</div>
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

        {timelinePages.length === 0 && (
          <div className="no-data">
            <p>Không có dữ liệu cho timeline này</p>
          </div>
        )}
      </div>
    </div>
  );
}
