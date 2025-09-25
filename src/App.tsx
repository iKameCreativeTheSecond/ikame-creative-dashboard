import './App.css'
import Charts, { type ChartObjectData } from './components/Charts'
import { useState, useEffect } from 'react'
import Filter from './components/Filter';


const serverUrl = "http://localhost:8080"; // Change to your server URL

// ...existing code...

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
  const handleFilterChange = (filter: { startDate: string | null; endDate: string | null; team?: string; staff?: string }) => {
    setRange(filter);
    // Build query params based on filter
    const params = new URLSearchParams();
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    if (filter.team) params.append('team', filter.team);
    if (filter.staff) params.append('staff', filter.staff);
    fetch(`/api/charts?${params.toString()}`)
      .then(res => res.json())
      .then(data => setChartsData(data));
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
