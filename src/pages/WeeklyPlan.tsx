import { useState, useEffect, useMemo, useRef } from 'react';
import { Button, DatePicker, Empty, Input, InputNumber, message, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import TopBar from '../components/TopBar';
import AdminData from '../common/AdministratorData';
import { GlobalData } from '../common/GlobalData';
import './WeeklyPlan.css';

import type { ProjectIssue } from '../common/GlobalData';
import { isTodayAfter } from '../common/DateUtils';

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
  // Report values (backend-provided Difference per task type)
  reportCPP: number;
  reportIcon: number;
  reportBanner: number;
  reportPLA: number;
  reportVideo: number;
  // Note per task type (from ProjectIssue.Note)
  noteCPP: string;
  noteIcon: string;
  noteBanner: string;
  notePLA: string;
  noteVideo: string;
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
  | 'completedVideo'
  | 'reportCPP'
  | 'reportIcon'
  | 'reportBanner'
  | 'reportPLA'
  | 'reportVideo';

type CompletedField = 'completedCPP' | 'completedIcon' | 'completedBanner' | 'completedPLA' | 'completedVideo';
type ReportField = 'reportCPP' | 'reportIcon' | 'reportBanner' | 'reportPLA' | 'reportVideo';
type NoteField = 'noteCPP' | 'noteIcon' | 'noteBanner' | 'notePLA' | 'noteVideo';

type TextField = 'objectives' | 'strategy';

const PROJECT_PALETTE: { bg: string; color: string }[] = [
  { bg: 'rgba(91, 196, 255, 0.15)',  color: '#5bc4ff' },
  { bg: 'rgba(77, 208, 225, 0.15)',  color: '#4dd0e1' },
  { bg: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' },
  { bg: 'rgba(251, 191, 36, 0.15)',  color: '#fbbf24' },
  { bg: 'rgba(52, 211, 153, 0.15)',  color: '#34d399' },
  { bg: 'rgba(251, 146, 60, 0.15)',  color: '#fb923c' },
  { bg: 'rgba(236, 72, 153, 0.15)',  color: '#ec4899' },
  { bg: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' },
  { bg: 'rgba(34, 211, 238, 0.15)',  color: '#22d3ee' },
  { bg: 'rgba(250, 204, 21, 0.15)',  color: '#facc15' },
];

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
  const [isPlanDataLoaded, setIsPlanDataLoaded] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
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
  const [addedItemId, setAddedItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<WeeklyPlanItem | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(() => AdminData.getListProjects());

  const [colWidths, setColWidths] = useState({ timeline: 190, project: 210, objectives: 300, strategy: 300, confirm: 210, completed: 210, report: 210, note: 280 });

  const addFormRef = useRef<HTMLDivElement>(null);
  const rowRefsMap = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<{ key: keyof typeof colWidths; startX: number; startWidth: number } | null>(null);
  const didInitialLoadRef = useRef(false);
  const planDataRef = useRef<WeeklyPlanItem[]>([]);
  const confirmAutoSaveTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const completedAutoSaveTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const reportAutoSaveTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const noteAutoSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? 'http://localhost:8888';

  const stableHash32 = (input: string): number => {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return hash >>> 0;
  };

  const isAllowEdit = (): boolean => 
  {
    if (GlobalData.getUser().role.toLowerCase() === 'admin')
      return true;
    const team = GlobalData.getUser().team.toLowerCase();
    if (team !== 'concept' && team !== 'strategy')
      return false;
    const deadline = import.meta.env.VITE_WEEKLY_PLAN_EDIT_DEADLINE;
    if (isTodayAfter(deadline))
      return false;
    return true;
  }

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

  // Serialize WeeklyPlanItem confirmed fields → weekly-order payload.
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

  // Deserialize weekly-order response → full WeeklyPlanItem
  const deserializeWeeklyOrder = (data: any): WeeklyPlanItem => {
    const timeline = new Date(data.StartWeek);
    const project = (data.Project ?? '') as string;
    const backendIdRaw = data.ID ?? data.id;
    const backendId = backendIdRaw === undefined || backendIdRaw === null || backendIdRaw === '' ? undefined : String(backendIdRaw);
    const parsedBackendId = backendId ? Number(backendId) : NaN;

    const d = new Date(timeline);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const mondayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const derivedId = -1 * (stableHash32(`${project.trim().toLowerCase()}|${mondayMs}`) + 1);

    const id = Number.isFinite(parsedBackendId) ? parsedBackendId : derivedId;
    const cpp = data.CPP ?? 0;
    const icon = data.Icon ?? 0;
    const banner = data.Banner ?? 0;
    const pla = data.PLA ?? 0;
    const video = data.Video ?? 0;

    return {
      id,
      backendId,
      timeline,
      project,
      status: data.Status ?? 'neutral',
      objectives: data.Goal ?? '',
      strategy: data.Strategy ?? '',
      confirmationStatus: 'pending',
      proposedCPP: cpp,
      proposedIcon: icon,
      proposedBanner: banner,
      proposedPLA: pla,
      proposedVideo: video,
      confirmedCPP: cpp,
      confirmedIcon: icon,
      confirmedBanner: banner,
      confirmedPLA: pla,
      confirmedVideo: video,
      completedCPP: 0,
      completedIcon: 0,
      completedBanner: 0,
      completedPLA: 0,
      completedVideo: 0,
      reportCPP: 0,
      reportIcon: 0,
      reportBanner: 0,
      reportPLA: 0,
      reportVideo: 0,
      noteCPP: '',
      noteIcon: '',
      noteBanner: '',
      notePLA: '',
      noteVideo: '',
    };
  };

  const fetchWeeklyPlans = async (): Promise<WeeklyPlanItem[]> => {
    const response = await fetch(serverUrl + '/get/weekly-order', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return ensureUniqueIds(data.map(deserializeWeeklyOrder));
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

  const apiUpdateProjectIssue = async (issue: ProjectIssue, newDifference: number, newNote: string, newCompletedCount?: number): Promise<void> => {
    if (!issue.ID) throw new Error('Missing issue ID');
    const masterToken = import.meta.env.VITE_SERVER_MASTER_TOKEN;
    const payload = {
      ID: issue.ID,
      Project: issue.Project,
      StartWeek: issue.StartWeek,
      TaskType: issue.TaskType,
      CompletedCount: newCompletedCount ?? issue.CompletedCount ?? 0,
      Assignees: issue.Assignees ?? [],
      Difference: newDifference,
      Team: issue.Team ?? '',
      OrderCount: issue.OrderCount ?? 0,
      Note: newNote,
    };
    const response = await fetch(serverUrl + '/post/update-project-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': masterToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

  const apiDeleteWeeklyPlan = async (project: string, startWeekIso: string): Promise<void> => {
    const response = await fetch(serverUrl + '/post/delete-weekly-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Project: project, StartWeek: startWeekIso }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  };

  const apiAddWeeklyPlan = async (item: WeeklyPlanItem): Promise<WeeklyPlanItem> => {
    const payload = {
      ID: item.backendId ?? undefined,
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
    };
    const response = await fetch(serverUrl + '/post/add-new-weekly-order', {
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

  const getMondayMsFromDate = (date: Date): number => {
    const d = new Date(date);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return monday.getTime();
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

  // Load completed counts from backend whenever filters change,
  // then map into completedCPP/Icon/Banner/PLA/Video so the Report column updates.
  // Guard on isPlanDataLoaded: avoids patching an empty array when both effects fire on mount.
  useEffect(() => {
    if (!isPlanDataLoaded) return;
    const { from, to } = getEffectiveRange();

    const fromIso = new Date(from.getFullYear(), from.getMonth(), from.getDate()).toISOString();
    const toIso = new Date(to.getFullYear(), to.getMonth(), to.getDate()).toISOString();

    const selectedProjectSet = new Set(selectedProjects.map(p => String(p ?? '').trim().toLowerCase()).filter(Boolean));

    const controller = new AbortController();
    const signal = controller.signal;

    const mapTaskTypeToFields = (
      taskTypeRaw: string | undefined | null
    ): { completed: CompletedField; report: ReportField; note: NoteField } | null => {
      const taskType = String(taskTypeRaw ?? '').trim().toLowerCase();
      switch (taskType) {
        case 'art_cpp':
        case 'cpp':
          return { completed: 'completedCPP', report: 'reportCPP', note: 'noteCPP' };
        case 'art_icon':
        case 'icon':
          return { completed: 'completedIcon', report: 'reportIcon', note: 'noteIcon' };
        case 'art_banner':
        case 'banner':
          return { completed: 'completedBanner', report: 'reportBanner', note: 'noteBanner' };
        case 'playable':
        case 'pla':
          return { completed: 'completedPLA', report: 'reportPLA', note: 'notePLA' };
        case 'video':
          return { completed: 'completedVideo', report: 'reportVideo', note: 'noteVideo' };
        default:
          return null;
      }
    };

    const normalizeTaskType = (raw: string | undefined | null): string | null => {
      switch (String(raw ?? '').trim().toLowerCase()) {
        case 'art_cpp': case 'cpp': return 'cpp';
        case 'art_icon': case 'icon': return 'icon';
        case 'art_banner': case 'banner': return 'banner';
        case 'playable': case 'pla': return 'pla';
        case 'video': return 'video';
        default: return null;
      }
    };

    const applyCompletedToState = (issues: ProjectIssue[]) => {
      const completedByKey = new Map<
        string,
        Pick<WeeklyPlanItem, 'completedCPP' | 'completedIcon' | 'completedBanner' | 'completedPLA' | 'completedVideo'>
      >();

      const reportByKey = new Map<
        string,
        Pick<WeeklyPlanItem, 'reportCPP' | 'reportIcon' | 'reportBanner' | 'reportPLA' | 'reportVideo'>
      >();

      const noteByKey = new Map<
        string,
        Pick<WeeklyPlanItem, 'noteCPP' | 'noteIcon' | 'noteBanner' | 'notePLA' | 'noteVideo'>
      >();

      // Rebuild the cache from the fresh fetch result
      GlobalData.projectIssuesCache = new Map();

      for (const issue of issues ?? []) {
        if (!issue?.Project || !issue?.StartWeek) continue;

        const projectKey = String(issue.Project).trim().toLowerCase();
        if (selectedProjectSet.size > 0 && !selectedProjectSet.has(projectKey)) continue;

        const fields = mapTaskTypeToFields(issue.TaskType);
        if (!fields) continue;

        const issueMondayMs = getMondayMsFromDate(new Date(issue.StartWeek));
        const key = `${projectKey}|${issueMondayMs}`;

        // Cache by (project|mondayMs|normalizedType) so we can look up by field name
        const nt = normalizeTaskType(issue.TaskType);
        if (nt) {
          GlobalData.projectIssuesCache.set(`${projectKey}|${issueMondayMs}|${nt}`, issue);
        }

        const current = completedByKey.get(key) ?? {
          completedCPP: 0,
          completedIcon: 0,
          completedBanner: 0,
          completedPLA: 0,
          completedVideo: 0,
        };

        const increment = Number(issue.CompletedCount ?? 0);
        const nextCompleted = Number.isFinite(increment) ? current[fields.completed] + increment : current[fields.completed];
        completedByKey.set(key, { ...current, [fields.completed]: nextCompleted });

        const reportCurrent = reportByKey.get(key) ?? {
          reportCPP: 0,
          reportIcon: 0,
          reportBanner: 0,
          reportPLA: 0,
          reportVideo: 0,
        };

        const rawDifference = (issue as any).Difference ?? (issue as any).Different;
        const diffIncrement = Number(rawDifference ?? 0);
        const nextReport = Number.isFinite(diffIncrement)
          ? reportCurrent[fields.report] + diffIncrement
          : reportCurrent[fields.report];
        reportByKey.set(key, { ...reportCurrent, [fields.report]: nextReport });

        const noteCurrent = noteByKey.get(key) ?? {
          noteCPP: '', noteIcon: '', noteBanner: '', notePLA: '', noteVideo: '',
        };
        noteByKey.set(key, { ...noteCurrent, [fields.note]: issue.Note ?? '' });
      }

      const isInRange = (timeline: Date) => {
        const t = normalizeToLocalDate(timeline).getTime();
        const fromT = normalizeToLocalDate(from).getTime();
        const toT = normalizeToLocalDate(to).getTime();
        return t >= fromT && t <= toT;
      };

      const patchItem = (item: WeeklyPlanItem): WeeklyPlanItem => {
        if (!item?.project || !item?.timeline) return item;
        if (!isInRange(item.timeline)) return item;

        const projectKey = String(item.project).trim().toLowerCase();
        const emptyNotes = { noteCPP: '', noteIcon: '', noteBanner: '', notePLA: '', noteVideo: '' };

        if (selectedProjectSet.size > 0 && !selectedProjectSet.has(projectKey)) {
          return {
            ...item,
            completedCPP: 0, completedIcon: 0, completedBanner: 0, completedPLA: 0, completedVideo: 0,
            reportCPP: 0, reportIcon: 0, reportBanner: 0, reportPLA: 0, reportVideo: 0,
            ...emptyNotes,
          };
        }

        const mondayMs = getMondayMsFromDate(item.timeline);
        const key = `${projectKey}|${mondayMs}`;
        const completed = completedByKey.get(key);
        const report = reportByKey.get(key);
        const note = noteByKey.get(key);

        if (!completed && !report && !note) {
          return {
            ...item,
            completedCPP: 0, completedIcon: 0, completedBanner: 0, completedPLA: 0, completedVideo: 0,
            reportCPP: 0, reportIcon: 0, reportBanner: 0, reportPLA: 0, reportVideo: 0,
            ...emptyNotes,
          };
        }

        return {
          ...item,
          ...(completed ?? { completedCPP: 0, completedIcon: 0, completedBanner: 0, completedPLA: 0, completedVideo: 0 }),
          ...(report ?? { reportCPP: 0, reportIcon: 0, reportBanner: 0, reportPLA: 0, reportVideo: 0 }),
          ...(note ?? emptyNotes),
        };
      };

      setPlanData(prev => prev.map(patchItem));
      setFilteredData(prev => prev.map(patchItem));
    };

    (async () => {
      try
      {
        const masterToken = import.meta.env.VITE_SERVER_MASTER_TOKEN;
        const response = await fetch(serverUrl + '/post/project-issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': masterToken,
          },
          body: JSON.stringify({ StartDate: fromIso, EndDate: toIso }),
          signal,
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const issues = (await response.json()) as ProjectIssue[];
        if (signal.aborted) return;
        applyCompletedToState(Array.isArray(issues) ? issues : []);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('Error fetching project issues for WeeklyPlan report:', err);
      }
    })();

    return () => controller.abort();
  }, [selectedProjects, dateFrom, dateTo, isPlanDataLoaded]);

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
      reportCPP: 0,
      reportIcon: 0,
      reportBanner: 0,
      reportPLA: 0,
      reportVideo: 0,
      noteCPP: '',
      noteIcon: '',
      noteBanner: '',
      notePLA: '',
      noteVideo: '',
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
            confirmedCPP: snapshot.proposedCPP,
            confirmedIcon: snapshot.proposedIcon,
            confirmedBanner: snapshot.proposedBanner,
            confirmedPLA: snapshot.proposedPLA,
            confirmedVideo: snapshot.proposedVideo,
            completedCPP: duplicateItem.completedCPP,
            completedIcon: duplicateItem.completedIcon,
            completedBanner: duplicateItem.completedBanner,
            completedPLA: duplicateItem.completedPLA,
            completedVideo: duplicateItem.completedVideo,
            reportCPP: duplicateItem.reportCPP,
            reportIcon: duplicateItem.reportIcon,
            reportBanner: duplicateItem.reportBanner,
            reportPLA: duplicateItem.reportPLA,
            reportVideo: duplicateItem.reportVideo,
            noteCPP: duplicateItem.noteCPP,
            noteIcon: duplicateItem.noteIcon,
            noteBanner: duplicateItem.noteBanner,
            notePLA: duplicateItem.notePLA,
            noteVideo: duplicateItem.noteVideo,
          };

          setPlanData(prev => prev.map(item => (item.id === duplicateItem.id ? optimistic : item)));
          setFilteredData(prev => prev.map(item => (item.id === duplicateItem.id ? optimistic : item)));

          setIsAddFormOpen(false);
          setNewItem(null);
          setAddError('');
          setAddedItemId(duplicateItem.id);
          messageApi.success(`Đã cập nhật kế hoạch "${snapshot.project}" thành công!`);
          setDateFrom(formatDateForInput(snapshot.timeline));
          setDateTo(formatDateForInput(getSundayOfWeek(snapshot.timeline)));

          try {
            if (optimistic.backendId) {
              await apiUpdateWeeklyPlan(optimistic);
            } else {
              const saved = await apiAddWeeklyPlan({ ...optimistic, backendId: undefined });
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
    const toAdd: WeeklyPlanItem = {
      ...newItem,
      id: nextId,
      backendId: undefined,
      confirmedCPP: newItem.proposedCPP,
      confirmedIcon: newItem.proposedIcon,
      confirmedBanner: newItem.proposedBanner,
      confirmedPLA: newItem.proposedPLA,
      confirmedVideo: newItem.proposedVideo,
    };

    // Optimistic UI update (keeps current UX), then persist to DB.
    setPlanData(prev => [...prev, toAdd]);
    setFilteredData(prev => [...prev, toAdd]);

    setIsAddFormOpen(false);
    setNewItem(null);
    setAddError('');
    setAddedItemId(nextId);
    messageApi.success(`Đã thêm kế hoạch "${toAdd.project}" thành công!`);
    // Adjust filter to show the week of the newly added item
    setDateFrom(formatDateForInput(toAdd.timeline));
    setDateTo(formatDateForInput(getSundayOfWeek(toAdd.timeline)));

    try {
      const saved = await apiAddWeeklyPlan(toAdd);
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

    fetchWeeklyPlans()
      .then(items => {
        setPlanData(items);
        setFilteredData(items);
        setIsPlanDataLoaded(true);
        setProjectOptions(prev => {
          if (prev.length > 0) return prev;
          return [...new Set(items.map(item => item.project))];
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

  // Scale column widths to fit the container on first load
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const containerWidth = wrapper.clientWidth;
    if (containerWidth <= 0) return;
    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
    if (totalWidth <= containerWidth) return;
    const scale = containerWidth / totalWidth;
    setColWidths(prev => {
      const keys = Object.keys(prev) as Array<keyof typeof prev>;
      const scaled = { ...prev };
      let newTotal = 0;
      keys.forEach(key => {
        scaled[key] = Math.max(80, Math.floor(prev[key] * scale));
        newTotal += scaled[key];
      });
      // Distribute rounding remainder so the table fills the container exactly
      scaled.objectives += containerWidth - newTotal;
      return scaled;
    });
  }, []);

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

  // Sort filtered data by timeline
  const sortedItems = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => a.timeline.getTime() - b.timeline.getTime());
    return sorted;
  }, [filteredData]);

  const getProjectColorStyle = (project: string): React.CSSProperties => {
    const idx = stableHash32(project.trim().toLowerCase()) % PROJECT_PALETTE.length;
    return { background: PROJECT_PALETTE[idx].bg, color: PROJECT_PALETTE[idx].color };
  };

  const getReportInputClass = (value: number) =>
    value < 0 ? 'report-input-negative' : value > 0 ? 'report-input-positive' : '';

  useEffect(() => { planDataRef.current = planData; }, [planData]);

  const updateQuantity = (id: number, field: QuantityField, value: number, allowNegative = false) => {
    const nextValue = Number.isFinite(value) ? (allowNegative ? Math.trunc(value) : Math.max(0, Math.trunc(value))) : 0;
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [field]: nextValue } : item)));
    // Keep `filteredData` in sync so controlled inputs update immediately while the filter effect catches up.
    setFilteredData(prev => prev.map(item => (item.id === id ? { ...item, [field]: nextValue } : item)));
  };

  const handleConfirmedQuantityChange = (id: number, field: QuantityField, value: number) => {
    updateQuantity(id, field, value);

    const existing = confirmAutoSaveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const item = planDataRef.current.find(i => i.id === id);
      if (!item) return;
      apiUpdateWeeklyPlan(item)
        .catch(err => {
          console.error('Auto-save error:', err);
          messageApi.error(`Lỗi lưu kế hoạch "${item.project}"!`);
        });
    }, 800);

    confirmAutoSaveTimers.current.set(id, timer);
  };

  const completedFieldToNormalizedType: Record<string, string> = {
    completedCPP: 'cpp',
    completedIcon: 'icon',
    completedBanner: 'banner',
    completedPLA: 'pla',
    completedVideo: 'video',
  };

  const reportFieldToNormalizedType: Record<string, string> = {
    reportCPP: 'cpp',
    reportIcon: 'icon',
    reportBanner: 'banner',
    reportPLA: 'pla',
    reportVideo: 'video',
  };

  const noteFieldToNormalizedType: Record<string, string> = {
    noteCPP: 'cpp',
    noteIcon: 'icon',
    noteBanner: 'banner',
    notePLA: 'pla',
    noteVideo: 'video',
  };

  const normalizedTypeToNoteField: Record<string, NoteField> = {
    cpp: 'noteCPP',
    icon: 'noteIcon',
    banner: 'noteBanner',
    pla: 'notePLA',
    video: 'noteVideo',
  };

  const normalizedTypeToCompletedField: Record<string, CompletedField> = {
    cpp: 'completedCPP',
    icon: 'completedIcon',
    banner: 'completedBanner',
    pla: 'completedPLA',
    video: 'completedVideo',
  };

  const normalizedTypeToReportField: Record<string, ReportField> = {
    cpp: 'reportCPP',
    icon: 'reportIcon',
    banner: 'reportBanner',
    pla: 'reportPLA',
    video: 'reportVideo',
  };

  const handleCompletedQuantityChange = (id: number, field: QuantityField, value: number) => {
    updateQuantity(id, field, value);

    const existing = completedAutoSaveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const item = planDataRef.current.find(i => i.id === id);
      if (!item) return;

      const normalizedType = completedFieldToNormalizedType[field];
      if (!normalizedType) return;

      const projectKey = String(item.project).trim().toLowerCase();
      const mondayMs = getMondayMsFromDate(item.timeline);
      const cacheKey = `${projectKey}|${mondayMs}|${normalizedType}`;
      const issue = GlobalData.projectIssuesCache.get(cacheKey);

      if (!issue?.ID) {
        console.warn(`No cached project issue for key: ${cacheKey}`);
        return;
      }

      const latestItem = planDataRef.current.find(i => i.id === id);
      const latestCompleted = (latestItem?.[field] as number) ?? 0;
      const reportField = normalizedTypeToReportField[normalizedType];
      const latestDiff = reportField ? ((latestItem?.[reportField] as number) ?? 0) : 0;
      const noteField = normalizedTypeToNoteField[normalizedType];
      const latestNote = noteField ? ((latestItem?.[noteField] as string) ?? '') : '';
      apiUpdateProjectIssue(issue, latestDiff, latestNote, latestCompleted)
        .catch((err: unknown) => {
          console.error('Auto-save completed error:', err);
          messageApi.error(`Lỗi lưu hoàn thành "${item.project}"!`);
        });
    }, 800);

    completedAutoSaveTimers.current.set(id, timer);
  };

  const handleReportQuantityChange = (id: number, field: QuantityField, value: number) => {
    updateQuantity(id, field, value, true);

    const existing = reportAutoSaveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const item = planDataRef.current.find(i => i.id === id);
      if (!item) return;

      const normalizedType = reportFieldToNormalizedType[field];
      if (!normalizedType) return;

      const projectKey = String(item.project).trim().toLowerCase();
      const mondayMs = getMondayMsFromDate(item.timeline);
      const cacheKey = `${projectKey}|${mondayMs}|${normalizedType}`;
      const issue = GlobalData.projectIssuesCache.get(cacheKey);

      if (!issue?.ID) {
        console.warn(`No cached project issue for key: ${cacheKey}`);
        return;
      }

      const latestItem = planDataRef.current.find(i => i.id === id);
      const latestValue = (latestItem?.[field] as number) ?? 0;
      const noteField = normalizedTypeToNoteField[normalizedType];
      const latestNote = noteField ? ((latestItem?.[noteField] as string) ?? '') : '';
      const completedField = normalizedTypeToCompletedField[normalizedType];
      const latestCompleted = completedField ? ((latestItem?.[completedField] as number) ?? 0) : 0;
      apiUpdateProjectIssue(issue, latestValue, latestNote, latestCompleted)
        .catch((err: unknown) => {
          console.error('Auto-save report error:', err);
          messageApi.error(`Lỗi lưu báo cáo "${item.project}"!`);
        });
    }, 800);

    reportAutoSaveTimers.current.set(id, timer);
  };

  const handleNoteChange = (id: number, field: NoteField, value: string) => {
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    planDataRef.current = planDataRef.current.map(item => (item.id === id ? { ...item, [field]: value } : item));

    const timerKey = `${id}|${field}`;
    const existing = noteAutoSaveTimers.current.get(timerKey);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const item = planDataRef.current.find(i => i.id === id);
      if (!item) return;

      const normalizedType = noteFieldToNormalizedType[field];
      if (!normalizedType) return;

      const projectKey = String(item.project).trim().toLowerCase();
      const mondayMs = getMondayMsFromDate(item.timeline);
      const cacheKey = `${projectKey}|${mondayMs}|${normalizedType}`;
      const issue = GlobalData.projectIssuesCache.get(cacheKey);

      if (!issue?.ID) {
        console.warn(`No cached project issue for key: ${cacheKey}`);
        return;
      }

      const reportField = normalizedTypeToReportField[normalizedType];
      const currentDiff = reportField ? ((planDataRef.current.find(i => i.id === id)?.[reportField] as number) ?? 0) : 0;
      const completedField = normalizedTypeToCompletedField[normalizedType];
      const currentCompleted = completedField ? ((planDataRef.current.find(i => i.id === id)?.[completedField] as number) ?? 0) : 0;
      const latestNote = (planDataRef.current.find(i => i.id === id)?.[field] as string) ?? '';

      apiUpdateProjectIssue(issue, currentDiff, latestNote, currentCompleted)
        .catch((err: unknown) => {
          console.error('Auto-save note error:', err);
          messageApi.error(`Lỗi lưu ghi chú "${item.project}"!`);
        });
    }, 800);

    noteAutoSaveTimers.current.set(timerKey, timer);
  };

  const startResize = (e: React.MouseEvent, key: keyof typeof colWidths) => {
    e.preventDefault();
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidths[key] };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(80, startWidth + (ev.clientX - startX));
      setColWidths(prev => ({ ...prev, [key]: newWidth }));
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const updateTextField = (id: number, field: TextField, value: string) => {
    setPlanData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    // Keep `filteredData` in sync so textareas are editable immediately.
    setFilteredData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const deleteItem = (id: number) => {
    setPlanData(prev => prev.filter(item => item.id !== id));
    setFilteredData(prev => prev.filter(item => item.id !== id));
  };

  const requestDeleteItem = (item: WeeklyPlanItem) => {
    modal.confirm({
      title: 'Xác nhận xoá',
      content: `Bạn có chắc muốn xoá kế hoạch "${item.project}" không?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        const project = (item.project ?? '').trim();
        const startWeekIso = item.timeline?.toISOString?.() ?? '';
        if (!project || !startWeekIso) {
          deleteItem(item.id);
          messageApi.success(`Đã xoá kế hoạch "${item.project}" thành công!`);
          return;
        }

        try {
          await apiDeleteWeeklyPlan(project, startWeekIso);
        } catch {
          modal.error({
            title: 'Lỗi xoá dữ liệu',
            content: 'Không thể xoá kế hoạch trong DB. Vui lòng thử lại.',
            centered: true,
          });
          return;
        }

        deleteItem(item.id);
        messageApi.success(`Đã xoá kế hoạch "${item.project}" thành công!`);
      },
    });
  };

  const renderTextArea = (item: WeeklyPlanItem, field: TextField, allowEdit: boolean) => {
    return (
      <div className="table-textarea-wrap">
        <textarea
          className="table-textarea"
          value={item[field]}
          onChange={(e) => updateTextField(item.id, field, e.target.value)}
          rows={9}
          readOnly={!allowEdit}
        />
      </div>
    );
  };

  const allowEdit = isAllowEdit();

  return (
    <div className="weekly-plan-page">
      {modalContextHolder}
      {messageContextHolder}
      <TopBar userName={GlobalData.getUser().name || GlobalData.getUser().email || 'User'} imageUrl={GlobalData.getUser().picture} siteName="Weekly Plan Dashboard" />
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
                style={{ width: '100%', minWidth: 200 }}
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
                <Button shape="round" onClick={() => shiftWeekRange(-1)}>← Tuần trước</Button>
                <Button shape="round" onClick={() => handleQuickFilter(1)}>1 Tuần trước</Button>
                <Button shape="round" onClick={() => handleQuickFilter(2)}>2 Tuần trước</Button>
                <Button shape="round" onClick={() => handleQuickFilter(4)}>4 Tuần trước</Button>
                <Button shape="round" onClick={() => handleQuickFilter(6)}>6 Tuần trước</Button>
                <Button shape="round" onClick={handleNextWeekFilter}>1 Tuần tới</Button>
                <Button shape="round" onClick={() => shiftWeekRange(1)} disabled={!canShiftWeekRange(1)}>Tuần sau →</Button>
                <Button shape="round" danger onClick={clearDateFilters}>Xóa</Button>
              </div>
            </div>

            <div className="filter-group" style={{ marginLeft: 'auto', flex: '0 0 auto', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '24px' }}>
              <label>Thêm mục</label>
              <div>
                <Button type="primary" onClick={openAddForm} disabled={!allowEdit}>+ Thêm mục mới</Button>
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

        <Modal
          open={isAddFormOpen && !!newItem}
          title="Thêm kế hoạch tuần mới"
          onCancel={cancelAddForm}
          footer={null}
          width={1000}
          destroyOnHidden
        >
          {newItem && (
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
                    size="large"
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
                    size="large"
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
                  <Input.TextArea
                    rows={7}
                    size="large"
                    value={newItem.objectives}
                    onChange={(e) => updateNewItemText('objectives', e.target.value)}
                    placeholder="Nhập mục tiêu"
                  />
                </div>
                <div className="weekly-plan-field">
                  <label>Chiến lược</label>
                  <Input.TextArea
                    rows={7}
                    size="large"
                    value={newItem.strategy}
                    onChange={(e) => updateNewItemText('strategy', e.target.value)}
                    placeholder="Nhập chiến lược"
                  />
                </div>
              </div>

              <div className="weekly-plan-add-qty">
                <div className="weekly-plan-add-qty-title">Số lượng</div>
                <div className="weekly-plan-qty-grid">
                  <div className="weekly-plan-qty-item"><span className="qty-label">CPP</span><InputNumber size="large" min={0} step={1} controls={false} value={newItem.proposedCPP} onChange={(v) => updateNewItemQuantity('proposedCPP', Number(v ?? 0))} style={{ width: '100%' }} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Icon</span><InputNumber size="large" min={0} step={1} controls={false} value={newItem.proposedIcon} onChange={(v) => updateNewItemQuantity('proposedIcon', Number(v ?? 0))} style={{ width: '100%' }} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Banner</span><InputNumber size="large" min={0} step={1} controls={false} value={newItem.proposedBanner} onChange={(v) => updateNewItemQuantity('proposedBanner', Number(v ?? 0))} style={{ width: '100%' }} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">PLA</span><InputNumber size="large" min={0} step={1} controls={false} value={newItem.proposedPLA} onChange={(v) => updateNewItemQuantity('proposedPLA', Number(v ?? 0))} style={{ width: '100%' }} /></div>
                  <div className="weekly-plan-qty-item"><span className="qty-label">Video</span><InputNumber size="large" min={0} step={1} controls={false} value={newItem.proposedVideo} onChange={(v) => updateNewItemQuantity('proposedVideo', Number(v ?? 0))} style={{ width: '100%' }} /></div>
                </div>
              </div>

              {addError && (
                <div className="weekly-plan-add-error">{addError}</div>
              )}

              <div className="weekly-plan-add-actions">
                <Button type="primary" size="large" htmlType="submit">Thêm</Button>
                <Button danger size="large" onClick={cancelAddForm}>Hủy</Button>
              </div>
            </form>
          )}
        </Modal>

        <div className="plan-table-wrapper" ref={tableWrapperRef}>
          <table className="plan-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: Object.values(colWidths).reduce((a, b) => a + b, 0) + 'px' }}>
            <colgroup>
              <col style={{ width: colWidths.timeline }} />
              <col style={{ width: colWidths.project }} />
              <col style={{ width: colWidths.objectives }} />
              <col style={{ width: colWidths.strategy }} />
              <col style={{ width: colWidths.confirm }} />
              <col style={{ width: colWidths.completed }} />
              <col style={{ width: colWidths.report }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className="col-resizable"><span>Timeline</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'timeline')} /></th>
                <th className="col-resizable"><span>Dự án</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'project')} /></th>
                <th className="col-resizable"><span>Mục tiêu</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'objectives')} /></th>
                <th className="col-resizable"><span>Chiến lược</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'strategy')} /></th>
                <th className="col-resizable"><span>Số lượng confirm</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'confirm')} /></th>
                <th className="col-resizable"><span>Hoàn thành</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'completed')} /></th>
                <th className="col-resizable"><span>Báo cáo</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'report')} /></th>
                <th className="col-resizable"><span>Ghi chú</span><div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'note')} /></th>
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
                    <span className="project-badge" style={getProjectColorStyle(item.project)}>
                      {item.project}
                    </span>
                    <Button danger size="small" block style={{ marginTop: '2rem' }} onClick={() => requestDeleteItem(item)}>Xoá</Button>
                  </td>
                  <td className="col-objectives">
                    {renderTextArea(item, 'objectives', allowEdit)}
                  </td>
                  <td className="col-strategy">
                    {renderTextArea(item, 'strategy', allowEdit)}
                  </td>
                  <td className="col-quantity">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> <InputNumber min={0} step={1} value={item.confirmedCPP} onChange={(v) => handleConfirmedQuantityChange(item.id, 'confirmedCPP', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> <InputNumber min={0} step={1} value={item.confirmedIcon} onChange={(v) => handleConfirmedQuantityChange(item.id, 'confirmedIcon', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> <InputNumber min={0} step={1} value={item.confirmedBanner} onChange={(v) => handleConfirmedQuantityChange(item.id, 'confirmedBanner', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> <InputNumber min={0} step={1} value={item.confirmedPLA} onChange={(v) => handleConfirmedQuantityChange(item.id, 'confirmedPLA', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> <InputNumber min={0} step={1} value={item.confirmedVideo} onChange={(v) => handleConfirmedQuantityChange(item.id, 'confirmedVideo', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                    </div>
                  </td>
                  <td className="col-quantity col-completed">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> <InputNumber min={0} step={1} value={item.completedCPP} onChange={(v) => handleCompletedQuantityChange(item.id, 'completedCPP', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> <InputNumber min={0} step={1} value={item.completedIcon} onChange={(v) => handleCompletedQuantityChange(item.id, 'completedIcon', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> <InputNumber min={0} step={1} value={item.completedBanner} onChange={(v) => handleCompletedQuantityChange(item.id, 'completedBanner', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> <InputNumber min={0} step={1} value={item.completedPLA} onChange={(v) => handleCompletedQuantityChange(item.id, 'completedPLA', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> <InputNumber min={0} step={1} value={item.completedVideo} onChange={(v) => handleCompletedQuantityChange(item.id, 'completedVideo', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} disabled={!allowEdit} /></div>
                    </div>
                  </td>
                  <td className="col-quantity col-report">
                    <div className="quantity-list">
                      <div className="quantity-item"><span className="qty-label">CPP:</span> <InputNumber step={1} value={item.reportCPP} onChange={(v) => handleReportQuantityChange(item.id, 'reportCPP', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} className={getReportInputClass(item.reportCPP)} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Icon:</span> <InputNumber step={1} value={item.reportIcon} onChange={(v) => handleReportQuantityChange(item.id, 'reportIcon', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} className={getReportInputClass(item.reportIcon)} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Banner:</span> <InputNumber step={1} value={item.reportBanner} onChange={(v) => handleReportQuantityChange(item.id, 'reportBanner', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} className={getReportInputClass(item.reportBanner)} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">PLA:</span> <InputNumber step={1} value={item.reportPLA} onChange={(v) => handleReportQuantityChange(item.id, 'reportPLA', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} className={getReportInputClass(item.reportPLA)} disabled={!allowEdit} /></div>
                      <div className="quantity-item"><span className="qty-label">Video:</span> <InputNumber step={1} value={item.reportVideo} onChange={(v) => handleReportQuantityChange(item.id, 'reportVideo', Number(v ?? 0))} controls={false} size="small" style={{ width: 64 }} className={getReportInputClass(item.reportVideo)} disabled={!allowEdit} /></div>
                    </div>
                  </td>
                  <td className="col-note">
                    <div className="note-list">
                      <div className="note-list-item"><span className="qty-label">CPP:</span><Input.TextArea autoSize={{ minRows: 1 }} className="note-textarea" placeholder="ghi chú" value={item.noteCPP} onChange={(e) => handleNoteChange(item.id, 'noteCPP', e.target.value)} disabled={!allowEdit} /></div>
                      <div className="note-list-item"><span className="qty-label">Icon:</span><Input.TextArea autoSize={{ minRows: 1 }} className="note-textarea" placeholder="ghi chú" value={item.noteIcon} onChange={(e) => handleNoteChange(item.id, 'noteIcon', e.target.value)} disabled={!allowEdit} /></div>
                      <div className="note-list-item"><span className="qty-label">Banner:</span><Input.TextArea autoSize={{ minRows: 1 }} className="note-textarea" placeholder="ghi chú" value={item.noteBanner} onChange={(e) => handleNoteChange(item.id, 'noteBanner', e.target.value)} disabled={!allowEdit} /></div>
                      <div className="note-list-item"><span className="qty-label">PLA:</span><Input.TextArea autoSize={{ minRows: 1 }} className="note-textarea" placeholder="ghi chú" value={item.notePLA} onChange={(e) => handleNoteChange(item.id, 'notePLA', e.target.value)} disabled={!allowEdit} /></div>
                      <div className="note-list-item"><span className="qty-label">Video:</span><Input.TextArea autoSize={{ minRows: 1 }} className="note-textarea" placeholder="ghi chú" value={item.noteVideo} onChange={(e) => handleNoteChange(item.id, 'noteVideo', e.target.value)} disabled={!allowEdit} /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedItems.length === 0 && (
          <Empty description="Không có dữ liệu" style={{ padding: '3rem', color: '#7a9bb8' }} />
        )}
      </div>
    </div>
  );
}
