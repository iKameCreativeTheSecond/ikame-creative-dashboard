import './Home.css'
import Charts, { type ChartObjectData } from '../components/Charts'
import TeamTargetProgress, { type WeeklyTeamPerformaceData } from '../components/TeamTargetProgress';
import ProjectIssueTable, { type ProjectIssue } from '../components/ProjectIssueTable';
import TimeRangeComparison from '../components/TimeRangeComparison';
import { useState, useEffect, useMemo } from 'react'
import Filter from '../components/Filter';
import TopBar from '../components/TopBar';
import { GlobalData } from '../common/GlobalData';


const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";

// ...existing code...


class PerformanceData {
    public TotalPerformancePoint: number = 0;
    public TotalBasePoint: number = 0;
    public TotalCreativeProcessPoint: number = 0;
    public TotalCreativeTaskPoint: number = 0;
    public Identifier: string = ''; // Email or Team name

    constructor(totalPerformancePoint: number, totalBasePoint: number, totalCreativeProcessPoint: number, totalCreativeTaskPoint: number, identifier: string) {
        this.TotalPerformancePoint = totalPerformancePoint;
        this.TotalBasePoint = totalBasePoint;
        this.TotalCreativeProcessPoint = totalCreativeProcessPoint;
        this.TotalCreativeTaskPoint = totalCreativeTaskPoint;
        this.Identifier = identifier;
    }

    public getTotal(): number {
        return Math.round(this.getBase() + this.getCreative());
    }

    public getCreative(): number {
        return Math.round(this.TotalCreativeProcessPoint + this.TotalCreativeTaskPoint);
    }

    public getBase(): number {
        return Math.round(this.TotalBasePoint);
    }
}

class PerformanceDataWithTime {
    public StartDate: string = '';
    public EndDate: string = '';
    public TotalPerformancePoint: PerformanceData;


    constructor(startDate: string, endDate: string, totalPerformancePoint: number, totalBasePoint: number, totalCreativeProcessPoint: number, totalCreativeTaskPoint: number, identifier: string) {
        this.StartDate = startDate;
        this.EndDate = endDate;
        this.TotalPerformancePoint = new PerformanceData(totalPerformancePoint, totalBasePoint, totalCreativeProcessPoint, totalCreativeTaskPoint, identifier);
    }

    public getTotal(): number {
        return this.TotalPerformancePoint.getTotal();
    }

    public getBase(): number {
        return this.TotalPerformancePoint.getBase();
    }

    public getCreative(): number {
        return this.TotalPerformancePoint.getCreative();
    }
}

type TeamWeeklyTarget = {
    Team: string;
    WeeklyTarget: number;
}

