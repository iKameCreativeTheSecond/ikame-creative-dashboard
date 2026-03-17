import { useState, useEffect, useMemo, useRef } from 'react';
import { Select, DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import TopBar from '../components/TopBar';
import AdminData from '../common/AdministratorData';
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
  // Completed quantities
  completedCPP: number;
  completedIcon: number;
  completedBanner: number;
  completedPLA: number;
  completedVideo: number;
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
  | 'confirmedVideo'
  | 'completedCPP'
  | 'completedIcon'
  | 'completedBanner'
  | 'completedPLA'
  | 'completedVideo';

type TextField = 'objectives' | 'strategy';

// Returns today's date as a local Date object using Vietnam timezone (UTC+7)
function getVietnamNow(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);
  return new Date(year, month - 1, day);
}

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState<WeeklyPlanItem[]>([]);
  const [filteredData, setFilteredData] = useState<WeeklyPlanItem[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [modal, modalContextHolder] = Modal.useModal();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = getVietnamNow();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = getVietnamNow();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + 6);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addError, setAddError] = useState<string>('');
  const [addSuccessMsg, setAddSuccessMsg] = useState<string>('');
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string>('');
  const [addedItemId, setAddedItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<WeeklyPlanItem | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(() => AdminData.getListProjects());

  const addFormRef = useRef<HTMLDivElement>(null);
  const rowRefsMap = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? 'http://localhost:8888';

  useEffect(() => {
    if (AdminData.ProjectDetails && AdminData.ProjectDetails.length > 0) {
      setProjectOptions(AdminData.getListProjects());
    } else {
      fetch(serverUrl + '/get/project-details', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          AdminData.ProjectDetails = data;
          setProjectOptions(AdminData.getListProjects());
        })
        .catch(err => console.error('Error fetching project list:', err));
    }
  }, []);

  // Helper function to get Monday of current week
  const getMondayOfWeek = (date: Date): Date => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    // Calculate how many days to subtract to get to Monday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    selectedDate.setDate(selectedDate.getDate() - daysToSubtract);
    return selectedDate;
  };

  // Returns Sunday of the week starting on the given Monday
  const getSundayOfWeek = (monday: Date): Date => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
  };

  const getNextMonday = (): Date => {
    const currentMonday = getMondayOfWeek(getVietnamNow());
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday;
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  // Quick filter options - set start date to N weeks before current Monday
  const handleQuickFilter = (weeks: number) => {
    const currentMonday = getMondayOfWeek(getVietnamNow());
    const fromDate = new Date(currentMonday);
    fromDate.setDate(fromDate.getDate() - weeks * 7);
    setDateFrom(formatDateForInput(fromDate));
    setDateTo(formatDateForInput(getSundayOfWeek(fromDate)));
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  // Handle from date change - snap to Monday, auto-set dateTo to Sunday of same week
  const handleDateFromChange = (value: string) => {
    if (!value) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const selectedDate = parseIsoDateInputToLocalDate(value);
    if (selectedDate) {
      const monday = getMondayOfWeek(new Date(selectedDate));
      setDateFrom(formatDateForInput(monday));
      setDateTo(formatDateForInput(getSundayOfWeek(monday)));
    }
  };

  // Handle to date change - snap to Sunday
  // Shift the current date range by whole weeks (7 days)
  // direction: -1 = previous week, +1 = next week
  const getEffectiveRange = (): { from: Date; to: Date } => {
    const currentMonday = getMondayOfWeek(getVietnamNow());

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

    const nextMonday = getNextMonday();
    const nextSunday = getSundayOfWeek(nextMonday);
    return nextTo.getTime() <= nextSunday.getTime();
  };

  const handleNextWeekFilter = () => {
    const nextMonday = getNextMonday();
    setDateFrom(formatDateForInput(nextMonday));
    setDateTo(formatDateForInput(getSundayOfWeek(nextMonday)));
  };

  const shiftWeekRange = (direction: -1 | 1) => {
    if (!canShiftWeekRange(direction)) return;
    const { from } = getEffectiveRange();
    const newFrom = new Date(from);
    newFrom.setDate(newFrom.getDate() + direction * 7);
    setDateFrom(formatDateForInput(newFrom));
    setDateTo(formatDateForInput(getSundayOfWeek(newFrom)));
  };

  const openAddForm = () => {
    const nextMonday = getNextMonday();
    const defaultItem: WeeklyPlanItem = {
      id: 0,
      timeline: nextMonday,
      project: '',
      status: 'neutral',
      objectives: '',
      strategy: '',
      proposedCPP: 0,
      proposedIcon: 0,
      proposedBanner: 0,
      proposedPLA: 0,
      proposedVideo: 0,
      confirmedCPP: 0,
      confirmedIcon: 0,
      confirmedBanner: 0,
      confirmedPLA: 0,
      confirmedVideo: 0,
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
      confirmationStatus: 'pending'
    };
    setNewItem(defaultItem);
    setAddError('');
    setIsAddFormOpen(true);
  };

  const cancelAddForm = () => {
    setIsAddFormOpen(false);
    setNewItem(null);
    setAddError('');
  };

  const updateNewItemQuantity = (field: QuantityField, value: number) => {
    setNewItem(prev => {
      if (!prev) return prev;
      const nextValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
      return { ...prev, [field]: nextValue } as WeeklyPlanItem;
    });
  };

  const updateNewItemText = (field: TextField, value: string) => {
    setNewItem(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleNewItemTimelineChange = (value: string) => {
    setNewItem(prev => {
      if (!prev) return prev;
      const selectedDate = parseIsoDateInputToLocalDate(value);
      if (!selectedDate) return prev;
      const monday = getMondayOfWeek(new Date(selectedDate));
      return { ...prev, timeline: monday };
    });
  };

  const handleAddSubmit = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newItem) return;
    if (!newItem.project.trim()) {
      setAddError('Vui lòng chọn dự án.');
      return;
    }
    const normalizedNewTimeline = normalizeToLocalDate(newItem.timeline).getTime();
    const newProjectKey = newItem.project.trim().toLowerCase();
    const duplicateItem = planData.find(item => {
      const itemTimeline = normalizeToLocalDate(item.timeline).getTime();
      const itemProjectKey = item.project.trim().toLowerCase();
      return itemTimeline === normalizedNewTimeline && itemProjectKey === newProjectKey;
    });
    if (duplicateItem) {
      const snapshot = { ...newItem };
      modal.confirm({
        title: 'Phát hiện trùng lặp',
        content: `Đã có kế hoạch cho "${snapshot.project}" trong tuần này. Bạn muốn cập nhật mục cũ theo dữ liệu mới không?`,
        okText: 'Cập nhật',
        cancelText: 'Hủy',
        centered: true,
        onOk: () => {
          setPlanData(prev =>
            prev.map(item =>
              item.id === duplicateItem.id ? { ...snapshot, id: duplicateItem.id } : item
            )
          );
          setIsAddFormOpen(false);
          setNewItem(null);
          setAddError('');
          setAddedItemId(duplicateItem.id);
          setAddSuccessMsg(`Đã cập nhật kế hoạch "${snapshot.project}" thành công!`);
          setDateFrom(formatDateForInput(snapshot.timeline));
          setDateTo(formatDateForInput(getSundayOfWeek(snapshot.timeline)));
        },
      });
      return;
    }
    const nextId = planData.reduce((m, i) => Math.max(m, i.id), 0) + 1;
    const toAdd: WeeklyPlanItem = { ...newItem, id: nextId };
    setPlanData(prev => [...prev, toAdd]);
    setIsAddFormOpen(false);
    setNewItem(null);
    setAddError('');
    setAddedItemId(nextId);
    setAddSuccessMsg(`Đã thêm kế hoạch "${toAdd.project}" thành công!`);
    // Adjust filter to show the week of the newly added item
    setDateFrom(formatDateForInput(toAdd.timeline));
    setDateTo(formatDateForInput(getSundayOfWeek(toAdd.timeline)));
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
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
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
      confirmationStatus: 'sufficient'
      }
    ];

    setPlanData(sampleData);
    setFilteredData(sampleData);
    setProjectOptions(prev => {
      if (prev.length > 0) return prev;
      return [...new Set(sampleData.map(item => item.project))];
    });
  }, []);

  useEffect(() => {
    let filtered = planData;
    
    // Filter by selected projects (empty = show all)
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(item => selectedProjects.includes(item.project));
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
  }, [selectedProjects, planData, dateFrom, dateTo]);

  // Scroll to add form when it opens
  useEffect(() => {
    if (isAddFormOpen && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isAddFormOpen]);

  // Scroll to newly added row after it renders (scroll inside table wrapper only)
  useEffect(() => {
    if (addedItemId !== null) {
      const rowEl = rowRefsMap.current.get(addedItemId);
      const wrapper = tableWrapperRef.current;
      if (rowEl && wrapper) {
        const rowTop = rowEl.offsetTop;
        const rowHeight = rowEl.offsetHeight;
        const wrapperHeight = wrapper.clientHeight;
        wrapper.scrollTo({
          top: rowTop - wrapperHeight / 2 + rowHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [addedItemId, planData]);

  // Auto-clear success notification
  useEffect(() => {
    if (addSuccessMsg) {
      const timer = setTimeout(() => setAddSuccessMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [addSuccessMsg]);

  // Auto-clear delete success notification
  useEffect(() => {
    if (deleteSuccessMsg) {
      const timer = setTimeout(() => setDeleteSuccessMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccessMsg]);

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

  const copyToConfirmed = (id: number, proposedField: QuantityField) => {
    const confirmedField = proposedField.replace('proposed', 'confirmed') as QuantityField;
    setPlanData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [confirmedField]: item[proposedField] } : item
      )
    );
  };

  const deleteItem = (id: number) => {
    setPlanData(prev => prev.filter(item => item.id !== id));
  };

  const requestDeleteItem = (item: WeeklyPlanItem) =>
  {
    console.log('Requesting delete for item:', item);
    modal.confirm({
      title: 'Xác nhận xoá',
      content: `Bạn có chắc muốn xoá kế hoạch "${item.project}" không?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      centered: true,
      onOk: () => {
        deleteItem(item.id);
        setDeleteSuccessMsg(`Đã xoá kế hoạch "${item.project}" thành công!`);
      },
    });
  };

  const copyAllToConfirmed = (id: number) => {
    setPlanData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              confirmedCPP: item.proposedCPP,
              confirmedIcon: item.proposedIcon,
              confirmedBanner: item.proposedBanner,
              confirmedPLA: item.proposedPLA,
              confirmedVideo: item.proposedVideo,
            }
          : item
      )
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
      {modalContextHolder}
      <TopBar userName="Creative Team" siteName="Weekly Plan Dashboard" showHomeButton={true} />
      <div className="weekly-plan-container">
        <div className="filter-controls weekly-plan-filter-controls">
          <div className="filter-row">
            <div className="filter-group weekly-plan-filter-group-project">
              <label>Dự án</label>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Tất cả Dự án"
                value={selectedProjects}
                onChange={(values: string[]) => setSelectedProjects(values)}
                options={projectOptions.map(p => ({ value: p, label: p }))}
                style={{ minWidth: 200 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div className="filter-group weekly-plan-filter-group-date">
              <label>Từ ngày</label>
              <DatePicker
                value={dateFrom ? dayjs(dateFrom) : null}
                onChange={(date) => handleDateFromChange(date ? date.format('YYYY-MM-DD') : '')}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: '100%' }}
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
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(1)}>1 Tuần trước</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(2)}>2 Tuần trước</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(4)}>4 Tuần trước</button>
                <button type="button" className="quick-filter-btn" onClick={() => handleQuickFilter(6)}>6 Tuần trước</button>
                <button type="button" className="quick-filter-btn" onClick={handleNextWeekFilter}>1 Tuần tới</button>
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

            <div className="filter-group">
              <label>Thêm mục</label>
              <div>
                <button type="button" className="quick-filter-btn" onClick={openAddForm}>+ Thêm mục mới</button>
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

        {addSuccessMsg && (
          <div className="weekly-plan-success-toast">
            <span className="weekly-plan-success-icon">✓</span>
            {addSuccessMsg}
          </div>
        )}

        {deleteSuccessMsg && (
          <div className="weekly-plan-success-toast">
            <span className="weekly-plan-success-icon">✓</span>
            {deleteSuccessMsg}
          </div>
        )}

        {isAddFormOpen && newItem && (
          <div className="weekly-plan-add-card" ref={addFormRef}>
            <div className="weekly-plan-add-header">
              <h3 className="weekly-plan-add-title">Thêm kế hoạch tuần mới</h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit(e); }} className="weekly-plan-add-form">
              <div className="weekly-plan-add-top">
                <div className="weekly-plan-field weekly-plan-field-date">
                  <label>Timeline (Thứ 2)</label>
                  <DatePicker
                    value={dayjs(newItem.timeline)}
                    onChange={(date) => {
                      if (date) handleNewItemTimelineChange(date.format('YYYY-MM-DD'));
                    }}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="weekly-plan-field weekly-plan-field-project">
                  <label>Dự án</label>
                  <Select
                    showSearch
                    placeholder="-- Chọn dự án --"
                    value={newItem.project || undefined}
                    onChange={(value: string) => setNewItem(prev => (prev ? { ...prev, project: value } : prev))}
                    options={projectOptions.map(p => ({ value: p, label: p }))}
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
              </div>

              <div className="weekly-plan-add-body">
                <div className="weekly-plan-field">
                  <label>Mục tiêu</label>
                  <textarea
                    className="weekly-plan-textarea"
                    rows={7}
                    value={newItem.objectives}
                    onChange={(e) => updateNewItemText('objectives', e.target.value)}
                    placeholder="Nhập mục tiêu"
                  />
                </div>
                <div className="weekly-plan-field">
                  <label>Chiến lược</label>
                  <textarea
                    className="weekly-plan-textarea"
                    rows={7}
                    value={newItem.strategy}
                    onChange={(e) => updateNewItemText('strategy', e.target.value)}
                    placeholder="Nhập chiến lược"
                  />
                </div>
              </div>

              <div className="weekly-plan-add-qty">
                <div className="weekly-plan-add-qty-title">Số lượng order</div>
                <div className="weekly-plan-qty-grid">
                  <div className="weekly-plan-qty-item"><span className="qty-label">CPP</span><input className="quantity-input" type="number" min={0} step={1} value={newItem.proposedCPP} onChange={(e) => updateNewItemQuantity('proposedCPP', Number(e.target.value))} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Icon</span><input className="quantity-input" type="number" min={0} step={1} value={newItem.proposedIcon} onChange={(e) => updateNewItemQuantity('proposedIcon', Number(e.target.value))} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Banner</span><input className="quantity-input" type="number" min={0} step={1} value={newItem.proposedBanner} onChange={(e) => updateNewItemQuantity('proposedBanner', Number(e.target.value))} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">PLA</span><input className="quantity-input" type="number" min={0} step={1} value={newItem.proposedPLA} onChange={(e) => updateNewItemQuantity('proposedPLA', Number(e.target.value))} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Video</span><input className="quantity-input" type="number" min={0} step={1} value={newItem.proposedVideo} onChange={(e) => updateNewItemQuantity('proposedVideo', Number(e.target.value))} /></div>
                </div>
              </div>

              {addError && (
                <div className="weekly-plan-add-error">{addError}</div>
              )}

              <div className="weekly-plan-add-actions">
                <button type="submit" className="quick-filter-btn weekly-plan-add-btn">Thêm</button>
                <button type="button" className="clear-filters-btn active weekly-plan-add-btn" onClick={cancelAddForm}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        <div className="plan-table-wrapper" ref={tableWrapperRef}>
          <table className="plan-table">
            <thead>
              <tr>
                <th className="col-timeline">Timeline</th>
                <th className="col-project">Dự án</th>
                <th className="col-objectives">Mục tiêu</th>
                <th className="col-strategy">Chiến lược</th>
                <th className="col-quantity">Số lượng order</th>
                <th className="col-quantity">Số lượng confirm</th>
                <th className="col-status">Báo cáo</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefsMap.current.set(item.id, el);
                    else rowRefsMap.current.delete(item.id);
                  }}
                  className={addedItemId === item.id ? 'newly-added-row' : ''}
                >
                  <td className="col-timeline">
                    <span className="timeline-cell">
                      {formatDateDdMm(getTimelineStartDate(item.timeline))} - {formatDateDdMm(getTimelineEndDate(item.timeline))}
                    </span>
                  </td>
                  <td className="col-project">
                    <span className={`project-badge ${getStatusClass(item.status)}`}>
                      {item.project}
                    </span>
                    <button
                      type="button"
                      className="qty-copy-all-btn qty-delete-btn"
                      title="Xoá mục này"
                      onClick={() => requestDeleteItem(item)}
                    >Xoá</button>
                  </td>
                  <td className="col-objectives">
                    {renderTextArea(item, 'objectives')}
                  </td>
                  <td className="col-strategy">
                    {renderTextArea(item, 'strategy')}
                  </td>
                  <td className="col-quantity">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> {renderQuantityInput(item, 'proposedCPP')}<button type="button" className="qty-copy-btn" title="Copy sang Confirm" onClick={() => copyToConfirmed(item.id, 'proposedCPP')}>→</button></div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> {renderQuantityInput(item, 'proposedIcon')}<button type="button" className="qty-copy-btn" title="Copy sang Confirm" onClick={() => copyToConfirmed(item.id, 'proposedIcon')}>→</button></div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> {renderQuantityInput(item, 'proposedBanner')}<button type="button" className="qty-copy-btn" title="Copy sang Confirm" onClick={() => copyToConfirmed(item.id, 'proposedBanner')}>→</button></div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> {renderQuantityInput(item, 'proposedPLA')}<button type="button" className="qty-copy-btn" title="Copy sang Confirm" onClick={() => copyToConfirmed(item.id, 'proposedPLA')}>→</button></div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> {renderQuantityInput(item, 'proposedVideo')}<button type="button" className="qty-copy-btn" title="Copy sang Confirm" onClick={() => copyToConfirmed(item.id, 'proposedVideo')}>→</button></div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="qty-copy-all-btn qty-save-btn"
                        title="Lưu"
                        onClick={() => setAddSuccessMsg(`Đã lưu kế hoạch "${item.project}" thành công!`)}
                      >Save</button>
                      <button type="button" className="qty-copy-all-btn" title="Copy tất cả sang Confirm" onClick={() => copyAllToConfirmed(item.id)}>Copy all →</button>
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
                    <button
                      type="button"
                      className="qty-copy-all-btn qty-save-btn"
                      title="Save"
                      onClick={() => {
                        setAddSuccessMsg(`Đã lưu kế hoạch "${item.project}" thành công!`);
                      }}
                    >
                      Confirm
                    </button>
                  </td>
                  <td className="col-status">
                    <div className="confirm-diff-list">
                      {(['CPP', 'Icon', 'Banner', 'PLA', 'Video'] as const).map(type => {
                        const confirmed = item[`confirmed${type}` as QuantityField];
                        const completed = item[`completed${type}` as QuantityField];
                        const diff = confirmed - completed;
                        const cls = diff > 0 ? 'diff-surplus' : diff < 0 ? 'diff-lacking' : 'diff-exact';
                        const label = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '✓';
                        return (
                          <div key={type} className="confirm-diff-item">
                            <span className="qty-label">{type}:</span>
                            <span className={`confirm-diff-value ${cls}`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
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
