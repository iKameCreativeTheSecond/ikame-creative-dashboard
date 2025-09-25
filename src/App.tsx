import './App.css'
import Charts, { type ChartObjectData } from './components/Charts'
import { useState, useEffect } from 'react'
import Filter from './components/Filter';

// ...existing code...

export default function App() {
  const [range, setRange] = useState<{ startDate: string | null; endDate: string | null } | null>(null)
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string; team: string }[]>([]);
  const [chartsData, setChartsData] = useState<ChartObjectData[]>([]);

  // Fetch initial options and chart data
  useEffect(() => {
    // Replace with your actual API endpoints
    Promise.all([
      fetch('/api/teams').then(res => res.json()),
      fetch('/api/staff').then(res => res.json()),
      fetch('/api/charts').then(res => res.json()),
    ]).then(([teams, staff, charts]) => {
      setTeamOptions(teams);
      setStaffOptions(staff);
      setChartsData(charts);
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
