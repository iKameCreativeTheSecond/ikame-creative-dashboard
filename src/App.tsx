import './App.css'
import Charts, { type ChartObjectData } from './components/Charts'
import { useState, useEffect } from 'react'
import Filter from './components/Filter';


const serverUrl = "http://localhost:8080"; // Change to your server URL

// ...existing code...

type PerformanceData = {
    TotalPerformancePoint: number;
    TotalBasePoint: number;
    TotalCreativeProcessPoint: number;
    TotalCreativeTaskPoint: number;
}


export default function App() {
  const [range, setRange] = useState<{ startDate: string | null; endDate: string | null } | null>(null)
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string; team: string }[]>([]);
  const [chartsData, setChartsData] = useState<ChartObjectData[]>([]);

  async function getTeamMembers(teams: string[])
  {
    try 
    {
      const response = await fetch(`${serverUrl}/post/staff-member`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({ teams }),
        }
      );
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    }
    catch (error)
    {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  async function getPerformanceData(startDate: string | null, endDate: string | null, identifiers: string[], isTeam: boolean) : Promise<PerformanceData[]>
  {
    try 
    {
      const response = await fetch(`${serverUrl}performance-point?isTeam=${isTeam}`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({ startDate, endDate, identifiers, isTeam }),
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

  // Fetch initial options and chart data
  useEffect(() => {
    // Replace with your actual API endpoints
    getTeamMembers([]).then(members => {
      const teams = new Set<any>();
      for (const m of members) {
        if (teams.has(m.Team)) continue;
        teams.add(m.Team);
      }
      const staff = members.map((m: any) => ({ value: m.Email, label: m.Name, team: m.Team }));
      setTeamOptions(Array.from(teams).map(t => ({ value: t, label: t })));
      setStaffOptions(staff);
    });
  }, []);

  // Handler for filter change
  const handleFilterChange = (
    range: { startDate: string | null; endDate: string | null },
    selectedTeams: string[],
    selectedStaff: string[]
  ) => {
    setRange(range);
    
    const performanceDatas = getPerformanceData(
      range.startDate, 
      range.endDate,
      selectedStaff,
      selectedTeams.length > 0
    );

    

  };

  return (
    <div style={{ padding: '20px' }}>
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
      <Charts 
        data={chartsData} 
        title="Team Performance Dashboard" 
        height={500}
      />
    </div>
  )
}
