import './CompletedTasks.css';
import { useState, useEffect, useMemo } from 'react';
import { Typography, Tag, Spin, Empty, Statistic, Avatar, Select, Button } from 'antd';
import { CheckCircleFilled, StarFilled, LeftOutlined, RightOutlined } from '@ant-design/icons';
import Filter from '../components/Filter';
import TopBar from '../components/TopBar';
import { GlobalData } from '../common/GlobalData';

const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";

type ToolPointEntry = {
    ToolName: string;
    Point: number;
};

type TaskEntry = {
    TaskName: string;
    AssigneeID: string;
    Team: string;
    Level: number;
    PerformancePoint: number;
    ToolPointsT: ToolPointEntry[];
    ToolPointsQ: ToolPointEntry[];
    ToolFactor: number;
    CreativeProcessPoint: number;
    CreativeTaskPoint: number;
    BasePoint: number;
    DoneDate: string;
};

type WeekGroup = {
    key: string;
    monday: Date;
    sunday: Date;
    tasks: TaskEntry[];
};

const LEVEL_COLORS: Record<number, { bg: string; text: string }> = {
    1: { bg: '#cd7f32', text: '#fff' },
    2: { bg: '#a0a0a0', text: '#fff' },
    3: { bg: '#ffd700', text: '#0f1e2e' },
    4: { bg: '#5bc4ff', text: '#0f1e2e' },
    5: { bg: '#ff6b9d', text: '#fff' },
};

const TEAM_PALETTE = ['#5bc4ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#faad14', '#13c2c2'];

function getTeamColor(team: string, allTeams: string[]): string {
    const idx = allTeams.indexOf(team);
    return idx >= 0 ? TEAM_PALETTE[idx % TEAM_PALETTE.length] : '#5bc4ff';
}

function getMondayOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function fmtDate(d: Date): string {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function groupByWeek(tasks: TaskEntry[]): WeekGroup[] {
    const map = new Map<string, WeekGroup>();
    for (const task of tasks) {
        if (!task.DoneDate) continue;
        const monday = getMondayOfWeek(new Date(task.DoneDate));
        const key = monday.toISOString();
        if (!map.has(key)) {
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            map.set(key, { key, monday, sunday, tasks: [] });
        }
        map.get(key)!.tasks.push(task);
    }
    return Array.from(map.values()).sort((a, b) => b.monday.getTime() - a.monday.getTime());
}

function WeekStats({ tasks }: { tasks: TaskEntry[] }) {
    const total = tasks.length;
    const totalPP = tasks.reduce((s, t) => s + (t.PerformancePoint ?? 0), 0);
    const avgPP = total > 0 ? Math.round((totalPP / total) * 10) / 10 : 0;

    return (
        <div className="ct-stats-row">
            <div className="ct-stat-card">
                <Statistic
                    title={<Typography.Text style={{ color: '#7a9bb8', fontSize: 13 }}>Tasks this week</Typography.Text>}
                    value={total}
                    prefix={<CheckCircleFilled style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#e2ecf4' }}
                />
            </div>
            <div className="ct-stat-card">
                <Statistic
                    title={<Typography.Text style={{ color: '#7a9bb8', fontSize: 13 }}>Total PP</Typography.Text>}
                    value={Math.round(totalPP * 10) / 10}
                    precision={1}
                    prefix={<StarFilled style={{ color: '#5bc4ff' }} />}
                    valueStyle={{ color: '#e2ecf4' }}
                />
            </div>
            <div className="ct-stat-card">
                <Statistic
                    title={<Typography.Text style={{ color: '#7a9bb8', fontSize: 13 }}>Avg PP</Typography.Text>}
                    value={avgPP}
                    precision={1}
                    valueStyle={{ color: '#e2ecf4' }}
                />
            </div>
        </div>
    );
}

function TaskGrid({ tasks, allTeams, assigneeNameByEmail }: {
    tasks: TaskEntry[];
    allTeams: string[];
    assigneeNameByEmail: Record<string, string>;
}) {
    return (
        <div className="ct-task-grid">
            {tasks.map((task, idx) => {
                const teamColor = getTeamColor(task.Team, allTeams);
                const levelStyle = LEVEL_COLORS[task.Level] ?? { bg: '#5bc4ff', text: '#0f1e2e' };
                const assigneeName = assigneeNameByEmail[task.AssigneeID?.toLowerCase()] || task.AssigneeID;
                const doneDate = task.DoneDate ? new Date(task.DoneDate).toLocaleDateString('vi-VN') : '—';
                const creative = Math.round(((task.CreativeProcessPoint ?? 0) + (task.CreativeTaskPoint ?? 0)) * 10) / 10;

                return (
                    <div key={idx} className="ct-task-card" style={{ borderLeftColor: teamColor }}>
                        <div className="ct-card-header">
                            <span className="ct-task-name">{task.TaskName}</span>
                            <span
                                className="ct-level-badge"
                                style={{ background: levelStyle.bg, color: levelStyle.text }}
                            >
                                Lv {task.Level}
                            </span>
                        </div>

                        <div className="ct-card-meta">
                            <Tag
                                style={{
                                    background: teamColor + '22',
                                    borderColor: teamColor,
                                    color: teamColor,
                                    fontSize: 12,
                                }}
                            >
                                {task.Team}
                            </Tag>
                        </div>

                        <div className="ct-points-row">
                            <div className="ct-point pp">
                                <span className="ct-pt-label">PP</span>
                                <span className="ct-pt-val">{Math.round((task.PerformancePoint ?? 0) * 10) / 10}</span>
                            </div>
                            <div className="ct-point base">
                                <span className="ct-pt-label">Base</span>
                                <span className="ct-pt-val">{Math.round((task.BasePoint ?? 0) * 10) / 10}</span>
                            </div>
                            <div className="ct-point creative">
                                <span className="ct-pt-label">Creative</span>
                                <span className="ct-pt-val">{creative}</span>
                            </div>
                        </div>

                        <div className="ct-card-footer">
                            <span className="ct-assignee">
                                <Avatar
                                    size={20}
                                    style={{ backgroundColor: teamColor, fontSize: 11, flexShrink: 0 }}
                                >
                                    {assigneeName?.[0]?.toUpperCase() ?? '?'}
                                </Avatar>
                                <span>{assigneeName}</span>
                            </span>
                            <span className="ct-done-date">✓ {doneDate}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function CompletedTasks() {
    const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
    const [staffOptions, setStaffOptions] = useState<{ value: string; label: string; team: string }[]>([]);
    const [tasks, setTasks] = useState<TaskEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [weekIndex, setWeekIndex] = useState(0); // 0 = most recent

    const allTeams = useMemo(() => teamOptions.map(t => t.value), [teamOptions]);

    const assigneeNameByEmail = useMemo(() => {
        const map: Record<string, string> = {};
        for (const s of staffOptions) {
            if (!s?.value) continue;
            map[String(s.value).toLowerCase()] = s.label;
        }
        return map;
    }, [staffOptions]);

    const weekGroups = useMemo(() => groupByWeek(tasks), [tasks]);

    // Reset to most recent week when data changes
    useEffect(() => {
        setWeekIndex(0);
    }, [weekGroups]);

    const currentGroup = weekGroups[weekIndex] ?? null;
    const total = weekGroups.length;

    async function getTeamMembers(teams: string[]) {
        try {
            const response = await fetch(`${serverUrl}/post/staff-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || '',
                },
                body: JSON.stringify({ teams }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching team members:', error);
            return [];
        }
    }

    async function getTaskEntries(
        startDate: string,
        endDate: string,
        identifiers: string[],
        isTeam: boolean
    ): Promise<TaskEntry[]> {
        try {
            const response = await fetch(`${serverUrl}/post/task-entries?isTeam=${isTeam}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || '',
                },
                body: JSON.stringify({ startDate, endDate, identifiers }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching task entries:', error);
            return [];
        }
    }

    useEffect(() => {
        getTeamMembers([]).then(members => {
            const teams = new Set<string>();
            for (const m of members) {
                if (teams.has(m.Team)) continue;
                teams.add(m.Team);
            }
            setTeamOptions(Array.from(teams).map(t => ({ value: t, label: t })));
            setStaffOptions(members.map((m: any) => ({ value: m.Email, label: m.Name, team: m.Team })));
        });
    }, []);

    const handleFilterChange = (
        range: { startDate: string | null; endDate: string | null },
        selectedTeams: string[],
        selectedStaff: string[]
    ) => {
        const isoStart = range.startDate ? new Date(range.startDate).toISOString() : null;
        const isoEnd = range.endDate ? new Date(range.endDate).toISOString() : null;

        const isTeam = selectedTeams.length >= 2 || (selectedTeams.length === 1 && selectedStaff.length === 0);
        const identifiers = isTeam ? selectedTeams : selectedStaff;

        if (!isoStart || !isoEnd || identifiers.length === 0) {
            setTasks([]);
            return;
        }

        // // [DEBUG] issue 2 — date boundary sent to backend
        // console.log('[CT] filter dates sent to API:', {
        //     raw_startDate: range.startDate,
        //     raw_endDate:   range.endDate,
        //     iso_startDate: isoStart,
        //     iso_endDate:   isoEnd,
        //     identifiers,
        //     isTeam,
        // });

        setLoading(true);
        getTaskEntries(isoStart, isoEnd, identifiers, isTeam)
            .then(data => {
                // [DEBUG] issue 1 — PerformancePoint vs BasePoint+Creative per task
                // const sumPP       = data.reduce((s, t) => s + (t.PerformancePoint      ?? 0), 0);
                // const sumBase     = data.reduce((s, t) => s + (t.BasePoint             ?? 0), 0);
                // const sumCreative = data.reduce((s, t) => s + (t.CreativeProcessPoint  ?? 0) + (t.CreativeTaskPoint ?? 0), 0);
                // console.log('[CT] point totals across all returned tasks:', {
                //     taskCount:           data.length,
                //     sum_PerformancePoint: Math.round(sumPP       * 10) / 10,
                //     sum_BasePoint:        Math.round(sumBase     * 10) / 10,
                //     sum_Creative:         Math.round(sumCreative * 10) / 10,
                //     sum_Base_plus_Creative: Math.round((sumBase + sumCreative) * 10) / 10,
                // });

                // [DEBUG] tasks where PerformancePoint !== BasePoint + Creative
                const mismatched = data.filter(t => {
                    const expected = (t.BasePoint ?? 0) + (t.CreativeProcessPoint ?? 0) + (t.CreativeTaskPoint ?? 0);
                    return Math.abs((t.PerformancePoint ?? 0) - expected) > 0.01;
                });
                if (mismatched.length > 0) {
                    console.warn('[CT] tasks where PP ≠ Base+Creative:', mismatched.map(t => ({
                        TaskName:         t.TaskName,
                        PerformancePoint: t.PerformancePoint,
                        BasePoint:        t.BasePoint,
                        CreativeProcess:  t.CreativeProcessPoint,
                        CreativeTask:     t.CreativeTaskPoint,
                        ToolFactor:       t.ToolFactor,
                        diff: (t.PerformancePoint ?? 0) - ((t.BasePoint ?? 0) + (t.CreativeProcessPoint ?? 0) + (t.CreativeTaskPoint ?? 0)),
                    })));
                } else {
                    // console.log('[CT] all tasks: PerformancePoint === BasePoint + Creative (no mismatch)');
                }

                // // [DEBUG] DoneDate range actually returned
                // if (data.length > 0) {
                //     const dates = data.map(t => t.DoneDate).filter(Boolean).sort();
                //     // console.log('[CT] DoneDate range in response:', { earliest: dates[0], latest: dates[dates.length - 1] });
                // }

                setTasks(data);
            })
            .finally(() => setLoading(false));
    };

    return (
        <>
            <TopBar
                userName={GlobalData.getUser().name || GlobalData.getUser().email || 'User'}
                imageUrl={GlobalData.getUser().picture}
            />
            <div className="ct-container">
                <Filter onChange={handleFilterChange} teamOptions={teamOptions} staffOptions={staffOptions} />

                <Spin spinning={loading}>
                    {!loading && tasks.length === 0 ? (
                        <Empty
                            description={
                                <Typography.Text style={{ color: '#7a9bb8' }}>
                                    No completed tasks found. Select a team or staff member and date range.
                                </Typography.Text>
                            }
                            style={{ padding: '60px 0' }}
                        />
                    ) : currentGroup && (
                        <div className="ct-week-panel">
                            {/* Week navigator */}
                            <div className="ct-week-nav">
                                <Button
                                    icon={<LeftOutlined />}
                                    onClick={() => setWeekIndex(i => i - 1)}
                                    disabled={weekIndex === 0}
                                    className="ct-nav-btn"
                                />
                                <Select
                                    value={weekIndex}
                                    onChange={setWeekIndex}
                                    className="ct-week-select"
                                    popupMatchSelectWidth={false}
                                    options={weekGroups.map((g, i) => ({
                                        value: i,
                                        label: `${fmtDate(g.monday)} – ${fmtDate(g.sunday)}  (${g.tasks.length} tasks)`,
                                    }))}
                                />
                                <Typography.Text className="ct-week-counter">
                                    {weekIndex + 1} / {total}
                                </Typography.Text>
                                <Button
                                    icon={<RightOutlined />}
                                    onClick={() => setWeekIndex(i => i + 1)}
                                    disabled={weekIndex === total - 1}
                                    className="ct-nav-btn"
                                />
                            </div>

                            {/* Per-week content */}
                            <WeekStats tasks={currentGroup.tasks} />
                            <TaskGrid
                                tasks={currentGroup.tasks}
                                allTeams={allTeams}
                                assigneeNameByEmail={assigneeNameByEmail}
                            />
                        </div>
                    )}
                </Spin>
            </div>
        </>
    );
}
