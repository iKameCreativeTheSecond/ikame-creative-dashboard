import { useState, useEffect, useMemo, useRef } from 'react';
import { Select, DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import TopBar from '../components/TopBar';
import AdminData from '../common/AdministratorData';
import './WeeklyPlan.css';

interface WeeklyPlanItem {
  id: number;
  backendId?: string; // raw id from backend (ID/id). Can be missing.
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
  const didInitialLoadRef = useRef(false);

  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? 'http://localhost:8888';

  const stableHash32 = (input: string): number => {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return hash >>> 0;
  };

  const ensureUniqueIds = (items: WeeklyPlanItem[]): WeeklyPlanItem[] => {
    const used = new Set<number>();
    return items.map((item) => {
      let nextId = item.id;
      if (!Number.isFinite(nextId)) {
        nextId = -1 * (stableHash32(`${(item.project ?? '').trim().toLowerCase()}|${item.timeline?.toISOString?.() ?? ''}`) + 1);
      }

      while (used.has(nextId)) {
        nextId -= 1;
      }

      used.add(nextId);
      return nextId === item.id ? item : { ...item, id: nextId };
    });
  };

  // Serialize WeeklyPlanItem proposed fields → temp-weekly-order payload (same structure as WeeklyOrder)
  // For new items (no backendId yet), omit ID so backend can generate it.
  const serializeTempOrder = (item: WeeklyPlanItem) => ({
    ID: item.backendId ?? undefined,
    StartWeek: item.timeline.toISOString(),
    Project: item.project,
    Status: item.status,
    Goal: item.objectives,
    Strategy: item.strategy,
    CPP: item.proposedCPP,
    Icon: item.proposedIcon,
    Banner: item.proposedBanner,
    PLA: item.proposedPLA,
    Video: item.proposedVideo,
  });

  // Serialize WeeklyPlanItem confirmed fields → weekly-order update payload.
  // Keep the same payload shape as temp-weekly-order update (Status/Goal/Strategy + CPP/Icon/Banner/PLA/Video).
  const serializeConfirmedPlan = (item: WeeklyPlanItem) => ({
    ID: item.backendId ?? String(item.id),
    StartWeek: item.timeline.toISOString(),
    Project: item.project,
    Status: item.status,
    Goal: item.objectives,
    Strategy: item.strategy,
    CPP: item.confirmedCPP,
    Icon: item.confirmedIcon,
    Banner: item.confirmedBanner,
    PLA: item.confirmedPLA,
    Video: item.confirmedVideo,
  });

  // Deserialize temp-weekly-order response → full WeeklyPlanItem (proposed side, confirmed = 0)
  const deserializeTempOrder = (data: any): WeeklyPlanItem => {
    const timeline = new Date(data.StartWeek);
    const project = (data.Project ?? '') as string;
    const backendIdRaw = data.ID ?? data.id;
    const backendId = backendIdRaw === undefined || backendIdRaw === null || backendIdRaw === '' ? undefined : String(backendIdRaw);
    const parsedBackendId = backendId ? Number(backendId) : NaN;

    // If backend doesn't provide a usable ID, derive a stable client id from (project + monday)
    const d = new Date(timeline);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const mondayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const derivedId = -1 * (stableHash32(`${project.trim().toLowerCase()}|${mondayMs}`) + 1);

    const id = Number.isFinite(parsedBackendId) ? parsedBackendId : derivedId;

    return {
      id,
      backendId,
      timeline,
      project,
      status: data.Status ?? 'neutral',
      objectives: data.Goal ?? '',
      strategy: data.Strategy ?? '',
      confirmationStatus: 'pending',
      proposedCPP: data.CPP ?? 0,
      proposedIcon: data.Icon ?? 0,
      proposedBanner: data.Banner ?? 0,
      proposedPLA: data.PLA ?? 0,
      proposedVideo: data.Video ?? 0,
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
    };
  };

  // Deserialize weekly-plan response → confirmed quantities only (for merging)
  const deserializeConfirmedPlan = (data: any) => {
    const d = new Date(data.StartWeek);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return {
      project: (data.Project ?? '') as string,
      mondayMs: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
      confirmedCPP: (data.CPP ?? 0) as number,
      confirmedIcon: (data.Icon ?? 0) as number,
      confirmedBanner: (data.Banner ?? 0) as number,
      confirmedPLA: (data.PLA ?? 0) as number,
      confirmedVideo: (data.Video ?? 0) as number,
    };
  };

  const fetchTempWeeklyPlans = async (): Promise<WeeklyPlanItem[]> => {
    const response = await fetch(serverUrl + '/get/temp-weekly-order', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return ensureUniqueIds(data.map(deserializeTempOrder));
  };

  const fetchWeeklyPlans = async () => {
    const response = await fetch(serverUrl + '/get/weekly-order', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.map(deserializeConfirmedPlan);
  };

  const apiAddWeeklyPlan = async (item: WeeklyPlanItem): Promise<WeeklyPlanItem> => {
    const payload = serializeConfirmedPlan(item);
    const response = await fetch(serverUrl + '/post/add-new-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const responseData = await response.json();
    const nextId = Number(responseData.ID ?? responseData.id);
    return { ...item, id: Number.isFinite(nextId) ? nextId : item.id };
  };

  const apiUpdateWeeklyPlan = async (item: WeeklyPlanItem): Promise<void> => {
    const payload = serializeConfirmedPlan(item);
    const response = await fetch(serverUrl + '/post/update-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

  const apiDeleteWeeklyPlan = async (id: number): Promise<void> => {
    const response = await fetch(serverUrl + '/post/delete-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID: String(id) }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

  const apiAddTempWeeklyPlan = async (item: WeeklyPlanItem): Promise<WeeklyPlanItem> => {
    const payload = serializeTempOrder(item);
    const response = await fetch(serverUrl + '/post/add-new-temp-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const responseData = await response.json();
    const backendIdRaw = responseData.ID ?? responseData.id;
    const backendId = backendIdRaw === undefined || backendIdRaw === null || backendIdRaw === '' ? undefined : String(backendIdRaw);
    const nextId = backendId ? Number(backendId) : NaN;

    return {
      ...item,
      backendId,
      id: Number.isFinite(nextId) ? nextId : item.id,
    };
  };

  const apiUpdateTempWeeklyPlan = async (item: WeeklyPlanItem): Promise<void> => {
    const payload = serializeTempOrder(item);
    const response = await fetch(serverUrl + '/post/temp-update-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

  const apiDeleteTempWeeklyPlan = async (id: number): Promise<void> => {
    const response = await fetch(serverUrl + '/post/delete-temp-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ID: String(id) }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

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

  const handleAddSubmit = async (e?: any) => {
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
        onOk: async () => {
          const optimistic: WeeklyPlanItem = {
            ...duplicateItem,
            ...snapshot,
            id: duplicateItem.id,
            backendId: duplicateItem.backendId,
          };

          setPlanData(prev => prev.map(item => (item.id === duplicateItem.id ? optimistic : item)));
          setFilteredData(prev => prev.map(item => (item.id === duplicateItem.id ? optimistic : item)));

          setIsAddFormOpen(false);
          setNewItem(null);
          setAddError('');
          setAddedItemId(duplicateItem.id);
          setAddSuccessMsg(`Đã cập nhật kế hoạch "${snapshot.project}" thành công!`);
          setDateFrom(formatDateForInput(snapshot.timeline));
          setDateTo(formatDateForInput(getSundayOfWeek(snapshot.timeline)));

          try {
            if (optimistic.backendId) {
              await apiUpdateTempWeeklyPlan(optimistic);
            } else {
              const saved = await apiAddTempWeeklyPlan({ ...optimistic, backendId: undefined });
              setPlanData(prev => prev.map(item => (item.id === duplicateItem.id ? saved : item)));
              setFilteredData(prev => prev.map(item => (item.id === duplicateItem.id ? saved : item)));
              setAddedItemId(saved.id);
            }
          } catch (err) {
            console.error('Error saving duplicate weekly plan:', err);
            modal.error({
              title: 'Lỗi lưu dữ liệu',
              content: 'Không thể lưu kế hoạch vào DB. Vui lòng thử lại.',
              centered: true,
            });
          }
        },
      });
      return;
    }

    const nextId = planData.reduce((m, i) => Math.max(m, i.id), 0) + 1;
    const toAdd: WeeklyPlanItem = { ...newItem, id: nextId, backendId: undefined };

    // Optimistic UI update (keeps current UX), then persist to DB.
    setPlanData(prev => [...prev, toAdd]);
    setFilteredData(prev => [...prev, toAdd]);

    setIsAddFormOpen(false);
    setNewItem(null);
    setAddError('');
    setAddedItemId(nextId);
    setAddSuccessMsg(`Đã thêm kế hoạch "${toAdd.project}" thành công!`);
    // Adjust filter to show the week of the newly added item
    setDateFrom(formatDateForInput(toAdd.timeline));
    setDateTo(formatDateForInput(getSundayOfWeek(toAdd.timeline)));

    try {
      const saved = await apiAddTempWeeklyPlan(toAdd);
      // Backend may return a different ID; sync it back into state.
      setPlanData(prev => prev.map(item => (item.id === nextId ? saved : item)));
      setFilteredData(prev => prev.map(item => (item.id === nextId ? saved : item)));
      setAddedItemId(saved.id);
    } catch (err) {
      console.error('Error saving new weekly plan:', err);
      modal.error({
        title: 'Lỗi lưu dữ liệu',
        content: 'Không thể lưu kế hoạch vào DB. Dữ liệu đang hiển thị có thể chưa được lưu.',
        centered: true,
      });
    }
  };

  useEffect(() => {
    // React 18 StrictMode runs effects twice in dev; avoid double-fetch overwriting user edits.
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;

    Promise.all([fetchTempWeeklyPlans(), fetchWeeklyPlans()])
      .then(([tempItems, confirmedItems]) => {
        // Merge confirmed quantities into temp items by matching project + Monday of week
        const merged = tempItems.map(temp => {
          const d = new Date(temp.timeline);
          const dow = d.getDay();
          d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
          const tempMondayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          const match = confirmedItems.find((c: ReturnType<typeof deserializeConfirmedPlan>) =>
            c.project.trim().toLowerCase() === temp.project.trim().toLowerCase() &&
            c.mondayMs === tempMondayMs
          );
          if (!match) return temp;
          return {
            ...temp,
            confirmedCPP: match.confirmedCPP,
            confirmedIcon: match.confirmedIcon,
            confirmedBanner: match.confirmedBanner,
            confirmedPLA: match.confirmedPLA,
            confirmedVideo: match.confirmedVideo,
          };
        });
        const uniqueMerged = ensureUniqueIds(merged);
        setPlanData(uniqueMerged);
        setFilteredData(uniqueMerged);
        setProjectOptions(prev => {
          if (prev.length > 0) return prev;
          return [...new Set(uniqueMerged.map(item => item.project))];
        });
      })
      .catch(err => console.error('Error fetching weekly plans:', err));
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
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [field]: nextValue } : item)));
    // Keep `filteredData` in sync so controlled inputs update immediately while the filter effect catches up.
    setFilteredData(prev => prev.map(item => (item.id === id ? { ...item, [field]: nextValue } : item)));
  };

  const updateTextField = (id: number, field: TextField, value: string) => {
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    // Keep `filteredData` in sync so textareas are editable immediately.
    setFilteredData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const copyToConfirmed = (id: number, proposedField: QuantityField) => {
    const confirmedField = proposedField.replace('proposed', 'confirmed') as QuantityField;
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [confirmedField]: item[proposedField] } : item)));
    setFilteredData(prev => prev.map(item => (item.id === id ? { ...item, [confirmedField]: item[proposedField] } : item)));
  };

  const deleteItem = (id: number) => {
    setPlanData(prev => prev.filter(item => item.id !== id));
    setFilteredData(prev => prev.filter(item => item.id !== id));
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
    const applyCopy = (item: WeeklyPlanItem) =>
      item.id === id
        ? {
            ...item,
            confirmedCPP: item.proposedCPP,
            confirmedIcon: item.proposedIcon,
            confirmedBanner: item.proposedBanner,
            confirmedPLA: item.proposedPLA,
            confirmedVideo: item.proposedVideo,
          }
        : item;

    setPlanData(prev => prev.map(applyCopy));
    setFilteredData(prev => prev.map(applyCopy));
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
                        title="Save"
                        onClick={() => {
                          apiUpdateTempWeeklyPlan(item)
                            .then(() => setAddSuccessMsg(`Đã lưu kế hoạch "${item.project}" thành công!`))
                            .catch(err => { console.error('Lỗi lưu:', err); setAddSuccessMsg(`Lỗi khi lưu kế hoạch "${item.project}"!`); });
                        }}
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
                        apiUpdateWeeklyPlan(item)
                          .then(() => setAddSuccessMsg(`Đã lưu kế hoạch "${item.project}" thành công!`))
                          .catch(err => {
                            console.error('Lỗi confirm:', err);
                            setAddSuccessMsg(`Lỗi khi lưu kế hoạch "${item.project}"!`);
                          });
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
