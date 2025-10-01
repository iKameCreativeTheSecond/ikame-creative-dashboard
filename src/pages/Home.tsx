import './Home.css'
import Charts, { type ChartObjectData } from '../components/Charts'
import TeamTargetProgress, { type WeeklyTeamPerformaceData } from '../components/TeamTargetProgress';
import ProjectIssueTable, { type ProjectIssue } from '../components/ProjectIssueTable';
import { useState, useEffect } from 'react'
import Filter from '../components/Filter';
import TopBar from '../components/TopBar';
import { GlobalData } from '../common/GlobalData';


const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";

// ...existing code...

class PerformanceData {
    public StartWeek: string = ''; // ISO date string
    public TotalPerformancePoint: number = 0;
    public TotalBasePoint: number = 0;
    public TotalCreativeProcessPoint: number = 0;
    public TotalCreativeTaskPoint: number = 0;
    public Identifier: string = ''; // Email or Team name

    constructor(startWeek: string, totalPerformancePoint: number, totalBasePoint: number, totalCreativeProcessPoint: number, totalCreativeTaskPoint: number, identifier: string) {
        this.StartWeek = startWeek;
        this.TotalPerformancePoint = totalPerformancePoint;
        this.TotalBasePoint = totalBasePoint;
        this.TotalCreativeProcessPoint = totalCreativeProcessPoint;
        this.TotalCreativeTaskPoint = totalCreativeTaskPoint;
        this.Identifier = identifier;
    }

    public getTotal(): number {
        return this.getBase() + this.getCreative();
    }

    public getCreative(): number {
        return this.TotalCreativeProcessPoint + this.TotalCreativeTaskPoint;
    }

    public getBase(): number {
        return this.TotalBasePoint;
    }
}

type TeamWeeklyTarget = {
    Team: string;
    WeeklyTarget: number;
}

export default function Home()
{
    const [ range, setRange ] = useState<{ startDate: string | null; endDate: string | null } | null>(null)
    const [ teamOptions, setTeamOptions ] = useState<{ value: string; label: string }[]>([]);
    const [ staffOptions, setStaffOptions ] = useState<{ value: string; label: string; team: string }[]>([]);
    const [ chartsData, setChartsData ] = useState<ChartObjectData[]>([]);
    const [ teamWeeklyPerformance, setTeamWeeklyPerformance ] = useState<WeeklyTeamPerformaceData[]>([]);
    const [ projectIssues, setProjectIssues ] = useState<ProjectIssue[]>([]);

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

    async function getPerformanceData(startDate: string | null, endDate: string | null, identifiers: string[], isTeam: boolean): Promise<PerformanceData[]>
    {
        if (!startDate || !endDate || identifiers.length === 0) return [];
        try 
        {
            const jsonBody = JSON.stringify({ startDate, endDate, identifiers });
            const response = await fetch(`${serverUrl}/post/performance-point?isTeam=${isTeam}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonBody,
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json() as PerformanceData[];
        }
        catch (error)
        {
            console.error('Error fetching performance data:', error);
            return [];
        }
    }

    async function getLastWeekTeamPerformance(): Promise<PerformanceData[]>
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
            return await response.json() as PerformanceData[];
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
        
        for (const point of points)
        {
            const p: WeeklyTeamPerformaceData = 
            {
                name: point.Identifier,
                total: point.getTotal(),
                target: (targets && Array.isArray(targets)) ? targets.find(t => t.Team === point.Identifier)?.WeeklyTarget || 0 : 0,
                base: point.getBase(),
                creative: point.getCreative()
            };
            res.push(p);
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
            return await response.json() as ProjectIssue[];
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
        const isoStartDate = range.startDate ? new Date(range.startDate).toISOString() : null;
        const isoEndDate = range.endDate ? new Date(range.endDate).toISOString() : null;

        let isTeam = false;
        if (selectedTeams.length >= 2 || (selectedTeams.length === 1 && selectedStaff.length === 0))
            isTeam = true;

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
                            const performance = new PerformanceData(d.StartWeek, d.TotalPerformancePoint, d.TotalBasePoint, d.TotalCreativeProcessPoint, d.TotalCreativeTaskPoint, d.Identifier);
                            chartData.push({
                                name: performance.Identifier,
                                time: performance.StartWeek,
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
            console.log('Project issues data:', data);
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
            <div style={{ padding: '80px 20px 20px 20px' }}>
                <div style={ { marginTop: 780 } }>
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
                    <TeamTargetProgress teams={teamWeeklyPerformance} />
                    <Charts
                        data={chartsData}
                        issues={projectIssues}
                        title="Team Performance Dashboard"
                        height={500}
                    />
                    <ProjectIssueTable 
                        data={projectIssues} 
                        title="Current Project Issues"
                    />
            </div>
        </>
    );
}
