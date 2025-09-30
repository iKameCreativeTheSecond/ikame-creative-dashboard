import './Home.css'
import Charts, { type ChartObjectData } from '../components/Charts'
import TeamTargetProgress, { type WeeklyTeamPerformaceData } from '../components/TeamTargetProgress';
import { useState, useEffect } from 'react'
import Filter from '../components/Filter';
import { useLocation } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { GlobalData, type UserInfo } from '../common/GlobalData';


const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";

// ...existing code...

type PerformanceData = {
    StartWeek: string; // ISO date string
    TotalPerformancePoint: number;
    TotalBasePoint: number;
    TotalCreativeProcessPoint: number;
    TotalCreativeTaskPoint: number;
    Identifier: string; // Email or Team name
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
        for (const point of points)
        {
            const p: WeeklyTeamPerformaceData = 
            {
                name: point.Identifier,
                total: point.TotalPerformancePoint,
                target: targets.find(t => t.Team === point.Identifier)?.WeeklyTarget || 0,
                base: point.TotalBasePoint,
                creative: point.TotalCreativeProcessPoint + point.TotalCreativeTaskPoint
            };
            res.push(p);
        }
        return res;
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
                            chartData.push({
                                name: d.Identifier,
                                time: d.StartWeek,
                                performacePoint: d.TotalPerformancePoint,
                                basePoint: d.TotalBasePoint,
                                creativePoint: d.TotalCreativeProcessPoint + d.TotalCreativeTaskPoint
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

    };

    return (
        <>
            <TopBar userName={GlobalData.getUser().name || GlobalData.getUser().email || 'User'} imageUrl={GlobalData.getUser().picture} />
            <div style={{ padding: '480px 20px 20px 20px' }}>
                    <div style={{ marginBottom: 16 }}>
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
                        title="Team Performance Dashboard"
                        height={500}
                    />
            </div>
        </>
    );
}