export default function Home()
{
    const [ range, setRange ] = useState<{ startDate: string | null; endDate: string | null } | null>(null)
    const [ selectedTeams, setSelectedTeams ] = useState<string[]>([]);
    const [ selectedStaff, setSelectedStaff ] = useState<string[]>([]);
    const [ teamOptions, setTeamOptions ] = useState<{ value: string; label: string }[]>([]);
    const [ staffOptions, setStaffOptions ] = useState<{ value: string; label: string; team: string }[]>([]);
    const [ chartsData, setChartsData ] = useState<ChartObjectData[]>([]);
    const [ teamWeeklyPerformance, setTeamWeeklyPerformance ] = useState<WeeklyTeamPerformaceData[]>([]);
    const [ projectIssues, setProjectIssues ] = useState<ProjectIssue[]>([]);
    const [ filteredProjectIssues, setFilteredProjectIssues ] = useState<ProjectIssue[]>([]);
    const [ showTimeRangeComparison, setShowTimeRangeComparison ] = useState<boolean>(false);

    const assigneeNameByEmail = useMemo(() => {
        const map: Record<string, string> = {};
        for (const s of staffOptions) {
            if (!s?.value) continue;
            map[String(s.value).toLowerCase()] = s.label;
        }
        return map;
    }, [staffOptions]);

    async function getTeamMembers(teams: string[])
    {
        try 
        {
            const response = await fetch(`${serverUrl}/post/staff-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || ''
                },
                body: JSON.stringify({ teams }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        }
        catch (error)
        {
            console.error('Error fetching team members:', error);
            return [];
        }
    }

    async function getPerformanceData(startDate: string | null, endDate: string | null, identifiers: string[], isTeam: boolean): Promise<PerformanceDataWithTime[]>
    {
        if (!startDate || !endDate || identifiers.length === 0) return [];
        try 
        {
            const jsonBody = JSON.stringify({ startDate, endDate, identifiers });
            const response = await fetch(`${serverUrl}/post/performance-point?isTeam=${isTeam}&isWeekly=${true}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonBody,
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json() as PerformanceDataWithTime[];
        }
        catch (error)
        {
            console.error('Error fetching performance data:', error);
            return [];
        }
    }

    async function getLastWeekTeamPerformance(): Promise<PerformanceDataWithTime[]>
    {
        try
        {
            const response = await fetch(`${serverUrl}/get/last-week-team-performance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || ''
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json() as PerformanceDataWithTime[];
        }
        catch (error)   
        {
            console.error('Error fetching last week team performance:', error);
            return [];
        }
    }

    async function getWeeklyTarget(): Promise<TeamWeeklyTarget[]>
    {
        try
        {
            const response = await fetch(`${serverUrl}/get/team-weekly-target`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || ''
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json() as TeamWeeklyTarget[];
        }
        catch (error)
        {
            console.error('Error fetching team weekly targets:', error);
            return [];
        }
    }

    async function getLastWeekTeamPerformanceAndTarget() : Promise <WeeklyTeamPerformaceData[]> {
        const points = await getLastWeekTeamPerformance();
        const targets = await getWeeklyTarget();
        const res: WeeklyTeamPerformaceData[] = [];
        
        // Add null check to prevent iteration error
        if (!points || !Array.isArray(points)) {
            console.warn('Points data is null or not an array:', points);
            return res;
        }
        
        if (!targets || !Array.isArray(targets)) {
            console.warn('Targets data is null or not an array:', targets);
        }

        // console.log('Fetched targets:', targets);
        // console.log('Fetched points:', points);
        
        try
        {
            for (const per of points)
            {
                if (!per) continue; // Skip null or undefined performance data
                let target: number = 0;
                for (const t of targets)
                { 
                    if (!t) continue; // Skip null or undefined targets
                    if (t.Team === per.TotalPerformancePoint.Identifier)
                    {
                        target = t.WeeklyTarget;
                        break;
                    }
                } 
                const point = new PerformanceDataWithTime(per.StartDate, per.EndDate, per.TotalPerformancePoint.TotalPerformancePoint, per.TotalPerformancePoint.TotalBasePoint, per.TotalPerformancePoint.TotalCreativeProcessPoint, per.TotalPerformancePoint.TotalCreativeTaskPoint, per.TotalPerformancePoint.Identifier);
                // console.log('Processing performance for:', point);
                const p: WeeklyTeamPerformaceData =
                {
                    name: point.TotalPerformancePoint.Identifier,
                    total: point.getTotal(),
                    target: target,
                    base: point.getBase(),
                    creative: point.getCreative()
                };
                // console.log('Pushing performance data:', p);
                res.push(p);
            }
        }catch (error)
        {
            console.error('Error processing performance and target data:', error);
        }
        return res;
    }

    async function getProjectIssues(startDate: string | null, endDate: string | null): Promise<ProjectIssue[]>
    {
        if (!startDate || !endDate) return [];
        try
        {
            const response = await fetch(`${serverUrl}/post/project-issues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': GlobalData.getUserToken() || ''
                },
                body: JSON.stringify({ StartDate : startDate, EndDate: endDate })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            let res = await response.json() as ProjectIssue[];
            if (res == null) return [];
            for (const r of res)
            {
                r.Difference *= -1; // Invert difference for display
            }
            return res;
        }
        catch (error)
        {
            console.error('Error fetching project issues:', error);
            return [];
        }
    }


    // Fetch initial options and chart data
    useEffect(() =>
    {
        // Replace with your actual API endpoints
        getTeamMembers([]).then(members =>
        {
            const teams = new Set<any>();
            for (const m of members)
            {
                if (teams.has(m.Team)) continue;
                teams.add(m.Team);
            }
            const staff = members.map((m: any) => ({ value: m.Email, label: m.Name, team: m.Team }));
            setTeamOptions(Array.from(teams).map(t => ({ value: t, label: t })));
            setStaffOptions(staff);
        });

        getLastWeekTeamPerformanceAndTarget().then(data =>
        {
            setTeamWeeklyPerformance(data);
        });
        
    }, []);

    // Handler for filter change
    const handleFilterChange = (
        range: { startDate: string | null; endDate: string | null },
        selectedTeams: string[],
        selectedStaff: string[]
    ) =>
    {
        setRange(range);
        setSelectedTeams(selectedTeams);
        setSelectedStaff(selectedStaff);
        const isoStartDate = range.startDate ? new Date(range.startDate).toISOString() : null;
        const isoEndDate = range.endDate ? new Date(range.endDate).toISOString() : null;

        let isTeam = false;
        if (selectedTeams.length >= 2 || (selectedTeams.length === 1 && selectedStaff.length === 0))
            isTeam = true;

        // Store filter state for TimeRangeComparison visibility check
        const canShowComparison = (selectedTeams.length === 1 && selectedStaff.length === 0) || 
                                  (selectedTeams.length === 1 && selectedStaff.length === 1);
        setShowTimeRangeComparison(canShowComparison);

        getPerformanceData(
            isoStartDate,
            isoEndDate,
            isTeam ? selectedTeams : selectedStaff,
            isTeam
        )
            .then(data =>
            {
                const chartData: ChartObjectData[] = [];
                if (data)
                {
                    for (const d of data)
                    {
                        if (d)
                        {
                            const performance = new PerformanceDataWithTime(d.StartDate, d.EndDate, d.TotalPerformancePoint.TotalPerformancePoint, d.TotalPerformancePoint.TotalBasePoint, d.TotalPerformancePoint.TotalCreativeProcessPoint, d.TotalPerformancePoint.TotalCreativeTaskPoint, d.TotalPerformancePoint.Identifier);
                            // console.log('Processing performance data for chart:', performance. StartDate, performance.getBase(), performance.getCreative(), performance.getTotal(), performance.TotalPerformancePoint.Identifier);
                            
                            // Push the date back one day
                            const adjustedDate = new Date(performance.StartDate);
                            adjustedDate.setDate(adjustedDate.getDate() - 1);
                            
                            chartData.push({
                                name: performance.TotalPerformancePoint.Identifier,
                                time: adjustedDate.toISOString(),
                                performacePoint: performance.getTotal(),
                                basePoint: performance.getBase(),
                                creativePoint: performance.getCreative()
                            });
                        }
                    }
                }
                setChartsData(chartData);
            })
            .catch(error =>
            {
                console.error(error);
                setChartsData([]);
            });

        getProjectIssues(isoStartDate, isoEndDate).then(data =>
        {
            // console.log('Project issues data:', data);
            if (data) setProjectIssues(data);
        }).catch(error =>
        {
            console.error(error);
            setProjectIssues([]);
        })
    };

    // const fakeChartData: ChartObjectData[] = [
    //     { name: 'Team A', time: new Date('2023-09-22').toISOString(), performacePoint: 80, basePoint: 50, creativePoint: 30 },
    //     { name: 'Team B', time: new Date('2023-10-01').toISOString(), performacePoint: 70, basePoint: 40, creativePoint: 30 },
    //     { name: 'Team A', time: new Date('2023-10-08').toISOString(), performacePoint: 90, basePoint: 60, creativePoint: 30 },
    //     { name: 'Team B', time: new Date('2023-10-08').toISOString(), performacePoint: 60, basePoint: 30, creativePoint: 30 },
    // ];

    return (
        <>
            <TopBar userName={GlobalData.getUser().name || GlobalData.getUser().email || 'User'} imageUrl={GlobalData.getUser().picture} />
            <div className="home-container">
                    <TeamTargetProgress teams={teamWeeklyPerformance} />

                    <div>
                        <Filter
                            onChange={handleFilterChange}
                            teamOptions={teamOptions}
                            staffOptions={staffOptions}
                        />
                        <div style={{ marginTop: 8, fontSize: 14 }}>
                            <strong>Đã chọn:</strong>{' '}
                            {range ? `${range.startDate ?? '-'} → ${range.endDate ?? '-'}` : 'Chưa chọn'}
                        </div>
                    </div>
                    <Charts
                        data={chartsData}
                        issues={filteredProjectIssues}
                        assigneeNameByEmail={assigneeNameByEmail}
                        title="Team Performance"
                        height={500}
                    />
                    {showTimeRangeComparison && (
                        <TimeRangeComparison
                            data={chartsData.map(d => ({
                                time: d.time,
                                value: d.performacePoint,
                                baseValue: d.basePoint,
                                creativeValue: d.creativePoint
                            }))}
                        />
                    )}
                    <ProjectIssueTable 
                        data={projectIssues} 
                        title="Current Project Issues"
                        dateRange={range}
                        selectedTeams={selectedTeams}
                        selectedStaff={selectedStaff}
                        onFilteredDataChange={setFilteredProjectIssues}
                        assigneeNameByEmail={assigneeNameByEmail}
                    />
            </div>
        </>
    );
}
